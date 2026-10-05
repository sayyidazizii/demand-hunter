"use strict";
import React from "react";
import { Demand } from "@/types/demand";
import { formatRelativeTime, getCategoryMeta, getPlatformMeta } from "@/lib/utils";
import { formatDistance } from "@/lib/haversine";
import { 
  X, 
  ExternalLink, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  MessageSquare,
  Sparkles,
  Bot,
  Compass
} from "lucide-react";

interface DemandDetailModalProps {
  demand: Demand | null;
  onClose: () => void;
}

export const DemandDetailModal: React.FC<DemandDetailModalProps> = ({ demand, onClose }) => {
  if (!demand) return null;

  const platform = getPlatformMeta(demand.source_platform);
  const category = getCategoryMeta(demand.category);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${platform.color}`}>
              {platform.label}
            </span>
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${category.color}`}>
              {category.label}
            </span>
            {demand.is_solved ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
                <CheckCircle2 className="w-3 h-3 text-slate-400" />
                Closed / Selesai
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Open / Aktif
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-200">
          {/* Title */}
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {demand.title}
            </h2>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-2">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Diposting: {formatRelativeTime(demand.posted_at)} ({new Date(demand.posted_at).toLocaleString("id-ID")})
              </span>
              <span className="flex items-center gap-1 text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                {demand.location_name || "Indonesia"}
                {demand.distance_km !== undefined && (
                  <span className="text-emerald-400 font-semibold ml-1">
                    ({formatDistance(demand.distance_km)} dari Anda)
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* AI Extracted Intelligence Card */}
          <div className="rounded-xl bg-slate-950/70 border border-emerald-500/20 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Hasil Ekstraksi Gemini Flash AI
              </span>
              <span className="text-xs font-mono text-slate-400">
                Confidence: {Math.round((demand.confidence_score || 0.95) * 100)}%
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Kebutuhan Spesifik:</span>
                <span className="font-medium text-emerald-300">
                  {demand.item_or_service || "-"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Kontak / Target:</span>
                <span className="font-medium text-cyan-300">
                  {demand.contact_target || "Bisa dihubungi lewat link asli"}
                </span>
              </div>
              {demand.latitude && demand.longitude && (
                <div className="col-span-1 sm:col-span-2 flex items-center justify-between bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Compass className="w-3.5 h-3.5 text-slate-400" /> Koordinat Geo:
                    <code className="text-slate-200 ml-1 font-mono">
                      {demand.latitude}, {demand.longitude}
                    </code>
                  </span>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${demand.latitude},${demand.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    Buka di Peta <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            <div>
              <span className="text-slate-400 text-xs block mb-1">Ringkasan AI:</span>
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/80">
                {demand.summary || "Tidak ada ringkasan khusus."}
              </p>
            </div>
          </div>

          {/* Raw Scraped Content */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Teks Asli Postingan (Raw Scraped Text):
            </h4>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 leading-relaxed whitespace-pre-wrap select-text">
              {demand.raw_content}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700 transition-colors"
          >
            Tutup
          </button>

          {demand.source_url && (
            <a
              href={demand.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 transition-colors shadow-lg shadow-emerald-500/20"
            >
              <span>Buka Link Asli ({platform.label})</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
