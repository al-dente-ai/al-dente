import { db } from '../db';
import { logger } from '../logger';
import { NotFoundError } from '../middleware/error';
import { GenerateRecipesRequest, CreateRecipeRequest, RecipesQuery } from '../schemas/recipes';
import { calculateOffset, createPaginationResult, PaginationResult } from '../utils/pagination';
import { openaiService } from '../utils/openai';
import { supabaseService } from '../utils/supabase';
import { itemsService } from './itemsService';

export interface Recipe {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  meal_type: string;
  servings?: number;
  prep_time_minutes?: number;
  ingredients: Array<{ name: string; quantity: string }>;
  steps: string[];
  uses_item_ids: string[];
  image_url?: string;
  created_at: string;
}

export class RecipesService {
  async generateRecipes(userId: string, data: GenerateRecipesRequest): Promise<Recipe[]> {
    const { meal_type, user_prompt, count, generate_images } = data;

    try {
      // Get user's pantry items
      const pantryItems = await itemsService.getUserItems(userId);
      
      logger.info({ 
        userId, 
        pantryItemCount: pantryItems.length, 
        mealType: meal_type,
        count 
      }, 'Starting recipe generation');

      // Generate recipes using OpenAI
      const aiRecipes = await openaiService.generateRecipes(
        pantryItems.map(item => ({
          id: item.id,
          name: item.name,
          categories: item.categories,
          ...(item.amount && { amount: item.amount }),
          ...(item.expiry && { expiry: item.expiry }),
        })),
        meal_type || 'any',
        user_prompt,
        count
      );

      const recipes: Recipe[] = [];

      // Process each generated recipe
      for (const aiRecipe of aiRecipes) {
        let imageUrl: string | undefined;

        // Generate image if requested
        if (generate_images) {
          try {
            logger.info({ recipeTitle: aiRecipe.title }, 'Generating recipe image');
            
            const generatedImageUrl = await openaiService.generateRecipeImage(
              aiRecipe.title,
              aiRecipe.description
            );

            // Download and upload the generated image to Supabase
            const imageResponse = await fetch(generatedImageUrl);
            if (imageResponse.ok) {
              const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
              const { publicUrl } = await supabaseService.uploadImage(
                imageBuffer,
                userId,
                `${aiRecipe.title.replace(/[^a-zA-Z0-9]/g, '_')}.png`,
                'image/png'
              );
              imageUrl = publicUrl;
            }
          } catch (imageError) {
            logger.warn({ 
              recipeTitle: aiRecipe.title, 
              error: imageError 
            }, 'Failed to generate recipe image, continuing without image');
          }
        }

        // Debug AI recipe data
        console.log('🤖 [RECIPES SERVICE] Processing AI recipe:', {
          title: aiRecipe.title,
          mealType: aiRecipe.meal_type,
          aiUsesItemIds: aiRecipe.uses_item_ids,
          aiUsesItemIdsType: typeof aiRecipe.uses_item_ids,
          aiUsesItemIdsLength: aiRecipe.uses_item_ids ? aiRecipe.uses_item_ids.length : 0,
          hasImageUrl: !!imageUrl,
          timestamp: new Date().toISOString()
        });

        // Create recipe in database
        const recipe = await this.createRecipe(userId, {
          title: aiRecipe.title,
          description: aiRecipe.description,
          meal_type: aiRecipe.meal_type,
          servings: aiRecipe.servings,
          prep_time_minutes: aiRecipe.prep_time_minutes,
          ingredients: aiRecipe.ingredients,
          steps: aiRecipe.steps,
          uses_item_ids: aiRecipe.uses_item_ids || [],
          image_url: imageUrl,
        });

        recipes.push(recipe);
      }

      logger.info({ 
        userId, 
        generatedCount: recipes.length 
      }, 'Recipe generation completed');

      return recipes;
    } catch (error) {
      logger.error('Recipe generation failed', error);
      throw new Error('Failed to generate recipes');
    }
  }

