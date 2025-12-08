"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Spinner, Card, Button } from "flowbite-react";
import CardSortingStudy from "@/components/card-sorting/CardSortingStudy";
import TreeTestingStudy from "@/components/tree-testing/TreeTestingStudy";
import FirstClickStudy from "@/components/first-click/FirstClickStudy";

type Study = {
  id: string;
  title: string;
  description: string | null;
  type: "CARD_SORTING" | "TREE_TESTING" | "FIRST_CLICK";
  status: "DRAFT" | "ACTIVE" | "CLOSED";
  sortingType?: string | null;
  imageUrl: string | null;
  cards: any[];
  categories: any[];
  treeNodes: any[];
  tasks: any[];
};

export default function StudyPage() {
  const params = useParams();
  const [study, setStudy] = useState<Study | null>(null);
  const [loading, setLoading] = useState(true);
  const [participantId, setParticipantId] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    fetchStudy();
  }, [params.id]);

  const fetchStudy = async () => {
    const res = await fetch(`/api/studies/${params.id}`);
    if (res.ok) {
      const data = await res.json();
      setStudy(data);
    }
    setLoading(false);
  };

  const startStudy = async () => {
    const res = await fetch(`/api/studies/${params.id}/participants`, {
      method: "POST",
    });
    if (res.ok) {
      const data = await res.json();
      setParticipantId(data.id);
      setStarted(true);
    }
  };

  const handleComplete = () => {
    setCompleted(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Spinner size="xl" />
      </div>
    );
  }

  if (!study) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="max-w-md text-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Study not found
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            This study may have been deleted or the link is incorrect.
          </p>
        </Card>
      </div>
    );
  }

  if (study.status === "CLOSED") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="max-w-md text-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Study Paused
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            This study has been paused and is not currently accepting participants.
          </p>
        </Card>
      </div>
    );
  }

  if (study.status !== "ACTIVE") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="max-w-md text-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Study not available
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            This study is currently not accepting participants.
          </p>
        </Card>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="max-w-md text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Thank you!
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Your response has been recorded. You can close this window.
          </p>
        </Card>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="max-w-lg text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {study.title}
          </h1>
          {study.description && (
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {study.description}
            </p>
          )}
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            {study.type === "CARD_SORTING" && (
              <p>You will be asked to sort cards into categories.</p>
            )}
            {study.type === "TREE_TESTING" && (
              <p>You will be asked to find items in a navigation tree.</p>
            )}
            {study.type === "FIRST_CLICK" && (
              <p>You will be shown an image and asked where you would click.</p>
            )}
          </div>
          <Button onClick={startStudy} size="lg" color="blue">
            Start Study
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {study.type === "CARD_SORTING" && (
        <CardSortingStudy
          study={study}
          participantId={participantId!}
          onComplete={handleComplete}
        />
      )}
      {study.type === "TREE_TESTING" && (
        <TreeTestingStudy
          study={study}
          participantId={participantId!}
          onComplete={handleComplete}
        />
      )}
      {study.type === "FIRST_CLICK" && (
        <FirstClickStudy
          study={study}
          participantId={participantId!}
          onComplete={handleComplete}
        />
      )}
    </div>
  );
}

