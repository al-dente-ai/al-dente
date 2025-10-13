import swaggerJSDoc from 'swagger-jsdoc';
import { config } from './config';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Al Dente API',
    version: '1.0.0',
    description: 'Pantry tracking and AI-powered recipe generation REST API',
    contact: {
      name: 'API Support',
    },
  },
  servers: [
    {
      url: `http://localhost:${config.server.port}`,
      description: 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      // Error responses
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            description: 'Error message',
          },
          code: {
            type: 'string',
            description: 'Error code',
          },
          details: {
            type: 'object',
            description: 'Additional error details',
          },
        },
        required: ['error'],
      },
      ValidationError: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            example: 'Validation failed',
          },
          details: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                field: {
                  type: 'string',
                  description: 'Field name that failed validation',
                },
                message: {
                  type: 'string',
                  description: 'Validation error message',
                },
              },
            },
          },
        },
      },

      // Auth schemas
      SignupRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
            example: 'user@example.com',
          },
          password: {
            type: 'string',
            minLength: 8,
            description: 'User password (minimum 8 characters)',
            example: 'password123',
          },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
            example: 'user@example.com',
          },
          password: {
            type: 'string',
            description: 'User password',
            example: 'password123',
          },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          user: {
            type: 'object',
            properties: {
              id: {
                type: 'string',
                format: 'uuid',
                description: 'User ID',
              },
              email: {
                type: 'string',
                format: 'email',
                description: 'User email',
              },
              created_at: {
                type: 'string',
                format: 'date-time',
                description: 'Account creation timestamp',
              },
            },
          },
          token: {
            type: 'string',
            description: 'JWT authentication token',
          },
        },
      },

      // Item schemas
      Category: {
        type: 'string',
        enum: [
          'produce',
          'dairy',
          'meat',
          'spices',
          'grains',
          'condiments',
          'baked',
          'beverages',
          'frozen',
          'canned',
          'other',
        ],
        description: 'Item category',
      },
      CreateItemRequest: {
        type: 'object',
        required: ['name'],
        properties: {
          name: {
            type: 'string',
            description: 'Item name',
            example: 'Tomatoes',
          },
          amount: {
            type: 'string',
            description: 'Item amount/quantity',
            example: '2 lbs',
          },
          expiry: {
            type: 'string',
            format: 'date',
            description: 'Expiry date (YYYY-MM-DD)',
            example: '2023-12-31',
          },
          categories: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/Category',
            },
            description: 'Item categories',
            default: [],
          },
          notes: {
            type: 'string',
            description: 'Additional notes',
            example: 'Fresh from farmers market',
          },
          image_url: {
            type: 'string',
            format: 'url',
            description: 'Image URL',
          },
        },
      },
      UpdateItemRequest: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Item name',
          },
          amount: {
            type: 'string',
            description: 'Item amount/quantity',
          },
          expiry: {
            type: 'string',
            format: 'date',
            description: 'Expiry date (YYYY-MM-DD)',
          },
          categories: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/Category',
            },
            description: 'Item categories',
          },
          notes: {
            type: 'string',
            description: 'Additional notes',
          },
          image_url: {
            type: 'string',
            format: 'url',
            description: 'Image URL',
          },
        },
      },
      Item: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Item ID',
          },
          user_id: {
            type: 'string',
            format: 'uuid',
            description: 'Owner user ID',
          },
          name: {
            type: 'string',
            description: 'Item name',
          },
          amount: {
            type: 'string',
            nullable: true,
            description: 'Item amount/quantity',
          },
          expiry: {
            type: 'string',
            format: 'date',
            nullable: true,
            description: 'Expiry date',
          },
          categories: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/Category',
            },
            description: 'Item categories',
          },
          notes: {
            type: 'string',
            nullable: true,
            description: 'Additional notes',
          },
          image_url: {
            type: 'string',
            nullable: true,
            description: 'Image URL',
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            description: 'Creation timestamp',
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp',
          },
        },
      },
      ItemsResponse: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/Item',
            },
          },
          pagination: {
            $ref: '#/components/schemas/Pagination',
          },
        },
      },

      // Recipe schemas
      MealType: {
        type: 'string',
        enum: ['breakfast', 'lunch', 'dinner', 'snack'],
        description: 'Type of meal',
      },
      Ingredient: {
        type: 'object',
        required: ['name', 'quantity'],
        properties: {
          name: {
            type: 'string',
            description: 'Ingredient name',
            example: 'Flour',
          },
          quantity: {
            type: 'string',
            description: 'Ingredient quantity',
            example: '2 cups',
          },
        },
      },
      GenerateRecipesRequest: {
        type: 'object',
        required: ['meal_type'],
        properties: {
          meal_type: {
            $ref: '#/components/schemas/MealType',
          },
          user_prompt: {
            type: 'string',
            description: 'Optional user prompt for recipe generation',
            example: 'Something spicy with chicken',
          },
          count: {
            type: 'integer',
            minimum: 1,
            maximum: 5,
            default: 1,
            description: 'Number of recipes to generate',
          },
          generate_images: {
            type: 'boolean',
            default: true,
            description: 'Whether to generate images for recipes',
          },
        },
      },
      CreateRecipeRequest: {
        type: 'object',
        required: ['title', 'meal_type', 'servings', 'prep_time_minutes', 'ingredients', 'steps'],
        properties: {
          title: {
            type: 'string',
            description: 'Recipe title',
            example: 'Chicken Stir Fry',
          },
          description: {
            type: 'string',
            description: 'Recipe description',
            example: 'A quick and healthy chicken stir fry',
          },
          meal_type: {
            $ref: '#/components/schemas/MealType',
          },
          servings: {
            type: 'integer',
            minimum: 1,
            description: 'Number of servings',
            example: 4,
          },
          prep_time_minutes: {
            type: 'integer',
            minimum: 1,
            description: 'Preparation time in minutes',
            example: 30,
          },
          ingredients: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/Ingredient',
            },
            minItems: 1,
            description: 'Recipe ingredients',
          },
          steps: {
            type: 'array',
            items: {
              type: 'string',
            },
            minItems: 1,
            description: 'Recipe preparation steps',
            example: ['Heat oil in pan', 'Add chicken and cook', 'Add vegetables and stir'],
          },
          uses_item_ids: {
            type: 'array',
            items: {
              type: 'string',
              format: 'uuid',
            },
            default: [],
            description: 'IDs of pantry items used in this recipe',
          },
          image_url: {
            type: 'string',
            format: 'url',
            description: 'Recipe image URL',
          },
        },
      },
      Recipe: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            description: 'Recipe ID',
          },
          user_id: {
            type: 'string',
            format: 'uuid',
            description: 'Owner user ID',
          },
          title: {
            type: 'string',
            description: 'Recipe title',
          },
          description: {
            type: 'string',
            nullable: true,
            description: 'Recipe description',
          },
          meal_type: {
            $ref: '#/components/schemas/MealType',
          },
          servings: {
            type: 'integer',
            description: 'Number of servings',
          },
          prep_time_minutes: {
            type: 'integer',
            description: 'Preparation time in minutes',
          },
          ingredients: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/Ingredient',
            },
            description: 'Recipe ingredients',
          },
          steps: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'Recipe preparation steps',
          },
          uses_item_ids: {
            type: 'array',
            items: {
              type: 'string',
              format: 'uuid',
            },
            description: 'IDs of pantry items used in this recipe',
          },
          image_url: {
            type: 'string',
            nullable: true,
            description: 'Recipe image URL',
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            description: 'Creation timestamp',
          },
          updated_at: {
            type: 'string',
            format: 'date-time',
            description: 'Last update timestamp',
          },
        },
      },
      RecipesResponse: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/Recipe',
            },
          },
          pagination: {
            $ref: '#/components/schemas/Pagination',
          },
        },
      },
      GeneratedRecipesResponse: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/Recipe',
            },
          },
        },
      },

      // Scan schemas
      VisionPrediction: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'Predicted item name',
          },
          amount: {
            type: 'string',
            nullable: true,
            description: 'Predicted amount/quantity',
          },
          expiry: {
            type: 'string',
            format: 'date',
            nullable: true,
            description: 'Predicted expiry date',
          },
          categories: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/Category',
            },
            default: [],
            description: 'Predicted categories',
          },
          notes: {
            type: 'string',
            nullable: true,
            description: 'Additional predicted notes',
          },
          confidence: {
            type: 'number',
            minimum: 0,
            maximum: 1,
            description: 'Prediction confidence score',
          },
        },
      },
      ScanResponse: {
        type: 'object',
        properties: {
          image_url: {
            type: 'string',
            format: 'url',
            description: 'Uploaded image URL',
          },
          prediction: {
            $ref: '#/components/schemas/VisionPrediction',
          },
        },
      },

      // Utility schemas
      Pagination: {
        type: 'object',
        properties: {
          page: {
            type: 'integer',
            description: 'Current page number',
          },
          pageSize: {
            type: 'integer',
            description: 'Items per page',
          },
          total: {
            type: 'integer',
            description: 'Total number of items',
          },
          totalPages: {
            type: 'integer',
            description: 'Total number of pages',
          },
          hasNext: {
            type: 'boolean',
            description: 'Whether there are more pages',
          },
          hasPrev: {
            type: 'boolean',
            description: 'Whether there are previous pages',
          },
        },
      },
      HealthResponse: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['ok', 'error'],
            description: 'Service status',
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            description: 'Health check timestamp',
          },
          version: {
            type: 'string',
            description: 'API version',
          },
          environment: {
            type: 'string',
            description: 'Environment name',
          },
          database: {
            type: 'string',
            enum: ['connected', 'disconnected'],
            description: 'Database connection status',
          },
        },
      },
      APIInfoResponse: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
            description: 'API name',
          },
          description: {
            type: 'string',
            description: 'API description',
          },
          version: {
            type: 'string',
            description: 'API version',
          },
          endpoints: {
            type: 'object',
            description: 'Available endpoints grouped by category',
          },
        },
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
};

const options = {
  definition: swaggerDefinition,
  apis: ['./src/routes/*.ts', './src/index.ts'], // Path to the API files
};

export const swaggerSpec = swaggerJSDoc(options);
