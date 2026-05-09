import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface DocumentType {
  id: number;
  name: string;
  createdAt: string;
  created_at: string;
}

async function fetchDocumentTypes(): Promise<DocumentType[]> {
  const res = await fetch(`${BASE}/api/document-types`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch document types");
  return res.json();
}

async function createDocumentType(name: string): Promise<DocumentType> {
  const res = await fetch(`${BASE}/api/document-types`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Failed" }));
    throw new Error(err.error || "Failed to create document type");
  }
  return res.json();
}

async function deleteDocumentType(name: string): Promise<void> {
  const res = await fetch(`${BASE}/api/document-types/${encodeURIComponent(name)}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Failed" }));
    throw Object.assign(new Error(err.error || "Failed to delete"), { code: err.code });
  }
}

export function useDocumentTypes() {
  return useQuery({ queryKey: ["document-types"], queryFn: fetchDocumentTypes });
}

export function useCreateDocumentType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDocumentType,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["document-types"] }),
  });
}

export function useDeleteDocumentType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteDocumentType,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["document-types"] }),
  });
}
