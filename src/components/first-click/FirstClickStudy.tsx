"use client";

import { useState, useRef, useEffect } from "react";
import { Card } from "flowbite-react";

type Study = {
  id: string;
  imageUrl: string | null;
  tasks: { id: string; question: string }[];
};

export default function FirstClickStudy({
  study,
  participantId,
  onComplete,
}: {
  study: Study;
  participantId: string;
  onComplete: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [startTime] = useState<number>(Date.now());
  const [clicked, setClicked] = useState(false);

  const task = study.tasks[0];

  const handleClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    if (clicked || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const timeToClick = Date.now() - startTime;

    setClicked(true);

    await fetch(`/api/studies/${study.id}/participants`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        participantId,
        type: "FIRST_CLICK",
        results: [{ x, y, timeToClickMs: timeToClick }],
      }),
    });

    setTimeout(() => {
      onComplete();
    }, 500);
  };

  if (!study.imageUrl) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="text-center">
          <p className="text-gray-500 dark:text-gray-400">
            This study is not properly configured. Please contact the researcher.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white text-center">
          {task?.question || "Where would you click?"}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-1">
          Click on the image where you would perform this action
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
        <div
          ref={containerRef}
          onClick={handleClick}
          className={`relative cursor-crosshair border-2 border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden shadow-lg max-w-full ${
            clicked ? "pointer-events-none" : ""
          }`}
        >
          <img
            src={study.imageUrl}
            alt="Test image"
            className="max-w-full h-auto block"
            draggable={false}
          />
          {clicked && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
                <div className="text-4xl mb-2">✓</div>
                <p className="text-gray-900 dark:text-white font-medium">
                  Response recorded!
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

