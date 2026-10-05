import logging
import requests
from typing import List
from datetime import datetime, timezone
from urllib.parse import quote_plus
from .base import BaseFetcher, RawDemandItem

logger = logging.getLogger(__name__)

class RedditFetcher(BaseFetcher):
    """
    Fetches real-time public posts from Reddit (e.g., r/indonesia, r/finansial)
    using Reddit's open JSON search endpoints.
    Requires no paid API keys.
    """

    SUBREDDITS = ["indonesia", "finansial", "forhire", "entrepreneur"]

    def __init__(self, user_agent: str = "DemandRadarBot/1.0 (Lead Intelligence Engine)"):
        self.headers = {"User-Agent": user_agent}

    def fetch(self, keywords: List[str] = None, limit: int = 10) -> List[RawDemandItem]:
        if not keywords:
            keywords = ["butuh supplier", "cari", "WTB", "vendor"]

        items: List[RawDemandItem] = []
        
        for subreddit in self.SUBREDDITS[:2]: # Primary Indonesian communities
            for kw in keywords[:3]:
                if len(items) >= limit:
                    break
                try:
                    url = f"https://www.reddit.com/r/{subreddit}/search.json?q={quote_plus(kw)}&restrict_sr=1&sort=new&limit=5"
                    response = requests.get(url, headers=self.headers, timeout=5)
                    if response.status_code != 200:
                        continue
                    
                    data = response.json()
                    children = data.get("data", {}).get("children", [])
                    
                    for child in children:
                        post = child.get("data", {})
                        title = post.get("title", "")
                        selftext = post.get("selftext", "")
                        combined_text = f"{title}\n{selftext}".strip()
                        
                        created_utc = post.get("created_utc")
                        posted_at = datetime.fromtimestamp(created_utc, tz=timezone.utc).isoformat() if created_utc else None
                        permalink = f"https://reddit.com{post.get('permalink', '')}"
                        
                        items.append(
                            RawDemandItem(
                                source_platform="reddit",
                                source_url=permalink,
                                raw_content=combined_text,
                                comment_context=None,
                                author=post.get("author", "unknown"),
                                posted_at=posted_at
                            )
                        )
                        if len(items) >= limit:
                            break
                except Exception as e:
                    logger.debug(f"Reddit fetcher error for query '{kw}' in r/{subreddit}: {e}")
                    continue

        return items
