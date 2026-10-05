#!/usr/bin/env python3
"""
Demand Intelligence & Opportunity Lead Bot: Ingestion & AI Pipeline
===================================================================
1. Fetch: Scrapes raw posts from multiple sources (Twitter, Telegram, Reddit, Forums).
2. Classify: Uses Google Gemini Flash to extract buyer intent, category, location, and solved status.
3. Filter: Rejects non-buyer intent (e.g. spam, seller ads, job ads).
4. Solved Status: Accurately tags fulfilled leads (e.g. "sudah dapet", "closed", "sold").
5. Persist: Upserts into Supabase `demands` table based on `source_url`.
"""

import sys
import json
import logging
import argparse
from pathlib import Path
from typing import List, Dict, Any

# Ensure crawler directory is on pythonpath
crawler_dir = Path(__file__).resolve().parent
if str(crawler_dir.parent) not in sys.path:
    sys.path.insert(0, str(crawler_dir.parent))

# Ensure safe UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
if hasattr(sys.stderr, "reconfigure"):
    try:
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

from crawler.config import (
    SUPABASE_URL,
    SUPABASE_KEY,
    TARGET_KEYWORDS
)
from crawler.fetchers.base import RawDemandItem
from crawler.fetchers.mock_fetcher import MockFetcher
from crawler.fetchers.reddit_rss_fetcher import RedditFetcher
from crawler.fetchers.search_fetcher import SearchFetcher
from crawler.gemini_extractor import GeminiExtractor, ExtractedDemand

try:
    from supabase import create_client, Client
    HAS_SUPABASE = True
except ImportError:
    HAS_SUPABASE = False

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S"
)
logger = logging.getLogger("Pipeline")


