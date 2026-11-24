import hashlib
import json
import re
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

from django.conf import settings
from django.core.cache import cache
from django.http import JsonResponse
from django.shortcuts import render
from django.views.decorators.http import require_GET

OPENALEX_URL = "https://api.openalex.org/works"
CROSSREF_URL = "https://api.crossref.org/works"
GDELT_URL = "https://api.gdeltproject.org/api/v2/doc/doc"
DATA_DIR = Path(settings.BASE_DIR) / "static" / "portal" / "data"


def _clean(value, limit=700):
    value = re.sub(r"<[^>]+>", " ", str(value or ""))
    return re.sub(r"\s+", " ", value).strip()[:limit]


def _fetch_json(url, timeout=12):
    request = urllib.request.Request(
        url,
        headers={
            "User-Agent": "BhoomiInsight/1.0 (academic land-governance project)",
            "Accept": "application/json",
        },
    )
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return json.loads(response.read().decode("utf-8"))


def _result(title, organisation, category, summary, date, provider, url, **extra):
    return {
        "title": _clean(title, 240) or "Untitled result",
        "organisation": _clean(organisation, 160) or provider,
        "category": category,
        "summary": _clean(summary) or "Open the original source for details.",
        "date": str(date or "Date not supplied"),
        "provider": provider,
        "url": url or "",
        **extra,
    }


def _search_openalex(query, limit=8):
    params = urllib.parse.urlencode({
        "search": query,
        "per-page": limit,
        "sort": "relevance_score:desc",
        "select": "id,doi,title,publication_year,authorships,primary_location,abstract_inverted_index",
    })
    payload = _fetch_json(f"{OPENALEX_URL}?{params}")
    output = []
    for item in payload.get("results", []):
        abstract_index = item.get("abstract_inverted_index") or {}
        abstract = ""
        if abstract_index:
            positions = [p for ps in abstract_index.values() for p in ps]
            words = [""] * (max(positions) + 1 if positions else 0)
            for word, indexes in abstract_index.items():
                for index in indexes:
                    words[index] = word
            abstract = " ".join(words)
        location = item.get("primary_location") or {}
        source = (location.get("source") or {}).get("display_name") or "OpenAlex indexed work"
        landing = location.get("landing_page_url") or item.get("doi") or item.get("id")
        output.append(_result(
            item.get("title"), source, "research",
            abstract or "Scholarly work indexed by OpenAlex.",
            item.get("publication_year"), "OpenAlex", landing,
            doi=item.get("doi") or "",
        ))
    return output


def _search_crossref(query, limit=8):
    params = urllib.parse.urlencode({
        "query.bibliographic": query,
        "rows": limit,
        "select": "title,author,published,created,container-title,abstract,URL,DOI,publisher",
    })
    payload = _fetch_json(f"{CROSSREF_URL}?{params}")
    output = []
    for item in payload.get("message", {}).get("items", []):
        date_parts = (item.get("published") or item.get("created") or {}).get("date-parts") or [[None]]
        year = date_parts[0][0] if date_parts and date_parts[0] else ""
        title = (item.get("title") or ["Untitled publication"])[0]
        organisation = (item.get("container-title") or [item.get("publisher") or "Crossref record"])[0]
        url = item.get("URL") or (f"https://doi.org/{item['DOI']}" if item.get("DOI") else "")
        output.append(_result(
            title, organisation, "research",
            item.get("abstract") or "Publication metadata indexed by Crossref.",
            year, "Crossref", url, doi=item.get("DOI") or "",
        ))
    return output


def _search_gdelt(query, category="policy", limit=8):
    key = "bhoomi:gdelt:" + hashlib.sha256(query.casefold().encode()).hexdigest()
    cached = cache.get(key)
    if cached is not None:
        return cached
    params = urllib.parse.urlencode({
        "query": query, "mode": "ArtList", "format": "json",
        "maxrecords": limit, "timespan": "3m", "sort": "HybridRel",
    })
    payload = _fetch_json(f"{GDELT_URL}?{params}", timeout=15)
    output = []
    for item in payload.get("articles", []):
        seen = item.get("seendate") or ""
        date = f"{seen[:4]}-{seen[4:6]}-{seen[6:8]}" if len(seen) >= 8 else ""
        output.append(_result(
            item.get("title"), item.get("domain") or item.get("sourcecountry"),
            category, "News or policy-related coverage indexed by GDELT.",
            date, "GDELT", item.get("url"),
        ))
    cache.set(key, output, timeout=300)
    return output


