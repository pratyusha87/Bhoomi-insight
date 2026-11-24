"""Regional intelligence API backed by bundled official datasets."""
import json
import unicodedata
import urllib.parse
import urllib.request
from pathlib import Path

from django.conf import settings
from django.http import JsonResponse
from django.views.decorators.http import require_GET

DATA_FILE = Path(settings.BASE_DIR) / "static" / "portal" / "data" / "regional_indicators.json"

UNION_TERRITORIES = {
    "andaman and nicobar islands", "chandigarh",
    "dadra and nagar haveli and daman and diu", "delhi",
    "jammu and kashmir", "ladakh", "lakshadweep", "puducherry",
}

ALIASES = {
    "andaman & nicobar islands": "Andaman and Nicobar Islands",
    "a & n islands": "Andaman and Nicobar Islands",
    "dadra & nagar haveli and daman & diu": "Dadra and Nagar Haveli and Daman and Diu",
    "dadra and nagar haveli": "Dadra and Nagar Haveli and Daman and Diu",
    "jammu & kashmir": "Jammu and Kashmir",
    "nct of delhi": "Delhi",
}


def _load_data():
    with DATA_FILE.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def _research(region):
    query = urllib.parse.quote_plus(f'"{region}" India land use forest agriculture environment')
    url = f"https://api.openalex.org/works?search={query}&per-page=6&sort=relevance_score:desc&select=title,publication_year,doi,primary_location"
    request = urllib.request.Request(url, headers={"User-Agent": "BhoomiInsight/1.0"})
    try:
        with urllib.request.urlopen(request, timeout=8) as response:
            payload = json.loads(response.read().decode("utf-8"))
        output = []
        for item in payload.get("results", []):
            loc = item.get("primary_location") or {}
            output.append({
                "title": item.get("title") or "Untitled publication",
                "year": item.get("publication_year"),
                "url": loc.get("landing_page_url") or item.get("doi") or item.get("id"),
                "source": "OpenAlex",
            })
        return output, None
    except Exception as exc:
        return [], f"OpenAlex research lookup unavailable: {type(exc).__name__}"


