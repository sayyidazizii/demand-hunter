# Demand Intelligence & Opportunity Lead Bot: Python Crawler

This module ingests public postings across social media (Twitter/X, Telegram, Reddit, Forums), uses **Google Gemini AI** to extract structured buyer intent and location data, and upserts verified opportunities into **Supabase PostgreSQL**.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Configure Environment (.env)
Ensure your `.env` (or project root `.env`) has:
```env
GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Run Pipeline
```bash
# Run with mock dataset (includes active buyer demands, solved posts, and noise rejection test cases)
python pipeline.py --source mock

# Run with live public Reddit feeds
python pipeline.py --source reddit

# Dry-run test without writing to Supabase
python pipeline.py --source mock --dry-run
```

### 4. Run Automated Tests
```bash
python -m unittest test_crawler.py
```
