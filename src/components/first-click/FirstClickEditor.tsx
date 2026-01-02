"use client";

import { useState, useRef, useEffect } from "react";
import { Button, Label, TextInput, Card, Modal, ModalHeader, ModalBody, Toast, ToastToggle, ToggleSwitch } from "flowbite-react";
import { HiUpload, HiTrash, HiPlus, HiPencil, HiCheck, HiX, HiExclamation } from "react-icons/hi";

type Task = {
  id: string;
  question: string;
  imageUrl: string | null;
  displayTimeSeconds: number;
  order: number;
};

type Study = {
  id: string;
  status?: string;
  imageUrl: string | null;
  hasDisplayTime?: boolean;
  tasks: Task[];
};

export default function FirstClickEditor({
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
  const [uploading, setUploading] = useState<string | null>(null);
  const [newTaskQuestion, setNewTaskQuestion] = useState("");
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editQuestion, setEditQuestion] = useState("");
  const [tasks, setTasks] = useState<Task[]>(study.tasks);
  const [previewImages, setPreviewImages] = useState<{ [key: string]: string }>({});
  const [displayTimes, setDisplayTimes] = useState<{ [key: string]: number }>({});
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; taskId: string | null }>({ show: false, taskId: null });
  const [toast, setToast] = useState<{ show: boolean; message: string; type: "error" | "success" } | null>(null);
  const [hasDisplayTime, setHasDisplayTime] = useState(study.hasDisplayTime ?? false);

  useEffect(() => {
    // Always sync tasks from study
    setTasks(study.tasks);
    
    // Sync hasDisplayTime from study
    setHasDisplayTime(study.hasDisplayTime ?? false);
    
    // Initialize display times from tasks, but preserve existing local values
    setDisplayTimes((prev) => {
      const times: { [key: string]: number } = { ...prev };
      study.tasks.forEach((task) => {
        // Only initialize if not already set locally
        if (!(task.id in times)) {
          times[task.id] = task.displayTimeSeconds ?? 5;
        }
      });
      return times;
    });
  }, [study.tasks, study.hasDisplayTime]);

  const addTask = async () => {
    if (!newTaskQuestion.trim()) return;
    const questionToAdd = newTaskQuestion.trim();
    setNewTaskQuestion(""); // Clear input immediately for better UX
    
    try {
      const res = await fetch(`/api/studies/${study.id}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: questionToAdd, displayTimeSeconds: 5 }),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Failed to add task" }));
        showToast(errorData.error || "Failed to add task", "error");
        setNewTaskQuestion(questionToAdd); // Restore question on error
        return;
      }
      
      // Refresh from server to get updated study data
      onUpdate();
    } catch (error) {
      console.error("Error adding task:", error);
      showToast("Error adding task. Please try again.", "error");
      setNewTaskQuestion(questionToAdd); // Restore question on error
    }
  };

  const updateTask = async (taskId: string, question: string) => {
    await fetch(`/api/studies/${study.id}/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    setEditingTaskId(null);
    onUpdate();
  };

  const confirmDeleteTask = (taskId: string) => {
    setDeleteModal({ show: true, taskId });
  };

  const deleteTask = async () => {
    if (!deleteModal.taskId) return;
    await fetch(`/api/studies/${study.id}/tasks/${deleteModal.taskId}`, {
      method: "DELETE",
    });
    setDeleteModal({ show: false, taskId: null });
    onUpdate();
  };

  const showToast = (message: string, type: "error" | "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleFileChange = async (taskId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setPreviewImages((prev) => ({ ...prev, [taskId]: base64 }));
    };
    reader.readAsDataURL(file);

    setUploading(taskId);

    // Upload to server
    const uploadReader = new FileReader();
    uploadReader.onerror = () => {
      console.error("Error reading file");
      setUploading(null);
      setPreviewImages((prev) => {
        const newPrev = { ...prev };
        delete newPrev[taskId];
        return newPrev;
      });
      showToast("Error reading file. Please try again.", "error");
    };
    uploadReader.onload = async () => {
      try {
        const base64 = uploadReader.result as string;
        const res = await fetch(`/api/studies/${study.id}/tasks/${taskId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl: base64 }),
        });
        
        if (!res.ok) {
          let errorMessage = `HTTP ${res.status}: ${res.statusText}`;
          try {
            const errorData = await res.json();
            errorMessage = errorData.error || errorMessage;
            console.error("Upload error response:", errorData);
          } catch (e) {
            const text = await res.text().catch(() => "");
            console.error("Upload error (non-JSON):", text || "No error message");
            errorMessage = text || errorMessage;
          }
          throw new Error(errorMessage);
        }
        
        const result = await res.json();
        console.log("Upload successful:", result);
        // Clear preview after successful upload
        setPreviewImages((prev) => {
          const newPrev = { ...prev };
          delete newPrev[taskId];
          return newPrev;
        });
        // Reset file input
        const input = fileInputRefs.current[taskId];
        if (input) {
          input.value = "";
        }
        setUploading(null);
        onUpdate();
      } catch (error) {
        console.error("Error uploading image:", error);
        setUploading(null);
        setPreviewImages((prev) => {
          const newPrev = { ...prev };
          delete newPrev[taskId];
          return newPrev;
        });
        showToast("Error uploading image. Please try again.", "error");
      }
    };
    uploadReader.readAsDataURL(file);
  };

  const removeImage = async (taskId: string) => {
    await fetch(`/api/studies/${study.id}/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl: null }),
    });
    onUpdate();
  };

  const updateDisplayTime = async (taskId: string, seconds: number) => {
    // Validate: min 3, max 12 seconds
    const clampedSeconds = Math.max(3, Math.min(12, seconds));
    // Update local state first
    setDisplayTimes((prev) => ({ ...prev, [taskId]: clampedSeconds }));
    
    await fetch(`/api/studies/${study.id}/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayTimeSeconds: clampedSeconds }),
    });
    
    // Update tasks state locally without calling onUpdate to avoid reset
    setTasks((prevTasks) =>
      prevTasks.map((t) =>
        t.id === taskId ? { ...t, displayTimeSeconds: clampedSeconds } : t
      )
    );
  };

  const handleDisplayTimeChange = (taskId: string, value: string) => {
    const numValue = parseInt(value) || 5;
    const clampedValue = Math.max(3, Math.min(12, numValue));
    setDisplayTimes((prev) => ({ ...prev, [taskId]: clampedValue }));
  };

  const handleDisplayTimeBlur = (taskId: string, value: string) => {
    const numValue = parseInt(value) || 5;
    const clampedValue = Math.max(3, Math.min(12, numValue));
    setDisplayTimes((prev) => ({ ...prev, [taskId]: clampedValue }));
    updateDisplayTime(taskId, clampedValue);
  };

  const toggleDisplayTime = async (enabled: boolean) => {
    setHasDisplayTime(enabled);
    try {
      await fetch(`/api/studies/${study.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hasDisplayTime: enabled }),
      });
    } catch (error) {
      console.error("Error updating display time setting:", error);
      setHasDisplayTime(!enabled); // Revert on error
      showToast("Failed to update setting", "error");
    }
  };

  const startEditing = (task: Task) => {
    setEditingTaskId(task.id);
    setEditQuestion(task.question);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Tasks ({study.tasks.length})
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Add tasks with screenshots. Participants will click where they think they should to complete each task.
        </p>

        {/* Add new task */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex gap-2 max-w-xl">
            <TextInput
              value={newTaskQuestion}
              onChange={(e) => setNewTaskQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !isDisabled && addTask()}
              placeholder="Where would you click to...?"
              className="flex-1"
              disabled={isDisabled}
            />
            <Button onClick={addTask} color="blue" disabled={isDisabled || !newTaskQuestion.trim()}>
              <HiPlus className="mr-1 h-5 w-5" />
              Add Task
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <ToggleSwitch
              checked={hasDisplayTime}
              onChange={toggleDisplayTime}
              disabled={isDisabled}
              color="blue"
              label="Add display time for this study"
            />
          </div>
        </div>

        {/* Task list */}
        <div className="space-y-4">
          {tasks.map((task, index) => (
            <Card key={task.id} className="p-4">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Task {index + 1}
                  </span>
                  {editingTaskId === task.id ? (
                    <div className="flex gap-2 mt-1">
                      <TextInput
                        value={editQuestion}
                        onChange={(e) => setEditQuestion(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") updateTask(task.id, editQuestion);
                          if (e.key === "Escape") setEditingTaskId(null);
                        }}
                        className="flex-1"
                        autoFocus
                      />
                      <Button size="xs" color="light" className="border-green-500 text-green-600 hover:bg-green-50" onClick={() => updateTask(task.id, editQuestion)}>
                        <HiCheck className="h-3 w-3" />
                      </Button>
                      <Button size="xs" color="gray" onClick={() => setEditingTaskId(null)}>
                        <HiX className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <p className="text-gray-900 dark:text-white font-medium">
                      {task.question}
                    </p>
                  )}
                </div>
                {!editingTaskId && (
                  <div className="flex gap-1">
                    <Button
                      size="xs"
                      color="light"
                      onClick={() => startEditing(task)}
                      disabled={isDisabled}
                    >
                      <HiPencil className="h-4 w-4 text-gray-500" />
                    </Button>
                    <Button
                      size="xs"
                      color="light"
                      onClick={() => confirmDeleteTask(task.id)}
                      disabled={isDisabled}
                    >
                      <HiTrash className="h-4 w-4 text-gray-500 hover:text-red-500" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Image section */}
              {!task.imageUrl && !previewImages[task.id] ? (
                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                  <HiUpload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    Upload screenshot for this task
                  </p>
                  <input
                    ref={(el) => {
                      if (el) fileInputRefs.current[task.id] = el;
                    }}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(task.id, e)}
                    className="hidden"
                    key={`upload-${task.id}`}
                  />
                  <Button
                    size="sm"
                    color="light"
                    onClick={() => {
                      const input = fileInputRefs.current[task.id];
                      if (input) input.click();
                    }}
                    disabled={uploading === task.id || isDisabled}
                  >
                    {uploading === task.id ? "Uploading..." : "Upload Image"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="relative border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <img
                      src={previewImages[task.id] || task.imageUrl || ""}
                      alt={`Task ${index + 1} screenshot`}
                      className="max-w-full h-auto max-h-[300px] object-contain mx-auto"
                    />
                    {uploading === task.id && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <span className="text-white">Uploading...</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex gap-2">
                      <input
                        ref={(el) => {
                          if (el) fileInputRefs.current[task.id] = el;
                        }}
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFileChange(task.id, e)}
                        className="hidden"
                        key={`replace-${task.id}`}
                      />
                      <Button
                        size="xs"
                        color="light"
                        onClick={() => {
                          const input = fileInputRefs.current[task.id];
                          if (input) input.click();
                        }}
                        disabled={uploading === task.id || isDisabled}
                      >
                        {uploading === task.id ? "Uploading..." : "Replace"}
                      </Button>
                      <Button
                        size="xs"
                        color="light"
                        onClick={() => removeImage(task.id)}
                        disabled={isDisabled}
                      >
                        <HiTrash className="h-4 w-4 text-gray-500 hover:text-red-500" />
                      </Button>
                    </div>
                    {hasDisplayTime && (
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`display-time-${task.id}`} className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                          Display time (seconds):
                        </Label>
                        <TextInput
                          id={`display-time-${task.id}`}
                          type="number"
                          min={3}
                          max={12}
                          value={displayTimes[task.id] ?? task.displayTimeSeconds ?? 5}
                          onChange={(e) => handleDisplayTimeChange(task.id, e.target.value)}
                          onBlur={(e) => handleDisplayTimeBlur(task.id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleDisplayTimeBlur(task.id, (e.target as HTMLInputElement).value);
                            }
                          }}
                          className="w-20"
                          disabled={isDisabled}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>
          ))}

          {study.tasks.length === 0 && (
            <Card className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                No tasks yet. Add a task above to get started.
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal show={deleteModal.show} size="md" onClose={() => setDeleteModal({ show: false, taskId: null })} popup>
        <ModalHeader />
        <ModalBody>
          <div className="text-center">
            <HiExclamation className="mx-auto mb-4 h-14 w-14 text-gray-400 dark:text-gray-200" />
            <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
              Are you sure you want to delete this task?
            </h3>
            <div className="flex justify-center gap-4">
              <Button color="failure" onClick={deleteTask}>
                Yes, delete
              </Button>
              <Button color="gray" onClick={() => setDeleteModal({ show: false, taskId: null })}>
                Cancel
              </Button>
            </div>
          </div>
        </ModalBody>
      </Modal>

      {/* Toast notification */}
      {toast?.show && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
          <Toast className={`shadow-lg border ${toast.type === "error" ? "border-red-200 dark:border-red-700" : "border-green-200 dark:border-green-700"}`}>
            <div className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
              toast.type === "error" 
                ? "bg-red-100 text-red-500 dark:bg-red-800 dark:text-red-200" 
                : "bg-green-100 text-green-500 dark:bg-green-800 dark:text-green-200"
            }`}>
              {toast.type === "error" ? <HiX className="h-5 w-5" /> : <HiCheck className="h-5 w-5" />}
            </div>
            <div className="ml-3 text-sm font-medium">{toast.message}</div>
            <ToastToggle onDismiss={() => setToast(null)} />
          </Toast>
        </div>
      )}
    </div>
  );
}
