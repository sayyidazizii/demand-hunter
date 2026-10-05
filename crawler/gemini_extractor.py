import json
import re
import logging
from typing import Optional, Dict, Any
from pydantic import BaseModel, Field

try:
    import google.generativeai as genai
    HAS_GENAI = True
except ImportError:
    HAS_GENAI = False

from .config import GEMINI_API_KEY, GEMINI_MODEL_NAME, CITY_COORDINATES

logger = logging.getLogger(__name__)

# Keywords that indicate a demand has been satisfied/closed
SOLVED_KEYWORDS = [
    "sudah dapet", "sudah dapat", "closed", "sold", "udah ada", 
    "selesai", "terpenuhi", "dapet vendor", "sudah close", "sudah nemu", 
    "tidak butuh lagi", "done", "solved"
]

class ExtractedDemand(BaseModel):
    is_buyer_intent: bool = Field(description="True if post is actively seeking to buy, hire, source or import goods/services.")
    title: str = Field(description="Clear, concise headline summarizing the demand.")
    item_or_service: Optional[str] = Field(default=None, description="The specific item, material, or service requested.")
    category: str = Field(default="general", description="Category: 'barang', 'jasa', 'impor', or 'supplier'.")
    location_name: Optional[str] = Field(default="Indonesia", description="City, province, or region requested or buyer location.")
    latitude: Optional[float] = Field(default=None, description="Latitude of the location.")
    longitude: Optional[float] = Field(default=None, description="Longitude of the location.")
    is_solved: bool = Field(default=False, description="True if the request has already been closed, fulfilled, or solved.")
    summary: Optional[str] = Field(default=None, description="1 sentence concise Indonesian explanation of the opportunity.")
    confidence_score: float = Field(default=0.95, description="Confidence score between 0.0 and 1.0.")
    contact_target: Optional[str] = Field(default=None, description="Extracted contact info like phone, WA, telegram or email.")

