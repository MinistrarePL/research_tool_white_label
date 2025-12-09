"use client";

import { useState, useRef, useEffect } from "react";
import { Card, Button, Badge, Select, Label } from "flowbite-react";
import { HiDownload } from "react-icons/hi";

type Study = {
  id: string;
  tasks: { 
    id: string; 
    question: string; 
    imageUrl?: string | null; 
  }[];
  participants: {
    id: string;
    startedAt: string;
    completedAt: string | null;
    clickResults: {
      x: number;
      y: number;
      timeToClickMs: number;
      taskId?: string | null;
    }[];
  }[];
};

export default function FirstClickResults({ study }: { study: Study }) {
  const [selectedParticipant, setSelectedParticipant] = useState<string>("all");
  const [selectedTask, setSelectedTask] = useState<string>(study.tasks[0]?.id || "");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  
  const completedParticipants = study.participants.filter(p => p.completedAt);
  const currentTask = study.tasks.find(t => t.id === selectedTask);
  
  // Get clicks for current task and participant filter
  const getFilteredClicks = () => {
    let participants = completedParticipants;
    if (selectedParticipant !== "all") {
      participants = participants.filter(p => p.id === selectedParticipant);
    }
    
    return participants.flatMap(p => 
      p.clickResults.filter(r => 
        // If taskId exists, match it; if not, assume it's for the first task (backward compatibility)
        r.taskId ? r.taskId === selectedTask : selectedTask === study.tasks[0]?.id
      ).map(r => ({ ...r, participantId: p.id }))
    );
  };

  const filteredClicks = getFilteredClicks();

  useEffect(() => {
    if (currentTask?.imageUrl && imgLoaded && canvasRef.current && imgRef.current) {
      drawHeatmap();
    }
  }, [imgLoaded, selectedParticipant, selectedTask, completedParticipants]);

  const drawHeatmap = () => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas and draw image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);

    // Draw heatmap circles
    filteredClicks.forEach((click, index) => {
      const x = (click.x / 100) * canvas.width;
      const y = (click.y / 100) * canvas.height;

      // Create gradient for heatmap effect
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, 30);
      gradient.addColorStop(0, "rgba(255, 0, 0, 0.6)");
      gradient.addColorStop(1, "rgba(255, 0, 0, 0)");

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, 30, 0, Math.PI * 2);
      ctx.fill();
    });

    // Draw click points
    filteredClicks.forEach((click, index) => {
      const x = (click.x / 100) * canvas.width;
      const y = (click.y / 100) * canvas.height;

      // Different colors for different participants when showing all
      let color = "rgba(255, 0, 0, 0.8)";
      if (selectedParticipant === "all") {
        const participantIndex = completedParticipants.findIndex(p => p.id === click.participantId);
        const colors = [
          "rgba(255, 0, 0, 0.8)",   // Red
          "rgba(0, 255, 0, 0.8)",   // Green
          "rgba(0, 0, 255, 0.8)",   // Blue
          "rgba(255, 255, 0, 0.8)", // Yellow
          "rgba(255, 0, 255, 0.8)", // Magenta
          "rgba(0, 255, 255, 0.8)", // Cyan
          "rgba(255, 165, 0, 0.8)", // Orange
          "rgba(128, 0, 128, 0.8)", // Purple
        ];
        color = colors[participantIndex % colors.length];
      }

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();

      // Add white border
      ctx.strokeStyle = "white";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Add participant number if showing all
      if (selectedParticipant === "all") {
        const participantIndex = completedParticipants.findIndex(p => p.id === click.participantId);
        ctx.fillStyle = "white";
        ctx.font = "12px Arial";
        ctx.textAlign = "center";
        ctx.fillText(`${participantIndex + 1}`, x, y + 4);
      }
    });
  };

  const exportCSV = () => {
    let csv = "Task,Participant,X,Y,TimeToClick(ms)\n";
    
    study.tasks.forEach(task => {
      completedParticipants.forEach((p, pIndex) => {
        const taskClicks = p.clickResults.filter(r => 
          r.taskId ? r.taskId === task.id : task.id === study.tasks[0]?.id
        );
        taskClicks.forEach(click => {
          csv += `"${task.question}","Participant ${pIndex + 1}",${click.x},${click.y},${click.timeToClickMs}\n`;
        });
      });
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `first-click-results-${study.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportJSON = () => {
    const data = {
      study: {
        id: study.id,
        type: "FIRST_CLICK"
      },
      tasks: study.tasks.map(task => ({
        id: task.id,
        question: task.question,
        imageUrl: task.imageUrl
      })),
      participants: completedParticipants.map((p, index) => ({
        participantNumber: index + 1,
        participantId: p.id,
        startedAt: p.startedAt,
        completedAt: p.completedAt,
        clicks: p.clickResults.map(result => ({
          taskId: result.taskId,
          taskQuestion: study.tasks.find(t => t.id === result.taskId)?.question,
          x: result.x,
          y: result.y,
          timeToClickMs: result.timeToClickMs
        }))
      }))
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `first-click-results-${study.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (study.tasks.length === 0) {
    return (
      <Card className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">
          No tasks configured for this study.
        </p>
      </Card>
    );
  }

  if (completedParticipants.length === 0) {
    return (
      <Card className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">
          No completed responses yet. Share the study link to collect data.
        </p>
      </Card>
    );
  }

  const avgTime = filteredClicks.length > 0 
    ? (filteredClicks.reduce((sum, r) => sum + r.timeToClickMs, 0) / filteredClicks.length / 1000)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            First-Click Testing Results
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg">
        <div>
          <Label htmlFor="task-filter" className="mb-2 block">
            Task
          </Label>
          <Select
            id="task-filter"
            value={selectedTask}
            onChange={(e) => setSelectedTask(e.target.value)}
          >
            {study.tasks.map((task) => (
              <option key={task.id} value={task.id}>
                {task.question}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Label htmlFor="participant-filter" className="mb-2 block">
            Participant
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
      </div>

      {/* Heatmap */}
      {currentTask?.imageUrl && (
        <Card>
          <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
            Click Heatmap: {currentTask.question}
          </h4>
          
          <div className="flex justify-center">
            <img
              ref={imgRef}
              src={currentTask.imageUrl}
              alt="Test image"
              className="hidden"
              onLoad={() => setImgLoaded(true)}
            />
            <canvas
              ref={canvasRef}
              className="max-w-full h-auto border border-gray-200 dark:border-gray-700 rounded shadow-lg"
            />
          </div>
          
          <div className="mt-4 flex gap-4 text-sm">
            <Badge color="blue">
              Clicks: {filteredClicks.length}
            </Badge>
            <Badge color="green">
              Avg. time: {avgTime.toFixed(1)}s
            </Badge>
          </div>

          {selectedParticipant === "all" && completedParticipants.length > 1 && (
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span className="font-medium text-gray-700 dark:text-gray-300">Legend:</span>
              {completedParticipants.map((p, index) => {
                const colors = ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff", "#ffa500", "#800080"];
                const color = colors[index % colors.length];
                return (
                  <div key={p.id} className="flex items-center gap-1.5">
                    <div 
                      className="w-3 h-3 rounded-full border border-white/50" 
                      style={{ backgroundColor: color }}
                    ></div>
                    <span className="text-gray-600 dark:text-gray-400">P{index + 1}</span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {!currentTask?.imageUrl && (
        <Card className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            No image configured for the selected task.
          </p>
        </Card>
      )}
    </div>
  );
}
