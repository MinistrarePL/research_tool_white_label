"use client";

import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { Button, TextInput, Label, Card, Badge, Radio } from "flowbite-react";
import { HiPlus, HiTrash } from "react-icons/hi";
import SortableAdminCard from "./SortableAdminCard";
import SortableCategoryCard from "./SortableCategoryCard";

type CardType = {
  id: string;
  label: string;
  description: string | null;
  order: number;
};

type CategoryType = {
  id: string;
  name: string;
  isUserCreated: boolean;
  order?: number;
};

type Study = {
  id: string;
  status?: string;
  sortingType?: string | null;
  cards: CardType[];
  categories: CategoryType[];
};

export default function CardSortingEditor({
  study,
  onUpdate,
}: {
  study: Study;
  onUpdate: () => void;
}) {
  const isActive = study.status === "ACTIVE";
  const [newCard, setNewCard] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [sortingType, setSortingType] = useState<string>(
    study.sortingType || "OPEN"
  );
  const [cards, setCards] = useState<CardType[]>(study.cards);
  const [categories, setCategories] = useState<CategoryType[]>(study.categories);

  useEffect(() => {
    setCards(study.cards);
  }, [study.cards]);

  useEffect(() => {
    setCategories(study.categories);
  }, [study.categories]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    setSortingType(study.sortingType || "OPEN");
  }, [study.sortingType]);

  const updateSortingType = async (newType: string) => {
    setSortingType(newType);
    await fetch(`/api/studies/${study.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sortingType: newType }),
    });
    onUpdate();
  };

  const addCard = async () => {
    if (!newCard.trim()) return;
    setLoading(true);
    await fetch(`/api/studies/${study.id}/cards`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: newCard }),
    });
    setNewCard("");
    setLoading(false);
    onUpdate();
  };

  const deleteCard = async (cardId: string) => {
    await fetch(`/api/studies/${study.id}/cards/${cardId}`, {
      method: "DELETE",
    });
    onUpdate();
  };

  const addCategory = async () => {
    if (!newCategory.trim()) return;
    setLoading(true);
    await fetch(`/api/studies/${study.id}/categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCategory }),
    });
    setNewCategory("");
    setLoading(false);
    onUpdate();
  };

  const deleteCategory = async (categoryId: string) => {
    await fetch(`/api/studies/${study.id}/categories/${categoryId}`, {
      method: "DELETE",
    });
    onUpdate();
  };

  const handleCardsDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = cards.findIndex((c) => c.id === active.id);
    const newIndex = cards.findIndex((c) => c.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const newCards = arrayMove(cards, oldIndex, newIndex);
    setCards(newCards);

    // Update order in database
    await Promise.all(
      newCards.map((card, index) =>
        fetch(`/api/studies/${study.id}/cards/${card.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: index }),
        })
      )
    );
    onUpdate();
  };

  const handleCategoriesDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = categories.findIndex((c) => c.id === active.id);
    const newIndex = categories.findIndex((c) => c.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const newCategories = arrayMove(categories, oldIndex, newIndex);
    setCategories(newCategories);

    // Update order in database
    await Promise.all(
      newCategories.map((category, index) =>
        fetch(`/api/studies/${study.id}/categories/${category.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: index }),
        })
      )
    );
    onUpdate();
  };

  const editCard = async (cardId: string, newLabel: string) => {
    await fetch(`/api/studies/${study.id}/cards/${cardId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: newLabel }),
    });
    onUpdate();
  };

  const editCategory = async (categoryId: string, newName: string) => {
    await fetch(`/api/studies/${study.id}/categories/${categoryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });
    onUpdate();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Cards ({study.cards.length})
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Add cards that participants will sort into categories.
        </p>
        {isActive && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Study is active:</strong> Editing is disabled. Stop the study to make changes.
            </p>
          </div>
        )}
        <div className="flex gap-2 mb-4">
          <TextInput
            placeholder="Add new card..."
            value={newCard}
            onChange={(e) => setNewCard(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !isActive && addCard()}
            className="flex-1"
            disabled={isActive}
          />
          <Button onClick={addCard} disabled={loading || isActive} color="blue">
            <HiPlus className="h-5 w-5" />
          </Button>
        </div>
        {isActive ? (
          <div className="space-y-2">
            {cards.map((card) => (
              <Card key={card.id} className="py-2 px-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-900 dark:text-white">{card.label}</span>
                  <Button
                    size="xs"
                    color="failure"
                    onClick={() => deleteCard(card.id)}
                    disabled={isActive}
                  >
                    <HiTrash className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleCardsDragEnd}
          >
            <SortableContext
              items={cards.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {cards.map((card) => (
                  <SortableAdminCard
                    key={card.id}
                    id={card.id}
                    label={card.label}
                    onDelete={() => deleteCard(card.id)}
                    onEdit={(newLabel) => editCard(card.id, newLabel)}
                    disabled={isActive}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Categories ({study.categories.length})
        </h3>

        {/* Sorting Type Selection */}
        <div className="mb-4">
          <Label className="mb-2 block text-gray-900 dark:text-white">
            Sorting Type
          </Label>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Radio
                id="open"
                name="sortingType"
                value="OPEN"
                checked={sortingType === "OPEN"}
                onChange={(e) => updateSortingType(e.target.value)}
                disabled={isActive}
              />
              <Label htmlFor="open" className={isActive ? "cursor-not-allowed opacity-50" : "cursor-pointer"}>
                <span className="font-medium">Open</span> - Participants create their own categories
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Radio
                id="closed"
                name="sortingType"
                value="CLOSED"
                checked={sortingType === "CLOSED"}
                onChange={(e) => updateSortingType(e.target.value)}
                disabled={isActive}
              />
              <Label htmlFor="closed" className={isActive ? "cursor-not-allowed opacity-50" : "cursor-pointer"}>
                <span className="font-medium">Closed</span> - Only predefined categories
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Radio
                id="hybrid"
                name="sortingType"
                value="HYBRID"
                checked={sortingType === "HYBRID"}
                onChange={(e) => updateSortingType(e.target.value)}
                disabled={isActive}
              />
              <Label htmlFor="hybrid" className={isActive ? "cursor-not-allowed opacity-50" : "cursor-pointer"}>
                <span className="font-medium">Hybrid</span> - Participants can modify predefined categories
              </Label>
            </div>
          </div>
        </div>

        {/* Categories Section - visibility based on type */}
        {sortingType === "OPEN" ? (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Open sorting:</strong> Participants will create their own categories. You don't need to add categories here.
            </p>
          </div>
        ) : (
          <>
            {sortingType === "HYBRID" && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Participants can modify these categories (edit names, delete if empty).
              </p>
            )}
            {sortingType === "CLOSED" && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Participants can only use these predefined categories.
              </p>
            )}
            <div className="flex gap-2 mb-4">
              <TextInput
                placeholder="Add category..."
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !isActive && addCategory()}
                className="flex-1"
                disabled={isActive}
              />
              <Button onClick={addCategory} disabled={loading || isActive} color="blue">
                <HiPlus className="h-5 w-5" />
              </Button>
            </div>
            {isActive ? (
              <div className="space-y-2">
                {categories.map((category) => (
                  <Card key={category.id} className="py-2 px-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-900 dark:text-white">{category.name}</span>
                      <Button
                        size="xs"
                        color="failure"
                        onClick={() => deleteCategory(category.id)}
                        disabled={isActive}
                      >
                        <HiTrash className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
                {categories.length === 0 && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                    {sortingType === "CLOSED" 
                      ? "Add categories that participants will use."
                      : "Add categories that participants can modify."}
                  </p>
                )}
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleCategoriesDragEnd}
              >
                <SortableContext
                  items={categories.map((c) => c.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <SortableCategoryCard
                        key={category.id}
                        id={category.id}
                        name={category.name}
                        onDelete={() => deleteCategory(category.id)}
                        onEdit={(newName) => editCategory(category.id, newName)}
                        disabled={isActive}
                      />
                    ))}
                    {categories.length === 0 && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                        {sortingType === "CLOSED" 
                          ? "Add categories that participants will use."
                          : "Add categories that participants can modify."}
                      </p>
                    )}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </>
        )}
      </div>
    </div>
  );
}

