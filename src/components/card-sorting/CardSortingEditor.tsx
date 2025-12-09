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
import { Button, TextInput, Label, Card, Badge, Radio, Modal, ModalHeader, ModalBody } from "flowbite-react";
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
  isLocked = false,
}: {
  study: Study;
  onUpdate: () => void;
  isLocked?: boolean;
}) {
  const isActive = study.status === "ACTIVE";
  const isDisabled = isActive || isLocked;
  const [newCard, setNewCard] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [sortingType, setSortingType] = useState<string>(
    study.sortingType || "OPEN"
  );
  const [cards, setCards] = useState<CardType[]>(study.cards);
  const [categories, setCategories] = useState<CategoryType[]>(study.categories);
  const [showDeleteCardsModal, setShowDeleteCardsModal] = useState(false);
  const [showDeleteCategoriesModal, setShowDeleteCategoriesModal] = useState(false);

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

  const deleteAllCards = async () => {
    setShowDeleteCardsModal(false);
    setLoading(true);
    await Promise.all(
      cards.map((card) =>
        fetch(`/api/studies/${study.id}/cards/${card.id}`, {
          method: "DELETE",
        })
      )
    );
    setLoading(false);
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

  const deleteAllCategories = async () => {
    setShowDeleteCategoriesModal(false);
    setLoading(true);
    await Promise.all(
      categories.map((category) =>
        fetch(`/api/studies/${study.id}/categories/${category.id}`, {
          method: "DELETE",
        })
      )
    );
    setLoading(false);
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-0 lg:divide-x lg:divide-gray-200 dark:lg:divide-gray-700">
      <div className="lg:pr-10 pt-6 pb-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Cards ({study.cards.length})
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Add cards that participants will sort into categories.
        </p>
        <div className="flex gap-2 mb-4">
          <TextInput
            placeholder="Add new card..."
            value={newCard}
            onChange={(e) => setNewCard(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !isDisabled && addCard()}
            className="flex-1"
            disabled={isDisabled}
          />
          <Button onClick={addCard} disabled={loading || isDisabled} color="blue">
            <HiPlus className="h-5 w-5" />
          </Button>
        </div>
        {isDisabled ? (
          <div className="space-y-2">
            {cards.map((card) => (
              <Card key={card.id} className="py-2 px-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-900 dark:text-white">{card.label}</span>
                  <Button
                    size="xs"
                    color="failure"
                    onClick={() => deleteCard(card.id)}
                    disabled={isDisabled}
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
                    disabled={isDisabled}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
        {cards.length > 0 && !isDisabled && (
          <div className="mt-4">
            <Button size="xs" color="failure" outline onClick={() => setShowDeleteCardsModal(true)} disabled={loading}>
              Delete All
            </Button>
          </div>
        )}
      </div>

      <div className="lg:pl-10 pt-6 pb-6">
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
                disabled={isDisabled}
              />
              <Label htmlFor="open" className={isDisabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}>
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
                disabled={isDisabled}
              />
              <Label htmlFor="closed" className={isDisabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}>
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
                disabled={isDisabled}
              />
              <Label htmlFor="hybrid" className={isDisabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}>
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
                onKeyDown={(e) => e.key === "Enter" && !isDisabled && addCategory()}
                className="flex-1"
                disabled={isDisabled}
              />
              <Button onClick={addCategory} disabled={loading || isDisabled} color="blue">
                <HiPlus className="h-5 w-5" />
              </Button>
            </div>
            {isDisabled ? (
              <div className="space-y-2">
                {categories.map((category) => (
                  <Card key={category.id} className="py-2 px-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-900 dark:text-white">{category.name}</span>
                      <Button
                        size="xs"
                        color="failure"
                        onClick={() => deleteCategory(category.id)}
                        disabled={isDisabled}
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
                        disabled={isDisabled}
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
            {categories.length > 0 && !isDisabled && sortingType !== "OPEN" && (
              <div className="mt-4">
                <Button size="xs" color="failure" outline onClick={() => setShowDeleteCategoriesModal(true)} disabled={loading}>
                  Delete All
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete All Cards Modal */}
      <Modal show={showDeleteCardsModal} onClose={() => setShowDeleteCardsModal(false)}>
        <ModalHeader>Delete All Cards</ModalHeader>
        <ModalBody>
          <p className="text-gray-500 dark:text-gray-400">
            Are you sure you want to delete all cards? This action cannot be undone.
          </p>
          <div className="flex gap-2 justify-end mt-4">
            <Button color="gray" onClick={() => setShowDeleteCardsModal(false)}>
              Cancel
            </Button>
            <Button color="failure" onClick={deleteAllCards}>
              Delete All
            </Button>
          </div>
        </ModalBody>
      </Modal>

      {/* Delete All Categories Modal */}
      <Modal show={showDeleteCategoriesModal} onClose={() => setShowDeleteCategoriesModal(false)}>
        <ModalHeader>Delete All Categories</ModalHeader>
        <ModalBody>
          <p className="text-gray-500 dark:text-gray-400">
            Are you sure you want to delete all categories? This action cannot be undone.
          </p>
          <div className="flex gap-2 justify-end mt-4">
            <Button color="gray" onClick={() => setShowDeleteCategoriesModal(false)}>
              Cancel
            </Button>
            <Button color="failure" onClick={deleteAllCategories}>
              Delete All
            </Button>
          </div>
        </ModalBody>
      </Modal>
    </div>
  );
}