class GeminiExtractor:
    def __init__(self, api_key: Optional[str] = None, model_name: str = GEMINI_MODEL_NAME):
        self.api_key = api_key or GEMINI_API_KEY
        self.model_name = model_name
        self.client_ready = False

        if self.api_key and HAS_GENAI:
            try:
                genai.configure(api_key=self.api_key)
                self.model = genai.GenerativeModel(
                    model_name=self.model_name,
                    generation_config={
                        "temperature": 0.1,
                        "response_mime_type": "application/json"
                    }
                )
                self.client_ready = True
                logger.info(f"Initialized GeminiExtractor with model: {self.model_name}")
            except Exception as e:
                logger.warning(f"Failed to initialize Gemini API: {e}. Falling back to heuristic parser.")
        else:
            logger.info("No Gemini API key or SDK found. Using intelligent heuristic extractor.")

    def _lookup_coordinates(self, location_name: Optional[str]) -> tuple[Optional[str], Optional[float], Optional[float]]:
        """Match city name or alias against known coordinate dictionary."""
        if not location_name:
            return "Jakarta", -6.2088, 106.8456
        
        loc_lower = location_name.lower().strip()
        for city, coords in CITY_COORDINATES.items():
            if city in loc_lower:
                canonical_name = "Jakarta Selatan" if city == "jaksel" else \
                                 "Jakarta Barat" if city == "jakbar" else \
                                 "Jakarta Pusat" if city == "jakpus" else \
                                 "Jakarta Timur" if city == "jaktim" else \
                                 "Jakarta Utara" if city == "jakut" else \
                                 "Surabaya" if city == "sby" else \
                                 "Bandung" if city == "bdg" else \
                                 "Yogyakarta" if city == "jogja" else \
                                 city.title()
                return canonical_name, coords[0], coords[1]
        return location_name, None, None

    def _check_is_solved(self, raw_content: str, comment_context: Optional[str] = None) -> bool:
        """Scan text and comment context for solved/closed indicators."""
        combined = f"{raw_content} {comment_context or ''}".lower()
        for kw in SOLVED_KEYWORDS:
            if kw in combined:
                return True
        return False

    def _extract_contact_info(self, text: str) -> Optional[str]:
        """Simple regex extraction for WA, phone, or email."""
        phone_match = re.search(r'(?:wa|whatsapp|telp|hp|call|hub)?[:\s]*(08\d{8,12}|\+62\d{8,12})', text, re.IGNORECASE)
        if phone_match:
            return phone_match.group(0).strip()
        
        email_match = re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', text)
        if email_match:
            return email_match.group(0)
            
        handle_match = re.search(r'@[a-zA-Z0-9_]{3,30}', text)
        if handle_match:
            return handle_match.group(0)
            
        return None

    def _heuristic_extract(self, raw_content: str, comment_context: Optional[str] = None) -> ExtractedDemand:
        """Intelligent offline fallback parser when Gemini API is unavailable."""
        content_lower = raw_content.lower()
        
        # Check negative signals first (Jobs, Recruitment, Direct Sellers)
        job_signals = ["lowongan kerja", "loker", "dibutuhkan segera admin", "recruitment", "open recruitment", "host live", "gaji"]
        seller_signals = ["dijual", "jual ", "ready stock", "promo cuci gudang", "harga promo"]
        
        is_job = any(js in content_lower for js in job_signals)
        is_seller = any(ss in content_lower for ss in seller_signals) and not any(bs in content_lower for bs in ["butuh", "cari", "wtb"])

        if is_job or is_seller:
            return ExtractedDemand(
                is_buyer_intent=False,
                title=raw_content[:80],
                summary="Filtered out (job post or seller ad)",
                confidence_score=0.9
            )

        # Determine buyer intent
        buyer_intent_signals = [
            "butuh", "cari", "wtb", "dicari", "mencari", "supplier", "vendor",
            "jasa import", "beli", "need supplier", "sourcing", "looking for", "borongan"
        ]
        is_buyer_intent = any(sig in content_lower for sig in buyer_intent_signals)
        
        # Determine category
        category = "general"
        if any(w in content_lower for w in ["impor", "import", "forwarder", "cbm", "yiwu", "china", "export"]):
            category = "impor"
        elif any(w in content_lower for w in ["supplier", "pabrik", "distributor", "tangan pertama", "grosir"]):
            category = "supplier"
        elif any(w in content_lower for w in ["jasa", "vendor", "konveksi", "ekspedisi", "sewa", "desain", "borongan"]):
            category = "jasa"
        elif any(w in content_lower for w in ["barang", "unit", "beli", "wtb", "monitor", "kardus", "kopi", "pcs"]):
            category = "barang"

        # Check solved status
        is_solved = self._check_is_solved(raw_content, comment_context)
        
        # Detect location & coordinates
        location_name = "Indonesia"
        lat, lng = -6.2088, 106.8456
        for city, coords in CITY_COORDINATES.items():
            if city != "global" and city in content_lower:
                canonical_name, c_lat, c_lng = self._lookup_coordinates(city)
                location_name = canonical_name or city.title()
                lat, lng = c_lat, c_lng
                break
                
        # Generate short title
        first_line = raw_content.strip().split("\n")[0]
        title = first_line[:120] if len(first_line) > 10 else raw_content[:120]
        
        # Contact info
        contact = self._extract_contact_info(raw_content)

        return ExtractedDemand(
            is_buyer_intent=is_buyer_intent,
            title=title,
            item_or_service=title[:60],
            category=category,
            location_name=location_name,
            latitude=lat,
            longitude=lng,
            is_solved=is_solved,
            summary=raw_content[:200].replace("\n", " ").strip(),
            confidence_score=0.88,
            contact_target=contact
        )

    def extract(self, raw_content: str, comment_context: Optional[str] = None) -> Optional[ExtractedDemand]:
        """
        Processes text using Gemini Flash with strict JSON schema.
        Returns ExtractedDemand object or None if is_buyer_intent is False.
        """
        if not self.client_ready:
            result = self._heuristic_extract(raw_content, comment_context)
            return result if result.is_buyer_intent else None

        prompt = f"""
Anda adalah Demand Intelligence Engine untuk mengenali kebutuhan bisnis, WTB (Want To Buy), pencarian supplier, impor, atau jasa.
Tugas Anda adalah menganalisis teks posting publik dan komentar terkait untuk mengekstraksi data ke dalam format JSON yang valid.

Aturan Penting:
1. "is_buyer_intent": Set true HANYA jika pembuat post sedang mencari/membutuhkan/ingin membeli barang, jasa, impor, atau supplier. Set false jika post adalah iklan jualan, spam, atau obrolan umum tanpa kebutuhan beli.
2. "is_solved": Set true jika di teks atau komentar terdapat indikasi bahwa kebutuhan sudah terpenuhi / selesai (misal: "sudah dapet", "closed", "sold", "udah ada", "selesai", "dapet vendor").
3. "category": Wajib salah satu dari: 'barang', 'jasa', 'impor', 'supplier'.
4. "location_name": Nama kota atau wilayah spesifik (misal: 'Jakarta Selatan', 'Surabaya', 'Bandung', 'Jepara', atau 'Global').
5. "latitude" dan "longitude": Berikan estimasi koordinat desimal kota tersebut.
6. "summary": Ringkasan 1 kalimat jelas dalam Bahasa Indonesia tentang apa yang dicari.

Teks Post:
\"\"\"
{raw_content}
\"\"\"

Komentar / Konteks Tambahan (jika ada):
\"\"\"
{comment_context or 'Tidak ada komentar.'}
\"\"\"

Kembalikan HANYA JSON dengan struktur:
{{
  "is_buyer_intent": true,
  "title": "Judul singkat dan jelas",
  "item_or_service": "Nama barang atau jasa yang dicari",
  "category": "barang|jasa|impor|supplier",
  "location_name": "Nama Kota/Wilayah",
  "latitude": -6.2088,
  "longitude": 106.8456,
  "is_solved": false,
  "summary": "1 kalimat penjelasan kebutuhan",
  "confidence_score": 0.95,
  "contact_target": "Nomor WA, Telepon, Username, atau Email jika ada"
}}
"""
        try:
            response = self.model.generate_content(prompt)
            text = response.text.strip()
            
            # Clean markdown JSON block if present
            if text.startswith("```"):
                text = re.sub(r"^```(?:json)?\n?", "", text)
                text = re.sub(r"\n?```$", "", text)
                text = text.strip()

            data = json.loads(text)
            
            # Overwrite is_solved if comment/text explicitly has solved keywords
            if not data.get("is_solved", False):
                if self._check_is_solved(raw_content, comment_context):
                    data["is_solved"] = True

            # Coordinate verification & fallback
            lat = data.get("latitude")
            lng = data.get("longitude")
            if lat is None or lng is None:
                calc_lat, calc_lng = self._lookup_coordinates(data.get("location_name"))
                if calc_lat is not None:
                    data["latitude"] = calc_lat
                    data["longitude"] = calc_lng

            # Fallback contact extraction if Gemini missed it
            if not data.get("contact_target"):
                data["contact_target"] = self._extract_contact_info(raw_content)

            demand = ExtractedDemand(**data)

            if not demand.is_buyer_intent:
                logger.info(f"Skipped non-buyer intent post: {demand.title}")
                return None

            return demand

        except Exception as e:
            logger.error(f"Error during Gemini extraction: {e}. Falling back to heuristic extractor.")
            result = self._heuristic_extract(raw_content, comment_context)
            return result if result.is_buyer_intent else None
