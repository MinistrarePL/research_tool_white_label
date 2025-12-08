"use client";

import { useState, useRef, useEffect } from "react";
import { Card, Button, Badge, Table, TableHead, TableHeadCell, TableBody, TableRow, TableCell } from "flowbite-react";
import { HiDownload } from "react-icons/hi";
import CardSortingResults from "@/components/card-sorting/CardSortingResults";
import FirstClickResults from "@/components/first-click/FirstClickResults";
import TreeTestingResults from "@/components/tree-testing/TreeTestingResults";

type Study = {
  id: string;
  type: "CARD_SORTING" | "TREE_TESTING" | "FIRST_CLICK";
  imageUrl: string | null;
  cards: { id: string; label: string }[];
  categories: { id: string; name: string }[];
  treeNodes: { id: string; label: string }[];
  tasks: { id: string; question: string; correctNodeId: string | null }[];
  participants: {
    id: string;
    startedAt: string;
    completedAt: string | null;
    cardSortResults: {
      cardId: string;
      categoryId: string | null;
      categoryName: string | null;
    }[];
    treeTestResults: {
      taskId: string;
      selectedPath: string; // JSON string
      selectedNodeId: string | null;
      isCorrect: boolean;
      timeSpentMs: number;
    }[];
    clickResults: {
      x: number;
      y: number;
      timeToClickMs: number;
    }[];
  }[];
};

export default function StudyResults({ study }: { study: Study }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [imgLoaded, setImgLoaded] = useState(false);

  const completedParticipants = study.participants.filter(
    (p) => p.completedAt
  );

  useEffect(() => {
    if (study.type === "FIRST_CLICK" && imgLoaded && canvasRef.current && imgRef.current) {
      drawHeatmap();
    }
  }, [imgLoaded, study.participants]);

  const drawHeatmap = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(img, 0, 0);

    const clicks = completedParticipants.flatMap((p) => p.clickResults);
    
    clicks.forEach((click) => {
      const x = (click.x / 100) * canvas.width;
      const y = (click.y / 100) * canvas.height;

      const gradient = ctx.createRadialGradient(x, y, 0, x, y, 30);
      gradient.addColorStop(0, "rgba(255, 0, 0, 0.5)");
      gradient.addColorStop(1, "rgba(255, 0, 0, 0)");

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, 30, 0, Math.PI * 2);
      ctx.fill();
    });

    clicks.forEach((click) => {
      const x = (click.x / 100) * canvas.width;
      const y = (click.y / 100) * canvas.height;

      ctx.fillStyle = "rgba(255, 0, 0, 0.8)";
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  const exportCSV = () => {
    let csv = "";
    
    if (study.type === "CARD_SORTING") {
      csv = "Participant,Card,Category\n";
      completedParticipants.forEach((p, i) => {
        p.cardSortResults.forEach((result) => {
          const card = study.cards.find((c) => c.id === result.cardId);
          const category = result.categoryName || 
            study.categories.find((c) => c.id === result.categoryId)?.name || "";
          csv += `${i + 1},${card?.label || ""},${category}\n`;
        });
      });
    } else if (study.type === "TREE_TESTING") {
      csv = "Participant,Task,Selected Node,Correct,Time (ms)\n";
      completedParticipants.forEach((p, i) => {
        p.treeTestResults.forEach((result) => {
          const task = study.tasks.find((t) => t.id === result.taskId);
          const node = study.treeNodes.find((n) => n.id === result.selectedNodeId);
          csv += `${i + 1},"${task?.question || ""}",${node?.label || ""},${result.isCorrect},${result.timeSpentMs}\n`;
        });
      });
    } else if (study.type === "FIRST_CLICK") {
      csv = "Participant,X (%),Y (%),Time (ms)\n";
      completedParticipants.forEach((p, i) => {
        p.clickResults.forEach((result) => {
          csv += `${i + 1},${result.x.toFixed(2)},${result.y.toFixed(2)},${result.timeToClickMs}\n`;
        });
      });
    }

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `study-${study.id}-results.csv`;
    a.click();
  };

  const exportJSON = () => {
    const data = {
      studyId: study.id,
      type: study.type,
      participants: completedParticipants.map((p, i) => ({
        participantNumber: i + 1,
        results:
          study.type === "CARD_SORTING"
            ? p.cardSortResults.map((r) => ({
                card: study.cards.find((c) => c.id === r.cardId)?.label,
                category:
                  r.categoryName ||
                  study.categories.find((c) => c.id === r.categoryId)?.name,
              }))
            : study.type === "TREE_TESTING"
            ? p.treeTestResults.map((r) => ({
                task: study.tasks.find((t) => t.id === r.taskId)?.question,
                selectedNode: study.treeNodes.find(
                  (n) => n.id === r.selectedNodeId
                )?.label,
                path: (JSON.parse(r.selectedPath) as string[]).map(
                  (id) => study.treeNodes.find((n) => n.id === id)?.label
                ),
                isCorrect: r.isCorrect,
                timeMs: r.timeSpentMs,
              }))
            : p.clickResults.map((r) => ({
                x: r.x,
                y: r.y,
                timeMs: r.timeToClickMs,
              })),
      })),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `study-${study.id}-results.json`;
    a.click();
  };

  if (completedParticipants.length === 0) {
    return (
      <Card className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">
          No completed responses yet. Share the study link to collect data.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {study.type === "CARD_SORTING" && (
        <CardSortingResults study={study} />
      )}

      {study.type === "TREE_TESTING" && (
        <TreeTestingResults study={study} />
      )}

      {study.type === "FIRST_CLICK" && (
        <FirstClickResults study={study} />
      )}
    </div>
  );
}
