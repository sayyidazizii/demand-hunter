"use strict";
import React from "react";
import { Demand } from "@/types/demand";
import { formatRelativeTime, getCategoryMeta, getPlatformMeta } from "@/lib/utils";
import { formatDistance } from "@/lib/haversine";
import { 
  ExternalLink, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  MessageSquare,
  Sparkles,
  Navigation
} from "lucide-react";

interface DemandCardProps {
  demand: Demand;
  onSelect: (demand: Demand) => void;
  userCoords?: { lat: number; lng: number } | null;
}

export const DemandCard: React.FC<DemandCardProps> = ({
  demand,
  onSelect,
}) => {
  const platform = getPlatformMeta(demand.source_platform);
  const category = getCategoryMeta(demand.category);

  return (
    <div 
      className={`group relative flex flex-col justify-between rounded-2xl border transition-all duration-200 p-5 ${
        demand.is_solved
          ? "bg-slate-900/40 border-slate-800/80 opacity-75 hover:opacity-100"
          : "bg-slate-900/90 border-slate-800 hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-950/20"
      }`}
    >
      {/* Top Meta Bar */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          {/* Solved Status Pill (Green = Open, Grey = Closed) */}
          <div className="flex items-center gap-2">
            {demand.is_solved ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
                <CheckCircle2 className="w-3 h-3 text-slate-400" />
                <span>Closed / Selesai</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-500/10">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"></span>
                </span>
                <span>Open / Aktif</span>
              </span>
            )}

            {/* Category Pill */}
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${category.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${category.dotColor}`}></span>
              <span>{category.label}</span>
            </span>
          </div>

          {/* Source Platform Badge */}
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${platform.color}`}>
            <span>{platform.label}</span>
          </span>
        </div>

        {/* Title */}
        <h3 className="text-base font-semibold text-slate-100 line-clamp-2 group-hover:text-emerald-300 transition-colors leading-snug mb-2">
          {demand.title}
        </h3>

        {/* AI Extracted Summary */}
        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
          {demand.summary || demand.raw_content}
        </p>

        {/* Item or Service Tag */}
        {demand.item_or_service && (
          <div className="mb-4 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
            <span className="text-slate-500">Kebutuhan:</span>
            <span className="font-medium text-emerald-300 truncate max-w-[260px]">
              {demand.item_or_service}
            </span>
          </div>
        )}
      </div>

      {/* Bottom Meta & Action Section */}
      <div className="pt-3 border-t border-slate-800/80 flex flex-col gap-3">
        {/* Location & Relative Time */}
        <div className="flex flex-wrap items-center justify-between gap-y-1.5 text-xs text-slate-400">
          {/* Location Badge with Proximity Distance */}
          <div className="flex items-center gap-1 text-slate-300 font-medium">
            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate max-w-[170px]">{demand.location_name || "Indonesia"}</span>
            
            {/* Near Me Distance Badge if available */}
            {demand.distance_km !== undefined && (
              <span className="ml-1 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-500/30">
                <Navigation className="w-2.5 h-2.5" />
                {formatDistance(demand.distance_km)}
              </span>
            )}
          </div>

          {/* Relative Time ("2 hours ago") */}
          <div className="flex items-center gap-1 text-slate-500">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatRelativeTime(demand.posted_at)}</span>
          </div>
        </div>

        {/* Contact info snippet if present */}
        {demand.contact_target && (
          <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-950/50 px-2 py-1 rounded border border-slate-800">
            <MessageSquare className="w-3 h-3 text-cyan-400 shrink-0" />
            <span className="text-slate-400 truncate">
              Kontak: <strong className="text-slate-200">{demand.contact_target}</strong>
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <button
            onClick={() => onSelect(demand)}
            className="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 transition-colors text-center"
          >
            Lihat Analisis AI
          </button>

          {/* Required Button: "Buka Link Asli" */}
          {demand.source_url ? (
            <a
              href={demand.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-500/50 transition-colors"
            >
              <span>Buka Link Asli</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          ) : (
            <span className="text-xs text-slate-500 italic">No link</span>
          )}
        </div>
      </div>
    </div>
  );
};