@require_GET
def territory_profile(request):
    raw = (request.GET.get("region") or request.GET.get("name") or request.GET.get("state") or "").strip()
    if not raw or len(raw) > 100:
        return JsonResponse({"error": "Provide a valid region name."}, status=400)

    canonical = ALIASES.get(raw.casefold(), raw)
    try:
        dataset = _load_data()
    except (OSError, json.JSONDecodeError):
        return JsonResponse({"error": "Bundled regional dataset could not be read."}, status=500)

    # Match case-insensitively, preserving the canonical dataset label.
    def normalise_name(value):
        value = unicodedata.normalize("NFKD", str(value))
        value = "".join(ch for ch in value if not unicodedata.combining(ch))
        return " ".join(value.casefold().replace("&", "and").split())

    wanted = normalise_name(canonical)
    match = next((name for name in dataset["regions"] if normalise_name(name) == wanted), None)
    if not match:
        return JsonResponse({
            "error": f"No bundled profile found for '{raw}'. Check the spelling or GeoJSON state-name field.",
            "available_regions": list(dataset["regions"].keys()),
        }, status=404)

    row = dataset["regions"][match]
    region_type = "Union Territory" if match.casefold() in UNION_TERRITORIES else "State"
    research, research_error = _research(match)

    pop = row.get("population_2011")
    forest = row.get("forest_cover") or {}
    agri = row.get("agriculture_land_2024_25_thousand_ha")
    cultivated = row.get("cultivated_land_2024_25_thousand_ha")

    area_note = "Geographical area reported in ISFR 2023 (km²)."
    if match in {"Jammu and Kashmir", "Ladakh"}:
        area_note = "ISFR 2023 reports a combined geographical area for Jammu & Kashmir and Ladakh; this is not an individual territory area."

    overview = [
        {"label": "Administrative type", "value": region_type, "note": "State / Union Territory"},
        {"label": "Geographical area", "value": f'{forest.get("geographical_area_km2"):,.2f} km²' if forest.get("geographical_area_km2") else "Not reported separately", "note": area_note},
        {"label": "Population", "value": f"{pop:,}" if pop else "Not available", "note": "Census 2011 baseline; not a current population estimate."},
        {"label": "Forest cover (2023)", "value": f'{forest.get("forest_cover_2023_km2"):,.2f} km²' if forest.get("forest_cover_2023_km2") is not None else "Not available", "note": "Forest Survey of India, ISFR 2023, Table 9.1."},
        {"label": "Forest-cover change", "value": f'{forest.get("change_2013_2023_km2"):+,.2f} km²' if forest.get("change_2013_2023_km2") is not None else "Not available", "note": "Change between ISFR 2013 and ISFR 2023 assessments."},
        {"label": "Agricultural / cultivable land", "value": f"{agri:,} thousand ha" if agri is not None else "Not reported", "note": "DES Agriculture LUS 2024-25, provisional."},
        {"label": "Cultivated land", "value": f"{cultivated:,} thousand ha" if cultivated is not None else "Not reported", "note": "DES Agriculture LUS 2024-25, provisional."},
    ]

    forest_items = [
        f'Forest cover in 2013: {forest.get("forest_cover_2013_km2"):,.2f} km²',
        f'Forest cover in 2023: {forest.get("forest_cover_2023_km2"):,.2f} km²',
        f'Change from 2013 to 2023: {forest.get("change_2013_2023_km2"):+,.2f} km² ({forest.get("change_percent_2013_2023"):+.2f}%)',
    ] if forest else ["No forest-cover record available for this region."]

    agriculture_items = []
    if agri is not None:
        agriculture_items = [
            f"Agricultural / cultivable land: {agri:,} thousand hectares",
            f"Cultivated land: {cultivated:,} thousand hectares",
            "Agricultural year 2024-25; provisional figures.",
        ]
    else:
        agriculture_items = ["The source did not report a value for this region in the bundled table."]

    sections = [
        {
            "title": "Forest cover",
            "description": "Forest-cover area is a remote-sensing assessment, not the same as notified or recorded forest area.",
            "items": forest_items,
        },
        {
            "title": "Agricultural land",
            "description": "Values below are from the Department of Agriculture & Farmers Welfare's Land Use Statistics at a Glance 2024-25, Table IX. Units are thousand hectares; 2024-25 values are provisional.",
            "items": agriculture_items,
        },
        {
            "title": "Population and area notes",
            "description": "Population is a historical Census 2011 baseline. Administrative changes after 2011 affect comparability for Andhra Pradesh/Telangana and Jammu & Kashmir/Ladakh.",
            "items": [
                f"Population (2011): {pop:,}" if pop else "Population: not available in bundled baseline.",
                area_note,
            ],
        },
    ]

    sources = [
        {"label": "Central Ground Water Board — Dynamic Ground Water Resources 2024 (national and state/district annexures)", "url": "https://cgwb.gov.in/cgwbpnm/public/uploads/documents/17357169591419696804file.pdf"},
        {"label": "NRSC / ISRO Bhuvan — Flood annual layers", "url": "https://bhuvan-app1.nrsc.gov.in/disaster/usrtasks/flood/flood.php?uname=empty"},
        {"label": "NRSC / ISRO Bhuvan — Flood hazard zones", "url": "https://bhuvan-app1.nrsc.gov.in/disaster/usrtasks/flood_hz/flood_hz.php?uname=empty"},
        {"label": "Forest Survey of India — ISFR 2023", "url": "https://fsi.nic.in/forest-report-2023"},
        {"label": "DES Agriculture — Land Use Statistics 2024-25", "url": "https://desagri.gov.in/document-report-category/land-use-statistics-at-a-glance"},
        {"label": "RBI Handbook of Statistics on Indian States — population table", "url": "https://www.rbi.org.in/Scripts/PublicationsView.aspx?id=22789"},
        {"label": "Open Government Data Platform", "url": "https://www.data.gov.in/search?title=" + urllib.parse.quote_plus(match)},
        {"label": "ISRO / NRSC Bhuvan", "url": "https://bhuvan-app1.nrsc.gov.in/"},
        {"label": "India-WRIS", "url": "https://indiawris.gov.in/"},
    ]
    errors = [research_error] if research_error else []

    return JsonResponse({
        "region": match,
        "region_type": region_type,
        "overview": overview,
        "sections": sections,
        "research": research,
        "sources": sources,
        "errors": errors,
        "dataset_metadata": dataset.get("metadata", {}),
    })
