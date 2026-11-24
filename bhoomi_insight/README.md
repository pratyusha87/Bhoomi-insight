# Bhoomi Insight — Complete Django project

This package preserves the existing Bhoomi Insight interface and includes a working Django API for evidence search and regional intelligence.

## Run on Windows

```powershell
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Open http://127.0.0.1:8000/

No Docker is used.

## What works

- Evidence search: Research uses OpenAlex and Crossref; Policy/Innovation can use GDELT; Datasets searches the included local CSV/JSON data and returns direct links to those files.
- Territory Watch: loads the bundled state/UT indicator dataset for forest cover, agricultural/cultivable land, cultivated land and Census 2011 population.
- State profile: shows sourced values, reference years, units and caveats; links to official sources and OpenAlex research.
- Map: uses local GeoJSON if you provide it, otherwise attempts a hosted GeoJSON fallback. All category filters keep every boundary visible; state search only narrows the directory.
- Existing visual theme, dashboard layout and policy modal are retained.

## Bundled data

See `static/portal/data/README.txt`.

- `regional_indicators.json`
- `forest_cover_isfr_2023.csv`
- `agriculture_land_2024_25.csv`
- `population_census_2011.csv`

### Sources and limitations

1. Forest cover: Forest Survey of India, *India State of Forest Report 2023*, Table 9.1. The table reports 2013 and 2023 assessment values in km². Official source: https://fsi.nic.in/forest-report-2023
2. Agriculture: Department of Agriculture & Farmers Welfare, *Land Use Statistics at a Glance 2024-25*, Table IX. Agricultural land and cultivated land in thousand hectares; 2024-25 values are provisional. The report notes that 32 States/UTs furnished complete data and Maharashtra, West Bengal and Manipur supplied partial data. Official source: https://desagri.gov.in/document-report-category/land-use-statistics-at-a-glance
3. Population: Census 2011 state/UT population baseline as reproduced in RBI's *Handbook of Statistics on Indian States*, Table 1. This is not a current population estimate. Administrative reorganisation affects comparison for Andhra Pradesh/Telangana and Jammu & Kashmir/Ladakh. Source: https://www.rbi.org.in/Scripts/PublicationsView.aspx?id=22789

No groundwater, flood-risk, current land-record ownership, or real-time satellite layer is fabricated. Those require separate validated datasets and ingestion.

## GeoJSON boundary file

Put your own authoritative GeoJSON at:

`static/portal/data/india_states.geojson`

If absent, the frontend attempts the hosted DataMeet-derived 36-region boundary file at `https://static.geodataviewer.com/datasets/india-states.geojson`. This fallback requires internet and represents a 2011-vintage community boundary snapshot, so it is not legally authoritative. If the fallback host is unavailable, add your own GeoJSON.

The GeoJSON must be a FeatureCollection with at least 30 features and a state/UT name property such as `shapeName`, `ST_NM`, `NAME_1`, or `name`.

## API endpoints

- `/api/search/?q=forest&category=research`
- `/api/search/?q=agriculture&category=dataset`
- `/api/search/?q=land+policy&category=policy`
- `/api/territory/?region=Punjab`

The dataset search works without internet because it searches the bundled files. OpenAlex, Crossref and GDELT require internet access and can return partial results during provider outages.

## Project structure

- `portal/views.py` — search API
- `portal/territory_views.py` — regional profile API
- `portal/urls.py` — routes
- `static/portal/data/` — bundled datasets
- `static/portal/js/app.js` — search, map and profile rendering
- `templates/portal/home.html` — existing dashboard
- `static/portal/css/style.css` — existing visual design

## Before formal use

Check the original government source for revisions, definitions, reporting periods and geographic comparability. This is an academic prototype, not an official government information system.


## Groundwater, flood and boundary data update

- Added CGWB 2024 national groundwater aggregates to `static/portal/data/groundwater_resources_cgwb_2024.csv`, with source metadata in `hydrology_sources.json`. State/district annexures are linked to the official report but are not represented as fabricated local values.
- Added an optional historical flood-hazard WMS overlay from NRSC/ISRO Bhuvan and direct links to annual flood layers and hazard-zone maps. Coverage varies by state/year; this is not live flood alerting.
- Improved GeoJSON source fallback. The supplied 36-feature GeoJSON is bundled at `static/portal/data/india_states.geojson` and is loaded locally first; hosted GeoJSON sources are fallback-only. The user-supplied GeoJSON is embedded in this build. The FeatureCollection contains 36 features and uses the `shapeName` property for region names.
