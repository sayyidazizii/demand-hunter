"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Header } from "@/components/Header";
import { StatsHeader } from "@/components/StatsHeader";
import { FilterBar } from "@/components/FilterBar";
import { DemandCard } from "@/components/DemandCard";
import { DemandDetailModal } from "@/components/DemandDetailModal";
import { GeolocationBanner } from "@/components/GeolocationBanner";
import { EmptyState } from "@/components/EmptyState";
import { INITIAL_MOCK_DEMANDS } from "@/lib/mockData";
import { calculateHaversineDistance } from "@/lib/haversine";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { 
  Demand, 
  StatusFilter, 
  LocationScope, 
  CategoryFilter, 
  SortOption 
} from "@/types/demand";

export default function DashboardPage() {
  const [demands, setDemands] = useState<Demand[]>(INITIAL_MOCK_DEMANDS);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isSupabaseLive, setIsSupabaseLive] = useState<boolean>(false);

  // Filters & Views
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [locationScope, setLocationScope] = useState<LocationScope>("all");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [sortOption, setSortOption] = useState<SortOption>("newest"); // Default ordering: Newest first

  // Geolocation "Near Me" State
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [nearRadiusKm, setNearRadiusKm] = useState<number>(50);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Selected Demand for Detail Modal
  const [selectedDemand, setSelectedDemand] = useState<Demand | null>(null);

  // Fetch Demands from Supabase or Fallback to Initial Data
  const loadDemands = useCallback(async () => {
    setIsRefreshing(true);
    if (isSupabaseConfigured() && supabase) {
      try {
        const { data, error } = await supabase
          .from("demands")
          .select("*")
          .order("posted_at", { ascending: false });

        if (!error && data && data.length > 0) {
          setDemands(data as Demand[]);
          setIsSupabaseLive(true);
        } else {
          setDemands(INITIAL_MOCK_DEMANDS);
          setIsSupabaseLive(false);
        }
      } catch (err) {
        console.warn("Supabase fetch failed, using fallback data:", err);
        setDemands(INITIAL_MOCK_DEMANDS);
        setIsSupabaseLive(false);
      }
    } else {
      setDemands(INITIAL_MOCK_DEMANDS);
      setIsSupabaseLive(false);
    }
    setIsLoading(false);
    setIsRefreshing(false);
  }, []);

  useEffect(() => {
    loadDemands();
  }, [loadDemands]);

  // Request HTML5 Geolocation API
  const handleRequestGeolocation = () => {
    if (!navigator.geolocation) {
      setGeoError("Browser Anda tidak mendukung geolokasi.");
      // Fallback default: Jakarta
      setUserCoords({ lat: -6.2088, lng: 106.8456 });
      return;
    }

    setIsLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationScope("near_me");
        setSortOption("nearest");
        setIsLocating(false);
      },
      (err) => {
        console.warn("Geolocation permission error or timeout:", err.message);
        setGeoError("Izin lokasi ditolak/tidak tersedia. Menggunakan lokasi simulasi Jakarta.");
        // Fallback default coordinates: Jakarta Selatan
        setUserCoords({ lat: -6.2615, lng: 106.8106 });
        setLocationScope("near_me");
        setSortOption("nearest");
        setIsLocating(false);
      },
      { timeout: 7000, enableHighAccuracy: true }
    );
  };

  const handleDisableNearMe = () => {
    setLocationScope("all");
    setUserCoords(null);
    setSortOption("newest");
  };

  const handleSetPresetCity = (_cityName: string, lat: number, lng: number) => {
    setUserCoords({ lat, lng });
    setLocationScope("near_me");
    setSortOption("nearest");
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setLocationScope("all");
    setCategoryFilter("all");
    setSortOption("newest");
    setUserCoords(null);
  };

  // Filtered & Sorted Demands Pipeline
  const filteredDemands = useMemo(() => {
    let list = demands.map((d) => {
      // Calculate Haversine distance if userCoords is active
      if (userCoords && d.latitude !== null && d.longitude !== null) {
        const dist = calculateHaversineDistance(
          userCoords.lat,
          userCoords.lng,
          d.latitude,
          d.longitude
        );
        return { ...d, distance_km: dist };
      }
      return { ...d, distance_km: undefined };
    });

    // 1. Status Filter: All, Active Only (is_solved = false), Solved (is_solved = true)
    if (statusFilter === "active") {
      list = list.filter((d) => !d.is_solved);
    } else if (statusFilter === "solved") {
      list = list.filter((d) => d.is_solved);
    }

    // 2. Category Filter: All, Barang, Jasa, Impor, Supplier
    if (categoryFilter !== "all") {
      list = list.filter((d) => d.category === categoryFilter);
    }

    // 3. Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((d) => {
        const text = `${d.title} ${d.summary || ""} ${d.item_or_service || ""} ${d.location_name || ""} ${d.raw_content}`.toLowerCase();
        return text.includes(q);
      });
    }

    // 4. Location Scope Filter
    if (locationScope === "near_me") {
      list = list.filter((d) => {
        if (d.distance_km === undefined) return false;
        return d.distance_km <= nearRadiusKm;
      });
    } else if (locationScope === "indonesia") {
      list = list.filter((d) => {
        const loc = (d.location_name || "").toLowerCase();
        return !loc.includes("global") && !loc.includes("australia") && !loc.includes("singapore");
      });
    } else if (locationScope === "global") {
      list = list.filter((d) => {
        const loc = (d.location_name || "").toLowerCase();
        return loc.includes("global") || loc.includes("australia") || loc.includes("export") || loc.includes("singapore");
      });
    }

    // 5. Ordering & Sorting (Default: Newest First)
    list.sort((a, b) => {
      if (sortOption === "nearest" && a.distance_km !== undefined && b.distance_km !== undefined) {
        return a.distance_km - b.distance_km;
      }
      if (sortOption === "oldest") {
        return new Date(a.posted_at).getTime() - new Date(b.posted_at).getTime();
      }
      // Default: Newest first
      return new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime();
    });

    return list;
  }, [
    demands,
    statusFilter,
    categoryFilter,
    searchQuery,
    locationScope,
    nearRadiusKm,
    userCoords,
    sortOption,
  ]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Header */}
      <Header
        onRefresh={loadDemands}
        isRefreshing={isRefreshing}
        isSupabaseLive={isSupabaseLive}
        totalCount={demands.length}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Summary Bar */}
        <StatsHeader demands={demands} />

        {/* Near Me Active Banner */}
        <GeolocationBanner
          userCoords={userCoords}
          radiusKm={nearRadiusKm}
          setRadiusKm={setNearRadiusKm}
          onDisable={handleDisableNearMe}
          onSetPresetCity={handleSetPresetCity}
        />

        {geoError && (
          <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
            {geoError}
          </div>
        )}

        {/* Controls, Search, and Multi-Level Filters */}
        <FilterBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          locationScope={locationScope}
          setLocationScope={setLocationScope}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          sortOption={sortOption}
          setSortOption={setSortOption}
          nearRadiusKm={nearRadiusKm}
          setNearRadiusKm={setNearRadiusKm}
          onRequestGeolocation={handleRequestGeolocation}
          isLocating={isLocating}
          userCoords={userCoords}
          onClearFilters={handleClearFilters}
          totalFiltered={filteredDemands.length}
        />

        {/* Demands Cards Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-64 rounded-2xl bg-slate-900/60 border border-slate-800 animate-pulse p-5 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="h-4 bg-slate-800 rounded w-1/3"></div>
                  <div className="h-5 bg-slate-800 rounded w-4/5"></div>
                  <div className="h-4 bg-slate-800 rounded w-full"></div>
                </div>
                <div className="h-8 bg-slate-800 rounded w-full"></div>
              </div>
            ))}
          </div>
        ) : filteredDemands.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredDemands.map((demand) => (
              <DemandCard
                key={demand.id}
                demand={demand}
                onSelect={(d) => setSelectedDemand(d)}
                userCoords={userCoords}
              />
            ))}
          </div>
        ) : (
          <EmptyState onReset={handleClearFilters} />
        )}
      </main>

      {/* Detail / Raw AI Inspection Modal */}
      <DemandDetailModal
        demand={selectedDemand}
        onClose={() => setSelectedDemand(null)}
      />
    </div>
  );
}
