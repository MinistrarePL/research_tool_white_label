"use client";

import { useState, useEffect } from "react";
import { Button, Card, Progress } from "flowbite-react";
import { HiChevronRight, HiChevronDown, HiArrowLeft, HiCheck } from "react-icons/hi";

type TreeNode = {
  id: string;
  label: string;
  parentId: string | null;
};

type Task = {
  id: string;
  question: string;
  correctNodeId: string | null;
};

type Study = {
  id: string;
  treeNodes: TreeNode[];
  tasks: Task[];
};

type TaskResult = {
  taskId: string;
  selectedPath: string[];
  selectedNodeId: string | null;
  isCorrect: boolean;
  timeSpentMs: number;
};

export default function TreeTestingStudy({
  study,
  participantId,
  onComplete,
}: {
  study: Study;
  participantId: string;
  onComplete: () => void;
}) {
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [results, setResults] = useState<TaskResult[]>([]);
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [submitting, setSubmitting] = useState(false);

  const currentTask = study.tasks[currentTaskIndex];
  const progress = ((currentTaskIndex) / study.tasks.length) * 100;

  useEffect(() => {
    setStartTime(Date.now());
    setCurrentPath([]);
    setExpandedNodes(new Set());
    setSelectedNodeId(null);
  }, [currentTaskIndex]);

  const rootNodes = study.treeNodes.filter((n) => !n.parentId);

  const getChildren = (parentId: string): TreeNode[] => {
    return study.treeNodes.filter((n) => n.parentId === parentId);
  };

  const toggleExpand = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
    
    // Track path
    const node = study.treeNodes.find((n) => n.id === nodeId);
    if (node && !currentPath.includes(nodeId)) {
      setCurrentPath([...currentPath, nodeId]);
    }
  };

  const selectNode = (nodeId: string) => {
    // Just mark as selected, don't submit yet
    setSelectedNodeId(nodeId);
    
    // Update path to include selected node if not already there
    if (!currentPath.includes(nodeId)) {
      setCurrentPath([...currentPath, nodeId]);
    }
  };

  const confirmSelection = () => {
    if (!selectedNodeId) return;

    const timeSpent = Date.now() - startTime;
    const isCorrect = currentTask.correctNodeId === selectedNodeId;

    const result: TaskResult = {
      taskId: currentTask.id,
      selectedPath: currentPath,
      selectedNodeId: selectedNodeId,
      isCorrect,
      timeSpentMs: timeSpent,
    };

    const newResults = [...results, result];
    setResults(newResults);

    if (currentTaskIndex < study.tasks.length - 1) {
      setCurrentTaskIndex(currentTaskIndex + 1);
    } else {
      submitResults(newResults);
    }
  };

  const submitResults = async (finalResults: TaskResult[]) => {
    setSubmitting(true);
    await fetch(`/api/studies/${study.id}/participants`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        participantId,
        type: "TREE_TESTING",
        results: finalResults,
      }),
    });
    onComplete();
  };

  const renderNode = (node: TreeNode, depth: number = 0): React.ReactNode => {
    const children = getChildren(node.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedNodeId === node.id;

    return (
      <div key={node.id}>
        <div
          className={`flex items-center gap-2 py-2 px-3 rounded cursor-pointer transition-colors ${
            isSelected 
              ? "bg-blue-100 dark:bg-blue-900 border-2 border-blue-500" 
              : "hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}
          style={{ paddingLeft: `${depth * 24 + 12}px` }}
        >
          {hasChildren ? (
            <button
              onClick={() => toggleExpand(node.id)}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
            >
              {isExpanded ? (
                <HiChevronDown className="h-5 w-5 text-gray-500" />
              ) : (
                <HiChevronRight className="h-5 w-5 text-gray-500" />
              )}
            </button>
          ) : (
            <span className="w-7" />
          )}
          <span
            className={`flex-1 ${isSelected ? "text-blue-900 dark:text-blue-100 font-medium" : "text-gray-900 dark:text-white"}`}
            onClick={() => selectNode(node.id)}
          >
            {node.label}
          </span>
          <Button
            size="xs"
            color={isSelected ? "blue" : "light"}
            outline={!isSelected}
            onClick={() => selectNode(node.id)}
          >
            <HiCheck className="h-4 w-4 mr-1" />
            {isSelected ? "Selected" : "Select"}
          </Button>
        </div>
        {isExpanded && children.map((child) => renderNode(child, depth + 1))}
      </div>
    );
  };

  if (!currentTask) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="text-center">
          <p className="text-gray-500">Loading...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <Progress progress={progress} size="sm" color="blue" />
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Task {currentTaskIndex + 1} of {study.tasks.length}
        </p>
      </div>

      <Card className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {currentTask.question}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
          Navigate through the tree and click "Select" to choose an item, then confirm your selection.
        </p>
      </Card>

      {currentPath.length > 0 && (
        <div className="mb-4 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span>Path:</span>
          {currentPath.map((nodeId, index) => {
            const node = study.treeNodes.find((n) => n.id === nodeId);
            return (
              <span key={nodeId} className="flex items-center">
                {index > 0 && <HiChevronRight className="h-4 w-4 mx-1" />}
                <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                  {node?.label}
                </span>
              </span>
            );
          })}
        </div>
      )}

      <Card>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {rootNodes.map((node) => renderNode(node))}
        </div>
      </Card>

      {/* Selected Item Display & Confirm Button */}
      {selectedNodeId && (
        <div className="mt-6">
          <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                  Selected Item:
                </p>
                <p className="text-lg text-blue-900 dark:text-blue-100 font-semibold">
                  {study.treeNodes.find(n => n.id === selectedNodeId)?.label}
                </p>
              </div>
              <Button
                size="lg"
                color="blue"
                onClick={confirmSelection}
                disabled={submitting}
              >
                <HiCheck className="h-5 w-5 mr-2" />
                {submitting ? "Submitting..." : "Confirm Selection"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

