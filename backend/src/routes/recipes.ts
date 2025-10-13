import { Router, Request, Response, NextFunction } from 'express';
import { recipesService } from '../services/recipesService';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { validateBody, validateQuery, validateParams } from '../middleware/validate';
import {
  generateRecipesSchema,
  createRecipeSchema,
  recipesQuerySchema,
  recipeParamsSchema,
} from '../schemas/recipes';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

const generateRecipes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const recipes = await recipesService.generateRecipes(authReq.user.id, authReq.body);

    res.status(201).json({ data: recipes });
  } catch (error) {
    next(error);
  }
};

const createRecipe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const recipe = await recipesService.createRecipe(authReq.user.id, authReq.body);

    res.status(201).json(recipe);
  } catch (error) {
    next(error);
  }
};

const getRecipes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const result = await recipesService.getRecipes(authReq.user.id, authReq.query as any);

    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const getRecipeById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const recipe = await recipesService.getRecipeById(authReq.user.id, authReq.params.id);

    res.status(200).json(recipe);
  } catch (error) {
    next(error);
  }
};

const deleteRecipe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authReq = req as AuthenticatedRequest;
    await recipesService.deleteRecipe(authReq.user.id, authReq.params.id);

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /recipes/generate:
 *   post:
 *     summary: Generate AI-powered recipes
 *     description: Generate recipes using AI based on available pantry items and user preferences
 *     tags: [Recipes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GenerateRecipesRequest'
 *     responses:
 *       201:
 *         description: Recipes generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/GeneratedRecipesResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: AI generation failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/generate', validateBody(generateRecipesSchema), generateRecipes);
/**
 * @swagger
 * /recipes:
 *   post:
 *     summary: Create a custom recipe
 *     description: Create a new custom recipe in the user's collection
 *     tags: [Recipes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateRecipeRequest'
 *     responses:
 *       201:
 *         description: Recipe created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Recipe'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', validateBody(createRecipeSchema), createRecipe);
/**
 * @swagger
 * /recipes:
 *   get:
 *     summary: List user recipes
 *     description: Get a paginated list of user's saved recipes
 *     tags: [Recipes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of recipes per page
 *     responses:
 *       200:
 *         description: Recipes retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RecipesResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', validateQuery(recipesQuerySchema), getRecipes);
/**
 * @swagger
 * /recipes/{id}:
 *   get:
 *     summary: Get a specific recipe
 *     description: Retrieve details of a specific recipe by ID
 *     tags: [Recipes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Recipe ID
 *     responses:
 *       200:
 *         description: Recipe retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Recipe'
 *       400:
 *         description: Invalid recipe ID format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Recipe not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', validateParams(recipeParamsSchema), getRecipeById);
/**
 * @swagger
 * /recipes/{id}:
 *   delete:
 *     summary: Delete a recipe
 *     description: Remove a recipe from the user's collection
 *     tags: [Recipes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Recipe ID
 *     responses:
 *       204:
 *         description: Recipe deleted successfully
 *       400:
 *         description: Invalid recipe ID format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Recipe not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', validateParams(recipeParamsSchema), deleteRecipe);

export { router as recipesRouter };
