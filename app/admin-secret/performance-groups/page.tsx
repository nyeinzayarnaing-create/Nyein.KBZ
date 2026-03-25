"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import type { PerformanceGroup } from "@/types";

type FormData = {
    name: string;
    photo_url: string;
};

const emptyForm: FormData = {
    name: "",
    photo_url: "",
};

export default function PerformanceGroupsPage() {
    const [groups, setGroups] = useState<PerformanceGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<FormData>(emptyForm);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    // File upload states
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

    function handleImgError(id: string) {
        setImgErrors((prev) => ({ ...prev, [id]: true }));
    }

    const fetchGroups = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/performance-groups");
            const data = await res.json();
            setGroups(data.groups ?? []);
        } catch {
            console.error("Failed to fetch performance groups");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchGroups();
    }, [fetchGroups]);

    // Clean up preview URL when component unmounts or file changes
    useEffect(() => {
        return () => {
            if (previewUrl && previewUrl.startsWith("blob:")) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    function handleFileSelect(file: File) {
        const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
        if (!allowedTypes.includes(file.type)) {
            alert("Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed.");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            alert("File too large. Maximum size is 5MB.");
            return;
        }

        setSelectedFile(file);
        if (previewUrl && previewUrl.startsWith("blob:")) {
            URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(URL.createObjectURL(file));
    }

    function handleDrop(e: React.DragEvent) {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFileSelect(file);
    }

    function handleDragOver(e: React.DragEvent) {
        e.preventDefault();
        setDragOver(true);
    }

    function handleDragLeave(e: React.DragEvent) {
        e.preventDefault();
        setDragOver(false);
    }

    function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (file) handleFileSelect(file);
    }

    function removeSelectedFile() {
        setSelectedFile(null);
        if (previewUrl && previewUrl.startsWith("blob:")) {
            URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }

    async function uploadFile(): Promise<string | null> {
        if (!selectedFile) return null;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("file", selectedFile);

            const res = await fetch("/api/admin/upload", {
                method: "POST",
                body: formData,
            });

            const data = await res.json();
            if (!res.ok) {
                alert(`Upload failed: ${data.error}`);
                return null;
            }

            return data.url;
        } catch {
            alert("Upload failed. Please try again.");
            return null;
        } finally {
            setUploading(false);
        }
    }

    function openCreate() {
        setEditingId(null);
        setForm(emptyForm);
        setSelectedFile(null);
        setPreviewUrl(null);
        setShowForm(true);
    }

    function openEdit(group: PerformanceGroup) {
        setEditingId(group.id);
        setForm({
            name: group.name,
            photo_url: group.photo_url || "",
        });
        setSelectedFile(null);
        setPreviewUrl(group.photo_url || null);
        setShowForm(true);
    }

    function closeForm() {
        setShowForm(false);
        setEditingId(null);
        setForm(emptyForm);
        setSelectedFile(null);
        if (previewUrl && previewUrl.startsWith("blob:")) {
            URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(null);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!form.name.trim()) return;

        setSaving(true);
        try {
            let photoUrl = form.photo_url;

            if (selectedFile) {
                const uploadedUrl = await uploadFile();
                if (uploadedUrl) {
                    photoUrl = uploadedUrl;
                } else {
                    setSaving(false);
                    return;
                }
            }

            const payload = { ...form, photo_url: photoUrl };

            const res = await fetch(editingId ? "/api/admin/performance-groups" : "/api/admin/performance-groups", {
                method: editingId ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload),
            });

            const data = await res.json();
            if (!res.ok) {
                alert(`Failed to save group: ${data.error || "Unknown error"}`);
                return;
            }

            closeForm();
            await fetchGroups();
        } catch (err: unknown) {
            console.error("Save error:", err);
            alert("An unexpected error occurred while saving.");
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(id: string) {
        try {
            const res = await fetch(`/api/admin/performance-groups?id=${id}`, { method: "DELETE" });
            const data = await res.json();

            if (!res.ok) {
                alert(`Failed to delete group: ${data.error || "Unknown error"}`);
                return;
            }

            setDeleteConfirmId(null);
            await fetchGroups();
        } catch (err: unknown) {
            console.error("Delete error:", err);
            alert("An unexpected error occurred while deleting.");
        }
    }

    // Convert any Google Drive share/view/open URL to a directly embeddable thumbnail URL
    function getDirectGoogleDriveLink(url: string) {
        if (!url) return url;
        let id: string | null = null;
        const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
        if (fileMatch) id = fileMatch[1];
        if (!id) {
            const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
            if (idMatch) id = idMatch[1];
        }
        if (!id) {
            const lhMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
            if (lhMatch) id = lhMatch[1];
        }
        if (id) {
            return `https://lh3.googleusercontent.com/d/${id}`;
        }
        return url;
    }

    const filtered = groups.filter((g) => {
        return g.name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const displayPreview = previewUrl || form.photo_url;

    return (
        <main className="min-h-screen bg-[#faf9f7] flex flex-col">
            {/* Header */}
            <header className="sticky top-0 z-30 bg-[#faf9f7]/90 backdrop-blur-md border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/admin-secret"
                            className="flex items-center gap-2 text-gray-400 hover:text-[#6c5ce7] transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            <span className="hidden sm:inline">Back</span>
                        </Link>
                        <h1 className="font-display text-2xl sm:text-3xl font-extrabold gradient-text">
                            🎭 Performance Groups
                        </h1>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={openCreate}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] text-white font-bold text-sm transition-all duration-300 hover:shadow-lg hover:shadow-purple-300/40 hover:scale-105 active:scale-95"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add Group
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full">
                {/* Stats & Search */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6 items-center">
                    <div className="bg-white rounded-2xl px-6 py-3.5 border border-gray-100 flex items-center gap-4 card-shadow shrink-0">
                        <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center">
                            <span className="text-2xl">🎭</span>
                        </div>
                        <div>
                            <p className="text-sm text-gray-400 font-medium">Total Groups</p>
                            <p className="text-2xl font-extrabold gradient-text leading-none">{groups.length}</p>
                        </div>
                    </div>

                    <div className="relative flex-1 w-full">
                        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search groups by name..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-gray-200 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-300 transition-all card-shadow"
                        />
                    </div>
                </div>

                {/* Grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-24">
                        <div className="flex flex-col items-center gap-3">
                            <span className="text-4xl animate-float">🎭</span>
                            <p className="text-gray-400 text-sm font-medium animate-pulse">Loading groups...</p>
                        </div>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <div className="w-20 h-20 rounded-full bg-purple-50 flex items-center justify-center">
                            <span className="text-4xl">🎭</span>
                        </div>
                        <p className="text-gray-400 text-lg font-medium">No groups found</p>
                        <button onClick={openCreate} className="text-[#6c5ce7] hover:text-[#5a4bd1] font-semibold transition-colors">
                            + Add your first group
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filtered.map((group, index) => (
                            <div
                                key={group.id}
                                className="group relative bg-white rounded-3xl border border-gray-100 overflow-hidden hover:border-purple-200 transition-all duration-300 hover:shadow-xl hover:shadow-purple-100/50 card-shadow flex flex-col"
                                style={{ animation: `bounceIn 0.5s ease-out ${index * 0.05}s both` }}
                            >
                                <div className="aspect-[16/9] bg-gray-50 relative overflow-hidden shrink-0">
                                    {group.photo_url && !imgErrors[group.id] ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={getDirectGoogleDriveLink(group.photo_url)}
                                            alt={group.name}
                                            onError={() => handleImgError(group.id)}
                                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
                                            <span className="text-6xl opacity-40">🎭</span>
                                        </div>
                                    )}

                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                    <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                                        <button
                                            onClick={() => openEdit(group)}
                                            className="w-9 h-9 rounded-xl bg-white/90 backdrop-blur-md flex items-center justify-center text-[#6c5ce7] hover:bg-[#6c5ce7] hover:text-white transition-all shadow-sm"
                                            title="Edit"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => setDeleteConfirmId(group.id)}
                                            className="w-9 h-9 rounded-xl bg-white/90 backdrop-blur-md flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                            title="Delete"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                <div className="p-5 flex-1 flex flex-col justify-center">
                                    <h3 className="font-display font-bold text-xl text-gray-800 text-center line-clamp-2">
                                        {group.name}
                                    </h3>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={closeForm}>
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
                    <div
                        className="relative w-full max-w-md bg-white border border-gray-100 rounded-3xl shadow-2xl overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                        style={{ animation: "bounceIn 0.4s ease-out" }}
                    >
                        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
                            <h2 className="font-display text-xl font-bold gradient-text">
                                {editingId ? "✏️ Edit Group" : "➕ Add New Group"}
                            </h2>
                            <button onClick={closeForm} className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-gray-400 hover:text-gray-800 hover:shadow-sm border border-gray-200 transition-all">
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">🎭 Group Image</label>
                                {displayPreview ? (
                                    <div className="relative group/preview rounded-2xl overflow-hidden border border-gray-200">
                                        <div className="w-full aspect-[16/9] bg-gray-50">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={displayPreview} alt="Preview" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
                                            <button type="button" onClick={() => fileInputRef.current?.click()} className="px-5 py-2.5 rounded-xl bg-white text-gray-800 font-semibold text-sm hover:scale-105 transition-all shadow-xl">
                                                📷 Change
                                            </button>
                                            <button type="button" onClick={() => { removeSelectedFile(); setForm((f) => ({ ...f, photo_url: "" })); }} className="px-5 py-2.5 rounded-xl bg-red-500 text-white font-semibold text-sm hover:scale-105 transition-all shadow-xl">
                                                🗑️ Remove
                                            </button>
                                        </div>
                                        {selectedFile && (
                                            <div className="absolute bottom-3 left-3 right-3">
                                                <div className="bg-white/95 backdrop-blur-md rounded-xl px-4 py-2 text-xs text-gray-700 flex items-center gap-2 shadow-sm font-medium">
                                                    <span className="text-green-500 text-base">✓</span>
                                                    <span className="truncate flex-1">{selectedFile.name}</span>
                                                    <span className="shrink-0 text-gray-400">({(selectedFile.size / 1024).toFixed(0)} KB)</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div
                                        onDrop={handleDrop}
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onClick={() => fileInputRef.current?.click()}
                                        className={`w-full aspect-[16/9] rounded-2xl border-2 border-dashed cursor-pointer transition-all flex flex-col items-center justify-center gap-4 ${dragOver ? "border-[#6c5ce7] bg-purple-50/50 scale-[1.02]" : "border-gray-200 bg-gray-50/50 hover:border-purple-300 hover:bg-purple-50/30"}`}
                                    >
                                        <div className={`w-16 h-16 rounded-3xl flex items-center justify-center transition-all shadow-sm ${dragOver ? "bg-purple-100 scale-110" : "bg-white border border-gray-100"}`}>
                                            <span className="text-2xl">📷</span>
                                        </div>
                                        <div className="text-center px-4">
                                            <p className="text-sm text-gray-600 font-medium leading-relaxed">
                                                {dragOver ? "Drop image here" : <><span className="text-[#6c5ce7] font-bold">Click to upload</span> or drag and drop</>}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1 font-medium">16:9 Recommended • Max 5MB</p>
                                        </div>
                                    </div>
                                )}
                                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleFileInputChange} className="hidden" />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">Group Name <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    required
                                    value={form.name}
                                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                    className="w-full px-5 py-3.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:bg-white transition-all font-medium"
                                    placeholder="e.g. The Superstars"
                                />
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button type="button" onClick={closeForm} className="flex-1 py-3.5 px-4 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving || uploading} className="flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] text-white font-bold shadow-lg shadow-purple-200 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                    {saving || uploading ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Saving...
                                        </div>
                                    ) : (
                                        "Save Group"
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirmId && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setDeleteConfirmId(null)} />
                    <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 text-center shadow-2xl" style={{ animation: 'bounceIn 0.3s ease-out' }}>
                        <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mx-auto mb-4 border-8 border-white shadow-sm">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2 font-display">Delete Group?</h3>
                        <p className="text-gray-500 mb-8 text-sm leading-relaxed">
                            This action cannot be undone. All votes for this group will be permanently deleted.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteConfirmId(null)} className="flex-1 py-3 px-4 rounded-xl font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors">
                                Cancel
                            </button>
                            <button onClick={() => handleDelete(deleteConfirmId)} className="flex-1 py-3 px-4 rounded-xl font-semibold text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-200 transition-all hover:scale-[1.02] active:scale-[0.98]">
                                Yes, Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