def _local_dataset_results(query):
    """Search datasets bundled with this project; no network required."""
    q = query.casefold()
    definitions = [
        {
            "title": "State-wise Forest Cover — ISFR 2023",
            "organisation": "Forest Survey of India, MoEFCC",
            "summary": "Bundled state/UT data: forest cover for 2013 and 2023, area change and percentage change. Source: India State of Forest Report 2023, Table 9.1.",
            "url": "/static/portal/data/forest_cover_isfr_2023.csv",
            "terms": "forest cover tree cover forest survey india isfr 2023 forest area biodiversity"
        },
        {
            "title": "Agricultural and Cultivated Land — 2024-25 (Provisional)",
            "organisation": "Department of Agriculture & Farmers Welfare",
            "summary": "Bundled state/UT values for agricultural/cultivable land and cultivated land in thousand hectares. Source: Land Use Statistics at a Glance 2024-25, Table IX. Some states supplied partial data.",
            "url": "/static/portal/data/agriculture_land_2024_25.csv",
            "terms": "agriculture agricultural land cultivable cultivated crop farming land use 2024 2025"
        },
        {
            "title": "State/UT Population — Census 2011 baseline",
            "organisation": "Office of Registrar General & Census Commissioner / RBI",
            "summary": "Bundled population baseline (persons) for states and union territories. Historical Census 2011 figures; current administrative splits require care.",
            "url": "/static/portal/data/population_census_2011.csv",
            "terms": "population census 2011 people demographic population density"
        },
    ]
    matches = []
    for d in definitions:
        if not q or any(token in (d["terms"] + " " + d["title"] + " " + d["summary"]).casefold()
                         for token in q.split() if len(token) > 2):
            matches.append(_result(
                d["title"], d["organisation"], "dataset", d["summary"],
                "See dataset metadata", "Bundled dataset", d["url"],
            ))
    return matches


@require_GET
def search_evidence(request):
    query = (request.GET.get("q") or "").strip()[:200]
    category = (request.GET.get("category") or "all").strip().lower()
    category = {
        "datasets": "dataset", "data": "dataset",
        "papers": "research", "publications": "research",
    }.get(category, category)

    if len(query) < 2:
        return JsonResponse({
            "query": query, "results": [], "errors": [],
            "message": "Enter at least two characters to search."
        })
    if category not in {"all", "research", "dataset", "policy", "innovation"}:
        return JsonResponse({"results": [], "errors": [], "message": "Unknown category."}, status=400)

    results, errors = [], []
    if category in {"all", "research", "innovation"}:
        for provider, function in (("OpenAlex", _search_openalex), ("Crossref", _search_crossref)):
            try:
                results.extend(function(query))
            except Exception as exc:
                errors.append(f"{provider}: {type(exc).__name__}: {str(exc)[:180]}")

    if category in {"all", "dataset"}:
        results.extend(_local_dataset_results(query))

    if category in {"all", "policy", "innovation"}:
        try:
            results.extend(_search_gdelt(query, "policy" if category == "policy" else "innovation"))
        except Exception as exc:
            errors.append(f"GDELT: {type(exc).__name__}: {str(exc)[:180]}")

    seen, unique = set(), []
    for item in results:
        key = (item.get("doi") or item.get("url") or item.get("title", "")).casefold()
        if key not in seen:
            seen.add(key)
            unique.append(item)

    if unique:
        message = f"{len(unique)} results found."
    elif errors:
        message = "No results were returned and one or more live providers failed. Bundled datasets are searched locally for the Datasets filter."
    else:
        message = "No matching records found. Try a broader keyword."

    return JsonResponse({
        "query": query, "category": category, "results": unique,
        "count": len(unique), "errors": errors, "message": message,
        "sources": ["Bundled datasets", "OpenAlex", "Crossref", "GDELT"],
        "ogd_catalog_url": "https://www.data.gov.in/search?title=" + urllib.parse.quote_plus(query),
    })


def home(request):
    return render(request, "portal/home.html")
