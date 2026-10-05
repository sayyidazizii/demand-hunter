from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Optional, List
from datetime import datetime

@dataclass
class RawDemandItem:
    source_platform: str  # 'twitter', 'telegram', 'facebook', 'forum', 'reddit', 'google'
    source_url: str
    raw_content: str
    comment_context: Optional[str] = None
    author: Optional[str] = None
    posted_at: Optional[str] = None  # ISO format string or None (will default to now)

class BaseFetcher(ABC):
    @abstractmethod
    def fetch(self, keywords: List[str], limit: int = 10) -> List[RawDemandItem]:
        """Fetch raw items matching given keywords."""
        pass
