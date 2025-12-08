"use client";

import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { Button, TextInput, Label, Card, Select } from "flowbite-react";
import { HiPlus, HiTrash, HiChevronRight, HiChevronDown, HiPencil, HiCheck, HiX } from "react-icons/hi";
import SortableTask from "./SortableTask";

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
  status?: string;
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
  const isActive = study.status === "ACTIVE";
  const [newTaskQuestion, setNewTaskQuestion] = useState("");
  const [newTaskCorrectNode, setNewTaskCorrectNode] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>(study.tasks);
  
  // Node editing state
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);
  const [editNodeLabel, setEditNodeLabel] = useState("");
  const [addingChildToNodeId, setAddingChildToNodeId] = useState<string | null>(null);
  const [newChildLabel, setNewChildLabel] = useState("");

  useEffect(() => {
    setTasks(study.tasks);
  }, [study.tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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


  const deleteNode = async (nodeId: string) => {
    await fetch(`/api/studies/${study.id}/tree-nodes/${nodeId}`, {
      method: "DELETE",
    });
    onUpdate();
  };

  const startEditingNode = (node: TreeNode) => {
    setEditingNodeId(node.id);
    setEditNodeLabel(node.label);
  };

  const cancelEditingNode = () => {
    setEditingNodeId(null);
    setEditNodeLabel("");
  };

  const saveNode = async (nodeId: string) => {
    if (!editNodeLabel.trim()) return;
    await fetch(`/api/studies/${study.id}/tree-nodes/${nodeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: editNodeLabel.trim() }),
    });
    cancelEditingNode();
    onUpdate();
  };

  const startAddingChild = (parentId: string) => {
    setAddingChildToNodeId(parentId);
    setNewChildLabel("");
    // Expand the parent node
    setExpandedNodes((prev) => new Set([...prev, parentId]));
  };

  const cancelAddingChild = () => {
    setAddingChildToNodeId(null);
    setNewChildLabel("");
  };

  const addChildNode = async (parentId: string) => {
    if (!newChildLabel.trim()) return;
    setLoading(true);
    await fetch(`/api/studies/${study.id}/tree-nodes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: newChildLabel.trim(),
        parentId: parentId,
      }),
    });
    cancelAddingChild();
    setLoading(false);
    onUpdate();
  };

  const addRootNode = async () => {
    if (!newChildLabel.trim()) return;
    setLoading(true);
    await fetch(`/api/studies/${study.id}/tree-nodes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: newChildLabel.trim(),
        parentId: null,
      }),
    });
    cancelAddingChild();
    setLoading(false);
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

  const handleTasksDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = tasks.findIndex((t) => t.id === active.id);
    const newIndex = tasks.findIndex((t) => t.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const newTasks = arrayMove(tasks, oldIndex, newIndex);
    setTasks(newTasks);

    // Update order in database
    await Promise.all(
      newTasks.map((task, index) =>
        fetch(`/api/studies/${study.id}/tasks/${task.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: index }),
        })
      )
    );
    onUpdate();
  };

  const startEditingTask = (taskId: string) => {
    setEditingTaskId(taskId);
  };

  const saveTask = async (taskId: string, question: string, correctNodeId: string | null) => {
    setLoading(true);
    await fetch(`/api/studies/${study.id}/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        correctNodeId,
      }),
    });
    setLoading(false);
    setEditingTaskId(null);
    onUpdate();
  };

  const renderNode = (node: TreeNode, depth: number = 0): React.ReactNode => {
    const children = getChildren(node.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const isEditing = editingNodeId === node.id;
    const isAddingChild = addingChildToNodeId === node.id;

    return (
      <div key={node.id}>
        <div
          className="flex items-center gap-1 py-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-2 group"
          style={{ paddingLeft: `${depth * 20 + 8}px` }}
        >
          {hasChildren || isAddingChild ? (
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
          
          {isEditing ? (
            <div className="flex-1 flex items-center gap-1">
              <TextInput
                value={editNodeLabel}
                onChange={(e) => setEditNodeLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveNode(node.id);
                  if (e.key === "Escape") cancelEditingNode();
                }}
                autoFocus
                sizing="sm"
                className="flex-1"
              />
              <Button size="xs" color="success" onClick={() => saveNode(node.id)}>
                <HiCheck className="h-3 w-3" />
              </Button>
              <Button size="xs" color="gray" onClick={cancelEditingNode}>
                <HiX className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <>
              <span className="flex-1 text-gray-900 dark:text-white">
                {node.label}
              </span>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {!isActive && (
                  <>
                    <Button
                      size="xs"
                      color="light"
                      onClick={() => startAddingChild(node.id)}
                      title="Add child node"
                    >
                      <HiPlus className="h-3 w-3 text-gray-500" />
                    </Button>
                    <Button
                      size="xs"
                      color="light"
                      onClick={() => startEditingNode(node)}
                      title="Edit label"
                    >
                      <HiPencil className="h-3 w-3 text-gray-500" />
                    </Button>
                    <Button
                      size="xs"
                      color="light"
                      onClick={() => deleteNode(node.id)}
                      title="Delete"
                    >
                      <HiTrash className="h-3 w-3 text-gray-500 hover:text-red-500" />
                    </Button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
        
        {/* Adding child inline form */}
        {isAddingChild && isExpanded && (
          <div
            className="flex items-center gap-1 py-1 px-2"
            style={{ paddingLeft: `${(depth + 1) * 20 + 8}px` }}
          >
            <span className="w-6" />
            <TextInput
              value={newChildLabel}
              onChange={(e) => setNewChildLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") addChildNode(node.id);
                if (e.key === "Escape") cancelAddingChild();
              }}
              placeholder="New child node..."
              autoFocus
              sizing="sm"
              className="flex-1 bg-white dark:bg-white text-gray-900 dark:text-gray-900"
            />
            <Button size="xs" color="success" onClick={() => addChildNode(node.id)} disabled={loading}>
              <HiCheck className="h-3 w-3" />
            </Button>
            <Button size="xs" color="gray" onClick={cancelAddingChild}>
              <HiX className="h-3 w-3" />
            </Button>
          </div>
        )}
        
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

        {isActive && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mb-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Study is active:</strong> Editing is disabled. Stop the study to make changes.
            </p>
          </div>
        )}

        <Card className="max-h-[400px] overflow-auto">
          {rootNodes.length === 0 && addingChildToNodeId !== "root" ? (
            <div className="text-center py-4">
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">
                Add nodes to build your navigation tree.
              </p>
              {!isActive && (
                <Button size="sm" color="light" onClick={() => setAddingChildToNodeId("root")}>
                  <HiPlus className="mr-1 h-4 w-4" />
                  Add main category
                </Button>
              )}
            </div>
          ) : (
            <>
              {rootNodes.map((node) => renderNode(node))}
              
              {/* Add main category inline */}
              {addingChildToNodeId === "root" && (
                <div className="flex items-center gap-1 py-1 px-2 pl-8">
                  <TextInput
                    value={newChildLabel}
                    onChange={(e) => setNewChildLabel(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addRootNode();
                      if (e.key === "Escape") cancelAddingChild();
                    }}
                    placeholder="New main category..."
                    autoFocus
                    sizing="sm"
                    className="flex-1"
                  />
                  <Button size="xs" color="success" onClick={addRootNode} disabled={loading}>
                    <HiCheck className="h-3 w-3" />
                  </Button>
                  <Button size="xs" color="gray" onClick={cancelAddingChild}>
                    <HiX className="h-3 w-3" />
                  </Button>
                </div>
              )}
              
              {/* Button to add more root nodes */}
              {rootNodes.length > 0 && addingChildToNodeId !== "root" && !isActive && (
                <div className="pt-2 pl-8">
                  <Button size="xs" color="light" onClick={() => setAddingChildToNodeId("root")}>
                    <HiPlus className="mr-1 h-3 w-3" />
                    Add main category
                  </Button>
                </div>
              )}
            </>
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
              disabled={isActive}
            />
          </div>
          <div>
            <Label className="mb-2 block">Correct Answer (optional)</Label>
            <Select
              value={newTaskCorrectNode}
              onChange={(e) => setNewTaskCorrectNode(e.target.value)}
              disabled={isActive}
            >
              <option value="">No correct answer</option>
              {study.treeNodes.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.label}
                </option>
              ))}
            </Select>
          </div>
          <Button onClick={addTask} disabled={loading || isActive} color="blue">
            <HiPlus className="mr-2 h-5 w-5" />
            Add Task
          </Button>
        </div>

        {isActive ? (
          <div className="space-y-2">
            {tasks.map((task, index) => (
              <Card key={task.id} className="py-2 px-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
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
                  <div className="flex gap-1">
                    <Button
                      size="xs"
                      color="light"
                      onClick={() => deleteTask(task.id)}
                      disabled={isActive}
                    >
                      <HiTrash className="h-4 w-4 text-gray-500 hover:text-red-500" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleTasksDragEnd}
          >
            <SortableContext
              items={tasks.map((t) => t.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {tasks.map((task, index) => (
                  <SortableTask
                    key={task.id}
                    id={task.id}
                    task={task}
                    index={index}
                    treeNodes={study.treeNodes}
                    isActive={isActive}
                    isEditing={editingTaskId === task.id}
                    onEdit={() => startEditingTask(task.id)}
                    onDelete={() => deleteTask(task.id)}
                    onSave={(question, correctNodeId) => saveTask(task.id, question, correctNodeId)}
                    onCancel={() => setEditingTaskId(null)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  );
}

