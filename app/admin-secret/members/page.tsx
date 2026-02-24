"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Candidate } from "@/types";

type FormData = {
    name: string;
    photo_url: string;
    gender: "king" | "queen";
    group_name: string;
};

const emptyForm: FormData = {
    name: "",
    photo_url: "",
    gender: "king",
    group_name: "",
};

export default function MembersPage() {
    const [candidates, setCandidates] = useState<Candidate[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<FormData>(emptyForm);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [filterCategory, setFilterCategory] = useState<
        "all" | "king" | "queen"
    >("all");
    const [searchQuery, setSearchQuery] = useState("");

    // File upload states
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchCandidates = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/admin/candidates");
            const data = await res.json();
            setCandidates(data.candidates ?? []);
        } catch {
            console.error("Failed to fetch candidates");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCandidates();
    }, [fetchCandidates]);

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

    function openEdit(candidate: Candidate) {
        setEditingId(candidate.id);
        setForm({
            name: candidate.name,
            photo_url: candidate.photo_url || "",
            gender: candidate.gender,
            group_name: candidate.group_name || "",
        });
        setSelectedFile(null);
        setPreviewUrl(candidate.photo_url || null);
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

            if (editingId) {
                await fetch("/api/admin/candidates", {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: editingId, ...payload }),
                });
            } else {
                await fetch("/api/admin/candidates", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                });
            }
            closeForm();
            await fetchCandidates();
        } catch {
            alert("Failed to save member");
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(id: string) {
        try {
            await fetch(`/api/admin/candidates?id=${id}`, { method: "DELETE" });
            setDeleteConfirmId(null);
            await fetchCandidates();
        } catch {
            alert("Failed to delete member");
        }
    }

    const filtered = candidates.filter((c) => {
        const matchCategory =
            filterCategory === "all" || c.gender === filterCategory;
        const matchSearch =
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (c.group_name || "").toLowerCase().includes(searchQuery.toLowerCase());
        return matchCategory && matchSearch;
    });

    const kingCount = candidates.filter((c) => c.gender === "king").length;
    const queenCount = candidates.filter((c) => c.gender === "queen").length;

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
                            <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 19l-7-7 7-7"
                                />
                            </svg>
                            <span className="hidden sm:inline">Back</span>
                        </Link>
                        <h1 className="font-display text-2xl sm:text-3xl font-extrabold gradient-text">
                            👥 Members
                        </h1>
                    </div>
                    <button
                        onClick={openCreate}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] text-white font-bold text-sm transition-all duration-300 hover:shadow-lg hover:shadow-purple-300/40 hover:scale-105 active:scale-95"
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 4v16m8-8H4"
                            />
                        </svg>
                        Add Member
                    </button>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full">
                {/* Stats Cards */}
                <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
                    <div className="bg-white rounded-2xl p-4 border border-gray-100 text-center card-shadow">
                        <p className="text-3xl font-extrabold gradient-text">
                            {candidates.length}
                        </p>
                        <p className="text-xs text-gray-400 mt-1 font-medium">Total Members</p>
                    </div>
                    <div className="bg-white rounded-2xl p-4 border border-blue-100 text-center card-shadow">
                        <p className="text-3xl font-extrabold text-blue-500">{kingCount}</p>
                        <p className="text-xs text-gray-400 mt-1 font-medium">👑 Kings</p>
                    </div>
                    <div className="bg-white rounded-2xl p-4 border border-pink-100 text-center card-shadow">
                        <p className="text-3xl font-extrabold text-pink-500">{queenCount}</p>
                        <p className="text-xs text-gray-400 mt-1 font-medium">👸 Queens</p>
                    </div>
                </div>

                {/* Filters & Search */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <div className="relative flex-1">
                        <svg
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                            />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search by name or group..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-white border border-gray-200 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-300 transition-all card-shadow"
                        />
                    </div>
                    <div className="flex gap-2">
                        {(["all", "king", "queen"] as const).map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setFilterCategory(cat)}
                                className={`px-4 py-2.5 rounded-2xl font-semibold text-sm transition-all duration-300 ${filterCategory === cat
                                    ? "bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] text-white shadow-lg shadow-purple-200"
                                    : "bg-white text-gray-500 border border-gray-200 hover:border-purple-200 hover:text-[#6c5ce7] card-shadow"
                                    }`}
                            >
                                {cat === "all"
                                    ? "All"
                                    : cat === "king"
                                        ? "👑 Kings"
                                        : "👸 Queens"}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Members Grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-24">
                        <div className="flex flex-col items-center gap-3">
                            <span className="text-4xl animate-float">👑</span>
                            <p className="text-gray-400 text-sm font-medium animate-pulse">Loading members...</p>
                        </div>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <div className="w-20 h-20 rounded-full bg-purple-50 flex items-center justify-center">
                            <span className="text-4xl">
                                {filterCategory === "king"
                                    ? "👑"
                                    : filterCategory === "queen"
                                        ? "👸"
                                        : "👥"}
                            </span>
                        </div>
                        <p className="text-gray-400 text-lg font-medium">No members found</p>
                        <button
                            onClick={openCreate}
                            className="text-[#6c5ce7] hover:text-[#5a4bd1] font-semibold transition-colors"
                        >
                            + Add your first member
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {filtered.map((candidate, index) => (
                            <div
                                key={candidate.id}
                                className="group relative bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-purple-200 transition-all duration-300 hover:shadow-lg hover:shadow-purple-100/50 card-shadow"
                                style={{
                                    animation: `bounceIn 0.5s ease-out ${index * 0.05}s both`,
                                }}
                            >
                                {/* Image */}
                                <div className="aspect-[4/3] bg-gray-50 relative overflow-hidden">
                                    {candidate.photo_url ? (
                                        <Image
                                            src={candidate.photo_url}
                                            alt={candidate.name}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                            unoptimized
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
                                            <span className="text-6xl opacity-40">
                                                {candidate.gender === "king" ? "👑" : "👸"}
                                            </span>
                                        </div>
                                    )}

                                    {/* Category Badge */}
                                    <div className="absolute top-3 left-3">
                                        <span
                                            className={`px-2.5 py-1 rounded-full text-xs font-bold backdrop-blur-sm bg-white/80 ${candidate.gender === "king"
                                                ? "text-blue-600"
                                                : "text-pink-600"
                                                }`}
                                        >
                                            {candidate.gender === "king" ? "👑 King" : "👸 Queen"}
                                        </span>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="absolute top-3 right-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        <button
                                            onClick={() => openEdit(candidate)}
                                            className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-[#6c5ce7] hover:bg-[#6c5ce7] hover:text-white transition-all shadow-sm"
                                            title="Edit"
                                        >
                                            <svg
                                                className="w-4 h-4"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                                />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => setDeleteConfirmId(candidate.id)}
                                            className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-red-400 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                            title="Delete"
                                        >
                                            <svg
                                                className="w-4 h-4"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                                />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="p-4">
                                    <h3 className="font-display font-bold text-lg text-gray-800 truncate">
                                        {candidate.name}
                                    </h3>
                                    {candidate.group_name && (
                                        <p className="text-sm text-gray-400 mt-0.5 flex items-center gap-1.5">
                                            <svg
                                                className="w-3.5 h-3.5 text-gray-400"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                                                />
                                            </svg>
                                            {candidate.group_name}
                                        </p>
                                    )}
                                    <div className="mt-3 flex gap-2">
                                        <button
                                            onClick={() => openEdit(candidate)}
                                            className="flex-1 py-2 px-3 rounded-xl bg-gray-50 text-gray-600 hover:bg-purple-50 hover:text-[#6c5ce7] text-sm font-medium transition-all border border-gray-100"
                                        >
                                            ✏️ Edit
                                        </button>
                                        <button
                                            onClick={() => setDeleteConfirmId(candidate.id)}
                                            className="py-2 px-3 rounded-xl bg-gray-50 text-red-400 hover:bg-red-50 hover:text-red-500 text-sm font-medium transition-all border border-gray-100"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <footer className="mt-auto pt-8 pb-6 text-center">
                <p className="text-[#6c5ce7]/50 text-sm font-medium">Supported by UX Team</p>
            </footer>

            {/* Create / Edit Modal */}
            {showForm && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    onClick={closeForm}
                >
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
                    <div
                        className="relative w-full max-w-md bg-white border border-gray-200 rounded-3xl shadow-2xl shadow-purple-200/20 max-h-[90vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                        style={{ animation: "bounceIn 0.4s ease-out" }}
                    >
                        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur-sm rounded-t-3xl z-10">
                            <h2 className="font-display text-xl font-bold gradient-text">
                                {editingId ? "✏️ Edit Member" : "➕ Add New Member"}
                            </h2>
                            <button
                                onClick={closeForm}
                                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-all"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            {/* Image Upload Area */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-2">
                                    📷 Photo
                                </label>
                                {displayPreview ? (
                                    <div className="relative group/preview">
                                        <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-gray-50 border border-gray-200">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={displayPreview}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/preview:opacity-100 transition-opacity rounded-2xl flex items-center justify-center gap-3">
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="px-4 py-2 rounded-xl bg-white text-gray-800 font-medium text-sm hover:bg-gray-100 transition-colors shadow-lg"
                                            >
                                                📷 Change
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    removeSelectedFile();
                                                    setForm((f) => ({ ...f, photo_url: "" }));
                                                }}
                                                className="px-4 py-2 rounded-xl bg-red-500 text-white font-medium text-sm hover:bg-red-600 transition-colors shadow-lg"
                                            >
                                                🗑️ Remove
                                            </button>
                                        </div>
                                        {selectedFile && (
                                            <div className="absolute bottom-2 left-2 right-2">
                                                <div className="bg-white/90 backdrop-blur-sm rounded-xl px-3 py-1.5 text-xs text-gray-600 flex items-center gap-2 shadow-sm">
                                                    <span className="text-green-500">✓</span>
                                                    <span className="truncate">{selectedFile.name}</span>
                                                    <span className="shrink-0 text-gray-400">
                                                        ({(selectedFile.size / 1024).toFixed(0)} KB)
                                                    </span>
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
                                        className={`w-full aspect-[4/3] rounded-2xl border-2 border-dashed cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${dragOver
                                            ? "border-[#6c5ce7] bg-purple-50 scale-[1.02]"
                                            : "border-gray-200 bg-gray-50 hover:border-purple-300 hover:bg-purple-50/50"
                                            }`}
                                    >
                                        <div
                                            className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${dragOver
                                                ? "bg-purple-100"
                                                : "bg-gray-100"
                                                }`}
                                        >
                                            <span className="text-2xl">📷</span>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm text-gray-500 font-medium">
                                                {dragOver ? (
                                                    "Drop your image here"
                                                ) : (
                                                    <>
                                                        <span className="text-[#6c5ce7] font-semibold">
                                                            Click to upload
                                                        </span>{" "}
                                                        or drag and drop
                                                    </>
                                                )}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                JPEG, PNG, WebP, or GIF (max 5MB)
                                            </p>
                                        </div>
                                    </div>
                                )}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,image/gif"
                                    onChange={handleFileInputChange}
                                    className="hidden"
                                />
                            </div>

                            {/* Name */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-1.5">
                                    Name <span className="text-red-400">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={form.name}
                                    onChange={(e) =>
                                        setForm((f) => ({ ...f, name: e.target.value }))
                                    }
                                    className="w-full px-4 py-2.5 rounded-2xl bg-white border border-gray-200 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-300 transition-all"
                                    placeholder="Enter member name"
                                />
                            </div>

                            {/* Group Name */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-1.5">
                                    Group / Team Name
                                </label>
                                <input
                                    type="text"
                                    value={form.group_name}
                                    onChange={(e) =>
                                        setForm((f) => ({ ...f, group_name: e.target.value }))
                                    }
                                    className="w-full px-4 py-2.5 rounded-2xl bg-white border border-gray-200 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-300 transition-all"
                                    placeholder="e.g. Engineering, Marketing"
                                />
                            </div>

                            {/* Category */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-1.5">
                                    Category <span className="text-red-400">*</span>
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setForm((f) => ({ ...f, gender: "king" }))}
                                        className={`py-3 rounded-2xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${form.gender === "king"
                                            ? "bg-blue-50 border-2 border-blue-300 text-blue-600 shadow-lg shadow-blue-100"
                                            : "bg-gray-50 border-2 border-gray-200 text-gray-400 hover:border-blue-200"
                                            }`}
                                    >
                                        <span className="text-lg">👑</span> King
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setForm((f) => ({ ...f, gender: "queen" }))}
                                        className={`py-3 rounded-2xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${form.gender === "queen"
                                            ? "bg-pink-50 border-2 border-pink-300 text-pink-600 shadow-lg shadow-pink-100"
                                            : "bg-gray-50 border-2 border-gray-200 text-gray-400 hover:border-pink-200"
                                            }`}
                                    >
                                        <span className="text-lg">👸</span> Queen
                                    </button>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={closeForm}
                                    className="flex-1 py-2.5 rounded-2xl bg-gray-100 text-gray-600 hover:bg-gray-200 font-semibold transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving || uploading || !form.name.trim()}
                                    className="flex-1 py-2.5 rounded-2xl bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] text-white font-bold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-purple-300/40 hover:scale-[1.02] active:scale-95"
                                >
                                    {uploading
                                        ? "Uploading..."
                                        : saving
                                            ? "Saving..."
                                            : editingId
                                                ? "Update ✓"
                                                : "Add Member ✨"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirmId && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    onClick={() => setDeleteConfirmId(null)}
                >
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
                    <div
                        className="relative w-full max-w-sm bg-white border border-gray-200 rounded-3xl shadow-2xl p-6 text-center"
                        onClick={(e) => e.stopPropagation()}
                        style={{ animation: "bounceIn 0.4s ease-out" }}
                    >
                        <div className="w-14 h-14 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl">🗑️</span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 mb-2">
                            Delete Member?
                        </h3>
                        <p className="text-sm text-gray-400 mb-6">
                            This action cannot be undone. All votes for this member will also
                            be deleted.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="flex-1 py-2.5 rounded-2xl bg-gray-100 text-gray-600 hover:bg-gray-200 font-semibold transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDelete(deleteConfirmId)}
                                className="flex-1 py-2.5 rounded-2xl bg-gradient-to-r from-red-400 to-red-500 text-white font-bold transition-all hover:shadow-lg hover:shadow-red-200 hover:scale-[1.02] active:scale-95"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