  async createRecipe(userId: string, data: CreateRecipeRequest): Promise<Recipe> {
    try {
      const {
        title,
        description,
        meal_type,
        servings,
        prep_time_minutes,
        ingredients,
        steps,
        uses_item_ids,
        image_url,
      } = data;

      // Validate and filter UUID array
      const validatedUUIDs = this.validateAndFilterUUIDs(uses_item_ids || []);
      
      console.log('🔍 [RECIPES SERVICE] Creating recipe with data:', {
        userId,
        title,
        meal_type,
        originalUsesItemIds: uses_item_ids,
        validatedUUIDs,
        timestamp: new Date().toISOString()
      });

      const result = await db.query(
        `INSERT INTO recipes (
          user_id, title, description, meal_type, servings, 
          prep_time_minutes, ingredients, steps, uses_item_ids, image_url
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`,
        [
          userId,
          title,
          description,
          meal_type,
          servings,
          prep_time_minutes,
          JSON.stringify(ingredients),
          JSON.stringify(steps),
          validatedUUIDs,
          image_url,
        ]
      );

      const recipe = result.rows[0] as Recipe;
      
      console.log('✅ [RECIPES SERVICE] Recipe created successfully:', {
        recipeId: recipe.id,
        userId,
        finalUsesItemIds: recipe.uses_item_ids
      });
      
      logger.info({ recipeId: recipe.id, userId }, 'Recipe created successfully');

      return recipe;
    } catch (error) {
      console.error('❌ [RECIPES SERVICE] Failed to create recipe:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
        timestamp: new Date().toISOString()
      });
      
      logger.error('Failed to create recipe', error);
      throw new Error('Failed to create recipe');
    }
  }

  private validateAndFilterUUIDs(uuids: string[]): string[] {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    const validUUIDs = uuids.filter(uuid => {
      if (!uuid || typeof uuid !== 'string') {
        console.warn('⚠️ [RECIPES SERVICE] Invalid UUID type:', { uuid, type: typeof uuid });
        return false;
      }
      
      const isValid = uuidRegex.test(uuid);
      if (!isValid) {
        console.warn('⚠️ [RECIPES SERVICE] Invalid UUID format:', { uuid });
      }
      
      return isValid;
    });

    console.log('🔍 [RECIPES SERVICE] UUID validation completed:', {
      originalCount: uuids.length,
      validCount: validUUIDs.length,
      originalUUIDs: uuids,
      validUUIDs,
      timestamp: new Date().toISOString()
    });

    return validUUIDs;
  }

  async getRecipes(userId: string, query: RecipesQuery): Promise<PaginationResult<Recipe>> {
    try {
      const { page, pageSize } = query;
      const offset = calculateOffset(page, pageSize);

      // Get total count
      const countResult = await db.query(
        'SELECT COUNT(*) FROM recipes WHERE user_id = $1',
        [userId]
      );
      const total = parseInt(countResult.rows[0].count, 10);

      // Get recipes
      const recipesResult = await db.query(
        `SELECT * FROM recipes 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT $2 OFFSET $3`,
        [userId, pageSize, offset]
      );

      const recipes = recipesResult.rows as Recipe[];

      return createPaginationResult(recipes, total, page, pageSize);
    } catch (error) {
      logger.error('Failed to fetch recipes', error);
      throw new Error('Failed to fetch recipes');
    }
  }

  async getRecipeById(userId: string, recipeId: string): Promise<Recipe> {
    try {
      const result = await db.query(
        'SELECT * FROM recipes WHERE id = $1 AND user_id = $2',
        [recipeId, userId]
      );

      const recipe = result.rows[0];
      if (!recipe) {
        throw new NotFoundError('Recipe not found');
      }

      return recipe as Recipe;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Failed to fetch recipe', error);
      throw new Error('Failed to fetch recipe');
    }
  }

  async deleteRecipe(userId: string, recipeId: string): Promise<void> {
    try {
      const result = await db.query(
        'DELETE FROM recipes WHERE id = $1 AND user_id = $2 RETURNING id',
        [recipeId, userId]
      );

      if (result.rows.length === 0) {
        throw new NotFoundError('Recipe not found');
      }

      logger.info({ recipeId, userId }, 'Recipe deleted successfully');
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Failed to delete recipe', error);
      throw new Error('Failed to delete recipe');
    }
  }
}

export const recipesService = new RecipesService();
