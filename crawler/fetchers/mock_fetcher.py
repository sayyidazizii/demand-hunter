from typing import List
from datetime import datetime, timezone, timedelta
from .base import BaseFetcher, RawDemandItem

class MockFetcher(BaseFetcher):
    """
    Provides realistic simulated leads from multiple platforms.
    Useful for offline testing, CI/CD validation, and local demo workflows.
    Includes active buyer demands, solved demands, and non-buyer noise (spam/sellers).
    """

    def fetch(self, keywords: List[str] = None, limit: int = 10) -> List[RawDemandItem]:
        now = datetime.now(timezone.utc)
        
        sample_items = [
            # 1. Active Supplier Request (Twitter)
            RawDemandItem(
                source_platform="twitter",
                source_url="https://twitter.com/kopinusantara_id/status/178901234567890001",
                raw_content="[WTB/Cari] Butuh supplier biji kopi Robusta Temanggung & Arabica Gayo untuk roastery baru di Jaksel. Butuh supply rutin minimal 500kg/bulan dengan grade fine commercial. WA 081234567890 atau DM ya guys.",
                comment_context="Bro cek DM ada sample gratis.",
                author="@kopinusantara_id",
                posted_at=(now - timedelta(hours=2)).isoformat()
            ),
            # 2. Active Import Forwarder Request (Telegram)
            RawDemandItem(
                source_platform="telegram",
                source_url="https://t.me/impor_indonesia_group/89412",
                raw_content="URGENT! Butuh jasa forwarder impor borongan resmi door-to-door dari Yiwu China ke Pergudangan Margomulyo Surabaya. Muatan aksesoris HP sekitar 3 CBM. Ada rekomendasi freight forwarder terpercaya? PM rate per CBM ke t.me/import_buyer_sub.",
                comment_context=None,
                author="@import_buyer_sub",
                posted_at=(now - timedelta(hours=4)).isoformat()
            ),
            # 3. Active Goods Procurement (Forum)
            RawDemandItem(
                source_platform="forum",
                source_url="https://kaskus.co.id/thread/6620f91823901/wtb-20-unit-monitor-kantor-bandung",
                raw_content="WTB 20 Unit Monitor 24 Inch IPS 75Hz merk LG/Samsung untuk kantor cabang Bandung. Diutamakan supplier lokal Bandung agar bisa kirim sameday dan terbitkan faktur pajak. Budget 1.2 - 1.5jt/unit. Hubungi email: procurement@techstartup.id.",
                comment_context="Sudah kirim quotation via email pak.",
                author="procurement_mgr",
                posted_at=(now - timedelta(hours=6)).isoformat()
            ),
            # 4. Solved / Fulfilled Request (Facebook) -> Must be marked is_solved = True
            RawDemandItem(
                source_platform="facebook",
                source_url="https://facebook.com/groups/umkm.packaging/permalink/992817263541/",
                raw_content="Dicari pabrik karton kardus box corrugated die-cut custom 2000 pcs di Semarang untuk packaging hampers lebaran.",
                comment_context="Update: sudah dapet ya dari Mas Budi CV Karton Abadi. CLOSED! Makasih semuanya.",
                author="Andi Packaging",
                posted_at=(now - timedelta(days=1)).isoformat()
            ),
            # 5. Active Service / Vendor Request (Twitter)
            RawDemandItem(
                source_platform="twitter",
                source_url="https://twitter.com/event_id/status/178904561234567890",
                raw_content="Dicari vendor konveksi untuk pengerjaan 300 pcs kaos polo bordir bahan lacoste pique. Deadline pengerjaan 2 minggu. Lokasi workshop Tangerang atau Jakarta Barat lebih disukai. DM pricelist dan portofolio.",
                comment_context="Halo kak kami konveksi cipadu siap bantu.",
                author="@event_id",
                posted_at=(now - timedelta(hours=8)).isoformat()
            ),
            # 6. Global / Export Sourcing (Reddit)
            RawDemandItem(
                source_platform="reddit",
                source_url="https://reddit.com/r/indonesia/comments/1cxyza/looking_for_teak_furniture_supplier_export/",
                raw_content="We are a boutique hospitality interior studio based in Melbourne, Australia. We are actively sourcing reliable verified manufacturers in Jepara for custom teak dining chairs and synthetic rattan sets (1x 40ft HQ Container). Please send catalog and export certs.",
                comment_context="Check out Jepara furniture clusters, sent contact.",
                author="AussieDesignStudio",
                posted_at=(now - timedelta(days=1, hours=5)).isoformat()
            ),
            # 7. Non-Buyer Noise: Seller / Jual (Must be IGNORED by Gemini is_buyer_intent == False)
            RawDemandItem(
                source_platform="twitter",
                source_url="https://twitter.com/seller_hp_murah/status/178999999999999999",
                raw_content="DIJUAL: iPhone 15 Pro Max 256GB garansi resmi iBox baru masih segel. COD Jakarta Pusat atau kirim via Tokopedia. Harga promo 19jt net no nego. Minat wa 0811998877.",
                comment_context="Bisa tukar tambah gan?",
                author="@seller_hp_murah",
                posted_at=(now - timedelta(minutes=30)).isoformat()
            ),
            # 8. Non-Buyer Noise: Job Ad (Must be IGNORED by Gemini is_buyer_intent == False)
            RawDemandItem(
                source_platform="forum",
                source_url="https://forum.id/jobs/loker-admin-sosmed-surabaya",
                raw_content="LOWONGAN KERJA: Dibutuhkan segera Admin Sosial Media & Host Live TikTok di Surabaya Timur. Gaji 3.5jt - 5jt + bonus penjualan. Kirim CV ke hrd@toko.co.id.",
                comment_context="Bisa WFH ga min?",
                author="HRD_Recruiter",
                posted_at=(now - timedelta(hours=5)).isoformat()
            ),
            # 9. Active Logistics / Trucking Service (Telegram)
            RawDemandItem(
                source_platform="telegram",
                source_url="https://t.me/logistik_nusantara/5129",
                raw_content="Butuh vendor truk reefer pendingin kapasitas 5 ton rute Jakarta - Denpasar Bali untuk angkut frozen seafood. Jadwal rutin tiap pekan. Hubungi WA 087812984711.",
                comment_context=None,
                author="@logistik_bali",
                posted_at=(now - timedelta(days=1, hours=8)).isoformat()
            ),
            # 10. Active Raw Material Sourcing (Forum)
            RawDemandItem(
                source_platform="forum",
                source_url="https://agrobisnis.id/threads/butuh-tapioka-medan-10-ton.4421/",
                raw_content="Dicari pabrik atau supplier tangan pertama tepung tapioka kasar kualitas industri pakan & kerupuk. Kebutuhan 10 ton per pengiriman ke gudang Medan Deli. Hubungi Telp: 085270112233 (Pak Hendra).",
                comment_context="Bisa kirim spesifikasi kadar airnya pak?",
                author="hendra_pabrik",
                posted_at=(now - timedelta(days=2)).isoformat()
            )
        ]
        
        return sample_items[:limit]
