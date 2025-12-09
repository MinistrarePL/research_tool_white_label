"use client";

import { useState, useEffect, useRef } from "react";
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
import { Button, TextInput, Label, Card, Select, Toast, ToastToggle, Modal, ModalHeader, ModalBody } from "flowbite-react";
import { HiPlus, HiTrash, HiChevronRight, HiChevronDown, HiPencil, HiCheck, HiX, HiUpload } from "react-icons/hi";
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
  isLocked = false,
}: {
  study: Study;
  onUpdate: () => void;
  isLocked?: boolean;
}) {
  const isActive = study.status === "ACTIVE";
  const isDisabled = isActive || isLocked;
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
  const [toast, setToast] = useState<{ show: boolean; message: string; type?: "success" | "error" } | null>(null);
  const [showDeleteTasksModal, setShowDeleteTasksModal] = useState(false);
  const [showDeleteNodesModal, setShowDeleteNodesModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const expandAll = () => {
    const allNodeIds = study.treeNodes
      .filter((n) => getChildren(n.id).length > 0)
      .map((n) => n.id);
    setExpandedNodes(new Set(allNodeIds));
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  const hasExpandableNodes = study.treeNodes.some((n) => getChildren(n.id).length > 0);
  const allExpanded = hasExpandableNodes && 
    study.treeNodes
      .filter((n) => getChildren(n.id).length > 0)
      .every((n) => expandedNodes.has(n.id));


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
    if (!newTaskCorrectNode || newTaskCorrectNode === "") {
      // Show error toast
      setToast({ show: true, message: "Please select a correct answer before adding a task.", type: "error" });
      setTimeout(() => setToast(null), 3000);
      return;
    }
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

  const deleteAllTasks = async () => {
    setShowDeleteTasksModal(false);
    setLoading(true);
    await Promise.all(
      tasks.map((task) =>
        fetch(`/api/studies/${study.id}/tasks/${task.id}`, {
          method: "DELETE",
        })
      )
    );
    setLoading(false);
    onUpdate();
  };

  const deleteAllNodes = async () => {
    setShowDeleteNodesModal(false);
    setLoading(true);
    await Promise.all(
      study.treeNodes.map((node) =>
        fetch(`/api/studies/${study.id}/tree-nodes/${node.id}`, {
          method: "DELETE",
        })
      )
    );
    setLoading(false);
    onUpdate();
  };

  type JsonNode = {
    label: string;
    children?: JsonNode[];
  };

  // Convert object-based format to array-based format
  // Supports: { "Label": [...children] } or { "Label": { "Child": [...] } }
  const convertObjectToNodes = (obj: Record<string, unknown>): JsonNode[] => {
    return Object.entries(obj).map(([key, value]) => {
      const node: JsonNode = { label: key };
      
      if (Array.isArray(value)) {
        // Value is array of strings or objects
        if (value.length > 0) {
          if (typeof value[0] === "string") {
            // Array of strings: ["Item1", "Item2"]
            node.children = value.map((item) => ({ label: item as string }));
          } else {
            // Array of objects: [{ label: "..." }, ...]
            node.children = value as JsonNode[];
          }
        }
      } else if (typeof value === "object" && value !== null) {
        // Nested object: { "Child": [...] }
        node.children = convertObjectToNodes(value as Record<string, unknown>);
      }
      
      return node;
    });
  };

  const handleJsonUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const json = JSON.parse(text);

      let nodes: JsonNode[];

      if (Array.isArray(json)) {
        // Standard format: [{ label: "...", children: [...] }]
        nodes = json as JsonNode[];
      } else if (typeof json === "object" && json !== null) {
        // Object format: { "Label": [...] } - convert it
        nodes = convertObjectToNodes(json as Record<string, unknown>);
      } else {
        setToast({ show: true, message: "Invalid JSON format. Please provide an array or object structure.", type: "error" });
        setTimeout(() => setToast(null), 3000);
        return;
      }

      setLoading(true);

      // Recursive function to create nodes
      const createNodesRecursively = async (
        nodesToCreate: JsonNode[],
        parentId: string | null = null
      ) => {
        for (let i = 0; i < nodesToCreate.length; i++) {
          const node = nodesToCreate[i];
          const response = await fetch(`/api/studies/${study.id}/tree-nodes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              label: node.label,
              parentId,
              order: i,
            }),
          });
          const createdNode = await response.json();

          if (node.children && node.children.length > 0) {
            await createNodesRecursively(node.children, createdNode.id);
          }
        }
      };

      await createNodesRecursively(nodes);

      setLoading(false);
      onUpdate();
      setToast({ show: true, message: "Tree structure imported successfully!", type: "success" });
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      setLoading(false);
      setToast({ show: true, message: "Failed to parse JSON file. Please check the format.", type: "error" });
      setTimeout(() => setToast(null), 3000);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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
      <div key={node.id} className="mb-2" style={{ marginBottom: '8px' }}>
        {/* Node container with border like Optimal Workshop */}
        <div 
          className="border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 shadow-sm"
          style={{ marginLeft: `${depth * 24}px` }}
        >
          <div className="flex items-center p-3 group">
            {/* Expand/collapse button */}
            {hasChildren ? (
              <button 
                onClick={() => toggleExpand(node.id)} 
                className="mr-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              >
                {isExpanded ? (
                  <HiChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                ) : (
                  <HiChevronRight className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                )}
              </button>
            ) : (
              <span className="w-6 mr-2" />
            )}

            {/* Node content */}
            {isEditing ? (
              <div className="flex-1 flex items-center gap-2">
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
                <Button size="xs" color="light" className="border-green-500 text-green-600 hover:bg-green-50" onClick={() => saveNode(node.id)}>
                  <HiCheck className="h-3 w-3" />
                </Button>
                <Button size="xs" color="gray" onClick={cancelEditingNode}>
                  <HiX className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <>
                <span className="flex-1 text-gray-900 dark:text-white font-medium">
                  {node.label}
                </span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!isDisabled && (
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
        </div>
        
        {/* Adding child inline form */}
        {isAddingChild && isExpanded && (
          <div 
            className="border border-dashed border-gray-400 dark:border-gray-500 rounded-lg bg-gray-50 dark:bg-gray-700"
            style={{ marginLeft: `${(depth + 1) * 24}px`, marginTop: '8px' }}
          >
            <div className="flex items-center p-3 gap-2">
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
              <Button size="xs" color="light" className="border-green-500 text-green-600 hover:bg-green-50" onClick={() => addChildNode(node.id)} disabled={loading}>
                <HiCheck className="h-3 w-3" />
              </Button>
              <Button size="xs" color="gray" onClick={cancelAddingChild}>
                <HiX className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
        
        {/* Render children */}
        {isExpanded && hasChildren && (
          <div style={{ marginTop: '8px' }}>
            {children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-0 lg:divide-x lg:divide-gray-200 dark:lg:divide-gray-700">
      <div className="lg:pr-10 pt-6 pb-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Tree Structure ({study.treeNodes.length} nodes)
        </h3>

        <Card className="min-h-[200px]">
          {/* Header with Expand/Collapse and Add main category buttons */}
          <div className="flex justify-between items-center mb-3">
            <div>
              {hasExpandableNodes && (
                <>
                  {allExpanded ? (
                    <Button size="xs" color="light" onClick={collapseAll}>
                      Collapse All
                    </Button>
                  ) : (
                    <Button size="xs" color="light" onClick={expandAll}>
                      Expand All
                    </Button>
                  )}
                </>
              )}
            </div>
            {!isDisabled && (
              <div className="flex gap-2">
                <Button size="xs" color="light" onClick={() => fileInputRef.current?.click()}>
                  <HiUpload className="mr-1 h-3 w-3" />
                  Upload JSON
                </Button>
                <Button size="xs" color="light" onClick={() => setAddingChildToNodeId("root")}>
                  <HiPlus className="mr-1 h-3 w-3" />
                  Add main category
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleJsonUpload}
                  className="hidden"
                />
              </div>
            )}
          </div>

          {rootNodes.length === 0 && addingChildToNodeId !== "root" ? (
            <div className="text-center py-4">
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Add nodes to build your navigation tree.
              </p>
            </div>
          ) : (
            <>
              {rootNodes.map((node) => renderNode(node, 0))}
              
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
                  <Button size="xs" color="light" className="border-green-500 text-green-600 hover:bg-green-50" onClick={addRootNode} disabled={loading}>
                    <HiCheck className="h-3 w-3" />
                  </Button>
                  <Button size="xs" color="gray" onClick={cancelAddingChild}>
                    <HiX className="h-3 w-3" />
                  </Button>
                </div>
              )}
              
              {/* Delete All Nodes button */}
              {rootNodes.length > 0 && !isDisabled && (
                <div className="mt-4">
                  <Button size="xs" color="failure" outline onClick={() => setShowDeleteNodesModal(true)} disabled={loading}>
                    Delete All
                  </Button>
                </div>
              )}
            </>
          )}
        </Card>
      </div>

      <div className="lg:pl-10 pt-6 pb-6">
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
              disabled={isDisabled}
            />
          </div>
          <div>
            <Label className="mb-2 block">Correct Answer (optional)</Label>
            <Select
              value={newTaskCorrectNode}
              onChange={(e) => setNewTaskCorrectNode(e.target.value)}
              disabled={isDisabled}
            >
              <option value="">No correct answer</option>
              {study.treeNodes.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.label}
                </option>
              ))}
            </Select>
          </div>
          <Button 
            onClick={addTask} 
            disabled={loading || isDisabled || !newTaskQuestion.trim() || !newTaskCorrectNode || newTaskCorrectNode === ""} 
            color="blue"
          >
            <HiPlus className="mr-2 h-5 w-5" />
            Add Task
          </Button>
        </div>

        {isDisabled ? (
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
                      disabled={isDisabled}
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
                    isActive={isDisabled}
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
        {tasks.length > 0 && !isDisabled && (
          <div className="mt-4">
            <Button size="xs" color="failure" outline onClick={() => setShowDeleteTasksModal(true)} disabled={loading}>
              Delete All
            </Button>
          </div>
        )}
      </div>

      {/* Toast notification */}
      {toast && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
          <Toast>
            <div className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
              toast.type === "success" 
                ? "bg-green-100 text-green-500 dark:bg-green-800 dark:text-green-200" 
                : "bg-red-100 text-red-500 dark:bg-red-800 dark:text-red-200"
            }`}>
              {toast.type === "success" ? <HiCheck className="h-5 w-5" /> : <HiX className="h-5 w-5" />}
            </div>
            <div className="ml-3 text-sm font-normal">{toast.message}</div>
            <ToastToggle onDismiss={() => setToast(null)} />
          </Toast>
        </div>
      )}

      {/* Delete All Tasks Modal */}
      <Modal show={showDeleteTasksModal} onClose={() => setShowDeleteTasksModal(false)}>
        <ModalHeader>Delete All Tasks</ModalHeader>
        <ModalBody>
          <p className="text-gray-500 dark:text-gray-400">
            Are you sure you want to delete all tasks? This action cannot be undone.
          </p>
          <div className="flex gap-2 justify-end mt-4">
            <Button color="gray" onClick={() => setShowDeleteTasksModal(false)}>
              Cancel
            </Button>
            <Button color="failure" onClick={deleteAllTasks}>
              Delete All
            </Button>
          </div>
        </ModalBody>
      </Modal>

      {/* Delete All Nodes Modal */}
      <Modal show={showDeleteNodesModal} onClose={() => setShowDeleteNodesModal(false)}>
        <ModalHeader>Delete All Nodes</ModalHeader>
        <ModalBody>
          <p className="text-gray-500 dark:text-gray-400">
            Are you sure you want to delete all nodes in the tree structure? This action cannot be undone.
          </p>
          <div className="flex gap-2 justify-end mt-4">
            <Button color="gray" onClick={() => setShowDeleteNodesModal(false)}>
              Cancel
            </Button>
            <Button color="failure" onClick={deleteAllNodes}>
              Delete All
            </Button>
          </div>
        </ModalBody>
      </Modal>
    </div>
  );
}

