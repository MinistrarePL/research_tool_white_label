"use client";

import { useState } from "react";
import { Card, Button, Badge, Select, Label } from "flowbite-react";
import { HiDownload, HiCheck, HiX } from "react-icons/hi";

type Study = {
  id: string;
  tasks: { 
    id: string; 
    question: string; 
    correctNodeId?: string | null; 
  }[];
  treeNodes: {
    id: string;
    label: string;
    parentId: string | null;
  }[];
  participants: {
    id: string;
    startedAt: string;
    completedAt: string | null;
    treeTestResults: {
      taskId: string;
      selectedPath: string;
      selectedNodeId: string | null;
      isCorrect: boolean;
      timeSpentMs: number;
    }[];
  }[];
};

export default function TreeTestingResults({ study }: { study: Study }) {
  const [selectedParticipant, setSelectedParticipant] = useState<string>("all");
  const [selectedTask, setSelectedTask] = useState<string>("all");
  
  const completedParticipants = study.participants.filter(p => p.completedAt);

  // Get filtered results
  const getFilteredResults = () => {
    let participants = completedParticipants;
    if (selectedParticipant !== "all") {
      participants = participants.filter(p => p.id === selectedParticipant);
    }

    let results = participants.flatMap(p => 
      p.treeTestResults.map(r => ({
        ...r,
        participantId: p.id
      }))
    );

    if (selectedTask !== "all") {
      results = results.filter(r => r.taskId === selectedTask);
    }

    return results;
  };

  const filteredResults = getFilteredResults();

  // Get path as readable text
  const getPathText = (selectedPath: string) => {
    try {
      const pathIds = JSON.parse(selectedPath) as string[];
      return pathIds
        .map(id => study.treeNodes.find(n => n.id === id)?.label || id)
        .join(" → ");
    } catch {
      return selectedPath;
    }
  };

  // Get node label
  const getNodeLabel = (nodeId: string | null) => {
    if (!nodeId) return "No selection";
    return study.treeNodes.find(n => n.id === nodeId)?.label || nodeId;
  };

  // Get correct answer label
  const getCorrectAnswerLabel = (taskId: string) => {
    const task = study.tasks.find(t => t.id === taskId);
    if (!task?.correctNodeId) return "Not specified";
    return getNodeLabel(task.correctNodeId);
  };

  const exportCSV = () => {
    let csv = "Task,Participant,Selected Answer,Correct Answer,Path Taken,Is Correct,Time (seconds)\n";
    
    study.tasks.forEach(task => {
      completedParticipants.forEach((p, pIndex) => {
        const taskResults = p.treeTestResults.filter(r => r.taskId === task.id);
        taskResults.forEach(result => {
          const selectedAnswer = getNodeLabel(result.selectedNodeId);
          const correctAnswer = getCorrectAnswerLabel(task.id);
          const pathTaken = getPathText(result.selectedPath);
          
          csv += `"${task.question}","Participant ${pIndex + 1}","${selectedAnswer}","${correctAnswer}","${pathTaken}",${result.isCorrect},${(result.timeSpentMs / 1000).toFixed(1)}\n`;
        });
      });
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tree-testing-results-${study.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportJSON = () => {
    const data = {
      study: {
        id: study.id,
        type: "TREE_TESTING"
      },
      tasks: study.tasks.map(task => ({
        id: task.id,
        question: task.question,
        correctAnswer: {
          nodeId: task.correctNodeId,
          label: getCorrectAnswerLabel(task.id)
        }
      })),
      participants: completedParticipants.map((p, index) => ({
        participantNumber: index + 1,
        participantId: p.id,
        startedAt: p.startedAt,
        completedAt: p.completedAt,
        results: p.treeTestResults.map(result => ({
          taskId: result.taskId,
          taskQuestion: study.tasks.find(t => t.id === result.taskId)?.question,
          selectedAnswer: {
            nodeId: result.selectedNodeId,
            label: getNodeLabel(result.selectedNodeId)
          },
          correctAnswer: {
            nodeId: study.tasks.find(t => t.id === result.taskId)?.correctNodeId,
            label: getCorrectAnswerLabel(result.taskId)
          },
          pathTaken: getPathText(result.selectedPath),
          isCorrect: result.isCorrect,
          timeSpentMs: result.timeSpentMs
        }))
      }))
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tree-testing-results-${study.id}.json`;
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Tree Testing Results
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
            <option value="all">All Tasks</option>
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

      {/* Summary Statistics */}
      {selectedTask === "all" && selectedParticipant === "all" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {study.tasks.map((task) => {
            const taskResults = completedParticipants.flatMap(p => 
              p.treeTestResults.filter(r => r.taskId === task.id)
            );
            const correctCount = taskResults.filter(r => r.isCorrect).length;
            const avgTime = taskResults.length > 0 
              ? taskResults.reduce((sum, r) => sum + r.timeSpentMs, 0) / taskResults.length / 1000
              : 0;

            return (
              <Card key={task.id}>
                <h5 className="font-medium text-gray-900 dark:text-white mb-2">
                  {task.question}
                </h5>
                <div className="space-y-2">
                  <Badge color="success" className="w-full justify-center">
                    Success rate: {taskResults.length > 0 ? ((correctCount / taskResults.length) * 100).toFixed(0) : 0}%
                  </Badge>
                  <Badge color="gray" className="w-full justify-center">
                    Avg. time: {avgTime.toFixed(1)}s
                  </Badge>
                  <Badge color="blue" className="w-full justify-center">
                    Responses: {taskResults.length}
                  </Badge>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    <strong>Correct answer:</strong> {getCorrectAnswerLabel(task.id)}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detailed Results Table */}
      <Card>
        <h4 className="font-semibold text-gray-900 dark:text-white mb-4">
          Detailed Results
        </h4>
        
        {filteredResults.length > 0 ? (
          <div className="overflow-x-auto">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                  <tr>
                    <th className="px-6 py-3">Task</th>
                    <th className="px-6 py-3">Participant</th>
                    <th className="px-6 py-3">Selected Answer</th>
                    <th className="px-6 py-3">Correct Answer</th>
                    <th className="px-6 py-3">Result</th>
                    <th className="px-6 py-3">Time</th>
                    <th className="px-6 py-3">Path Taken</th>
                  </tr>
                </thead>
                <tbody>
                {filteredResults.map((result, index) => {
                  const task = study.tasks.find(t => t.id === result.taskId);
                  const participantIndex = completedParticipants.findIndex(p => p.id === result.participantId);
                  
                  return (
                    <tr key={`${result.taskId}-${result.participantId}-${index}`} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                        {task?.question || "Unknown Task"}
                      </td>
                      <td className="px-6 py-4">
                        Participant {participantIndex + 1}
                      </td>
                      <td className="px-6 py-4">
                        {getNodeLabel(result.selectedNodeId)}
                      </td>
                      <td className="px-6 py-4">
                        {getCorrectAnswerLabel(result.taskId)}
                      </td>
                      <td className="px-6 py-4">
                        {result.isCorrect ? (
                          <div className="flex items-center text-green-600 dark:text-green-400">
                            <HiCheck className="h-4 w-4 mr-1" />
                            Correct
                          </div>
                        ) : (
                          <div className="flex items-center text-red-600 dark:text-red-400">
                            <HiX className="h-4 w-4 mr-1" />
                            Incorrect
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {(result.timeSpentMs / 1000).toFixed(1)}s
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate" title={getPathText(result.selectedPath)}>
                          {getPathText(result.selectedPath)}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400">
              No results match the current filters.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
