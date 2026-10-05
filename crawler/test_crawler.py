import unittest
from crawler.gemini_extractor import GeminiExtractor, ExtractedDemand
from crawler.fetchers.mock_fetcher import MockFetcher
from crawler.pipeline import DemandPipeline

class TestDemandCrawler(unittest.TestCase):
    def setUp(self):
        self.extractor = GeminiExtractor()

    def test_buyer_intent_recognition(self):
        """Test that buyer intent is correctly recognized for procurement posts."""
        text = "Butuh supplier biji kopi Robusta Temanggung 500kg per bulan untuk roastery di Jaksel. Kontak WA 081234567890."
        extracted = self.extractor.extract(text)
        self.assertIsNotNone(extracted)
        self.assertTrue(extracted.is_buyer_intent)
        self.assertEqual(extracted.category, "supplier")
        self.assertIn("Jakarta", extracted.location_name)
        self.assertFalse(extracted.is_solved)

    def test_rejection_of_non_buyer_intent(self):
        """Test that seller ads and non-buyer posts are rejected (is_buyer_intent=False)."""
        seller_post = "JUAL: iPhone 15 Pro Max mulus garansi iBox harga 18jt COD Jakarta Pusat."
        extracted = self.extractor.extract(seller_post)
        self.assertIsNone(extracted, "Seller post should return None (filtered out)")

        job_post = "LOWONGAN KERJA: Dicari admin sosmed Surabaya gaji 4jt."
        extracted_job = self.extractor.extract(job_post)
        self.assertIsNone(extracted_job, "Job advertisement should return None (filtered out)")

    def test_solved_status_detection(self):
        """Test that posts with closed/solved phrases are marked is_solved=True."""
        text = "Dicari pabrik karton box corrugated die cut 2000 pcs di Semarang."
        comment = "Update: sudah dapet ya dari Mas Budi. CLOSED! Makasih."
        extracted = self.extractor.extract(text, comment_context=comment)
        self.assertIsNotNone(extracted)
        self.assertTrue(extracted.is_solved, "Should mark is_solved=True when comment says 'sudah dapet' or 'CLOSED'")

    def test_coordinates_resolution(self):
        """Test that Indonesian city names are mapped to accurate geographic coordinates."""
        text = "Butuh forwarder impor Surabaya door to door Yiwu."
        extracted = self.extractor.extract(text)
        self.assertIsNotNone(extracted)
        self.assertIsNotNone(extracted.latitude)
        self.assertIsNotNone(extracted.longitude)
        self.assertAlmostEqual(extracted.latitude, -7.2575, delta=0.5)

    def test_pipeline_execution(self):
        """Test end-to-end pipeline execution with mock fetcher."""
        pipeline = DemandPipeline(dry_run=True)
        items = MockFetcher().fetch(limit=10)
        stats = pipeline.process_and_persist(items)
        
        self.assertGreater(stats["valid_demands"], 0)
        self.assertGreater(stats["filtered_noise"], 0)
        self.assertGreater(stats["solved_leads"], 0)

if __name__ == "__main__":
    unittest.main()
