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
        meal_type,
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
          uses_item_ids || [],
          image_url,
        ]
      );

      const recipe = result.rows[0] as Recipe;
      logger.info({ recipeId: recipe.id, userId }, 'Recipe created successfully');

      return recipe;
    } catch (error) {
      logger.error('Failed to create recipe', error);
      throw new Error('Failed to create recipe');
    }
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
