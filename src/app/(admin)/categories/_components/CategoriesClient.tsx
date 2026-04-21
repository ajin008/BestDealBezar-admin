"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, Pencil, Trash2 } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Toggle";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { slugify } from "@/lib/utils";
import type { Category, CategoryFormData } from "@/types";

// ─── Default form ──────────────────────────────────────────────────────────────

const DEFAULT_FORM: CategoryFormData = {
  name: "",
  slug: "",
  image_url: null,
  is_active: true,
  sort_order: 0,
};

// ─── Main Component ────────────────────────────────────────────────────────────

export function CategoriesClient() {
  const {
    categories,
    isLoading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
    toggleActive,
    refetch,
  } = useCategories();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [form, setForm] = useState<CategoryFormData>(DEFAULT_FORM);
  const [formErrors, setFormErrors] = useState<Partial<CategoryFormData>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ─── DnD sensors ────────────────────────────────────────────────────────────

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // ─── Drag end — reorder categories ──────────────────────────────────────────

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = categories.findIndex((c) => c.id === active.id);
      const newIndex = categories.findIndex((c) => c.id === over.id);
      const reordered = arrayMove(categories, oldIndex, newIndex);

      // Update sort_order for all reordered categories
      await Promise.all(
        reordered.map((cat, index) =>
          updateCategory(cat.id, { sort_order: index })
        )
      );

      refetch();
    },
    [categories, updateCategory, refetch]
  );

  // ─── Open modal for add ──────────────────────────────────────────────────────

  const handleAddClick = useCallback(() => {
    setEditingCategory(null);
    setForm({ ...DEFAULT_FORM, sort_order: categories.length });
    setFormErrors({});
    setGeneralError(null);
    setIsModalOpen(true);
  }, [categories.length]);

  // ─── Open modal for edit ─────────────────────────────────────────────────────

  const handleEditClick = useCallback((category: Category) => {
    setEditingCategory(category);
    setForm({
      name: category.name,
      slug: category.slug,
      image_url: category.image_url,
      is_active: category.is_active,
      sort_order: category.sort_order,
    });
    setFormErrors({});
    setGeneralError(null);
    setIsModalOpen(true);
  }, []);

  // ─── Close modal ─────────────────────────────────────────────────────────────

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setForm(DEFAULT_FORM);
    setFormErrors({});
    setGeneralError(null);
  }, []);

  // ─── Form field change ───────────────────────────────────────────────────────

  const handleFormChange = useCallback(
    (field: keyof CategoryFormData, value: string | boolean | null) => {
      setForm((prev) => {
        const updated = { ...prev, [field]: value };
        // Auto-generate slug from name
        if (field === "name") {
          updated.slug = slugify(value as string);
        }
        return updated;
      });
      if (field in formErrors) {
        setFormErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    },
    [formErrors]
  );

  // ─── Validate ────────────────────────────────────────────────────────────────

  function validate(): boolean {
    const errors: Partial<CategoryFormData> = {};
    if (!form.name.trim()) errors.name = "Category name is required";
    if (!form.slug.trim()) errors.slug = "Slug is required";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  // ─── Save category ───────────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    if (!validate()) return;

    setIsSaving(true);
    setGeneralError(null);

    try {
      const result = editingCategory
        ? await updateCategory(editingCategory.id, form)
        : await createCategory(form);

      if (result.error) {
        setGeneralError(result.error);
        return;
      }

      handleCloseModal();
    } finally {
      setIsSaving(false);
    }
  }, [form, editingCategory, createCategory, updateCategory, handleCloseModal]);

  // ─── Delete category ─────────────────────────────────────────────────────────

  const handleDelete = useCallback(
    async (id: string) => {
      if (
        !confirm(
          "Delete this category? Products in this category will become uncategorized."
        )
      )
        return;

      setDeletingId(id);
      try {
        const result = await deleteCategory(id);
        if (result.error) {
          alert(result.error);
        }
      } finally {
        setDeletingId(null);
      }
    },
    [deleteCategory]
  );

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">
      {/* ── Page header ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Categories</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Drag rows to reorder. Click edit to modify.
          </p>
        </div>
        <Button onClick={handleAddClick}>
          <Plus size={16} />
          Add Category
        </Button>
      </div>

      {/* ── Error ──────────────────────────────────────────────────────────── */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ── Categories list ────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-900 border-t-transparent" />
          </div>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-sm font-medium text-gray-900">
              No categories yet
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Add your first category to organise products
            </p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={categories.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              <ul className="divide-y divide-gray-100">
                {categories.map((category) => (
                  <SortableCategoryRow
                    key={category.id}
                    category={category}
                    onEdit={handleEditClick}
                    onDelete={handleDelete}
                    onToggleActive={toggleActive}
                    isDeleting={deletingId === category.id}
                  />
                ))}
              </ul>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* ── Add / Edit Modal ───────────────────────────────────────────────── */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingCategory ? "Edit category" : "Add category"}
        size="sm"
      >
        <div className="flex flex-col gap-4">
          {generalError && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
              {generalError}
            </div>
          )}

          <Input
            label="Name"
            required
            value={form.name}
            onChange={(e) => handleFormChange("name", e.target.value)}
            error={
              typeof formErrors.name === "string" ? formErrors.name : undefined
            }
            placeholder="Groceries & Staples"
            autoFocus
          />

          <Input
            label="Slug"
            required
            value={form.slug}
            onChange={(e) => handleFormChange("slug", e.target.value)}
            error={
              typeof formErrors.slug === "string" ? formErrors.slug : undefined
            }
            placeholder="groceries-staples"
            hint="Auto-generated from name"
          />

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-gray-900">Active</p>
              <p className="text-xs text-gray-500">Show in storefront menus</p>
            </div>
            <Toggle
              checked={form.is_active}
              onChange={(v) => handleFormChange("is_active", v)}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={handleCloseModal}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleSave}
              isLoading={isSaving}
              loadingText="Saving..."
            >
              {editingCategory ? "Save changes" : "Create category"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── Sortable Category Row ─────────────────────────────────────────────────────

interface SortableCategoryRowProps {
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string, is_active: boolean) => void;
  isDeleting: boolean;
}

function SortableCategoryRow({
  category,
  onEdit,
  onDelete,
  onToggleActive,
  isDeleting,
}: SortableCategoryRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
    >
      {/* Drag handle */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 transition-colors touch-none"
        aria-label="Drag to reorder"
      >
        <GripVertical size={18} />
      </button>

      {/* Category image */}
      <div className="h-9 w-9 rounded-lg overflow-hidden bg-gray-100 shrink-0">
        {category.image_url ? (
          <img
            src={category.image_url}
            alt={category.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <span className="text-xs font-medium text-gray-400">
              {category.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Name + slug */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {category.name}
        </p>
        <p className="text-xs text-gray-400 truncate">/{category.slug}</p>
      </div>

      {/* Active toggle */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs text-gray-500 hidden sm:inline">Active</span>
        <Toggle
          checked={category.is_active}
          onChange={(checked) => onToggleActive(category.id, checked)}
        />
      </div>

      {/* Edit button */}
      <button
        type="button"
        onClick={() => onEdit(category)}
        className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
        aria-label={`Edit ${category.name}`}
      >
        <Pencil size={15} />
      </button>

      {/* Delete button */}
      <button
        type="button"
        onClick={() => onDelete(category.id)}
        disabled={isDeleting}
        className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
        aria-label={`Delete ${category.name}`}
      >
        <Trash2 size={15} />
      </button>
    </li>
  );
}
