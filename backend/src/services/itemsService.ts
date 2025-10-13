import { db } from '../db';
import { logger } from '../logger';
import { NotFoundError } from '../middleware/error';
import { CreateItemRequest, UpdateItemRequest, ItemsQuery } from '../schemas/items';
import { calculateOffset, createPaginationResult, PaginationResult } from '../utils/pagination';

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

export class ItemsService {
  async createItem(userId: string, data: CreateItemRequest): Promise<Item> {
    try {
      const { name, amount, expiry, categories, notes, image_url } = data;

      const result = await db.query(
        `INSERT INTO items (user_id, name, amount, expiry, categories, notes, image_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [userId, name, amount, expiry, categories || [], notes, image_url]
      );

      const item = result.rows[0] as Item;
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

      let whereConditions = ['user_id = $1'];
      let params: any[] = [userId];
      let paramCount = 1;

      // Search functionality
      if (q) {
        paramCount++;
        whereConditions.push(`(
          name ILIKE $${paramCount} OR 
          notes ILIKE $${paramCount} OR 
          similarity(name, $${paramCount}) > 0.1 OR
          similarity(COALESCE(notes, ''), $${paramCount}) > 0.1
        )`);
        params.push(`%${q}%`);
      }

      // Category filtering
      if (categories && categories.length > 0) {
        paramCount++;
        whereConditions.push(`categories && $${paramCount}`);
        params.push(categories);
      }

      const whereClause = whereConditions.join(' AND ');

      // Build ORDER BY clause
      let orderClause = '';
      if (sort === 'name') {
        orderClause = `ORDER BY name ${order.toUpperCase()}, created_at DESC`;
      } else if (sort === 'expiry') {
        orderClause = `ORDER BY expiry ${order.toUpperCase()} NULLS LAST, created_at DESC`;
      } else if (sort === 'amount') {
        orderClause = `ORDER BY amount ${order.toUpperCase()} NULLS LAST, created_at DESC`;
      } else if (sort === 'categories') {
        // Sort by first category alphabetically
        orderClause = `ORDER BY array_to_string(categories, ',') ${order.toUpperCase()}, created_at DESC`;
      }

      // Get total count
      const countQuery = `SELECT COUNT(*) FROM items WHERE ${whereClause}`;
      const countResult = await db.query(countQuery, params);
      const total = parseInt(countResult.rows[0].count, 10);

      // Get items
      const itemsQuery = `
        SELECT * FROM items 
        WHERE ${whereClause}
        ${orderClause}
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `;
      params.push(pageSize, offset);

      const itemsResult = await db.query(itemsQuery, params);
      const items = itemsResult.rows as Item[];

      return createPaginationResult(items, total, page, pageSize);
    } catch (error) {
      logger.error('Failed to fetch items', error);
      throw new Error('Failed to fetch items');
    }
  }

  async getItemById(userId: string, itemId: string): Promise<Item> {
    try {
      const result = await db.query(
        'SELECT * FROM items WHERE id = $1 AND user_id = $2',
        [itemId, userId]
      );

      const item = result.rows[0];
      if (!item) {
        throw new NotFoundError('Item not found');
      }

      return item as Item;
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

      const updateFields: string[] = [];
      const values: any[] = [];
      let paramCount = 0;

      // Build dynamic update query
      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined) {
          paramCount++;
          updateFields.push(`${key} = $${paramCount}`);
          values.push(value);
        }
      }

      if (updateFields.length === 0) {
        throw new Error('No fields to update');
      }

      // Add updated_at
      paramCount++;
      updateFields.push(`updated_at = $${paramCount}`);
      values.push(new Date());

      // Add WHERE clause parameters
      paramCount++;
      values.push(itemId);
      paramCount++;
      values.push(userId);

      const query = `
        UPDATE items 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount - 1} AND user_id = $${paramCount}
        RETURNING *
      `;

      const result = await db.query(query, values);
      const item = result.rows[0] as Item;

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
      const result = await db.query(
        'DELETE FROM items WHERE id = $1 AND user_id = $2 RETURNING id',
        [itemId, userId]
      );

      if (result.rows.length === 0) {
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
      const result = await db.query(
        'SELECT * FROM items WHERE user_id = $1 ORDER BY created_at DESC',
        [userId]
      );

      return result.rows as Item[];
    } catch (error) {
      logger.error('Failed to fetch user items', error);
      throw new Error('Failed to fetch user items');
    }
  }
}

export const itemsService = new ItemsService();
