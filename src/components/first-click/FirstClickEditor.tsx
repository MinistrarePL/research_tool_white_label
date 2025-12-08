"use client";

import { useState, useRef } from "react";
import { Button, Label, TextInput, FileInput, Card } from "flowbite-react";
import { HiUpload, HiTrash } from "react-icons/hi";

type Study = {
  id: string;
  imageUrl: string | null;
  tasks: { id: string; question: string }[];
};

export default function FirstClickEditor({
  study,
  onUpdate,
}: {
  study: Study;
  onUpdate: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [taskQuestion, setTaskQuestion] = useState(
    study.tasks[0]?.question || "Where would you click to...?"
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    // Convert to base64 for simple storage
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      await fetch(`/api/studies/${study.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: base64 }),
      });
      setUploading(false);
      onUpdate();
    };
    reader.readAsDataURL(file);
  };

  const removeImage = async () => {
    await fetch(`/api/studies/${study.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl: null }),
    });
    onUpdate();
  };

  const updateTask = async () => {
    if (study.tasks[0]) {
      // Update existing task
      await fetch(`/api/studies/${study.id}/tasks/${study.tasks[0].id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: taskQuestion }),
      });
    } else {
      // Create new task
      await fetch(`/api/studies/${study.id}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: taskQuestion }),
      });
    }
    onUpdate();
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Task Question
        </h3>
        <div className="flex gap-2 max-w-xl">
          <TextInput
            value={taskQuestion}
            onChange={(e) => setTaskQuestion(e.target.value)}
            placeholder="Where would you click to...?"
            className="flex-1"
          />
          <Button onClick={updateTask}>Save</Button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Image / Screenshot
        </h3>

        {!study.imageUrl ? (
          <Card className="text-center py-12">
            <div className="flex flex-col items-center gap-4">
              <HiUpload className="h-12 w-12 text-gray-400" />
              <div>
                <p className="text-gray-500 dark:text-gray-400 mb-2">
                  Upload an image or screenshot for the first-click test
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? "Uploading..." : "Upload Image"}
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="relative border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <img
                src={study.imageUrl}
                alt="Test image"
                className="max-w-full h-auto"
              />
            </div>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                color="gray"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? "Uploading..." : "Replace Image"}
              </Button>
              <Button color="failure" onClick={removeImage}>
                <HiTrash className="mr-2 h-4 w-4" />
                Remove
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