class DemandPipeline:
    def __init__(self, dry_run: bool = False):
        self.dry_run = dry_run
        self.extractor = GeminiExtractor()
        self.supabase: Any = None

        if HAS_SUPABASE and SUPABASE_URL and SUPABASE_KEY and "your-project" not in SUPABASE_URL:
            try:
                self.supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
                logger.info("Connected successfully to Supabase database.")
            except Exception as e:
                logger.warning(f"Failed to connect to Supabase: {e}. Output will be saved to local JSON.")
        else:
            logger.info("Supabase credentials not configured yet. Operating in local preview mode.")

    def fetch_all(self, source: str = "all", limit: int = 10) -> List[RawDemandItem]:
        """Aggregate raw posts from requested fetchers."""
        items: List[RawDemandItem] = []
        
        # 1. Mock Fetcher (guaranteed high-quality benchmark items)
        if source in ["all", "mock"]:
            mock = MockFetcher()
            items.extend(mock.fetch(TARGET_KEYWORDS, limit=limit))

        # 2. Reddit Fetcher (live open Indonesian subreddits)
        if source in ["all", "reddit"]:
            try:
                reddit = RedditFetcher()
                live_items = reddit.fetch(TARGET_KEYWORDS, limit=5)
                items.extend(live_items)
            except Exception as e:
                logger.debug(f"Reddit scraper notice: {e}")

        # 3. Web Search Fetcher
        if source in ["all", "search"]:
            try:
                searcher = SearchFetcher()
                search_items = searcher.fetch(TARGET_KEYWORDS, limit=5)
                items.extend(search_items)
            except Exception as e:
                logger.debug(f"Web search scraper notice: {e}")

        logger.info(f"Total raw posts collected: {len(items)}")
        return items[:limit]

    def process_and_persist(self, raw_items: List[RawDemandItem]) -> Dict[str, Any]:
        """
        Runs Gemini AI extraction on each raw item and upserts valid demands into Supabase.
        """
        stats = {
            "total_scraped": len(raw_items),
            "valid_demands": 0,
            "filtered_noise": 0,
            "active_leads": 0,
            "solved_leads": 0,
            "upserted_to_db": 0,
        }
        
        valid_records: List[Dict[str, Any]] = []

        print("\n" + "="*70)
        print("[RADAR] RUNNING GEMINI AI EXTRACTION & DEMAND CLASSIFIER")
        print("="*70)

        for idx, item in enumerate(raw_items, 1):
            logger.info(f"[{idx}/{len(raw_items)}] Processing post from [{item.source_platform.upper()}]: {item.source_url}")
            
            # Step 2: Filter & Classify via Gemini AI
            extracted: ExtractedDemand = self.extractor.extract(
                raw_content=item.raw_content,
                comment_context=item.comment_context
            )

            # Ignore if is_buyer_intent == False
            if not extracted or not extracted.is_buyer_intent:
                logger.info(f"   [SKIP] REJECTED: Not buyer intent (noise/seller/spam/job).")
                stats["filtered_noise"] += 1
                continue

            stats["valid_demands"] += 1
            if extracted.is_solved:
                stats["solved_leads"] += 1
                status_str = "CLOSED / SOLVED"
            else:
                stats["active_leads"] += 1
                status_str = "ACTIVE LEAD"

            logger.info(f"   [OK] ACCEPTED [{status_str}] | Category: {extracted.category.upper()} | Loc: {extracted.location_name}")
            logger.info(f"        Title: {extracted.title}")
            logger.info(f"        Summary: {extracted.summary}")
            if extracted.contact_target:
                logger.info(f"        Contact: {extracted.contact_target}")

            # Prepare DB record
            record = {
                "title": extracted.title,
                "raw_content": item.raw_content,
                "summary": extracted.summary,
                "item_or_service": extracted.item_or_service,
                "category": extracted.category,
                "source_platform": item.source_platform,
                "source_url": item.source_url,
                "location_name": extracted.location_name,
                "latitude": extracted.latitude,
                "longitude": extracted.longitude,
                "is_solved": extracted.is_solved,
                "confidence_score": extracted.confidence_score,
                "contact_target": extracted.contact_target or item.author,
            }
            if item.posted_at:
                record["posted_at"] = item.posted_at

            valid_records.append(record)

            # Step 3: Persist into Supabase
            if not self.dry_run and self.supabase:
                try:
                    res = self.supabase.table("demands").upsert(
                        record,
                        on_conflict="source_url"
                    ).execute()
                    stats["upserted_to_db"] += 1
                    logger.info("        [DB] Successfully upserted into Supabase `demands` table.")
                except Exception as e:
                    logger.error(f"        [ERR] Supabase upsert error: {e}")

        # Save to local JSON artifact for inspection
        output_file = crawler_dir / "output_demands.json"
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(valid_records, f, indent=2, ensure_ascii=False)
        logger.info(f"Saved {len(valid_records)} processed leads to {output_file}")

        self._print_summary(stats)
        return stats

    def _print_summary(self, stats: Dict[str, Any]):
        print("\n" + "="*70)
        print("[SUMMARY] PIPELINE INGESTION SUMMARY REPORT")
        print("="*70)
        print(f"Total Raw Posts Ingested : {stats['total_scraped']}")
        print(f"Noise / Non-Buyer Filtered: {stats['filtered_noise']}")
        print(f"Verified Buyer Demands   : {stats['valid_demands']}")
        print(f"  +-- Active Leads (Open): {stats['active_leads']}")
        print(f"  +-- Solved Leads (Done): {stats['solved_leads']}")
        print(f"Upserted into Supabase   : {stats['upserted_to_db']}")
        print("="*70 + "\n")


import time

def main():
    parser = argparse.ArgumentParser(description="Demand Radar AI Ingestion Bot")
    parser.add_argument("--source", choices=["all", "mock", "reddit", "search"], default="mock",
                        help="Data source to scrape (default: mock)")
    parser.add_argument("--limit", type=int, default=10,
                        help="Maximum posts to process (default: 10)")
    parser.add_argument("--dry-run", action="store_true",
                        help="Run AI extraction without persisting to Supabase")
    parser.add_argument("--loop", action="store_true",
                        help="Run crawler continuously in real-time loop")
    parser.add_argument("--interval", type=int, default=300,
                        help="Seconds between cycles when using --loop (default: 300s / 5 mins)")
    args = parser.parse_args()

    pipeline = DemandPipeline(dry_run=args.dry_run)

    if args.loop:
        logger.info(f"Radar loop activated. Running every {args.interval} seconds. Press Ctrl+C to stop.")
        while True:
            try:
                raw_items = pipeline.fetch_all(source=args.source, limit=args.limit)
                pipeline.process_and_persist(raw_items)
            except KeyboardInterrupt:
                logger.info("Radar stopped by user.")
                break
            except Exception as e:
                logger.error(f"Error in radar cycle: {e}")
            logger.info(f"Cycle completed. Next scan in {args.interval} seconds...")
            time.sleep(args.interval)
    else:
        raw_items = pipeline.fetch_all(source=args.source, limit=args.limit)
        pipeline.process_and_persist(raw_items)


if __name__ == "__main__":
    main()
