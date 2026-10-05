import os
from pathlib import Path
from dotenv import load_dotenv

# Find and load .env from crawler dir or parent project root
crawler_dir = Path(__file__).resolve().parent
project_root = crawler_dir.parent
load_dotenv(crawler_dir / ".env")
load_dotenv(project_root / ".env")
load_dotenv(project_root / ".env.local")

# API Keys & Endpoints
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL") or os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")
SEARCH_API_KEY = os.getenv("SEARCH_API_KEY", "")

# Gemini Model Name
GEMINI_MODEL_NAME = os.getenv("GEMINI_MODEL_NAME", "gemini-1.5-flash")

# Default Target Keywords for Demand Radar
TARGET_KEYWORDS = [
    "butuh supplier",
    "cari barang",
    "WTB",
    "impor jasa",
    "dicari supplier",
    "jasa import borongan",
    "butuh vendor",
    "looking for supplier indonesia"
]

# Indonesian & Regional Coordinates Reference Dictionary
CITY_COORDINATES = {
    "jakarta": (-6.2088, 106.8456),
    "jaksel": (-6.2615, 106.8106),
    "jakarta selatan": (-6.2615, 106.8106),
    "jakpus": (-6.1805, 106.8284),
    "jakarta pusat": (-6.1805, 106.8284),
    "jakbar": (-6.1683, 106.7588),
    "jakarta barat": (-6.1683, 106.7588),
    "jaktim": (-6.2250, 106.9004),
    "jakarta timur": (-6.2250, 106.9004),
    "jakut": (-6.1214, 106.7741),
    "jakarta utara": (-6.1214, 106.7741),
    "surabaya": (-7.2575, 112.7521),
    "sby": (-7.2575, 112.7521),
    "bandung": (-6.9175, 107.6191),
    "bdg": (-6.9175, 107.6191),
    "medan": (3.5952, 98.6722),
    "semarang": (-6.9667, 110.4167),
    "tangerang": (-6.1783, 106.6319),
    "tangsel": (-6.2887, 106.7179),
    "tangerang selatan": (-6.2887, 106.7179),
    "bekasi": (-6.2383, 106.9756),
    "depok": (-6.4025, 106.7942),
    "bogor": (-6.5971, 106.8060),
    "yogyakarta": (-7.7956, 110.3695),
    "jogja": (-7.7956, 110.3695),
    "solo": (-7.5666, 110.8250),
    "surakarta": (-7.5666, 110.8250),
    "denpasar": (-8.6705, 115.2126),
    "bali": (-8.4095, 115.1889),
    "makassar": (-5.1477, 119.4327),
    "palembang": (-2.9761, 104.7754),
    "batam": (1.1301, 104.0529),
    "pekanbaru": (0.5071, 101.4478),
    "malang": (-7.9666, 112.6326),
    "jepara": (-6.5888, 110.6684),
    "cirebon": (-6.7320, 108.5523),
    "singapore": (1.3521, 103.8198),
    "kuala lumpur": (3.1390, 101.6869),
    "global": (0.0, 0.0)
}
