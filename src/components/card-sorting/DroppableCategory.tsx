"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Card, Button, TextInput } from "flowbite-react";
import { HiTrash, HiPencil, HiCheck, HiX } from "react-icons/hi";
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
  canEdit = false,
  canDelete = false,
  isEditing = false,
  editingName = "",
  onEditNameChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
}: {
  id: string;
  name: string;
  cards: string[];
  allCards: CardType[];
  canEdit?: boolean;
  canDelete?: boolean;
  isEditing?: boolean;
  editingName?: string;
  onEditNameChange?: (name: string) => void;
  onStartEdit?: () => void;
  onSaveEdit?: () => void;
  onCancelEdit?: () => void;
  onDelete?: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <Card
      className={`min-h-[150px] transition-colors ${
        isOver ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20" : ""
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        {isEditing ? (
          <div className="flex-1 flex gap-2">
            <TextInput
              value={editingName}
              onChange={(e) => onEditNameChange?.(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSaveEdit?.();
                if (e.key === "Escape") onCancelEdit?.();
              }}
              className="flex-1"
              autoFocus
            />
            <Button size="xs" color="light" className="border-green-500 text-green-600 hover:bg-green-50" onClick={onSaveEdit}>
              <HiCheck className="h-3 w-3" />
            </Button>
            <Button size="xs" color="gray" onClick={onCancelEdit}>
              <HiX className="h-3 w-3" />
            </Button>
          </div>
        ) : (
          <>
            <h4 className="font-semibold text-gray-900 dark:text-white flex-1">
              {name}
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({cards.length})
              </span>
            </h4>
            {(canEdit || canDelete) && (
              <div className="flex gap-1">
                {canEdit && (
                  <Button size="xs" color="gray" onClick={onStartEdit}>
                    <HiPencil className="h-3 w-3" />
                  </Button>
                )}
                {canDelete && (
                  <Button size="xs" color="failure" onClick={onDelete}>
                    <HiTrash className="h-3 w-3" />
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </div>
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

