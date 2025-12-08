"use client";

import { useState } from "react";
import { Button, TextInput, Label, Card, Badge } from "flowbite-react";
import { HiPlus, HiTrash } from "react-icons/hi";

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
};

type Study = {
  id: string;
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
  const [newCard, setNewCard] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Cards ({study.cards.length})
        </h3>
        <div className="flex gap-2 mb-4">
          <TextInput
            placeholder="Add new card..."
            value={newCard}
            onChange={(e) => setNewCard(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCard()}
            className="flex-1"
          />
          <Button onClick={addCard} disabled={loading}>
            <HiPlus className="h-5 w-5" />
          </Button>
        </div>
        <div className="space-y-2">
          {study.cards.map((card) => (
            <Card key={card.id} className="p-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-900 dark:text-white">{card.label}</span>
                <Button
                  size="xs"
                  color="failure"
                  onClick={() => deleteCard(card.id)}
                >
                  <HiTrash className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
          {study.cards.length === 0 && (
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Add cards that participants will sort into categories.
            </p>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Categories ({study.categories.length})
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Leave empty for open card sorting (participants create their own categories).
        </p>
        <div className="flex gap-2 mb-4">
          <TextInput
            placeholder="Add category..."
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCategory()}
            className="flex-1"
          />
          <Button onClick={addCategory} disabled={loading}>
            <HiPlus className="h-5 w-5" />
          </Button>
        </div>
        <div className="space-y-2">
          {study.categories.map((category) => (
            <Card key={category.id} className="p-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-900 dark:text-white">{category.name}</span>
                <Button
                  size="xs"
                  color="failure"
                  onClick={() => deleteCategory(category.id)}
                >
                  <HiTrash className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

