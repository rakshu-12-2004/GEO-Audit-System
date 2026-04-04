from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl, field_validator
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import json
import re
from typing import Optional

app = FastAPI(title="GEO Audit System", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Models ──────────────────────────────────────────────────────────────────

class AuditRequest(BaseModel):
    url: str

    @field_validator("url")
    @classmethod
    def validate_url(cls, v: str) -> str:
        if not v.startswith(("http://", "https://")):
            v = "https://" + v
        parsed = urlparse(v)
        if not parsed.netloc:
            raise ValueError("Invalid URL")
        return v


class HeadingsModel(BaseModel):
    h1: list[str] = []
    h2: list[str] = []
    h3: list[str] = []


class AuditResponse(BaseModel):
    page_title: str
    meta_description: str
    headings: HeadingsModel
    images: list[str]
    recommended_schema: dict
    schema_type: str
    url: str


# ── Schema Recommendation Logic ──────────────────────────────────────────────

BLOG_KEYWORDS    = {"blog", "article", "news", "post", "story", "journal", "opinion", "editorial", "press"}
COMPANY_KEYWORDS = {"about", "company", "team", "mission", "who-we-are", "organization", "corp", "corporate", "contact"}
PRODUCT_KEYWORDS = {"product", "shop", "store", "buy", "price", "cart", "checkout", "item", "catalog", "sale"}


def detect_schema_type(url: str, title: str, description: str, headings: HeadingsModel) -> str:
    text_blob = " ".join([
        url.lower(),
        title.lower(),
        description.lower(),
        " ".join(headings.h1).lower(),
        " ".join(headings.h2).lower(),
    ])

    scores = {
        "Article":      sum(1 for kw in BLOG_KEYWORDS    if kw in text_blob),
        "Organization": sum(1 for kw in COMPANY_KEYWORDS if kw in text_blob),
        "Product":      sum(1 for kw in PRODUCT_KEYWORDS if kw in text_blob),
    }

    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else "WebPage"


def build_schema(schema_type: str, title: str, description: str, url: str, images: list[str]) -> dict:
    base = {
        "@context": "https://schema.org",
        "@type": schema_type,
        "name": title or "Untitled Page",
        "description": description or "No description available.",
        "url": url,
    }

    if schema_type == "Article":
        base.update({
            "headline": title,
            "articleBody": description,
            "author": {"@type": "Person", "name": "Unknown Author"},
            "publisher": {
                "@type": "Organization",
                "name": urlparse(url).netloc,
                "logo": {"@type": "ImageObject", "url": f"https://{urlparse(url).netloc}/favicon.ico"},
            },
            "datePublished": "",
            "dateModified": "",
        })

    elif schema_type == "Organization":
        base.update({
            "legalName": title,
            "contactPoint": {"@type": "ContactPoint", "contactType": "customer service"},
            "sameAs": [],
        })

    elif schema_type == "Product":
        base.update({
            "offers": {
                "@type": "Offer",
                "priceCurrency": "USD",
                "availability": "https://schema.org/InStock",
            },
            "brand": {"@type": "Brand", "name": urlparse(url).netloc},
        })

    else:  # WebPage fallback
        base["@type"] = "WebPage"

    if images:
        base["image"] = images[0]

    return base


# ── Scraping ─────────────────────────────────────────────────────────────────

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/122.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "en-US,en;q=0.9",
}


def scrape_page(url: str) -> dict:
    try:
        resp = requests.get(url, headers=HEADERS, timeout=15, allow_redirects=True)
        resp.raise_for_status()
    except requests.exceptions.ConnectionError:
        raise HTTPException(status_code=400, detail="Could not connect to the URL. Check if it's accessible.")
    except requests.exceptions.Timeout:
        raise HTTPException(status_code=408, detail="Request timed out.")
    except requests.exceptions.HTTPError as e:
        raise HTTPException(status_code=400, detail=f"HTTP error: {e}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error fetching URL: {str(e)}")

    soup = BeautifulSoup(resp.text, "html.parser")

    # Title
    title_tag = soup.find("title")
    title = title_tag.get_text(strip=True) if title_tag else ""

    # Meta description
    meta = (
        soup.find("meta", attrs={"name": "description"})
        or soup.find("meta", attrs={"property": "og:description"})
        or soup.find("meta", attrs={"name": "twitter:description"})
    )
    description = meta.get("content", "").strip() if meta else ""

    # Headings
    headings = HeadingsModel(
        h1=[h.get_text(strip=True) for h in soup.find_all("h1") if h.get_text(strip=True)][:10],
        h2=[h.get_text(strip=True) for h in soup.find_all("h2") if h.get_text(strip=True)][:10],
        h3=[h.get_text(strip=True) for h in soup.find_all("h3") if h.get_text(strip=True)][:10],
    )

    # Images — convert relative → absolute, deduplicate
    seen = set()
    images = []
    for img in soup.find_all("img"):
        src = img.get("src") or img.get("data-src") or img.get("data-lazy-src")
        if src:
            abs_src = urljoin(url, src)
            if abs_src not in seen and abs_src.startswith("http"):
                seen.add(abs_src)
                images.append(abs_src)
        if len(images) >= 10:
            break

    # OG image as fallback
    og_img = soup.find("meta", attrs={"property": "og:image"})
    if og_img and og_img.get("content"):
        abs_og = urljoin(url, og_img["content"])
        if abs_og not in seen:
            images.insert(0, abs_og)

    return {
        "title": title,
        "description": description,
        "headings": headings,
        "images": images,
    }


# ── Endpoint ──────────────────────────────────────────────────────────────────

@app.post("/audit", response_model=AuditResponse)
def audit(req: AuditRequest):
    data       = scrape_page(req.url)
    schema_type = detect_schema_type(req.url, data["title"], data["description"], data["headings"])
    schema      = build_schema(schema_type, data["title"], data["description"], req.url, data["images"])

    return AuditResponse(
        page_title=data["title"] or "No title found",
        meta_description=data["description"] or "No meta description found",
        headings=data["headings"],
        images=data["images"],
        recommended_schema=schema,
        schema_type=schema_type,
        url=req.url,
    )


@app.get("/health")
def health():
    return {"status": "ok", "service": "GEO Audit System"}
