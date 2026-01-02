"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Card } from "flowbite-react";

type Study = {
  id: string;
  imageUrl: string | null;
  tasks: { id: string; question: string; imageUrl?: string | null; displayTimeSeconds?: number }[];
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
  const isAdvancingRef = useRef(false);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [clicked, setClicked] = useState(false);
  const [results, setResults] = useState<Array<{ x: number; y: number; timeToClickMs: number; taskId: string }>>([]);
  const [timeRemaining, setTimeRemaining] = useState<number>(5);

  const task = study.tasks[currentTaskIndex];
  const imageUrl = task?.imageUrl || study.imageUrl;
  const isLastTask = currentTaskIndex >= study.tasks.length - 1;
  const displayTimeSeconds = task?.displayTimeSeconds ?? 5;

  const submitAllResults = useCallback(async (allResults: Array<{ x: number; y: number; timeToClickMs: number; taskId: string }>) => {
    await fetch(`/api/studies/${study.id}/participants`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        participantId,
        type: "FIRST_CLICK",
        results: allResults,
      }),
    });

    onComplete();
  }, [study.id, participantId, onComplete]);

  const handleAutoAdvance = useCallback(async () => {
    // Prevent double-calls using ref
    if (isAdvancingRef.current || clicked || !task || !containerRef.current) return;
    isAdvancingRef.current = true;

    // Record result with time equal to display time (user didn't click)
    const x = 50; // Center point as default
    const y = 50;
    const timeToClick = displayTimeSeconds * 1000; // Convert to milliseconds

    setClicked(true);

    const newResult = { x, y, timeToClickMs: timeToClick, taskId: task.id };
    const updatedResults = [...results, newResult];
    setResults(updatedResults);

    setTimeout(() => {
      isAdvancingRef.current = false;
      if (currentTaskIndex >= study.tasks.length - 1) {
        submitAllResults(updatedResults);
      } else {
        setCurrentTaskIndex((prev) => prev + 1);
        setClicked(false);
        setStartTime(Date.now());
      }
    }, 1000);
  }, [clicked, task, displayTimeSeconds, currentTaskIndex, study.tasks.length, submitAllResults, results]);

  // Timer effect - countdown only
  useEffect(() => {
    if (clicked || !task) return;

    setTimeRemaining(displayTimeSeconds);
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentTaskIndex, clicked, task, displayTimeSeconds]);

  // Separate effect to handle auto-advance when timer reaches 0
  useEffect(() => {
    if (timeRemaining === 0 && !clicked && task) {
      handleAutoAdvance();
    }
  }, [timeRemaining, clicked, task, handleAutoAdvance]);

  const handleClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    // Prevent double-calls using ref
    if (isAdvancingRef.current || clicked || !containerRef.current || !task) return;
    isAdvancingRef.current = true;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const timeToClick = Date.now() - startTime;

    setClicked(true);

    // Add result to local array
    const newResult = { x, y, timeToClickMs: timeToClick, taskId: task.id };
    const updatedResults = [...results, newResult];
    setResults(updatedResults);

    setTimeout(() => {
      isAdvancingRef.current = false;
      if (currentTaskIndex >= study.tasks.length - 1) {
        // Submit all results and complete
        submitAllResults(updatedResults);
      } else {
        // Move to next task
        setCurrentTaskIndex((prev) => prev + 1);
        setClicked(false);
        setStartTime(Date.now());
        setTimeRemaining(displayTimeSeconds);
      }
    }, 1000);
  };


  // If there are no tasks at all, show error
  if (study.tasks.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="text-center">
          <p className="text-gray-500 dark:text-gray-400">
            This study is not properly configured. Please contact the researcher.
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            Missing: tasks
          </p>
        </Card>
      </div>
    );
  }

  // If we've somehow gone past all tasks, show completion
  if (!task || currentTaskIndex >= study.tasks.length) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Thank you!
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Your response has been recorded.
          </p>
        </Card>
      </div>
    );
  }

  // If current task has no image, skip to next or complete
  if (!imageUrl) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="text-center">
          <p className="text-gray-500 dark:text-gray-400">
            This task is not properly configured (missing image).
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex justify-between items-center mb-2">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Task {currentTaskIndex + 1} of {study.tasks.length}
          </div>
          <div className="flex items-center gap-4">
            {!clicked && (
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {timeRemaining}s
              </div>
            )}
            <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${((currentTaskIndex + 1) / study.tasks.length) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white text-center">
          {task?.question || "Where would you click?"}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-1">
          Click on the image where you would perform this action
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
        <div
          ref={containerRef}
          onClick={handleClick}
          className={`relative cursor-crosshair border-2 border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden shadow-lg max-w-full max-h-full ${
            clicked ? "pointer-events-none" : ""
          }`}
        >
          <img
            src={imageUrl}
            alt="Test image"
            className="max-w-full max-h-[calc(100vh-180px)] object-contain block"
            draggable={false}
          />
          {clicked && (
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center">
                <div className="text-4xl mb-2">✓</div>
                <p className="text-gray-900 dark:text-white font-medium">
                  {isLastTask ? "Study completed!" : "Moving to next task..."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

