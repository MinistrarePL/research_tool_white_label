"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Badge, Modal, ModalHeader, ModalBody, Label, TextInput, Select, Textarea, Spinner, Toast, ToastToggle } from "flowbite-react";
import Link from "next/link";
import { HiPlus, HiPencil, HiTrash, HiClipboard, HiCheck, HiExclamation } from "react-icons/hi";

type Study = {
  id: string;
  title: string;
  description: string | null;
  type: "CARD_SORTING" | "TREE_TESTING" | "FIRST_CLICK";
  status: "DRAFT" | "ACTIVE" | "CLOSED";
  createdAt: string;
  _count: {
    participants: number;
  };
};

const studyTypeLabels = {
  CARD_SORTING: "Card Sorting",
  TREE_TESTING: "Tree Testing",
  FIRST_CLICK: "First Click",
};

const studyTypeColors = {
  CARD_SORTING: "purple",
  TREE_TESTING: "blue",
  FIRST_CLICK: "green",
} as const;

const statusColors = {
  DRAFT: "gray",
  ACTIVE: "success",
  CLOSED: "failure",
} as const;

export default function AdminDashboard() {
  const router = useRouter();
  const [studies, setStudies] = useState<Study[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "CARD_SORTING" as Study["type"],
  });
  const [creating, setCreating] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; studyId: string | null }>({ show: false, studyId: null });
  const [toast, setToast] = useState<{ show: boolean; message: string } | null>(null);

  useEffect(() => {
    fetchStudies();
  }, []);

  const fetchStudies = async () => {
    const res = await fetch("/api/studies");
    const data = await res.json();
    setStudies(data);
    setLoading(false);
  };

  const createStudy = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    const res = await fetch("/api/studies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    if (res.ok) {
      const newStudy = await res.json();
      setShowModal(false);
      setFormData({ title: "", description: "", type: "CARD_SORTING" });
      // Redirect to study editor with Content tab active
      router.push(`/admin/study/${newStudy.id}?tab=content`);
    }
    setCreating(false);
  };

  const confirmDelete = (id: string) => {
    setDeleteModal({ show: true, studyId: id });
  };

  const deleteStudy = async () => {
    if (!deleteModal.studyId) return;
    await fetch(`/api/studies/${deleteModal.studyId}`, { method: "DELETE" });
    setDeleteModal({ show: false, studyId: null });
    fetchStudies();
  };

  const copyLink = (id: string) => {
    const url = `${window.location.origin}/study/${id}`;
    navigator.clipboard.writeText(url);
    setToast({ show: true, message: "Link copied to clipboard!" });
    setTimeout(() => setToast(null), 3000);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="xl" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Your Studies
        </h1>
        <Button onClick={() => setShowModal(true)} color="blue">
          <HiPlus className="mr-2 h-5 w-5" />
          New Study
        </Button>
      </div>

      {studies.length === 0 ? (
        <Card className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No studies yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Create your first study to start collecting user insights.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {studies.map((study) => (
            <Card key={study.id} className="flex flex-col h-full">
              <div className="flex justify-between items-start mb-2">
                <Badge color={studyTypeColors[study.type]}>
                  {studyTypeLabels[study.type]}
                </Badge>
                <Badge color={statusColors[study.status]}>{study.status}</Badge>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {study.title}
              </h3>
              <div className="min-h-[2.5rem] flex items-start">
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                  {study.description || ""}
                </p>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                {study._count.participants} {study._count.participants === 1 ? "response" : "responses"}
              </p>
              <div className="flex gap-2 mt-4 mt-auto">
                <Button
                  as={Link}
                  href={`/admin/study/${study.id}`}
                  size="sm"
                  color="gray"
                >
                  <HiPencil className="mr-1 h-4 w-4" />
                  Edit
                </Button>
                <Button
                  size="sm"
                  color="gray"
                  outline
                  onClick={() => copyLink(study.id)}
                >
                  <HiClipboard className="mr-1 h-4 w-4" />
                  Copy Link
                </Button>
                <Button
                  size="sm"
                  color="failure"
                  onClick={() => confirmDelete(study.id)}
                >
                  <HiTrash className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal show={showModal} onClose={() => setShowModal(false)}>
        <ModalHeader>Create New Study</ModalHeader>
        <ModalBody>
          <form onSubmit={createStudy} className="flex flex-col gap-4">
            <div>
              <Label htmlFor="title" className="mb-2 block">Title</Label>
              <TextInput
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="description" className="mb-2 block">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="type" className="mb-2 block">Study Type</Label>
              <Select
                id="type"
                value={formData.type}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    type: e.target.value as Study["type"],
                  })
                }
              >
                <option value="CARD_SORTING">Card Sorting</option>
                <option value="TREE_TESTING">Tree Testing</option>
                <option value="FIRST_CLICK">First Click Testing</option>
              </Select>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button color="gray" onClick={() => setShowModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={creating} color="blue">
                {creating ? "Creating..." : "Create Study"}
              </Button>
            </div>
          </form>
        </ModalBody>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal show={deleteModal.show} size="md" onClose={() => setDeleteModal({ show: false, studyId: null })} popup>
        <ModalHeader />
        <ModalBody>
          <div className="text-center">
            <HiExclamation className="mx-auto mb-4 h-14 w-14 text-gray-400 dark:text-gray-200" />
            <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
              Are you sure you want to delete this study?
            </h3>
            <div className="flex justify-center gap-4">
              <Button color="failure" onClick={deleteStudy}>
                Yes, delete
              </Button>
              <Button color="gray" onClick={() => setDeleteModal({ show: false, studyId: null })}>
                Cancel
              </Button>
            </div>
          </div>
        </ModalBody>
      </Modal>

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
