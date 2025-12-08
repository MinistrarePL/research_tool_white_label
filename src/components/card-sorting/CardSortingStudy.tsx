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
import { Button, Card, TextInput } from "flowbite-react";
import { HiPlus } from "react-icons/hi";
import SortableCard from "./SortableCard";
import DroppableCategory from "./DroppableCategory";

type CardType = {
  id: string;
  label: string;
};

type CategoryType = {
  id: string;
  name: string;
};

type Study = {
  id: string;
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
  const isOpenSort = study.categories.length === 0;
  
  const [unsortedCards, setUnsortedCards] = useState<string[]>(
    study.cards.map((c) => c.id)
  );
  const [categoryCards, setCategoryCards] = useState<CategoryCards>({});
  const [userCategories, setUserCategories] = useState<CategoryType[]>(
    isOpenSort ? [] : study.categories
  );
  const [newCategoryName, setNewCategoryName] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
    };
    setUserCategories([...userCategories, newCat]);
    setCategoryCards({ ...categoryCards, [newCat.id]: [] });
    setNewCategoryName("");
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
      alert("Please sort all cards before submitting.");
      return;
    }

    setSubmitting(true);

    const results: any[] = [];
    for (const [categoryId, cardIds] of Object.entries(categoryCards)) {
      for (const cardId of cardIds) {
        const category = userCategories.find((c) => c.id === categoryId);
        results.push({
          cardId,
          categoryId: categoryId.startsWith("user-") ? null : categoryId,
          categoryName: category?.name,
        });
      }
    }

    await fetch(`/api/studies/${study.id}/participants`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        participantId,
        type: "CARD_SORTING",
        results,
      }),
    });

    onComplete();
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
          {isOpenSort && " Create your own categories using the input below."}
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

            {isOpenSort && (
              <div className="flex gap-2 mb-4">
                <TextInput
                  placeholder="New category name..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCategory()}
                  className="flex-1"
                />
                <Button onClick={addCategory}>
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
        >
          {submitting ? "Submitting..." : "Submit"}
        </Button>
      </div>
    </div>
  );
}

