 "use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password.trim() || loading) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        setError(data.error || "Invalid passcode. Please try again.");
        return;
      }

      router.push("/admin-secret");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#faf9f7] relative overflow-hidden px-4">
      <div className="absolute top-[-80px] left-[-60px] w-64 h-64 bg-purple-300/30 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-[-80px] right-[-60px] w-72 h-72 bg-pink-300/30 rounded-full blur-3xl animate-float" />
      <div className="absolute top-1/3 right-[-40px] w-40 h-40 bg-yellow-300/20 rounded-full blur-2xl animate-float" />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-6 text-center">
          <span className="text-5xl">🛡️</span>
          <h1 className="mt-4 font-display text-3xl font-extrabold gradient-text">
            Admin Access
          </h1>
          <p className="mt-2 text-sm text-gray-500 font-medium">
            Enter the secret passcode to open the admin dashboard.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white/90 backdrop-blur-xl rounded-3xl border border-gray-100 card-shadow p-6 space-y-4"
        >
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Admin passcode
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter passcode"
              className="w-full px-4 py-3 rounded-2xl bg-[#faf9f7] border border-gray-200 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-300 transition-all"
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 border border-red-100 rounded-2xl px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !password.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] text-white font-bold text-sm transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-purple-300/40 hover:scale-[1.02] active:scale-95"
          >
            {loading ? "Checking..." : "Unlock Admin"}
          </button>

          <p className="text-center text-xs text-gray-400 mt-1">
            Hint: The passcode is shared with authorized organizers only.
          </p>
        </form>

        <p className="mt-6 text-center text-xs text-[#6c5ce7]/50 font-medium">
          Supported by UX Team
        </p>
      </div>
    </main>
  );
}

