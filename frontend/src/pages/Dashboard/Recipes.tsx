import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRecipes, useItems, toast } from '../../store';
import { GenerateRecipesSchema, type GenerateRecipesFormData } from '../../lib/validators';
import type { Recipe } from '../../lib/types';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import Spinner from '../../components/ui/Spinner';
import { formatDate } from '../../lib/utils';

const MEAL_TYPES = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
];

export default function Recipes() {
  const { 
    recipes, 
    pagination, 
    isLoading, 
    isGenerating, 
    isSubmitting, 
    fetchAll, 
    generate, 
    remove 
  } = useRecipes();
  const { items, fetchAll: fetchItems } = useItems();
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<GenerateRecipesFormData>({
    resolver: zodResolver(GenerateRecipesSchema),
    defaultValues: {
      count: 2,
      generate_images: true,
    },
  });

  // Load recipes and items on mount
  useEffect(() => {
    fetchAll();
    fetchItems();
  }, [fetchAll, fetchItems]);

  const handleGenerateRecipes = async (data: GenerateRecipesFormData) => {
    try {
      const generatedRecipes = await generate(data);
      toast.success(`Generated ${generatedRecipes.length} recipe${generatedRecipes.length === 1 ? '' : 's'}!`);
      reset();
    } catch (error) {
      toast.error('Failed to generate recipes');
    }
  };

  const handleDeleteRecipe = async (recipe: Recipe) => {
    if (!confirm(`Are you sure you want to delete "${recipe.title}"?`)) return;

    try {
      await remove(recipe.id);
      toast.success(`Deleted "${recipe.title}"`);
    } catch (error) {
      toast.error('Failed to delete recipe');
    }
  };

  const getRecipeStats = (recipe: Recipe) => {
    const stats = [];
    if (recipe.servings) stats.push(`${recipe.servings} serving${recipe.servings === 1 ? '' : 's'}`);
    if (recipe.prep_time_minutes) {
      const hours = Math.floor(recipe.prep_time_minutes / 60);
      const minutes = recipe.prep_time_minutes % 60;
      if (hours > 0) {
        stats.push(`${hours}h ${minutes}m`);
      } else {
        stats.push(`${minutes} min`);
      }
    }
    return stats.join(' • ');
  };

  const getUsedIngredients = (recipe: Recipe) => {
    if (!recipe.uses_item_ids || recipe.uses_item_ids.length === 0) return [];
    return items.filter(item => recipe.uses_item_ids.includes(item.id));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Recipes</h1>
        <p className="mt-1 text-sm text-gray-600">
          Generate AI-powered recipes based on your pantry items.
        </p>
      </div>

      {/* Recipe Generator */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Generate New Recipes</h2>
        <form onSubmit={handleSubmit(handleGenerateRecipes)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Select
              label="Meal Type"
              options={[{ value: '', label: 'Any meal type' }, ...MEAL_TYPES]}
              {...register('meal_type')}
              error={errors.meal_type?.message}
            />
            <Input
              label="Number of Recipes"
              type="number"
              min="1"
              max="5"
              {...register('count', { valueAsNumber: true })}
              error={errors.count?.message}
            />
          </div>
          <Input
            label="Special Instructions"
            placeholder="e.g., vegetarian, quick meals, Italian cuisine..."
            {...register('user_prompt')}
            error={errors.user_prompt?.message}
          />
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="generate_images"
              {...register('generate_images')}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="generate_images" className="text-sm text-gray-700">
              Generate recipe images (may take longer)
            </label>
          </div>
          <Button
            type="submit"
            isLoading={isGenerating}
            disabled={isGenerating || items.length === 0}
            className="w-full md:w-auto"
          >
            {isGenerating ? 'Generating Recipes...' : 'Generate Recipes'}
          </Button>
          {items.length === 0 && (
            <p className="text-sm text-yellow-600">
              Add some items to your inventory first to generate personalized recipes.
            </p>
          )}
        </form>
      </Card>

      {/* Recipes List */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Your Recipes</h2>
          {pagination && (
            <span className="text-sm text-gray-600">
              {pagination.total} recipe{pagination.total === 1 ? '' : 's'}
            </span>
          )}
        </div>

        {isLoading ? (
          <Card>
            <div className="flex justify-center py-8">
              <Spinner size="lg" />
            </div>
          </Card>
        ) : recipes.length === 0 ? (
          <Card>
            <div className="text-center py-8">
              <div className="text-4xl mb-4">👨‍🍳</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No recipes yet</h3>
              <p className="text-gray-600 mb-4">
                Generate your first recipe using the form above.
              </p>
            </div>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {recipes.map((recipe) => {
              const usedIngredients = getUsedIngredients(recipe);
              return (
                <Card key={recipe.id} className="group cursor-pointer hover:shadow-md transition-shadow">
                  <div onClick={() => setSelectedRecipe(recipe)}>
                    {recipe.image_url && (
                      <img
                        src={recipe.image_url}
                        alt={recipe.title}
                        className="w-full h-48 object-cover rounded-lg mb-4"
                      />
                    )}
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {recipe.title}
                        </h3>
                        {recipe.description && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{recipe.description}</p>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span className="capitalize bg-gray-100 px-2 py-1 rounded-full">
                          {recipe.meal_type}
                        </span>
                        <span>{formatDate(recipe.created_at)}</span>
                      </div>

                      {getRecipeStats(recipe) && (
                        <div className="text-sm text-gray-600">
                          {getRecipeStats(recipe)}
                        </div>
                      )}

                      {usedIngredients.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-green-700 mb-1">
                            Uses {usedIngredients.length} item{usedIngredients.length === 1 ? '' : 's'} from your pantry:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {usedIngredients.slice(0, 3).map((item) => (
                              <span
                                key={item.id}
                                className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                              >
                                {item.name}
                              </span>
                            ))}
                            {usedIngredients.length > 3 && (
                              <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                +{usedIngredients.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRecipe(recipe);
                        }}
                        className="flex-1"
                      >
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteRecipe(recipe);
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Recipe Detail Modal */}
      <Modal
        isOpen={!!selectedRecipe}
        onClose={() => setSelectedRecipe(null)}
        title={selectedRecipe?.title}
        size="xl"
      >
        {selectedRecipe && (
          <div className="space-y-6">
            {selectedRecipe.image_url && (
              <img
                src={selectedRecipe.image_url}
                alt={selectedRecipe.title}
                className="w-full h-64 object-cover rounded-lg"
              />
            )}

            {selectedRecipe.description && (
              <p className="text-gray-600">{selectedRecipe.description}</p>
            )}

            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {selectedRecipe.servings || '—'}
                </div>
                <div className="text-sm text-gray-600">Servings</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  {selectedRecipe.prep_time_minutes ? `${selectedRecipe.prep_time_minutes}m` : '—'}
                </div>
                <div className="text-sm text-gray-600">Prep Time</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-xl font-bold text-gray-900 capitalize">
                  {selectedRecipe.meal_type}
                </div>
                <div className="text-sm text-gray-600">Meal Type</div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Ingredients</h3>
              <ul className="space-y-2">
                {selectedRecipe.ingredients.map((ingredient, index) => (
                  <li key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span>{ingredient.name}</span>
                    {ingredient.quantity && (
                      <span className="text-gray-600">{ingredient.quantity}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Instructions</h3>
              <ol className="space-y-3">
                {selectedRecipe.steps.map((step, index) => (
                  <li key={index} className="flex space-x-3">
                    <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 text-sm font-medium rounded-full">
                      {index + 1}
                    </span>
                    <span className="text-gray-700">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {getUsedIngredients(selectedRecipe).length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">From Your Pantry</h3>
                <div className="grid gap-2 md:grid-cols-2">
                  {getUsedIngredients(selectedRecipe).map((item) => (
                    <div key={item.id} className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                      {item.image_url && (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-8 h-8 rounded object-cover"
                        />
                      )}
                      <div>
                        <div className="font-medium text-green-900">{item.name}</div>
                        {item.amount && (
                          <div className="text-sm text-green-700">{item.amount}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
