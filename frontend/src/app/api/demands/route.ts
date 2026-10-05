import { NextRequest, NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { INITIAL_MOCK_DEMANDS } from "@/lib/mockData";
import { calculateHaversineDistance } from "@/lib/haversine";
import { Demand } from "@/types/demand";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const status = searchParams.get("status") || "all";
  const category = searchParams.get("category") || "all";
  const locationScope = searchParams.get("location") || "all";
  const query = searchParams.get("q")?.toLowerCase() || "";
  const nearLat = searchParams.get("nearLat") ? parseFloat(searchParams.get("nearLat")!) : null;
  const nearLng = searchParams.get("nearLng") ? parseFloat(searchParams.get("nearLng")!) : null;
  const radiusKm = searchParams.get("radius") ? parseFloat(searchParams.get("radius")!) : 50;

  let demands: Demand[] = [];

  // Try fetching from Supabase if configured
  if (isSupabaseConfigured() && supabase) {
    try {
      let dbQuery = supabase
        .from("demands")
        .select("*")
        .order("posted_at", { ascending: false });

      if (status === "active") {
        dbQuery = dbQuery.eq("is_solved", false);
      } else if (status === "solved") {
        dbQuery = dbQuery.eq("is_solved", true);
      }

      if (category !== "all") {
        dbQuery = dbQuery.eq("category", category);
      }

      const { data, error } = await dbQuery;

      if (!error && data && data.length > 0) {
        demands = data as Demand[];
      } else {
        demands = INITIAL_MOCK_DEMANDS;
      }
    } catch {
      demands = INITIAL_MOCK_DEMANDS;
    }
  } else {
    // Local / offline mock fallback
    demands = INITIAL_MOCK_DEMANDS;
  }

  // In-memory filtering for search & location scopes
  let filtered = demands.filter((item) => {
    // 1. Status Filter
    if (status === "active" && item.is_solved) return false;
    if (status === "solved" && !item.is_solved) return false;

    // 2. Category Filter
    if (category !== "all" && item.category !== category) return false;

    // 3. Search Keyword
    if (query) {
      const targetText = `${item.title} ${item.summary || ""} ${item.item_or_service || ""} ${item.location_name || ""} ${item.raw_content}`.toLowerCase();
      if (!targetText.includes(query)) return false;
    }

    // 4. Location Scope
    if (locationScope === "indonesia") {
      const loc = (item.location_name || "").toLowerCase();
      if (loc.includes("global") || loc.includes("australia") || loc.includes("singapore") || loc.includes("china")) {
        return false;
      }
    } else if (locationScope === "global") {
      const loc = (item.location_name || "").toLowerCase();
      if (!loc.includes("global") && !loc.includes("australia") && !loc.includes("export") && !loc.includes("china")) {
        return false;
      }
    }

    return true;
  });

  // 5. Proximity / "Near Me" Distance Calculation using Haversine
  if (nearLat !== null && nearLng !== null && !isNaN(nearLat) && !isNaN(nearLng)) {
    filtered = filtered
      .map((item) => {
        if (item.latitude !== null && item.longitude !== null) {
          const distance = calculateHaversineDistance(
            nearLat,
            nearLng,
            item.latitude,
            item.longitude
          );
          return { ...item, distance_km: distance };
        }
        return item;
      })
      .filter((item) => {
        if (locationScope === "near_me") {
          return item.distance_km !== undefined && item.distance_km <= radiusKm;
        }
        return true;
      });
  }

  return NextResponse.json({
    success: true,
    total: filtered.length,
    demands: filtered,
    is_supabase_connected: isSupabaseConfigured(),
  });
}
