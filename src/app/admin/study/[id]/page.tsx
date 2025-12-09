"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Button, Tabs, TabItem, Badge, Spinner, TextInput, Label, Textarea, Toast, ToastToggle } from "flowbite-react";
import { HiArrowLeft, HiPlay, HiStop, HiLink, HiCheck } from "react-icons/hi";
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
  const [toast, setToast] = useState<{ show: boolean; message: string } | null>(null);

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
    setToast({ show: true, message: "Link copied!" });
    setTimeout(() => setToast(null), 3000);
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

  const completedResponses = study.participants.filter((p: any) => p.completedAt).length;
  const canEditContent = study.status === "DRAFT" || (study.status === "CLOSED" && completedResponses === 0);

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button as={Link} href="/admin" color="gray" outline size="sm">
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
        <Button color="gray" outline onClick={copyLink}>
          <HiLink className="mr-1 h-4 w-4" />
          Copy Link
        </Button>
        <Button
          color={study.status === "ACTIVE" ? "light" : "blue"}
          className={study.status === "ACTIVE" ? "border-red-500 text-red-500 hover:bg-red-50 dark:border-red-400 dark:text-red-400 dark:hover:bg-red-900/20" : ""}
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
          <div>
            {!canEditContent && (
              <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Content editing is locked.</strong> This study has {completedResponses} response{completedResponses !== 1 ? "s" : ""}. 
                  To maintain data integrity, you cannot modify the content after receiving responses.
                </p>
              </div>
            )}
            {study.type === "CARD_SORTING" && (
              <CardSortingEditor study={study} onUpdate={fetchStudy} isLocked={!canEditContent} />
            )}
            {study.type === "TREE_TESTING" && (
              <TreeTestingEditor study={study} onUpdate={fetchStudy} isLocked={!canEditContent} />
            )}
            {study.type === "FIRST_CLICK" && (
              <div className="mt-4">
                <FirstClickEditor study={study} onUpdate={fetchStudy} isLocked={!canEditContent} />
              </div>
            )}
          </div>
        </TabItem>

        <TabItem active={activeTab === 2} title={`Results (${study.participants.filter((p: any) => p.completedAt).length})`}>
          <div className="mt-4">
            <StudyResults study={study} />
          </div>
        </TabItem>
      </Tabs>

      {/* Toast notification */}
      {toast?.show && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50">
          <Toast className="shadow-lg border border-green-200 dark:border-green-700">
            <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-500 dark:bg-green-800 dark:text-green-200">
              <HiCheck className="h-5 w-5" />
            </div>
            <div className="ml-3 text-sm font-medium">{toast.message}</div>
            <ToastToggle onDismiss={() => setToast(null)} />
          </Toast>
        </div>
      )}
    </div>
  );
}
