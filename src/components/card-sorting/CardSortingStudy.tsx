"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Button, Card, TextInput, Toast, ToastToggle } from "flowbite-react";
import { HiPlus, HiTrash, HiPencil, HiExclamationCircle } from "react-icons/hi";
import SortableCard from "./SortableCard";
import DroppableCategory from "./DroppableCategory";

type CardType = {
  id: string;
  label: string;
};

type CategoryType = {
  id: string;
  name: string;
  isPredefined?: boolean;
};

type Study = {
  id: string;
  sortingType?: string | null;
  cards: CardType[];
  categories: CategoryType[];
};

type CategoryCards = {
  [categoryId: string]: string[];
};

export default function CardSortingStudy({
  study,
  participantId,
  onComplete,
}: {
  study: Study;
  participantId: string;
  onComplete: () => void;
}) {
  const sortingType = study.sortingType || "OPEN";
  const isOpen = sortingType === "OPEN";
  const isClosed = sortingType === "CLOSED";
  const isHybrid = sortingType === "HYBRID";
  
  const [unsortedCards, setUnsortedCards] = useState<string[]>(
    study.cards.map((c) => c.id)
  );
  const [categoryCards, setCategoryCards] = useState<CategoryCards>({});
  const [userCategories, setUserCategories] = useState<CategoryType[]>(
    isOpen 
      ? [] 
      : study.categories.map(c => ({ ...c, isPredefined: true }))
  );
  const [newCategoryName, setNewCategoryName] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<{ show: boolean; message: string } | null>(null);

  const showToast = (message: string) => {
    setToast({ show: true, message });
    setTimeout(() => setToast(null), 4000);
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const addCategory = () => {
    if (!newCategoryName.trim()) return;
    const newCat: CategoryType = {
      id: `user-${Date.now()}`,
      name: newCategoryName.trim(),
      isPredefined: false,
    };
    setUserCategories([...userCategories, newCat]);
    setCategoryCards({ ...categoryCards, [newCat.id]: [] });
    setNewCategoryName("");
  };

  const deleteCategory = (categoryId: string) => {
    const cardsInCategory = categoryCards[categoryId] || [];
    if (cardsInCategory.length > 0) {
      showToast("Cannot delete a category that contains cards. Please move all cards first.");
      return;
    }
    setUserCategories(userCategories.filter(c => c.id !== categoryId));
    const newCategoryCards = { ...categoryCards };
    delete newCategoryCards[categoryId];
    setCategoryCards(newCategoryCards);
  };

  const startEditCategory = (categoryId: string) => {
    const category = userCategories.find(c => c.id === categoryId);
    if (category) {
      setEditingCategoryId(categoryId);
      setEditingCategoryName(category.name);
    }
  };

  const saveEditCategory = () => {
    if (!editingCategoryId || !editingCategoryName.trim()) return;
    setUserCategories(userCategories.map(c => 
      c.id === editingCategoryId 
        ? { ...c, name: editingCategoryName.trim() }
        : c
    ));
    setEditingCategoryId(null);
    setEditingCategoryName("");
  };

  const cancelEditCategory = () => {
    setEditingCategoryId(null);
    setEditingCategoryName("");
  };

  const findContainer = (id: string) => {
    if (unsortedCards.includes(id)) return "unsorted";
    for (const [containerId, cards] of Object.entries(categoryCards)) {
      if (cards.includes(id)) return containerId;
    }
    return null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeContainer = findContainer(activeId);
    let overContainer = findContainer(overId);

    // If over a category directly
    if (!overContainer && userCategories.find((c) => c.id === overId)) {
      overContainer = overId;
    }

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }

    // Move card between containers
    if (activeContainer === "unsorted") {
      setUnsortedCards((cards) => cards.filter((id) => id !== activeId));
    } else {
      setCategoryCards((prev) => ({
        ...prev,
        [activeContainer]: prev[activeContainer].filter((id) => id !== activeId),
      }));
    }

    if (overContainer === "unsorted") {
      setUnsortedCards((cards) => [...cards, activeId]);
    } else {
      setCategoryCards((prev) => ({
        ...prev,
        [overContainer]: [...(prev[overContainer] || []), activeId],
      }));
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
  };

  const handleSubmit = async () => {
    if (unsortedCards.length > 0) {
      showToast("Please sort all cards before submitting.");
      return;
    }

    setSubmitting(true);

    try {
      const results: any[] = [];
      for (const [categoryId, cardIds] of Object.entries(categoryCards)) {
        for (const cardId of cardIds) {
          const category = userCategories.find((c) => c.id === categoryId);
          // For HYBRID: check if category was originally predefined
          const originalCategory = study.categories.find(c => c.id === categoryId);
          results.push({
            cardId,
            categoryId: category?.isPredefined && originalCategory ? categoryId : null,
            categoryName: category?.name,
            originalCategoryName: originalCategory?.name || null,
          });
        }
      }

      const response = await fetch(`/api/studies/${study.id}/participants`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participantId,
          type: "CARD_SORTING",
          results,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("Failed to submit results:", errorData);
        showToast("Failed to submit results. Please try again.");
        setSubmitting(false);
        return;
      }

      onComplete();
    } catch (error) {
      console.error("Error submitting results:", error);
      showToast("An error occurred. Please try again.");
      setSubmitting(false);
    }
  };

  const activeCard = study.cards.find((c) => c.id === activeId);

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Sort the cards into categories
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Drag cards from the left and drop them into the appropriate category.
          {isOpen && " Create your own categories using the input below."}
          {isHybrid && " You can modify predefined categories or create new ones."}
        </p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Unsorted cards */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
              Cards to Sort ({unsortedCards.length})
            </h3>
            <Card className="min-h-[300px] bg-gray-100 dark:bg-gray-800">
              <SortableContext
                items={unsortedCards}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {unsortedCards.map((cardId) => {
                    const card = study.cards.find((c) => c.id === cardId);
                    return card ? (
                      <SortableCard key={cardId} id={cardId} label={card.label} />
                    ) : null;
                  })}
                </div>
              </SortableContext>
            </Card>
          </div>

          {/* Categories */}
          <div className="lg:col-span-2">
            <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
              Categories
            </h3>

            {(isOpen || isHybrid) && (
              <div className="flex gap-2 mb-4">
                <TextInput
                  placeholder="New category name..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCategory()}
                  className="flex-1"
                />
                <Button onClick={addCategory} color="blue">
                  <HiPlus className="h-5 w-5" />
                </Button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userCategories.map((category) => (
                <DroppableCategory
                  key={category.id}
                  id={category.id}
                  name={category.name}
                  cards={categoryCards[category.id] || []}
                  allCards={study.cards}
                  canEdit={isOpen || isHybrid}
                  canDelete={isOpen || isHybrid}
                  isEditing={editingCategoryId === category.id}
                  editingName={editingCategoryName}
                  onEditNameChange={setEditingCategoryName}
                  onStartEdit={() => startEditCategory(category.id)}
                  onSaveEdit={saveEditCategory}
                  onCancelEdit={cancelEditCategory}
                  onDelete={() => deleteCategory(category.id)}
                />
              ))}
            </div>

            {userCategories.length === 0 && (
              <Card className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  Create a category to start sorting cards.
                </p>
              </Card>
            )}
          </div>
        </div>

        <DragOverlay>
          {activeCard ? (
            <div className="bg-white dark:bg-gray-700 border-2 border-blue-500 rounded-lg p-3 shadow-lg">
              {activeCard.label}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <div className="mt-6 flex justify-end">
        <Button
          onClick={handleSubmit}
          disabled={submitting || unsortedCards.length > 0}
          size="lg"
          color="blue"
        >
          {submitting ? "Submitting..." : "Submit"}
        </Button>
      </div>

      {/* Toast notification */}
      {toast?.show && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
          <Toast className="shadow-lg border border-orange-200 dark:border-orange-700">
            <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-100 text-orange-500 dark:bg-orange-700 dark:text-orange-200">
              <HiExclamationCircle className="h-5 w-5" />
            </div>
            <div className="ml-3 text-sm font-medium">{toast.message}</div>
            <ToastToggle onDismiss={() => setToast(null)} />
          </Toast>
        </div>
      )}
    </div>
  );
}

