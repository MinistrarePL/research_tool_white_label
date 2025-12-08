"use client";

import { useState, useEffect } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, Button, TextInput, Select, Label } from "flowbite-react";
import { HiTrash, HiPencil, HiCheck, HiX } from "react-icons/hi";

type TreeNode = {
  id: string;
  label: string;
};

export default function SortableTask({
  id,
  task,
  index,
  treeNodes,
  isActive,
  isEditing,
  onEdit,
  onDelete,
  onSave,
  onCancel,
}: {
  id: string;
  task: {
    id: string;
    question: string;
    correctNodeId: string | null;
  };
  index: number;
  treeNodes: TreeNode[];
  isActive: boolean;
  isEditing: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onSave: (question: string, correctNodeId: string | null) => void;
  onCancel: () => void;
}) {
  const [editQuestion, setEditQuestion] = useState(task.question);
  const [editCorrectNode, setEditCorrectNode] = useState(task.correctNodeId || "");

  useEffect(() => {
    if (isEditing) {
      setEditQuestion(task.question);
      setEditCorrectNode(task.correctNodeId || "");
    }
  }, [isEditing, task.question, task.correctNodeId]);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled: isActive || isEditing });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleSave = () => {
    if (editQuestion.trim()) {
      onSave(editQuestion.trim(), editCorrectNode || null);
    }
  };

  const handleCancel = () => {
    setEditQuestion(task.question);
    setEditCorrectNode(task.correctNodeId || "");
    onCancel();
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card className={`py-2 px-3 ${isActive || isEditing ? "" : "cursor-grab active:cursor-grabbing"}`}>
        {isEditing ? (
          <div className="space-y-3">
            <div>
              <Label className="mb-2 block text-xs">Question</Label>
              <TextInput
                value={editQuestion}
                onChange={(e) => setEditQuestion(e.target.value)}
                placeholder="Where would you find...?"
                disabled={isActive}
              />
            </div>
            <div>
              <Label className="mb-2 block text-xs">Correct Answer (optional)</Label>
              <Select
                value={editCorrectNode}
                onChange={(e) => setEditCorrectNode(e.target.value)}
                disabled={isActive}
              >
                <option value="">No correct answer</option>
                {treeNodes.map((node) => (
                  <option key={node.id} value={node.id}>
                    {node.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex gap-2 justify-end">
              <Button 
                size="xs" 
                color="gray" 
                onClick={handleCancel}
              >
                <HiX className="h-3 w-3" />
              </Button>
              <Button 
                size="xs" 
                color="light"
                className="border-green-500 text-green-600 hover:bg-green-50"
                onClick={handleSave} 
                disabled={!editQuestion.trim()}
              >
                <HiCheck className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-2">
            <div
              className="flex-1"
              {...(!isActive ? attributes : {})}
              {...(!isActive ? listeners : {})}
            >
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Task {index + 1}
              </span>
              <p className="text-gray-900 dark:text-white font-medium">
                {task.question}
              </p>
              {task.correctNodeId && (
                <p className="text-sm text-green-600 dark:text-green-400">
                  Correct:{" "}
                  {treeNodes.find((n) => n.id === task.correctNodeId)?.label || "Unknown"}
                </p>
              )}
            </div>
            <div className="flex gap-1">
              <Button
                size="xs"
                color="light"
                onClick={onEdit}
                disabled={isActive}
              >
                <HiPencil className="h-4 w-4 text-gray-500" />
              </Button>
              <Button
                size="xs"
                color="light"
                onClick={onDelete}
                disabled={isActive}
              >
                <HiTrash className="h-4 w-4 text-gray-500 hover:text-red-500" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

