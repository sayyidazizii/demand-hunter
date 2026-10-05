-- ==============================================================================
-- Demand Intelligence & Opportunity Lead Bot: Supabase PostgreSQL Schema
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create Demands Table
CREATE TABLE IF NOT EXISTS demands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    raw_content TEXT NOT NULL,
    summary TEXT,
    item_or_service VARCHAR(255),
    category VARCHAR(50) DEFAULT 'general', -- 'barang', 'jasa', 'impor', 'supplier'
    source_platform VARCHAR(50) NOT NULL,    -- 'twitter', 'telegram', 'facebook', 'forum', 'reddit', 'google'
    source_url TEXT,
    location_name VARCHAR(150),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    is_solved BOOLEAN DEFAULT FALSE,
    confidence_score FLOAT DEFAULT 1.0,
    contact_target VARCHAR(255),
    posted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uq_demands_source_url UNIQUE (source_url)
);

-- 3. Core Indices for High-Performance Queries & Filtering
CREATE INDEX IF NOT EXISTS idx_demands_posted_at ON demands (posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_demands_is_solved ON demands (is_solved);
CREATE INDEX IF NOT EXISTS idx_demands_location ON demands (location_name);
CREATE INDEX IF NOT EXISTS idx_demands_category ON demands (category);
CREATE INDEX IF NOT EXISTS idx_demands_coordinates ON demands (latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- 4. Full-Text Search (FTS) Index
CREATE INDEX IF NOT EXISTS idx_demands_search_vector ON demands USING gin (
    to_tsvector('indonesian', coalesce(title, '') || ' ' || coalesce(summary, '') || ' ' || coalesce(item_or_service, '') || ' ' || coalesce(location_name, ''))
);

-- 5. Row Level Security (RLS)
ALTER TABLE demands ENABLE ROW LEVEL SECURITY;

-- Allow anonymous and authenticated read access for dashboard
CREATE POLICY "Allow public read access on demands" 
    ON demands FOR SELECT 
    USING (true);

-- Allow service_role key full CRUD access for Python crawler ingestion
CREATE POLICY "Allow service role full access on demands" 
    ON demands FOR ALL 
    USING (auth.jwt() ->> 'role' = 'service_role')
    WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Fallback policy for local development / testing without service_role auth enforcement
CREATE POLICY "Allow anon insert/update if permitted"
    ON demands FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow anon update if permitted"
    ON demands FOR UPDATE
    USING (true);

-- Enable Supabase Realtime for instant websocket broadcasting on changes
ALTER PUBLICATION supabase_realtime ADD TABLE demands;

-- 6. Helper Function: Haversine Distance Search in SQL
-- Calculate distance between two coordinates in kilometers and filter by radius
CREATE OR REPLACE FUNCTION get_demands_near(
    user_lat DOUBLE PRECISION,
    user_lng DOUBLE PRECISION,
    radius_km DOUBLE PRECISION DEFAULT 50.0
)
RETURNS TABLE (
    id UUID,
    title VARCHAR,
    raw_content TEXT,
    summary TEXT,
    item_or_service VARCHAR,
    category VARCHAR,
    source_platform VARCHAR,
    source_url TEXT,
    location_name VARCHAR,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    is_solved BOOLEAN,
    confidence_score FLOAT,
    contact_target VARCHAR,
    posted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE,
    distance_km DOUBLE PRECISION
) 
LANGUAGE sql STABLE
AS $$
    SELECT 
        d.id,
        d.title,
        d.raw_content,
        d.summary,
        d.item_or_service,
        d.category,
        d.source_platform,
        d.source_url,
        d.location_name,
        d.latitude,
        d.longitude,
        d.is_solved,
        d.confidence_score,
        d.contact_target,
        d.posted_at,
        d.created_at,
        (
            6371 * acos(
                least(1.0, greatest(-1.0, 
                    cos(radians(user_lat)) * cos(radians(d.latitude)) *
                    cos(radians(d.longitude) - radians(user_lng)) +
                    sin(radians(user_lat)) * sin(radians(d.latitude))
                ))
            )
        ) AS distance_km
    FROM demands d
    WHERE d.latitude IS NOT NULL 
      AND d.longitude IS NOT NULL
      AND (
            6371 * acos(
                least(1.0, greatest(-1.0, 
                    cos(radians(user_lat)) * cos(radians(d.latitude)) *
                    cos(radians(d.longitude) - radians(user_lng)) +
                    sin(radians(user_lat)) * sin(radians(d.latitude))
                ))
            )
      ) <= radius_km
    ORDER BY distance_km ASC;
$$;

-- 7. Seed Initial Realistic Demand Leads (For Instant Testing & Verification)
INSERT INTO demands (
    title, raw_content, summary, item_or_service, category, source_platform, 
    source_url, location_name, latitude, longitude, is_solved, confidence_score, contact_target, posted_at
) VALUES 
(
    'Butuh Supplier Biji Kopi Robusta & Arabica 500kg/bulan',
    'Halo rekan-rekan, ada yang punya link supplier biji kopi Robusta Temanggung & Arabica Gayo untuk roastery baru di Jaksel? Butuh supply rutin minimal 500kg/bulan dengan grade fine commercial/specialty. DM atau kontak WA 081234567890. Terima kasih.',
    'Mencari supplier biji kopi Robusta & Arabica rutin 500kg/bulan untuk kebutuhan roastery.',
    'Biji Kopi Robusta & Arabica',
    'supplier',
    'twitter',
    'https://twitter.com/kopijakarta/status/178901234567890001',
    'Jakarta Selatan, DKI Jakarta',
    -6.2615,
    106.8106,
    false,
    0.98,
    'WA: 081234567890 / @kopijakarta',
    NOW() - INTERVAL '2 hours'
),
(
    'Dicari Jasa Import Borongan Door-to-Door dari Yiwu ke Surabaya',
    'URGENT! Butuh jasa forwarder impor borongan resmi/door to door dari Yiwu China ke Pergudangan Margomulyo Surabaya. Barang aksesoris HP sekitar 3 CBM. Ada rekomendasi freight forwarder terpercaya yang amanah? PM rate per CBM ya.',
    'Kebutuhan jasa forwarder impor door-to-door China-Surabaya 3 CBM aksesoris HP.',
    'Jasa Import Borongan Forwarder China-Surabaya',
    'impor',
    'telegram',
    'https://t.me/impor_indonesia_group/89412',
    'Surabaya, Jawa Timur',
    -7.2575,
    112.7521,
    false,
    0.96,
    'Telegram: @import_buyer_sub',
    NOW() - INTERVAL '4 hours'
),
(
    'WTB 20 Unit Monitor 24 Inch IPS 75Hz untuk Kantor Baru',
    'WTB / Cari 20 unit monitor kantor ukuran 24 inch panel IPS (merk LG/Samsung/AOC). Diutamakan toko/distributor area Bandung biar bisa COD atau kirim sameday. Budget 1.2jt - 1.5jt per unit. Faktur pajak diutamakan.',
    'Membeli 20 unit monitor 24 inch IPS untuk pengadaan kantor di Bandung.',
    'Monitor 24 Inch IPS 20 Unit',
    'barang',
    'forum',
    'https://kaskus.co.id/thread/6620f91823901/wtb-20-unit-monitor-kantor-bandung',
    'Bandung, Jawa Barat',
    -6.9175,
    107.6191,
    false,
    0.94,
    'Kaskus PM / Email: procurement@techstartup.id',
    NOW() - INTERVAL '6 hours'
),
(
    'Cari Vendor Konveksi Kaos Polo Bordir Komunitas 300 Pcs',
    'Dicari vendor konveksi untuk pengerjaan 300 pcs kaos polo bordir bahan lacoste pique. Deadline 2 minggu pengerjaan. Lokasi workshop Tangerang/Jakarta Barat lebih disukai agar bisa cek sample kain langsung. Portofolio kirim ke DM.',
    'Mencari vendor konveksi kaos polo bordir 300 pcs deadline 2 minggu.',
    'Jasa Konveksi Kaos Polo Bordir 300 Pcs',
    'jasa',
    'twitter',
    'https://twitter.com/event_id/status/178904561234567890',
    'Tangerang, Banten',
    -6.1783,
    106.6319,
    false,
    0.95,
    'Twitter DM @event_id',
    NOW() - INTERVAL '8 hours'
),
(
    'WTB Kardus Box Corrugated Die Cut Custom 2000 Pcs [SOLVED]',
    'Sudah dapet ya vendornya dari Mas Budi Tangerang. CLOSED! Terima kasih teman-teman grup yang sudah bantu rekomen.',
    'Pengadaan kardus box die-cut custom 2000 pcs (sudah terpenuhi).',
    'Kardus Box Corrugated Die Cut',
    'barang',
    'facebook',
    'https://facebook.com/groups/umkm.packaging/permalink/992817263541/',
    'Semarang, Jawa Tengah',
    -6.9667,
    110.4167,
    true,
    0.99,
    'FB User: Andi Packaging',
    NOW() - INTERVAL '1 day'
),
(
    'Looking for Indonesian Furniture Manufacturer (Teak & Rattan Export)',
    'We are a boutique hospitality interior studio based in Melbourne, Australia. We are actively sourcing reliable verified manufacturers for custom teak dining chairs and synthetic rattan lounge sets (1x 40ft HQ Container). Inspection report required.',
    'Australian buyer seeking verified Indonesian teak & rattan furniture manufacturers for export container.',
    'Teak & Rattan Furniture Export Manufacturer',
    'impor',
    'reddit',
    'https://reddit.com/r/indonesia/comments/1cxyza/looking_for_teak_furniture_supplier_export/',
    'Jepara, Jawa Tengah',
    -6.5888,
    110.6684,
    false,
    0.97,
    'Reddit: u/AussieDesignStudio',
    NOW() - INTERVAL '1 day 5 hours'
),
(
    'Butuh Jasa Ekspedisi Pendingin (Reefer Truck) Jakarta-Bali',
    'Butuh vendor truk reefer pendingin kapasitas 5 ton rute Jakarta - Denpasar untuk angkut frozen seafood. Jadwal rutin tiap pekan hari Selasa. Ada rekomendasi ekspedisi yang suhunya stabil minus 18 derajat?',
    'Mencari penyedia jasa truk pendingin / reefer rutin Jakarta ke Bali.',
    'Jasa Truk Pendingin (Reefer Truck)',
    'jasa',
    'telegram',
    'https://t.me/logistik_nusantara/5129',
    'Denpasar, Bali',
    -8.6705,
    115.2126,
    false,
    0.92,
    'WA: 087812984711',
    NOW() - INTERVAL '1 day 8 hours'
),
(
    'Supplier Bahan Baku Tepung Tapioka Kasar 10 Ton',
    'Dicari pabrik/supplier tangan pertama tepung tapioka kasar kualitas industri pakan & kerupuk. Kebutuhan 10 ton per pengiriman ke gudang Medan Deli. Tolong sertakan spesifikasi kadar air dan harga loco gudang.',
    'Kebutuhan tepung tapioka kasar skala industri 10 ton pengiriman ke Medan.',
    'Tepung Tapioka Kasar 10 Ton',
    'supplier',
    'forum',
    'https://agrobisnis.id/threads/butuh-tapioka-medan-10-ton.4421/',
    'Medan, Sumatera Utara',
    3.5952,
    98.6722,
    false,
    0.93,
    'Telp: 085270112233 (Pak Hendra)',
    NOW() - INTERVAL '2 days'
)
ON CONFLICT (source_url) DO UPDATE SET 
    title = EXCLUDED.title,
    summary = EXCLUDED.summary,
    item_or_service = EXCLUDED.item_or_service,
    is_solved = EXCLUDED.is_solved,
    confidence_score = EXCLUDED.confidence_score;
