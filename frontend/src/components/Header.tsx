"use strict";
import React from "react";
import { Radar, RefreshCw, Database, Sparkles } from "lucide-react";

interface HeaderProps {
  onRefresh: () => void;
  isRefreshing: boolean;
  isSupabaseLive: boolean;
  totalCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onRefresh,
  isRefreshing,
  isSupabaseLive,
}) => {
  return (
    <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Logo and Branding */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 text-emerald-400 shadow-lg shadow-emerald-500/10">
            <Radar className="w-5 h-5 animate-spin-slow" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                Demand Radar <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">AI v2.0</span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Lead Intelligence & Buyer Procurement Monitoring
            </p>
          </div>
        </div>

        {/* Status Indicators & Action */}
        <div className="flex items-center gap-3">
          {/* Data Source Badge */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border border-slate-800 bg-slate-900/60 text-slate-300">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span>Sumber Data:</span>
            <span className={isSupabaseLive ? "text-emerald-400 font-medium" : "text-amber-400 font-medium"}>
              {isSupabaseLive ? "Supabase Live" : "Local Verified Dataset"}
            </span>
          </div>

          {/* AI Status Badge */}
          <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span className="font-mono">Gemini 1.5 Flash</span>
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 transition-all disabled:opacity-50"
            title="Muat ulang data terbaru"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-emerald-400" : ""}`} />
            <span className="hidden sm:inline">Refresh Radar</span>
          </button>
        </div>
      </div>
    </header>
  );
};
