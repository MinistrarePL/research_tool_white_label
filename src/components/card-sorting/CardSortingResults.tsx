"use client";

import { useState, useMemo } from "react";
import { Card, Button, Badge, Select, Label } from "flowbite-react";
import { HiDownload } from "react-icons/hi";

type Study = {
  id: string;
  cards: { id: string; label: string }[];
  categories: { id: string; name: string }[];
  participants: {
    id: string;
    startedAt: string;
    completedAt: string | null;
    cardSortResults: {
      cardId: string;
      categoryId: string | null;
      categoryName: string | null;
      originalCategoryName: string | null;
    }[];
  }[];
};

type CategoryType = "all" | "predefined" | "user-created";

type CategoryGroup = {
  name: string;
  type: "predefined" | "user-created";
  cards: Array<{ cardId: string; participantId: string; label: string }>;
};

// Predefined colors for participants
const participantColors = [
  "border-blue-500",
  "border-green-500", 
  "border-red-500",
  "border-yellow-500",
  "border-purple-500",
  "border-pink-500",
  "border-indigo-500",
  "border-orange-500",
  "border-teal-500",
  "border-cyan-500",
];

export default function CardSortingResults({ study }: { study: Study }) {
  const [selectedParticipant, setSelectedParticipant] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryType>("all");
  
  const completedParticipants = study.participants.filter(p => p.completedAt);

  // Build category groups - predefined vs user-created
  const categoryGroups = useMemo(() => {
    const groups = new Map<string, CategoryGroup>();
    
    // Get predefined category names for comparison
    const predefinedNames = new Set(study.categories.map(c => c.name));
    
    completedParticipants.forEach(p => {
      p.cardSortResults.forEach(result => {
        const usedName = result.categoryName || "";
        
        if (!usedName) return;
        
        // Determine category type:
        // - predefined: name matches original AND matches predefined category
        // - user-created: everything else (including renamed predefined categories)
        const isPredefined = result.originalCategoryName === result.categoryName && predefinedNames.has(usedName);
        const type: "predefined" | "user-created" = isPredefined ? "predefined" : "user-created";
        
        if (!groups.has(usedName)) {
          groups.set(usedName, {
            name: usedName,
            type,
            cards: [],
          });
        }
        
        const group = groups.get(usedName)!;
        
        // Add card
        const card = study.cards.find(c => c.id === result.cardId);
        if (card) {
          group.cards.push({
            cardId: result.cardId,
            participantId: p.id,
            label: card.label,
          });
        }
      });
    });
    
    return Array.from(groups.values());
  }, [study, completedParticipants]);

  // Filter categories by type
  const filteredGroups = useMemo(() => {
    if (categoryFilter === "all") return categoryGroups;
    return categoryGroups.filter(g => g.type === categoryFilter);
  }, [categoryGroups, categoryFilter]);

  // Filter by participant
  const getFilteredCards = (group: CategoryGroup) => {
    if (selectedParticipant === "all") return group.cards;
    return group.cards.filter(c => c.participantId === selectedParticipant);
  };

  const getParticipantColor = (participantId: string) => {
    const index = completedParticipants.findIndex(p => p.id === participantId);
    return participantColors[index % participantColors.length];
  };

  const getParticipantNumber = (participantId: string) => {
    return completedParticipants.findIndex(p => p.id === participantId) + 1;
  };

  const getCategoryTypeBadge = (type: CategoryGroup["type"]) => {
    switch (type) {
      case "predefined":
        return <Badge color="blue" size="xs">predefined</Badge>;
      case "user-created":
        return <Badge color="green" size="xs">user-created</Badge>;
    }
  };

  // Count categories by type
  const categoryCounts = useMemo(() => {
    return {
      all: categoryGroups.length,
      predefined: categoryGroups.filter(g => g.type === "predefined").length,
      "user-created": categoryGroups.filter(g => g.type === "user-created").length,
    };
  }, [categoryGroups]);

  const exportCSV = () => {
    let csv = "Card,";
    csv += completedParticipants.map((_, i) => `Participant ${i + 1}`).join(",");
    csv += "\n";

    study.cards.forEach(card => {
      csv += `"${card.label}",`;
      const categories = completedParticipants.map(p => {
        const result = p.cardSortResults.find(r => r.cardId === card.id);
        return result?.categoryName || 
          study.categories.find(c => c.id === result?.categoryId)?.name || 
          "-";
      });
      csv += categories.map(cat => `"${cat}"`).join(",");
      csv += "\n";
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `card-sorting-results-${study.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportJSON = () => {
    const data = {
      study: {
        id: study.id,
        type: "CARD_SORTING"
      },
      participants: completedParticipants.map((p, index) => ({
        participantNumber: index + 1,
        participantId: p.id,
        startedAt: p.startedAt,
        completedAt: p.completedAt,
        results: p.cardSortResults.map(result => ({
          cardId: result.cardId,
          cardLabel: study.cards.find(c => c.id === result.cardId)?.label,
          categoryId: result.categoryId,
          categoryName: result.categoryName,
          originalCategoryName: result.originalCategoryName,
        }))
      }))
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `card-sorting-results-${study.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Card Sorting Results
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {completedParticipants.length} completed responses
          </p>
        </div>
        <div className="flex gap-2">
          <Button color="gray" outline onClick={exportCSV}>
            <HiDownload className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button color="gray" outline onClick={exportJSON}>
            <HiDownload className="mr-2 h-4 w-4" />
            Export JSON
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="min-w-[200px]">
          <Label htmlFor="participant-filter" className="mb-2 block">
            Filter by Participant
          </Label>
          <Select
            id="participant-filter"
            value={selectedParticipant}
            onChange={(e) => setSelectedParticipant(e.target.value)}
          >
            <option value="all">All Participants</option>
            {completedParticipants.map((p, index) => (
              <option key={p.id} value={p.id}>
                Participant {index + 1}
              </option>
            ))}
          </Select>
        </div>
        
        <div className="min-w-[200px]">
          <Label htmlFor="category-filter" className="mb-2 block">
            Filter by Category Type
          </Label>
          <Select
            id="category-filter"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as CategoryType)}
          >
            <option value="all">All ({categoryCounts.all})</option>
            <option value="predefined">Predefined ({categoryCounts.predefined})</option>
            <option value="user-created">User-created ({categoryCounts["user-created"]})</option>
          </Select>
        </div>
      </div>

      {/* Legend */}
      {selectedParticipant === "all" && completedParticipants.length > 1 && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-300">Legend:</span>
          {completedParticipants.map((p, index) => (
            <div key={p.id} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 border-2 ${getParticipantColor(p.id)} rounded`}></div>
              <span className="text-gray-600 dark:text-gray-400">P{index + 1}</span>
            </div>
          ))}
        </div>
      )}

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredGroups.map((group) => {
          const filteredCards = getFilteredCards(group);
          
          return (
            <Card key={group.name} className="flex flex-col">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {group.name}
                    </h4>
                    {getCategoryTypeBadge(group.type)}
                  </div>
                </div>
                <Badge color="gray" size="sm" className="ml-2 flex-shrink-0">
                  {filteredCards.length}
                </Badge>
              </div>
              
              <div className="space-y-2 flex-1 min-h-[120px] flex flex-col">
                {filteredCards.length > 0 ? (
                  <>
                    {filteredCards.map((card, index) => (
                      <div
                        key={`${card.cardId}-${card.participantId}-${index}`}
                        className={`p-2 bg-white dark:bg-gray-700 rounded border-2 ${
                          selectedParticipant === "all" 
                            ? getParticipantColor(card.participantId)
                            : "border-gray-200 dark:border-gray-600"
                        } text-sm text-gray-900 dark:text-white`}
                      >
                        {card.label}
                        {selectedParticipant === "all" && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            P{getParticipantNumber(card.participantId)}
                          </div>
                        )}
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-center text-gray-400 dark:text-gray-500 text-sm">
                    No cards in this category
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {filteredGroups.length === 0 && (
        <Card className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            {categoryGroups.length === 0 
              ? "No results available yet."
              : "No categories match the selected filter."}
          </p>
        </Card>
      )}
    </div>
  );
}
