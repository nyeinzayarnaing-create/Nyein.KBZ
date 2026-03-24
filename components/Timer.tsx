"use client";

import { useEffect, useState } from "react";
import type { Settings } from "@/types";

type TimerProps = {
  settings: Settings | null;
  onTimeUp?: () => void;
  isAdmin?: boolean;
  onStart?: (seconds: number) => void;
  onStop?: () => void;
  onReset?: () => void;
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function Timer({
  settings,
  onTimeUp,
  isAdmin = false,
  onStart,
  onStop,
  onReset,
}: TimerProps) {
  const [remaining, setRemaining] = useState<number | null>(null);
  const [timerMinutes, setTimerMinutes] = useState(5);

  useEffect(() => {
    if (!settings) return;

    setTimerMinutes(Math.round(settings.timer_seconds / 60) || 5);

    if (settings.timer_end_at && settings.voting_active) {
      const end = new Date(settings.timer_end_at).getTime();
      const update = () => {
        const now = Date.now();
        const secs = Math.max(0, Math.floor((end - now) / 1000));
        setRemaining(secs);
        if (secs === 0) onTimeUp?.();
      };
      update();
      const id = setInterval(update, 1000);
      return () => clearInterval(id);
    } else if (!settings.voting_active) {
      setRemaining(null);
    } else {
      setRemaining(settings.timer_seconds);
    }
  }, [settings, onTimeUp]);

  const isActive = remaining !== null && remaining > 0;

  return (
    <div className="text-center">
      <div
        className={`
          inline-block px-10 py-6 rounded-3xl border-2 transition-all duration-500 card-shadow
          ${isActive
            ? "border-[#6c5ce7]/30 bg-white"
            : "border-gray-200 bg-white"
          }
        `}
      >
        <p className="text-gray-400 text-sm uppercase tracking-wider font-semibold mb-2">
          {settings?.voting_active ? "⏱️ Time Remaining" : "⏱️ Countdown"}
        </p>
        <p
          className={`font-display text-5xl md:text-7xl font-extrabold ${isActive ? "gradient-text" : "text-gray-300"
            }`}
        >
          {remaining !== null
            ? formatTime(remaining)
            : settings?.voting_active
              ? formatTime(settings.timer_seconds)
              : "—"}
        </p>
      </div>

      {isAdmin && onStart && onStop && (
        <div className="mt-6 flex flex-wrap gap-3 justify-center items-center">
          <label className="text-gray-500 text-sm font-medium">Duration:</label>
          <input
            type="number"
            min={1}
            max={60}
            step={1}
            value={timerMinutes}
            onChange={(e) => setTimerMinutes(Math.max(1, Math.min(60, Number(e.target.value) || 1)))}
            className="px-3 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-800 w-20 text-center font-semibold focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-300 card-shadow"
          />
          <span className="text-gray-400 text-sm font-medium">min</span>
          <button
            onClick={() => onStart(timerMinutes * 60)}
            disabled={settings?.voting_active}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-500 text-white font-bold transition-all duration-300 hover:shadow-lg hover:shadow-emerald-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            ▶️ Start
          </button>
          <button
            onClick={onStop}
            disabled={!settings?.voting_active}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-400 to-red-500 text-white font-bold transition-all duration-300 hover:shadow-lg hover:shadow-red-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            ⏹️ Stop
          </button>
          {onReset && (
            <button
              onClick={onReset}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-400 to-orange-500 text-white font-bold transition-all duration-300 hover:shadow-lg hover:shadow-orange-200 hover:scale-105 active:scale-95"
            >
              🔄 Reset
            </button>
          )}
        </div>
      )}
    </div>
  );
}
