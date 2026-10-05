"use strict";
import React from "react";
import { Navigation, X, Sliders, MapPin } from "lucide-react";

interface GeolocationBannerProps {
  userCoords: { lat: number; lng: number } | null;
  radiusKm: number;
  setRadiusKm: (radius: number) => void;
  onDisable: () => void;
  onSetPresetCity: (city: string, lat: number, lng: number) => void;
}

export const GeolocationBanner: React.FC<GeolocationBannerProps> = ({
  userCoords,
  radiusKm,
  setRadiusKm,
  onDisable,
  onSetPresetCity,
}) => {
  if (!userCoords) return null;

  return (
    <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/40 shadow-lg shadow-emerald-950/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
          <Navigation className="w-4 h-4 animate-pulse" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Mode Radar &quot;Near Me&quot; Aktif
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              {userCoords.lat.toFixed(4)}, {userCoords.lng.toFixed(4)}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Menampilkan permintaan dalam radius <strong>{radiusKm} km</strong> dari posisi Anda (dihitung otomatis dengan formula Haversine).
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 self-end md:self-auto">
        {/* Preset quick test cities (helpful for testing on desktops) */}
        <div className="hidden lg:flex items-center gap-1 text-[11px] text-slate-400 mr-2">
          <span>Tes Kota:</span>
          <button
            onClick={() => onSetPresetCity("Jakarta", -6.2088, 106.8456)}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
          >
            Jakarta
          </button>
          <button
            onClick={() => onSetPresetCity("Surabaya", -7.2575, 112.7521)}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
          >
            Surabaya
          </button>
          <button
            onClick={() => onSetPresetCity("Bandung", -6.9175, 107.6191)}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
          >
            Bandung
          </button>
          <button
            onClick={() => onSetPresetCity("Bali", -8.6705, 115.2126)}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
          >
            Bali
          </button>
        </div>

        {/* Radius selector */}
        <div className="flex items-center gap-1.5 bg-slate-950/80 px-2 py-1 rounded-xl border border-emerald-500/30">
          <Sliders className="w-3 h-3 text-emerald-400" />
          <span className="text-xs text-slate-400">Radius:</span>
          <select
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
            className="bg-transparent text-emerald-300 font-semibold text-xs focus:outline-none cursor-pointer"
          >
            <option value={25} className="bg-slate-900">25 km</option>
            <option value={50} className="bg-slate-900">50 km</option>
            <option value={100} className="bg-slate-900">100 km</option>
            <option value={250} className="bg-slate-900">250 km</option>
            <option value={500} className="bg-slate-900">500 km</option>
          </select>
        </div>

        {/* Disable button */}
        <button
          onClick={onDisable}
          className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          title="Matikan filter Near Me"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
