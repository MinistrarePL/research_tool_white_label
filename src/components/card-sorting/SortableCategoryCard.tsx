"use client";

import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, Button, TextInput } from "flowbite-react";
import { HiTrash, HiPencil, HiCheck, HiX } from "react-icons/hi";

export default function SortableCategoryCard({
  id,
  name,
  onDelete,
  onEdit,
  disabled,
}: {
  id: string;
  name: string;
  onDelete: () => void;
  onEdit: (newName: string) => void;
  disabled?: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(name);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: disabled || isEditing });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleSave = () => {
    if (editValue.trim() && editValue !== name) {
      onEdit(editValue.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(name);
    setIsEditing(false);
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`py-2 px-3 ${disabled || isEditing ? "" : "cursor-grab active:cursor-grabbing"}`}
    >
      <div className="flex items-center justify-between gap-2">
        {isEditing ? (
          <TextInput
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") handleCancel();
            }}
            autoFocus
            className="flex-1"
            sizing="sm"
          />
        ) : (
          <div
            {...(!disabled ? attributes : {})}
            {...(!disabled ? listeners : {})}
            className="flex-1 text-gray-900 dark:text-white"
          >
            {name}
          </div>
        )}
        <div className="flex gap-1">
          {isEditing ? (
            <>
              <Button size="xs" color="success" onClick={handleSave}>
                <HiCheck className="h-4 w-4" />
              </Button>
              <Button size="xs" color="gray" onClick={handleCancel}>
                <HiX className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button
                size="xs"
                color="light"
                onClick={() => setIsEditing(true)}
                disabled={disabled}
              >
                <HiPencil className="h-4 w-4 text-gray-500" />
              </Button>
              <Button
                size="xs"
                color="light"
                onClick={onDelete}
                disabled={disabled}
              >
                <HiTrash className="h-4 w-4 text-gray-500 hover:text-red-500" />
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}

