export type DemandCategory = 'barang' | 'jasa' | 'impor' | 'supplier' | 'general';

export type SourcePlatform = 'twitter' | 'telegram' | 'facebook' | 'forum' | 'reddit' | 'google' | string;

export interface Demand {
  id: string;
  title: string;
  raw_content: string;
  summary: string | null;
  item_or_service: string | null;
  category: DemandCategory;
  source_platform: SourcePlatform;
  source_url: string | null;
  location_name: string | null;
  latitude: number | null;
  longitude: number | null;
  is_solved: boolean;
  confidence_score: number | null;
  contact_target: string | null;
  posted_at: string;
  created_at: string;
  distance_km?: number; // Calculated on client when "Near Me" is active
}

export type StatusFilter = 'all' | 'active' | 'solved';
export type LocationScope = 'all' | 'near_me' | 'indonesia' | 'global';
export type CategoryFilter = 'all' | 'barang' | 'jasa' | 'impor' | 'supplier';
export type SortOption = 'newest' | 'oldest' | 'nearest';
