"use client";

import { useState } from "react";
import { Button, TextInput, Label, Card, Select } from "flowbite-react";
import { HiPlus, HiTrash, HiChevronRight, HiChevronDown } from "react-icons/hi";

type TreeNode = {
  id: string;
  label: string;
  parentId: string | null;
  order: number;
};

type Task = {
  id: string;
  question: string;
  correctNodeId: string | null;
  order: number;
};

type Study = {
  id: string;
  treeNodes: TreeNode[];
  tasks: Task[];
};

export default function TreeTestingEditor({
  study,
  onUpdate,
}: {
  study: Study;
  onUpdate: () => void;
}) {
  const [newNodeLabel, setNewNodeLabel] = useState("");
  const [selectedParent, setSelectedParent] = useState<string>("");
  const [newTaskQuestion, setNewTaskQuestion] = useState("");
  const [newTaskCorrectNode, setNewTaskCorrectNode] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

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
  };

  const addNode = async () => {
    if (!newNodeLabel.trim()) return;
    setLoading(true);
    await fetch(`/api/studies/${study.id}/tree-nodes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: newNodeLabel,
        parentId: selectedParent || null,
      }),
    });
    setNewNodeLabel("");
    setLoading(false);
    onUpdate();
  };

  const deleteNode = async (nodeId: string) => {
    await fetch(`/api/studies/${study.id}/tree-nodes/${nodeId}`, {
      method: "DELETE",
    });
    onUpdate();
  };

  const addTask = async () => {
    if (!newTaskQuestion.trim()) return;
    setLoading(true);
    await fetch(`/api/studies/${study.id}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: newTaskQuestion,
        correctNodeId: newTaskCorrectNode || null,
      }),
    });
    setNewTaskQuestion("");
    setNewTaskCorrectNode("");
    setLoading(false);
    onUpdate();
  };

  const deleteTask = async (taskId: string) => {
    await fetch(`/api/studies/${study.id}/tasks/${taskId}`, {
      method: "DELETE",
    });
    onUpdate();
  };

  const renderNode = (node: TreeNode, depth: number = 0): React.ReactNode => {
    const children = getChildren(node.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedNodes.has(node.id);

    return (
      <div key={node.id}>
        <div
          className="flex items-center gap-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-2"
          style={{ paddingLeft: `${depth * 20 + 8}px` }}
        >
          {hasChildren ? (
            <button onClick={() => toggleExpand(node.id)} className="p-1">
              {isExpanded ? (
                <HiChevronDown className="h-4 w-4 text-gray-500" />
              ) : (
                <HiChevronRight className="h-4 w-4 text-gray-500" />
              )}
            </button>
          ) : (
            <span className="w-6" />
          )}
          <span className="flex-1 text-gray-900 dark:text-white">
            {node.label}
          </span>
          <Button
            size="xs"
            color="failure"
            onClick={() => deleteNode(node.id)}
          >
            <HiTrash className="h-3 w-3" />
          </Button>
        </div>
        {isExpanded &&
          children.map((child) => renderNode(child, depth + 1))}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Tree Structure ({study.treeNodes.length} nodes)
        </h3>

        <div className="space-y-3 mb-4">
          <div>
            <Label className="mb-2 block">Parent Node</Label>
            <Select
              value={selectedParent}
              onChange={(e) => setSelectedParent(e.target.value)}
            >
              <option value="">Root level</option>
              {study.treeNodes.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex gap-2">
            <TextInput
              placeholder="New node label..."
              value={newNodeLabel}
              onChange={(e) => setNewNodeLabel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addNode()}
              className="flex-1"
            />
            <Button onClick={addNode} disabled={loading}>
              <HiPlus className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <Card className="max-h-[400px] overflow-auto">
          {rootNodes.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-4">
              Add nodes to build your navigation tree.
            </p>
          ) : (
            rootNodes.map((node) => renderNode(node))
          )}
        </Card>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Tasks ({study.tasks.length})
        </h3>

        <div className="space-y-3 mb-4">
          <div>
            <Label className="mb-2 block">Question</Label>
            <TextInput
              placeholder="Where would you find...?"
              value={newTaskQuestion}
              onChange={(e) => setNewTaskQuestion(e.target.value)}
            />
          </div>
          <div>
            <Label className="mb-2 block">Correct Answer (optional)</Label>
            <Select
              value={newTaskCorrectNode}
              onChange={(e) => setNewTaskCorrectNode(e.target.value)}
            >
              <option value="">No correct answer</option>
              {study.treeNodes.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.label}
                </option>
              ))}
            </Select>
          </div>
          <Button onClick={addTask} disabled={loading}>
            <HiPlus className="mr-2 h-5 w-5" />
            Add Task
          </Button>
        </div>

        <div className="space-y-2">
          {study.tasks.map((task, index) => (
            <Card key={task.id} className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Task {index + 1}
                  </span>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {task.question}
                  </p>
                  {task.correctNodeId && (
                    <p className="text-sm text-green-600 dark:text-green-400">
                      Correct:{" "}
                      {study.treeNodes.find((n) => n.id === task.correctNodeId)
                        ?.label || "Unknown"}
                    </p>
                  )}
                </div>
                <Button
                  size="xs"
                  color="failure"
                  onClick={() => deleteTask(task.id)}
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

