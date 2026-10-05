"use strict";
import React from "react";
import { Radar, RotateCcw } from "lucide-react";

interface EmptyStateProps {
  onReset: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onReset }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 border-dashed my-8">
      <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-500 mb-4">
        <Radar className="w-7 h-7 text-emerald-500/60" />
      </div>
      <h3 className="text-base font-semibold text-slate-200 mb-1">
        Tidak Ada Permintaan yang Cocok
      </h3>
      <p className="text-xs text-slate-400 max-w-sm mb-5 leading-relaxed">
        Radar tidak menemukan permintaan dengan filter status, kategori, atau radius lokasi yang dipilih.
      </p>
      <button
        onClick={onReset}
        className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        <span>Reset Semua Filter</span>
      </button>
    </div>
  );
};
