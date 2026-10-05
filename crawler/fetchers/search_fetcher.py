import logging
import requests
from typing import List
from bs4 import BeautifulSoup
from urllib.parse import quote_plus
from .base import BaseFetcher, RawDemandItem
from ..config import SEARCH_API_KEY

logger = logging.getLogger(__name__)

class SearchFetcher(BaseFetcher):
    """
    Scrapes public demand queries across web search.
    Supports SerpAPI when API key is provided, or open search parsing.
    """

    def __init__(self, api_key: str = SEARCH_API_KEY):
        self.api_key = api_key

    def fetch(self, keywords: List[str] = None, limit: int = 10) -> List[RawDemandItem]:
        if not keywords:
            keywords = ["site:twitter.com 'butuh supplier'", "site:kaskus.co.id 'WTB'"]

        items: List[RawDemandItem] = []

        # If SerpAPI key is available
        if self.api_key:
            for kw in keywords[:3]:
                if len(items) >= limit:
                    break
                try:
                    url = f"https://serpapi.com/search.json?q={quote_plus(kw)}&api_key={self.api_key}&hl=id&gl=id&num=5"
                    resp = requests.get(url, timeout=6)
                    if resp.status_code == 200:
                        results = resp.json().get("organic_results", [])
                        for res in results:
                            link = res.get("link", "")
                            title = res.get("title", "")
                            snippet = res.get("snippet", "")
                            
                            platform = "google"
                            if "twitter.com" in link or "x.com" in link:
                                platform = "twitter"
                            elif "t.me" in link or "telegram" in link:
                                platform = "telegram"
                            elif "facebook.com" in link:
                                platform = "facebook"
                            elif "kaskus" in link or "forum" in link:
                                platform = "forum"

                            items.append(
                                RawDemandItem(
                                    source_platform=platform,
                                    source_url=link,
                                    raw_content=f"{title}\n{snippet}",
                                    comment_context=None,
                                    author=None,
                                    posted_at=None
                                )
                            )
                except Exception as e:
                    logger.warning(f"SerpAPI query error for '{kw}': {e}")

        # DuckDuckGo fallback / lightweight html search if still below limit
        if len(items) < limit:
            try:
                headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
                query = "site:twitter.com butuh supplier kopi OR kain OR jasa"
                url = f"https://html.duckduckgo.com/html/?q={quote_plus(query)}"
                resp = requests.get(url, headers=headers, timeout=5)
                if resp.status_code == 200:
                    soup = BeautifulSoup(resp.text, "html.parser")
                    results = soup.find_all("div", class_="result__body")
                    for r in results:
                        link_tag = r.find("a", class_="result__url")
                        snippet_tag = r.find("a", class_="result__snippet")
                        title_tag = r.find("a", class_="result__title")
                        
                        if snippet_tag and link_tag:
                            link = link_tag.get("href", "").strip()
                            text = f"{title_tag.get_text() if title_tag else ''}\n{snippet_tag.get_text()}".strip()
                            items.append(
                                RawDemandItem(
                                    source_platform="twitter" if "twitter" in link else "forum",
                                    source_url=link,
                                    raw_content=text,
                                    comment_context=None
                                )
                            )
                        if len(items) >= limit:
                            break
            except Exception as e:
                logger.debug(f"DuckDuckGo search fallback notice: {e}")

        return items
