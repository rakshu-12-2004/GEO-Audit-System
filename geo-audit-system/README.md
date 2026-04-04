# GEO Audit System

A **Generative Engine Optimization (GEO)** audit tool that scrapes any public webpage and returns structured SEO data + a recommended JSON-LD schema to improve AI citation readiness.

---

## Stack

| Layer    | Tech                          |
|----------|-------------------------------|
| Backend  | FastAPI + Python 3.11         |
| Scraping | BeautifulSoup4 + requests     |
| Frontend | React 18                      |
| Styling  | Pure CSS (custom design system) |
| Deploy   | Docker + docker-compose       |

---

## Quick Start (Docker)

```bash
# Clone / unzip the project
cd geo-audit-system

# Build and run everything
docker-compose up --build

# Frontend → http://localhost:3000
# Backend  → http://localhost:8000
# API docs → http://localhost:8000/docs
```

---

## Manual Local Start

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install --legacy-peer-deps
npm start
# Opens http://localhost:3000
```

---

## API Reference

### `POST /audit`

**Request body:**
```json
{ "url": "https://example.com" }
```

**Response:**
```json
{
  "page_title": "Example Domain",
  "meta_description": "...",
  "headings": {
    "h1": ["Main Heading"],
    "h2": ["Sub Heading"],
    "h3": []
  },
  "images": ["https://example.com/image.jpg"],
  "recommended_schema": {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Example Domain",
    "description": "...",
    "url": "https://example.com"
  },
  "schema_type": "WebPage",
  "url": "https://example.com"
}
```

### Schema Detection Rules

| Keyword match (URL + title + headings) | Schema type  |
|----------------------------------------|--------------|
| blog, article, news, post, story       | Article      |
| about, company, team, mission, org     | Organization |
| product, shop, store, buy, price, cart | Product      |
| (none matched)                         | WebPage      |

---

## Project Structure

```
geo-audit-system/
├── backend/
│   ├── main.py              # FastAPI app
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.js
│   │   ├── App.css
│   │   ├── index.js
│   │   ├── index.css
│   │   └── components/
│   │       ├── AuditForm.js
│   │       ├── AuditForm.css
│   │       ├── AuditResults.js
│   │       └── AuditResults.css
│   ├── public/
│   │   └── index.html
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docker-compose.yml
└── README.md
```
