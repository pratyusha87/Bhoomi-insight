BHOOMI INSIGHT — DATA DIRECTORY

Existing datasets:
- regional_indicators.json: bundled regional profile data; inspect per-field source notes.
- forest_cover_isfr_2023.csv: ISFR 2023 forest cover snapshot.
- agriculture_land_2024_25.csv: DES Land Use Statistics 2024-25 provisional data; source coverage is incomplete for some states/UTs.
- population_census_2011.csv: historical Census 2011 baseline.

New hydrology assets:
- groundwater_resources_cgwb_2024.csv: national-level groundwater recharge and annual extractable resource totals only (446.90 and 406.19 BCM). The official report contains state-wise Annexure I and district-wise Annexure II; do not infer regional values from the national rows.
- hydrology_sources.json: source metadata, coverage, limitations and official links for groundwater, flood and boundaries.
- Flood hazard: historical NRSC/ISRO Bhuvan WMS overlay toggle is provided in the map. Bhuvan annual flood layers and hazard zones have selected-state/year coverage, not uniform current coverage for all 36 regions. These are not live flood alerts.

India boundaries:
The supplied india_state.geojson is bundled as static/portal/data/india_states.geojson and is loaded locally first. It contains a 36-feature India ADM1 FeatureCollection. The GeoJSON properties include shapeName, shapeISO, shapeID, shapeGroup and shapeType. Hosted sources remain fallback-only. Verify boundary vintage and administrative naming before official/legal use.

Official sources:
CGWB 2024 report: https://cgwb.gov.in/cgwbpnm/public/uploads/documents/17357169591419696804file.pdf
Bhuvan flood annual layers: https://bhuvan-app1.nrsc.gov.in/disaster/usrtasks/flood/flood.php?uname=empty
Bhuvan flood hazard: https://bhuvan-app1.nrsc.gov.in/disaster/usrtasks/flood_hz/flood_hz.php?uname=empty
