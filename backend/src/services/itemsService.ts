import { drizzleDb, items } from '../db';
import { logger } from '../logger';
import { NotFoundError } from '../middleware/error';
import { CreateItemRequest, UpdateItemRequest, ItemsQuery } from '../schemas/items';
import { calculateOffset, createPaginationResult, PaginationResult } from '../utils/pagination';
import { eq, and, sql, desc, asc, count } from 'drizzle-orm';

export interface Item {
  id: string;
  user_id: string;
  name: string;
  amount?: string;
  expiry?: string;
  categories: string[];
  notes?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

// Helper function to convert Drizzle schema to Item interface
function drizzleItemToItem(rawItem: any): Item {
  return {
    id: rawItem.id,
    user_id: rawItem.userId,
    name: rawItem.name,
    ...(rawItem.amount && { amount: rawItem.amount }),
    ...(rawItem.expiry && { expiry: rawItem.expiry }),
    categories: rawItem.categories || [],
    ...(rawItem.notes && { notes: rawItem.notes }),
    ...(rawItem.imageUrl && { image_url: rawItem.imageUrl }),
    created_at: rawItem.createdAt,
    updated_at: rawItem.updatedAt,
  } as Item;
}

export class ItemsService {
  async createItem(userId: string, data: CreateItemRequest): Promise<Item> {
    try {
      const { name, amount, expiry, categories, notes, image_url } = data;

      const result = await drizzleDb
        .insert(items)
        .values({
          userId,
          name,
          amount,
          expiry,
          categories: categories || [],
          notes,
          imageUrl: image_url,
        })
        .returning();

      const item = drizzleItemToItem(result[0]);
      logger.info({ itemId: item.id, userId }, 'Item created successfully');

      return item;
    } catch (error) {
      logger.error('Failed to create item', error);
      throw new Error('Failed to create item');
    }
  }

  async getItems(userId: string, query: ItemsQuery): Promise<PaginationResult<Item>> {
    try {
      const { page, pageSize, q, categories, sort, order } = query;
      const offset = calculateOffset(page, pageSize);

      // Build where conditions
      let whereConditions = [eq(items.userId, userId)];

      // Search functionality using PostgreSQL features
      if (q) {
        whereConditions.push(
          sql`(
            ${items.name} ILIKE ${`%${q}%`} OR 
            ${items.notes} ILIKE ${`%${q}%`} OR 
            similarity(${items.name}, ${q}) > 0.1 OR
            similarity(COALESCE(${items.notes}, ''), ${q}) > 0.1
          )`
        );
      }

      // Category filtering using PostgreSQL array operations
      if (categories && categories.length > 0) {
        whereConditions.push(sql`${items.categories} && ${categories}`);
      }

      const whereClause = and(...whereConditions);

      // Build order by clause
      let orderBy;
      if (sort === 'name') {
        orderBy = [order === 'asc' ? asc(items.name) : desc(items.name), desc(items.createdAt)];
      } else if (sort === 'expiry') {
        orderBy = [order === 'asc' ? asc(items.expiry) : desc(items.expiry), desc(items.createdAt)];
      } else if (sort === 'amount') {
        orderBy = [order === 'asc' ? asc(items.amount) : desc(items.amount), desc(items.createdAt)];
      } else if (sort === 'categories') {
        // Sort by first category alphabetically using PostgreSQL array_to_string
        const sortDirection = order === 'asc' ? 'ASC' : 'DESC';
        orderBy = [
          sql`array_to_string(${items.categories}, ',') ${sql.raw(sortDirection)}`,
          desc(items.createdAt),
        ];
      } else {
        orderBy = [desc(items.createdAt)];
      }

      // Get total count
      const countResult = await drizzleDb.select({ count: count() }).from(items).where(whereClause);

      const total = countResult[0].count;

      // Get items with pagination
      const itemsResult = await drizzleDb
        .select()
        .from(items)
        .where(whereClause)
        .orderBy(...orderBy)
        .limit(pageSize)
        .offset(offset);

      const mappedItems = itemsResult.map(drizzleItemToItem);

      return createPaginationResult(mappedItems, total, page, pageSize);
    } catch (error) {
      logger.error('Failed to fetch items', error);
      throw new Error('Failed to fetch items');
    }
  }

  async getItemById(userId: string, itemId: string): Promise<Item> {
    try {
      const result = await drizzleDb
        .select()
        .from(items)
        .where(and(eq(items.id, itemId), eq(items.userId, userId)));

      const rawItem = result[0];
      if (!rawItem) {
        throw new NotFoundError('Item not found');
      }

      return drizzleItemToItem(rawItem);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Failed to fetch item', error);
      throw new Error('Failed to fetch item');
    }
  }

  async updateItem(userId: string, itemId: string, data: UpdateItemRequest): Promise<Item> {
    try {
      // First check if item exists and belongs to user
      await this.getItemById(userId, itemId);

      // Build dynamic update object for Drizzle
      const updateData: any = {};

      if (data.name !== undefined) updateData.name = data.name;
      if (data.amount !== undefined) updateData.amount = data.amount;
      if (data.expiry !== undefined) updateData.expiry = data.expiry;
      if (data.categories !== undefined) updateData.categories = data.categories;
      if (data.notes !== undefined) updateData.notes = data.notes;
      if (data.image_url !== undefined) updateData.imageUrl = data.image_url;

      // Always update the updated_at field
      updateData.updatedAt = new Date().toISOString();

      if (Object.keys(updateData).length === 1) {
        // Only updatedAt
        throw new Error('No fields to update');
      }

      const result = await drizzleDb
        .update(items)
        .set(updateData)
        .where(and(eq(items.id, itemId), eq(items.userId, userId)))
        .returning();

      const item = drizzleItemToItem(result[0]);

      logger.info({ itemId, userId }, 'Item updated successfully');
      return item;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Failed to update item', error);
      throw new Error('Failed to update item');
    }
  }

  async deleteItem(userId: string, itemId: string): Promise<void> {
    try {
      const result = await drizzleDb
        .delete(items)
        .where(and(eq(items.id, itemId), eq(items.userId, userId)))
        .returning({ id: items.id });

      if (result.length === 0) {
        throw new NotFoundError('Item not found');
      }

      logger.info({ itemId, userId }, 'Item deleted successfully');
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Failed to delete item', error);
      throw new Error('Failed to delete item');
    }
  }

  async getUserItems(userId: string): Promise<Item[]> {
    try {
      const result = await drizzleDb
        .select()
        .from(items)
        .where(eq(items.userId, userId))
        .orderBy(desc(items.createdAt));

      return result.map(drizzleItemToItem);
    } catch (error) {
      logger.error('Failed to fetch user items', error);
      throw new Error('Failed to fetch user items');
    }
  }
}

export const itemsService = new ItemsService();
