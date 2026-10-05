code
Markdown
# Project Specification: Demand Intelligence & Opportunity Lead Bot

## 1. Overview & Objective
Build an automated lead generation & demand radar web platform that scrapes/monitors demands for goods, services, or imports ("WTB", "butuh supplier", "cari jasa").
The system processes data with Google Gemini AI to extract intent, location, and fulfilled/solved status, stores leads into Supabase (PostgreSQL), and displays them on a Next.js responsive dashboard hosted on Vercel.

---

## 2. Tech Stack Requirements (Zero-Cost / Free Tier Compatible)
- **Frontend Dashboard**: Next.js 14+ (App Router), React, Tailwind CSS, Lucide Icons, deployed for Vercel.
- **Database & Geolocation**: Supabase (PostgreSQL) with table schema supporting location coordinate filtering and full-text search.
- **AI Processing Engine**: Google Gemini API (`gemini-1.5-flash`) for intent recognition, entity extraction, and status classification.
- **Scraper / Ingestion**: Python 3.10+ standalone script using `google-generativeai`, `supabase-py`, and `requests` / `telethon` (or Google Custom Search / SerpAPI).

---

## 3. Database Schema (Supabase SQL)
Generate a migration file `supabase_schema.sql` containing:

```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS demands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    raw_content TEXT NOT NULL,
    summary TEXT,
    item_or_service VARCHAR(255),
    category VARCHAR(50) DEFAULT 'general', -- 'barang', 'jasa', 'impor', 'supplier'
    source_platform VARCHAR(50) NOT NULL,    -- 'twitter', 'telegram', 'facebook', 'forum'
    source_url TEXT,
    location_name VARCHAR(150),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    is_solved BOOLEAN DEFAULT FALSE,
    confidence_score FLOAT DEFAULT 1.0,
    contact_target VARCHAR(255),
    posted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_demands_posted_at ON demands (posted_at DESC);
CREATE INDEX idx_demands_is_solved ON demands (is_solved);
CREATE INDEX idx_demands_location ON demands (location_name);
4. System Implementation Steps
Phase 1: Environment & Config
Create .env.example with:
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
SEARCH_API_KEY=
Phase 2: Python Bot Scraper & AI Engine (crawler/)
Create crawler/pipeline.py with the following workflow:
Fetch: Query public feeds/APIs for keywords like butuh supplier, cari barang, WTB, impor jasa.
Filter & Classify via Gemini AI:
Send text to Gemini Flash with strict JSON schema:
code
JSON
{
  "is_buyer_intent": true,
  "title": "Short title",
  "item_or_service": "Extracted item",
  "category": "barang|jasa|impor",
  "location_name": "City/Region in Indonesia or Global",
  "latitude": -6.2088,
  "longitude": 106.8456,
  "is_solved": false,
  "summary": "1 sentence explanation"
}
Ignore if is_buyer_intent == false.
Read comment context if available: if phrases like "sudah dapet", "closed", "sold" appear, mark is_solved = true.
Persist: Upsert into Supabase demands table based on source_url.
Phase 3: Next.js Frontend Dashboard (frontend/)
Create a modern, clean web interface:
Views & Filters:
Default Ordering: Sorted by posted_at descending (Newest first).
Filter by Status: All, Active Only (is_solved = false), or Solved (is_solved = true).
Filter by Location:
Option 1: "Near Me" (Uses browser HTML5 Geolocation API, calculating distance in KM using Haversine formula).
Option 2: All Indonesia.
Option 3: International / Global.
Filter by Category: All, Barang, Jasa, Impor.
Components:
DemandCard: Displays title, summary, source badge (Twitter/Telegram), location badge, solved status pill (Green = Open, Grey = Closed), relative time ("2 hours ago"), and button "Buka Link Asli".
StatsHeader: Count of active opportunities found today.
5. Verification & Acceptance Criteria

Schema executes cleanly on PostgreSQL/Supabase.

AI prompt returns valid structured JSON reliably.

Dashboard builds with npm run build without TypeScript/ESLint errors.

Geolocation filter correctly calculates radius from user's current lat/long.

Vercel-ready structure (/ root or properly configured workspace).