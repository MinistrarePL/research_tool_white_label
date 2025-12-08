"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Button, Tabs, TabItem, Badge, Spinner, TextInput, Label, Textarea } from "flowbite-react";
import { HiArrowLeft, HiPlay, HiStop, HiLink } from "react-icons/hi";
import Link from "next/link";
import CardSortingEditor from "@/components/card-sorting/CardSortingEditor";
import TreeTestingEditor from "@/components/tree-testing/TreeTestingEditor";
import FirstClickEditor from "@/components/first-click/FirstClickEditor";
import StudyResults from "@/components/StudyResults";

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
  participants: any[];
};

export default function StudyEditorPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [study, setStudy] = useState<Study | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<number>(0);

  useEffect(() => {
    fetchStudy();
    const tab = searchParams.get("tab");
    if (tab === "content") {
      setActiveTab(1); // Content is the second tab (index 1)
    }
  }, [params.id, searchParams]);

  const fetchStudy = async () => {
    const res = await fetch(`/api/studies/${params.id}`);
    if (res.ok) {
      const data = await res.json();
      setStudy(data);
    }
    setLoading(false);
  };

  const updateStudy = async (data: Partial<Study>) => {
    const res = await fetch(`/api/studies/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      fetchStudy();
    }
  };

  const toggleStatus = async () => {
    const newStatus = study?.status === "ACTIVE" ? "CLOSED" : "ACTIVE";
    await updateStudy({ status: newStatus });
  };

  const copyLink = () => {
    const url = `${window.location.origin}/study/${params.id}`;
    navigator.clipboard.writeText(url);
    alert("Link copied!");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="xl" />
      </div>
    );
  }

  if (!study) {
    return <div>Study not found</div>;
  }

  const statusColors = {
    DRAFT: "gray",
    ACTIVE: "success",
    CLOSED: "failure",
  } as const;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button as={Link} href="/admin" color="light" size="sm">
          <HiArrowLeft className="mr-1 h-4 w-4" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {study.title}
          </h1>
        </div>
        <Badge color={statusColors[study.status]} size="lg">
          {study.status}
        </Badge>
        <Button color="gray" onClick={copyLink}>
          <HiLink className="mr-1 h-4 w-4" />
          Copy Link
        </Button>
        <Button
          color={study.status === "ACTIVE" ? "failure" : "blue"}
          onClick={toggleStatus}
        >
          {study.status === "ACTIVE" ? (
            <>
              <HiStop className="mr-1 h-4 w-4" />
              Close Study
            </>
          ) : (
            <>
              <HiPlay className="mr-1 h-4 w-4" />
              Activate
            </>
          )}
        </Button>
      </div>

      <Tabs aria-label="Study tabs" variant="underline" onActiveTabChange={setActiveTab}>
        <TabItem active={activeTab === 0} title="Settings">
          <div className="max-w-2xl space-y-4 mt-4">
            <div>
              <Label htmlFor="title" className="mb-2 block">Title</Label>
              <TextInput
                id="title"
                value={study.title}
                onChange={(e) => updateStudy({ title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="description" className="mb-2 block">Description</Label>
              <Textarea
                id="description"
                value={study.description || ""}
                onChange={(e) => updateStudy({ description: e.target.value })}
                rows={3}
              />
            </div>
          </div>
        </TabItem>

        <TabItem active={activeTab === 1} title="Content">
          <div className="mt-4">
            {study.type === "CARD_SORTING" && (
              <CardSortingEditor study={study} onUpdate={fetchStudy} />
            )}
            {study.type === "TREE_TESTING" && (
              <TreeTestingEditor study={study} onUpdate={fetchStudy} />
            )}
            {study.type === "FIRST_CLICK" && (
              <FirstClickEditor study={study} onUpdate={fetchStudy} />
            )}
          </div>
        </TabItem>

        <TabItem active={activeTab === 2} title={`Results (${study.participants.length})`}>
          <div className="mt-4">
            <StudyResults study={study} />
          </div>
        </TabItem>
      </Tabs>
    </div>
  );
}
