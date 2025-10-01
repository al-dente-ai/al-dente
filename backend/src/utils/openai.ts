import OpenAI from 'openai';
import { config } from '../config';
import { logger } from '../logger';
import { VisionPrediction } from '../schemas/scanning';
import { AIRecipe } from '../schemas/recipes';

class OpenAIService {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: config.openai.apiKey,
    });
  }

  async analyzeImage(imageUrl: string): Promise<VisionPrediction> {
    const analysisStartTime = Date.now();
    
    try {
      console.log('🧠 [OPENAI] Starting image analysis', {
        imageUrl,
        model: 'gpt-4o-mini',
        timestamp: new Date().toISOString()
      });

      const systemPrompt = `You are a food identification assistant. Analyze the image and identify the food item shown. 
      
      Guidelines:
      - Be conservative with expiry dates - only provide if clearly visible on packaging
      - Categorize using the provided categories
      - Provide a confidence score based on how clear the image is
      - If unsure about any field, leave it null and lower the confidence
      - For amounts, use common units (cups, pounds, pieces, etc.)`;

      console.log('📝 [OPENAI] Sending vision request to OpenAI API');
      const apiStartTime = Date.now();
      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Identify the food item in this image and provide structured information about it.',
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl,
                },
              },
            ],
          },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'food_item_analysis',
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                amount: { type: ['string', 'null'] },
                expiry: { 
                  type: ['string', 'null'], 
                  description: 'ISO 8601 date if visible/known' 
                },
                categories: {
                  type: 'array',
                  items: {
                    type: 'string',
                    enum: [
                      'produce', 'dairy', 'meat', 'spices', 'grains', 
                      'condiments', 'baked', 'beverages', 'frozen', 'canned', 'other'
                    ],
                  },
                },
                notes: { type: ['string', 'null'] },
                confidence: { type: 'number', minimum: 0, maximum: 1 },
              },
              required: ['name', 'confidence'],
              additionalProperties: false,
            },
          },
        },
      });
      const apiEndTime = Date.now();

      console.log('📡 [OPENAI] API response received', {
        apiDuration: `${apiEndTime - apiStartTime}ms`,
        responseId: response.id,
        model: response.model,
        usage: response.usage,
        finishReason: response.choices[0]?.finish_reason
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        console.error('❌ [OPENAI] No content in API response');
        throw new Error('No response from OpenAI');
      }

      console.log('🔍 [OPENAI] Parsing response content', {
        contentLength: content.length,
        contentPreview: content.substring(0, 100) + '...'
      });

      const prediction = JSON.parse(content) as VisionPrediction;
      
      const analysisEndTime = Date.now();
      const totalDuration = analysisEndTime - analysisStartTime;

      console.log('✅ [OPENAI] Analysis completed successfully', {
        predictionName: prediction.name,
        confidence: prediction.confidence,
        categories: prediction.categories,
        hasAmount: !!prediction.amount,
        hasExpiry: !!prediction.expiry,
        hasNotes: !!prediction.notes,
        totalDuration: `${totalDuration}ms`,
        apiDuration: `${apiEndTime - apiStartTime}ms`,
        usage: response.usage,
        timestamp: new Date().toISOString()
      });

      logger.info({ prediction }, 'Image analysis completed');
      
      return prediction;
    } catch (error) {
      const analysisEndTime = Date.now();
      const totalDuration = analysisEndTime - analysisStartTime;
      
      console.error('❌ [OPENAI] Analysis failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
        imageUrl,
        duration: `${totalDuration}ms`,
        timestamp: new Date().toISOString()
      });
      
      logger.error('OpenAI image analysis failed', error);
      throw new Error('Failed to analyze image');
    }
  }

  async generateRecipes(
    pantryItems: Array<{
      id: string;
      name: string;
      amount?: string;
      categories: string[];
      expiry?: string;
    }>,
    mealType: string,
    userPrompt?: string,
    count: number = 1
  ): Promise<AIRecipe[]> {
    try {
      const systemPrompt = `You are a skilled chef and recipe creator. Generate practical, delicious recipes using the provided pantry items when possible.

      Guidelines:
      - Prefer using available pantry items but don't force impossible combinations
      - Suggest realistic ingredient quantities
      - Provide clear, step-by-step instructions
      - Consider expiry dates when selecting ingredients
      - Make recipes appropriate for the requested meal type
      - For uses_item_ids: ONLY include the exact ID strings of pantry items that are actually used in the recipe. If no pantry items are used, leave the array empty. Use the exact ID format provided in the pantry items list.`;

      const pantryDescription = pantryItems.map(item => 
        `- ID: ${item.id} | ${item.name} (${item.amount || 'unknown amount'}, categories: ${item.categories.join(', ')}, expires: ${item.expiry || 'unknown'})`
      ).join('\n');

      console.log('🧠 [OPENAI] Generating recipes with pantry items:', {
        itemCount: pantryItems.length,
        mealType,
        userPrompt,
        count,
        pantryItemIds: pantryItems.map(item => item.id),
        timestamp: new Date().toISOString()
      });

      const mealTypeText = mealType && mealType !== 'any' ? `${mealType} ` : '';
      const userMessage = `Generate ${count} ${mealTypeText}recipe(s) using these pantry items when possible:

${pantryDescription}

${userPrompt ? `Additional requirements: ${userPrompt}` : ''}

Please generate recipes that make good use of available ingredients.`;

      const response = await this.client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userMessage,
          },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'recipe_generation',
            schema: {
              type: 'object',
              properties: {
                recipes: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      title: { type: 'string' },
                      description: { type: 'string' },
                      meal_type: { 
                        type: 'string',
                        enum: ['breakfast', 'lunch', 'dinner', 'snack']
                      },
                      servings: { type: 'integer', minimum: 1 },
                      prep_time_minutes: { type: 'integer', minimum: 1 },
                      ingredients: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            name: { type: 'string' },
                            quantity: { type: 'string' },
                          },
                          required: ['name', 'quantity'],
                          additionalProperties: false,
                        },
                      },
                      steps: {
                        type: 'array',
                        items: { type: 'string' },
                        minItems: 1,
                      },
                      uses_item_ids: {
                        type: 'array',
                        items: { 
                          type: 'string',
                          pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
                        },
                        description: 'Array of UUID strings from the provided pantry items that are used in this recipe'
                      },
                    },
                    required: [
                      'title', 'description', 'meal_type', 'servings', 
                      'prep_time_minutes', 'ingredients', 'steps'
                    ],
                    additionalProperties: false,
                  },
                },
              },
              required: ['recipes'],
              additionalProperties: false,
            },
          },
        },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from OpenAI');
      }

      const result = JSON.parse(content) as { recipes: AIRecipe[] };
      
      console.log('🎯 [OPENAI] Recipe generation response parsed:', {
        recipeCount: result.recipes.length,
        recipes: result.recipes.map(recipe => ({
          title: recipe.title,
          mealType: recipe.meal_type,
          usesItemIds: recipe.uses_item_ids,
          usesItemIdsCount: recipe.uses_item_ids ? recipe.uses_item_ids.length : 0,
          ingredientCount: recipe.ingredients.length,
          stepCount: recipe.steps.length
        })),
        timestamp: new Date().toISOString()
      });
      
      logger.info({ recipeCount: result.recipes.length }, 'Recipe generation completed');
      
      return result.recipes;
    } catch (error) {
      logger.error('OpenAI recipe generation failed', error);
      throw new Error('Failed to generate recipes');
    }
  }

  async generateRecipeImage(recipeTitle: string, description: string): Promise<string> {
    try {
      const prompt = `A professional food photography shot of "${recipeTitle}". ${description}. 
      High quality, well-lit, appetizing presentation on a clean background. 
      Professional food styling, vibrant colors, restaurant quality plating.`;

      const response = await this.client.images.generate({
        model: 'dall-e-3',
        prompt: prompt,
        size: '1024x1024',
        quality: 'standard',
        n: 1,
      });

      const imageUrl = response.data?.[0]?.url;
      if (!imageUrl) {
        throw new Error('No image generated');
      }

      logger.info({ recipeTitle }, 'Recipe image generated');
      return imageUrl;
    } catch (error) {
      logger.error('OpenAI image generation failed', error);
      throw new Error('Failed to generate recipe image');
    }
  }
}

export const openaiService = new OpenAIService();
export { OpenAIService };
