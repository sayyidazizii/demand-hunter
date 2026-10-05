"use strict";
import React from "react";
import { 
  Search, 
  MapPin, 
  SlidersHorizontal, 
  Navigation, 
  Globe2, 
  Building2, 
  X,
  Compass
} from "lucide-react";
import { StatusFilter, LocationScope, CategoryFilter, SortOption } from "@/types/demand";

interface FilterBarProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: StatusFilter;
  setStatusFilter: (status: StatusFilter) => void;
  locationScope: LocationScope;
  setLocationScope: (scope: LocationScope) => void;
  categoryFilter: CategoryFilter;
  setCategoryFilter: (category: CategoryFilter) => void;
  sortOption: SortOption;
  setSortOption: (sort: SortOption) => void;
  nearRadiusKm: number;
  setNearRadiusKm: (radius: number) => void;
  onRequestGeolocation: () => void;
  isLocating: boolean;
  userCoords: { lat: number; lng: number } | null;
  onClearFilters: () => void;
  totalFiltered: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  locationScope,
  setLocationScope,
  categoryFilter,
  setCategoryFilter,
  sortOption,
  setSortOption,
  nearRadiusKm,
  setNearRadiusKm,
  onRequestGeolocation,
  isLocating,
  userCoords,
  onClearFilters,
  totalFiltered,
}) => {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 mb-6 shadow-xl shadow-slate-950/40">
      {/* 1. Search Bar & Status Tabs */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center pb-4 border-b border-slate-800/80">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari kebutuhan: 'biji kopi', 'forwarder', 'konveksi', 'Bandung'..."
            className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-10 pr-9 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Status Filter (Required: All, Active Only, Solved) */}
        <div className="flex items-center gap-1 p-1 bg-slate-950/80 border border-slate-800 rounded-xl">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              statusFilter === "all"
                ? "bg-slate-800 text-white shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Semua Status
          </button>
          <button
            onClick={() => setStatusFilter("active")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              statusFilter === "active"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Aktif Saja
          </button>
          <button
            onClick={() => setStatusFilter("solved")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              statusFilter === "solved"
                ? "bg-slate-700 text-slate-200 shadow-sm"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Terpenuhi / Closed
          </button>
        </div>
      </div>

      {/* 2. Location Scopes (Required: Near Me, Indonesia, Global) */}
      <div className="pt-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1 mr-1">
            <Compass className="w-3.5 h-3.5 text-emerald-400" /> Lokasi:
          </span>

          {/* All */}
          <button
            onClick={() => setLocationScope("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              locationScope === "all"
                ? "bg-slate-800 text-white border border-slate-700"
                : "bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            Semua Wilayah
          </button>

          {/* Option 1: "Near Me" (HTML5 Geolocation + Haversine formula) */}
          <button
            onClick={() => {
              setLocationScope("near_me");
              onRequestGeolocation();
            }}
            disabled={isLocating}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              locationScope === "near_me"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-950/20"
                : "bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            <Navigation className={`w-3.5 h-3.5 ${isLocating ? "animate-spin text-emerald-400" : "text-emerald-400"}`} />
            <span>Near Me (Dekat Saya)</span>
          </button>

          {/* Option 2: All Indonesia */}
          <button
            onClick={() => setLocationScope("indonesia")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              locationScope === "indonesia"
                ? "bg-slate-800 text-white border border-slate-700"
                : "bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Seluruh Indonesia</span>
          </button>

          {/* Option 3: International / Global */}
          <button
            onClick={() => setLocationScope("global")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              locationScope === "global"
                ? "bg-slate-800 text-white border border-slate-700"
                : "bg-slate-950/60 text-slate-400 hover:text-slate-200 border border-slate-800"
            }`}
          >
            <Globe2 className="w-3.5 h-3.5 text-indigo-400" />
            <span>Internasional / Global</span>
          </button>

          {/* Radius selector when Near Me is active */}
          {locationScope === "near_me" && userCoords && (
            <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
              <span className="text-xs text-slate-400">Radius:</span>
              <select
                value={nearRadiusKm}
                onChange={(e) => setNearRadiusKm(Number(e.target.value))}
                className="bg-slate-950 border border-emerald-500/40 text-emerald-300 text-xs rounded-lg px-2 py-1 focus:outline-none"
              >
                <option value={25}>&lt; 25 km</option>
                <option value={50}>&lt; 50 km</option>
                <option value={100}>&lt; 100 km</option>
                <option value={250}>&lt; 250 km</option>
                <option value={500}>&lt; 500 km</option>
              </select>
            </div>
          )}
        </div>

        {/* Sort Ordering (Default: Newest first) */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <SlidersHorizontal className="w-3.5 h-3.5" /> Urutkan:
          </span>
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as SortOption)}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-slate-700"
          >
            <option value="newest">Terbaru (Default)</option>
            {userCoords && <option value="nearest">Jarak Terdekat</option>}
            <option value="oldest">Terlama</option>
          </select>
        </div>
      </div>

      {/* 3. Category Filter Chips (Required: All, Barang, Jasa, Impor, Supplier) */}
      <div className="mt-4 pt-3 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-slate-400 mr-1">Kategori:</span>
          {(["all", "barang", "jasa", "impor", "supplier"] as CategoryFilter[]).map((cat) => {
            const isSelected = categoryFilter === cat;
            const labelMap: Record<CategoryFilter, string> = {
              all: "Semua Kategori",
              barang: "Barang",
              jasa: "Jasa",
              impor: "Impor",
              supplier: "Supplier",
            };
            return (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  isSelected
                    ? "bg-emerald-500 text-slate-950 font-semibold shadow-sm"
                    : "bg-slate-800/60 text-slate-300 hover:bg-slate-800 border border-slate-700/60"
                }`}
              >
                {labelMap[cat]}
              </button>
            );
          })}
        </div>

        {/* Results Count & Reset */}
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span>Menampilkan <strong className="text-white">{totalFiltered}</strong> peluang</span>
          {(searchQuery || statusFilter !== "all" || locationScope !== "all" || categoryFilter !== "all") && (
            <button
              onClick={onClearFilters}
              className="text-xs text-emerald-400 hover:text-emerald-300 underline font-medium"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
