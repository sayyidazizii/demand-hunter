"use strict";
import React from "react";
import { Demand } from "@/types/demand";
import { Zap, CheckCircle2, PackageCheck, Truck, Layers, Wrench } from "lucide-react";

interface StatsHeaderProps {
  demands: Demand[];
}

export const StatsHeader: React.FC<StatsHeaderProps> = ({ demands }) => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  // Count active opportunities found today
  const activeTodayCount = demands.filter((d) => {
    const postTime = new Date(d.posted_at).getTime();
    return !d.is_solved && postTime >= startOfToday;
  }).length;

  const totalActive = demands.filter((d) => !d.is_solved).length;
  const totalSolved = demands.filter((d) => d.is_solved).length;
  const totalLeads = demands.length;

  // Category counts
  const barangCount = demands.filter((d) => d.category === "barang").length;
  const jasaCount = demands.filter((d) => d.category === "jasa").length;
  const imporCount = demands.filter((d) => d.category === "impor").length;
  const supplierCount = demands.filter((d) => d.category === "supplier").length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. Primary Required Metric: Active Opportunities Today */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 p-5 shadow-lg shadow-emerald-950/20">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400/90 flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Peluang Aktif Hari Ini
          </span>
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Zap className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-white tracking-tight">
            {activeTodayCount > 0 ? activeTodayCount : totalActive}
          </span>
          <span className="text-xs text-emerald-400/80 font-medium">
            lead baru terverifikasi
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Dari {totalActive} total peluang aktif di radar
        </p>
      </div>

      {/* 2. Total Leads Monitored */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 hover:border-slate-700 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Total Demands Terpantau
          </span>
          <div className="p-2 rounded-xl bg-slate-800 text-cyan-400 border border-slate-700">
            <Layers className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-white tracking-tight">
            {totalLeads}
          </span>
          <span className="text-xs text-slate-400 font-medium">permintaan</span>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Scraped dari Twitter, Telegram, Reddit & Forum
        </p>
      </div>

      {/* 3. Solved / Fulfilled Opportunities */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 hover:border-slate-700 transition-colors">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Permintaan Terpenuhi
          </span>
          <div className="p-2 rounded-xl bg-slate-800 text-slate-300 border border-slate-700">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-slate-200 tracking-tight">
            {totalSolved}
          </span>
          <span className="text-xs text-slate-400 font-medium">closed deals</span>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Terdeteksi kata &quot;sudah dapet&quot; / &quot;closed&quot;
        </p>
      </div>

      {/* 4. Category Breakdown Chips */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 p-5 hover:border-slate-700 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Distribusi Kategori
          </span>
          <div className="p-2 rounded-xl bg-slate-800 text-indigo-400 border border-slate-700">
            <PackageCheck className="w-4 h-4" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div className="flex items-center justify-between px-2.5 py-1 rounded-lg bg-slate-800/60 border border-slate-800 text-xs">
            <span className="text-slate-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span> Barang
            </span>
            <span className="font-semibold text-white">{barangCount}</span>
          </div>
          <div className="flex items-center justify-between px-2.5 py-1 rounded-lg bg-slate-800/60 border border-slate-800 text-xs">
            <span className="text-slate-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> Jasa
            </span>
            <span className="font-semibold text-white">{jasaCount}</span>
          </div>
          <div className="flex items-center justify-between px-2.5 py-1 rounded-lg bg-slate-800/60 border border-slate-800 text-xs">
            <span className="text-slate-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400"></span> Impor
            </span>
            <span className="font-semibold text-white">{imporCount}</span>
          </div>
          <div className="flex items-center justify-between px-2.5 py-1 rounded-lg bg-slate-800/60 border border-slate-800 text-xs">
            <span className="text-slate-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Supplier
            </span>
            <span className="font-semibold text-white">{supplierCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
