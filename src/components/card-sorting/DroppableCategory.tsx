"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Card } from "flowbite-react";
import SortableCard from "./SortableCard";

type CardType = {
  id: string;
  label: string;
};

export default function DroppableCategory({
  id,
  name,
  cards,
  allCards,
}: {
  id: string;
  name: string;
  cards: string[];
  allCards: CardType[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <Card
      className={`min-h-[150px] transition-colors ${
        isOver ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20" : ""
      }`}
    >
      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
        {name}
        <span className="text-sm font-normal text-gray-500 ml-2">
          ({cards.length})
        </span>
      </h4>
      <div ref={setNodeRef} className="min-h-[80px]">
        <SortableContext items={cards} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {cards.map((cardId) => {
              const card = allCards.find((c) => c.id === cardId);
              return card ? (
                <SortableCard key={cardId} id={cardId} label={card.label} />
              ) : null;
            })}
          </div>
        </SortableContext>
        {cards.length === 0 && (
          <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
            Drop cards here
          </p>
        )}
      </div>
    </Card>
  );
}

