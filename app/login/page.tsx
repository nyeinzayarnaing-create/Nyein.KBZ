"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { setVoterId } from "@/lib/voter";

export default function LoginPage() {
    const router = useRouter();
    const [employeeId, setEmployeeId] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleLogin(e: React.FormEvent) {
        e.preventDefault();
        if (!employeeId.trim()) return;

        setLoading(true);
        setError("");

        try {
            if (!supabase) throw new Error("Supabase not initialized");

            // Validate employee_id against candidates table (case-insensitive)
            const { data, error: dbError } = await supabase
                .from("candidates")
                .select("employee_id")
                .ilike("employee_id", employeeId.trim())
                .limit(1)
                .maybeSingle();

            if (dbError) throw dbError;

            if (data) {
                setVoterId(employeeId.trim());
                router.push("/vote");
            } else {
                setError("Invalid Employee ID. Please check and try again.");
            }
        } catch (err: unknown) {
            console.error("Login error:", err);
            setError("An error occurred during login. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-[#faf9f7] relative overflow-hidden">
            {/* Decorative blobs */}
            <div className="absolute top-[-80px] left-[-60px] w-64 h-64 bg-purple-300/20 rounded-full blur-3xl animate-float" />
            <div className="absolute bottom-[-80px] right-[-60px] w-72 h-72 bg-pink-300/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />

            <div className="w-full max-w-md z-10">
                <div className="text-center mb-10">
                    <div className="mb-4 inline-block transform hover:scale-110 transition-transform cursor-default">
                        <span className="text-6xl">✨</span>
                    </div>
                    <h1 className="font-display text-4xl font-extrabold gradient-text mb-2">
                        Voter Login
                    </h1>
                    <p className="text-gray-500 font-medium">
                        Enter your Employee ID to start voting
                    </p>
                </div>

                <form
                    onSubmit={handleLogin}
                    className="bg-white p-8 rounded-3xl border border-gray-100 shadow-2xl shadow-purple-100/50 space-y-6"
                >
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2 px-1">
                            Employee ID
                        </label>
                        <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            required
                            placeholder="e.g. 012345"
                            value={employeeId}
                            onChange={(e) => setEmployeeId(e.target.value.replace(/\D/g, ''))}
                            className="w-full px-5 py-4 rounded-2xl bg-gray-50 border border-transparent focus:bg-white focus:border-purple-300 focus:ring-4 focus:ring-purple-100 outline-none transition-all text-lg font-medium tracking-wide"
                            autoFocus
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-500 p-4 rounded-2xl text-sm font-medium border border-red-100 animate-bounce-in">
                            ⚠️ {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !employeeId.trim()}
                        className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#6c5ce7] to-[#a29bfe] text-white font-bold text-lg transition-all duration-300 hover:shadow-lg hover:shadow-purple-300/40 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-md"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Verifying...
                            </span>
                        ) : (
                            "Login ✨"
                        )}
                    </button>
                </form>

                <p className="mt-8 text-center text-sm text-gray-400 font-medium tracking-wide leading-relaxed">
                    Only registered employees can participate in the voting.<br />
                    Need help? Contact the UX Team.
                </p>
            </div>

            <footer className="fixed bottom-0 left-0 w-full py-4 text-center bg-[#faf9f7]/80 backdrop-blur-sm border-t border-gray-100/50">
                <p className="text-[#6c5ce7]/40 text-xs font-semibold uppercase tracking-widest">Supported by UX Team</p>
            </footer>
        </main>
    );
}
