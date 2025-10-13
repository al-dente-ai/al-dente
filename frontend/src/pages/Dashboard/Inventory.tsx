import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useItems, toast } from '../../store';
import { CreateItemSchema, UpdateItemSchema, type CreateItemFormData, type UpdateItemFormData } from '../../lib/validators';
import { formatRelativeDate, getCategoryColor, debounce } from '../../lib/utils';
import type { Item, ItemsQuery } from '../../lib/types';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Card from '../../components/ui/Card';
import Modal from '../../components/ui/Modal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import Spinner from '../../components/ui/Spinner';

const CATEGORIES = [
  { value: 'produce', label: 'Produce' },
  { value: 'dairy', label: 'Dairy' },
  { value: 'meat', label: 'Meat' },
  { value: 'grains', label: 'Grains' },
  { value: 'spices', label: 'Spices' },
  { value: 'condiments', label: 'Condiments' },
  { value: 'snacks', label: 'Snacks' },
  { value: 'beverages', label: 'Beverages' },
];

export default function Inventory() {
  const { items, pagination, isLoading, isSubmitting, fetchAll, create, update, remove } = useItems();
  const [query, setQuery] = useState<ItemsQuery>({ page: 1, pageSize: 20, sort: 'expiry', order: 'asc' });
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [addImagePreview, setAddImagePreview] = useState<string | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);

  // Forms
  const addForm = useForm<CreateItemFormData>({
    resolver: zodResolver(CreateItemSchema),
  });

  const editForm = useForm<UpdateItemFormData>({
    resolver: zodResolver(UpdateItemSchema),
  });

  // Load items on mount and when query changes
  useEffect(() => {
    fetchAll({ ...query, categories: selectedCategories.length > 0 ? selectedCategories : undefined });
  }, [query, selectedCategories, fetchAll]);

  // Clear selections when page changes or filters are applied
  useEffect(() => {
    setSelectedItems(new Set());
  }, [query.page, query.q, selectedCategories]);

  // Debounced search
  const debouncedSearch = debounce((searchTerm: string) => {
    setQuery(prev => ({ ...prev, q: searchTerm, page: 1 }));
  }, 300);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
  };

  const handleCategoryFilter = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
    setQuery(prev => ({ ...prev, page: 1 }));
  };

  const handleSort = (column: 'name' | 'expiry' | 'amount' | 'categories') => {
    setQuery(prev => {
      // If clicking the same column, toggle the order
      if (prev.sort === column) {
        return { ...prev, order: prev.order === 'asc' ? 'desc' : 'asc', page: 1 };
      }
      // If clicking a different column, set it as the sort column with ascending order
      return { ...prev, sort: column, order: 'asc', page: 1 };
    });
  };

  const handlePageChange = (newPage: number) => {
    setQuery(prev => ({ ...prev, page: newPage }));
  };

  const handleAddImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAddImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddItem = async (data: CreateItemFormData) => {
    try {
      const itemData = { ...data };
      if (addImagePreview) {
        itemData.image_url = addImagePreview;
      }
      await create(itemData);
      toast.success(`Added "${data.name}" to inventory`);
      setShowAddModal(false);
      addForm.reset();
      setAddImagePreview(null);
    } catch (error) {
      toast.error('Failed to add item');
    }
  };

  const handleEditItem = async (data: UpdateItemFormData) => {
    if (!editingItem) return;

    try {
      const itemData = { ...data };
      if (editImagePreview) {
        itemData.image_url = editImagePreview;
      }
      await update(editingItem.id, itemData);
      toast.success(`Updated "${editingItem.name}"`);
      setEditingItem(null);
      editForm.reset();
      setEditImagePreview(null);
    } catch (error) {
      toast.error('Failed to update item');
    }
  };

  const handleDeleteItem = async (item: Item) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) return;

    try {
      await remove(item.id);
      toast.success(`Deleted "${item.name}"`);
    } catch (error) {
      toast.error('Failed to delete item');
    }
  };

  const handleToggleItem = (itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleToggleAll = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map(item => item.id)));
    }
  };

  const handleBulkDelete = async () => {
    const count = selectedItems.size;
    if (count === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${count} item${count > 1 ? 's' : ''}?`)) return;

    try {
      await Promise.all(Array.from(selectedItems).map(id => remove(id)));
      toast.success(`Deleted ${count} item${count > 1 ? 's' : ''}`);
      setSelectedItems(new Set());
    } catch (error) {
      toast.error('Failed to delete items');
    }
  };

  const openEditModal = (item: Item) => {
    setEditingItem(item);
    setEditImagePreview(item.image_url || null);
    editForm.reset({
      name: item.name,
      amount: item.amount || '',
      expiry: item.expiry || '',
      categories: item.categories,
      notes: item.notes || '',
      image_url: item.image_url || '',
    });
  };

  // Helper to render sortable column headers
  const SortableHeader = ({ column, label }: { column: 'name' | 'expiry' | 'amount' | 'categories'; label: string }) => {
    const isSorted = query.sort === column;
    const isAsc = query.order === 'asc';
    
    return (
      <button
        onClick={() => handleSort(column)}
        className="flex items-center space-x-1.5 hover:text-accent-600 transition-colors font-medium"
      >
        <span>{label}</span>
        <span className="flex flex-col items-center -space-y-1">
          {isSorted ? (
            isAsc ? (
              <span className="text-accent-600">▲</span>
            ) : (
              <span className="text-accent-600">▼</span>
            )
          ) : (
            <>
              <span className="text-neutral-300 text-[10px]">▲</span>
              <span className="text-neutral-300 text-[10px]">▼</span>
            </>
          )}
        </span>
      </button>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-800">Pantry Inventory</h1>
        <p className="mt-1 text-sm text-neutral-600">
          {selectedItems.size > 0 
            ? `${selectedItems.size} item${selectedItems.size > 1 ? 's' : ''} selected`
            : 'Manage your food items and track expiry dates.'
          }
        </p>
      </div>

      {/* Filters */}
      <Card>
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-1">
            <Input
              placeholder="Search items..."
              onChange={handleSearch}
            />
          </div>

          {/* Category filter pills */}
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((category) => (
              <button
                key={category.value}
                onClick={() => handleCategoryFilter(category.value)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedCategories.includes(category.value)
                    ? 'bg-accent-100 text-accent-800 border-2 border-accent-200'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                {category.label}
              </button>
            ))}
            {selectedCategories.length > 0 && (
              <button
                onClick={() => setSelectedCategories([])}
                className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 hover:bg-red-200"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Action buttons */}
      <div className="flex justify-end gap-2">
        {selectedItems.size > 0 && (
          <Button 
            onClick={handleBulkDelete}
            variant="outline"
            className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
          >
            Delete Selected ({selectedItems.size})
          </Button>
        )}
        <Button onClick={() => setShowAddModal(true)}>
          Add Item
        </Button>
      </div>

      {/* Items Table */}
      <Card padding="sm">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner size="lg" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📦</div>
            <h3 className="text-lg font-medium text-neutral-800 mb-2">No items found</h3>
            <p className="text-neutral-600 mb-4">
              {selectedCategories.length > 0 || query.q
                ? 'Try adjusting your filters or search term.'
                : 'Start by adding some items to your pantry.'}
            </p>
            <Button onClick={() => setShowAddModal(true)}>
              Add Your First Item
            </Button>
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={items.length > 0 && selectedItems.size === items.length}
                      onChange={handleToggleAll}
                      className="rounded border-neutral-300 text-accent-600 focus:ring-accent-500 cursor-pointer"
                    />
                  </TableHead>
                  <TableHead className="hidden sm:table-cell">
                    <SortableHeader column="name" label="Item" />
                  </TableHead>
                  <TableHead className="hidden lg:table-cell">
                    <SortableHeader column="amount" label="Amount" />
                  </TableHead>
                  <TableHead className="hidden xl:table-cell">
                    <SortableHeader column="categories" label="Categories" />
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    <SortableHeader column="expiry" label="Expiry" />
                  </TableHead>
                  <TableHead><span></span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.id)}
                        onChange={() => handleToggleItem(item.id)}
                        className="rounded border-neutral-300 text-accent-600 focus:ring-accent-500 cursor-pointer"
                      />
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <button
                        onClick={() => openEditModal(item)}
                        className="flex items-center space-x-3 text-left hover:opacity-75 transition-opacity w-full"
                      >
                        {item.image_url && (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="h-10 w-10 rounded-lg object-cover cursor-pointer"
                          />
                        )}
                        <div>
                          <div className="font-medium text-neutral-800 hover:text-accent-600 cursor-pointer">
                            {item.name}
                          </div>
                        </div>
                      </button>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">{item.amount || '—'}</TableCell>
                    <TableCell className="hidden xl:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {item.categories.map((category) => (
                          <span
                            key={category}
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(category)}`}
                          >
                            {category}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {item.expiry ? (
                        <span className={`text-sm ${
                          new Date(item.expiry) < new Date() ? 'text-red-600 font-medium' :
                          new Date(item.expiry) < new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) ? 'text-accent-700 font-medium bg-accent-100 px-2 py-1 rounded' :
                          'text-neutral-600'
                        }`}>
                          {formatRelativeDate(item.expiry)}
                        </span>
                      ) : (
                        <span className="text-neutral-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleDeleteItem(item)}
                        className="p-2 hover:bg-red-50 rounded-full transition-colors group"
                        title="Delete item"
                      >
                        <svg
                          className="w-5 h-5 text-neutral-400 group-hover:text-red-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-200">
                <div className="text-sm text-neutral-700">
                  Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total items)
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={!pagination.hasPrev}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={!pagination.hasNext}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Add Item Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          addForm.reset();
          setAddImagePreview(null);
        }}
        title="Add New Item"
      >
        <form onSubmit={addForm.handleSubmit(handleAddItem)} className="space-y-4">
          <Input
            label="Item Name"
            {...addForm.register('name')}
            error={addForm.formState.errors.name?.message}
          />
          <Input
            label="Amount"
            placeholder="e.g., 1 container, 500g, 2 cups"
            {...addForm.register('amount')}
            error={addForm.formState.errors.amount?.message}
          />
          <Input
            label="Expiry Date"
            type="date"
            {...addForm.register('expiry')}
            error={addForm.formState.errors.expiry?.message}
          />
          <Input
            label="Notes"
            placeholder="Any additional notes..."
            {...addForm.register('notes')}
            error={addForm.formState.errors.notes?.message}
          />
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleAddImageChange}
              className="block w-full text-sm text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-accent-50 file:text-accent-700 hover:file:bg-accent-100 cursor-pointer"
            />
            {addImagePreview && (
              <div className="mt-3">
                <img
                  src={addImagePreview}
                  alt="Preview"
                  className="h-32 w-32 object-cover rounded-lg"
                />
              </div>
            )}
          </div>
          <div className="flex space-x-3 pt-4">
            <Button
              type="submit"
              className="flex-1"
              isLoading={isSubmitting}
            >
              Add Item
            </Button>
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => {
                setShowAddModal(false);
                addForm.reset();
                setAddImagePreview(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Item Modal */}
      <Modal
        isOpen={!!editingItem}
        onClose={() => {
          setEditingItem(null);
          editForm.reset();
          setEditImagePreview(null);
        }}
        title="Edit Item"
      >
        <form onSubmit={editForm.handleSubmit(handleEditItem)} className="space-y-4">
          <Input
            label="Item Name"
            {...editForm.register('name')}
            error={editForm.formState.errors.name?.message}
          />
          <Input
            label="Amount"
            placeholder="e.g., 1 container, 500g, 2 cups"
            {...editForm.register('amount')}
            error={editForm.formState.errors.amount?.message}
          />
          <Input
            label="Expiry Date"
            type="date"
            {...editForm.register('expiry')}
            error={editForm.formState.errors.expiry?.message}
          />
          <Input
            label="Notes"
            placeholder="Any additional notes..."
            {...editForm.register('notes')}
            error={editForm.formState.errors.notes?.message}
          />
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleEditImageChange}
              className="block w-full text-sm text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-accent-50 file:text-accent-700 hover:file:bg-accent-100 cursor-pointer"
            />
            {editImagePreview && (
              <div className="mt-3">
                <img
                  src={editImagePreview}
                  alt="Preview"
                  className="h-32 w-32 object-cover rounded-lg"
                />
              </div>
            )}
          </div>
          <div className="space-y-3 pt-4">
            <div className="flex space-x-3">
              <Button
                type="submit"
                className="flex-1"
                isLoading={isSubmitting}
              >
                Update Item
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setEditingItem(null);
                  editForm.reset();
                  setEditImagePreview(null);
                }}
              >
                Cancel
              </Button>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full text-red-600 hover:text-red-700 border-red-300 hover:border-red-400 hover:bg-red-50"
              onClick={() => {
                if (editingItem) {
                  handleDeleteItem(editingItem);
                  setEditingItem(null);
                  editForm.reset();
                  setEditImagePreview(null);
                }
              }}
            >
              Delete Item
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
