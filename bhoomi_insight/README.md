# 🌍 Bhoomi Insight
### An India-focused Land Governance & Geospatial Intelligence Platform

**Bhoomi Insight** is a Django-based web platform designed to bring land, environmental, agricultural, and regional indicators together in one place. It aims to make complex geographical and public datasets easier to explore, understand, and use for informed decision-making.

By combining structured datasets, geographical boundaries, and analytical dashboards, Bhoomi Insight provides a unified interface for exploring India's land and environmental landscape.

---

## ✨ Key Features

### 📊 1. Overview Dashboard
- Centralized view of regional and environmental indicators.
- Structured presentation of key geographical data.
- Quick access to important platform modules.

### 📚 2. Evidence Library
- Organized collection of datasets and supporting information.
- Access to agricultural, population, forest-cover, and hydrological data.
- A foundation for data-backed research and analysis.

### 🗺️ 3. Territory Watch
- Geographical exploration using India's state and union territory boundaries.
- GeoJSON-based geographical data integration.
- Regional indicator visualization and exploration.

### 🏛️ 4. Policy Studio
- A dedicated space for exploring policy-related insights.
- Designed to support evidence-based land governance discussions.
- Provides a foundation for future policy analysis capabilities.

### 💧 5. Hydrology & Environmental Data
- Groundwater resource information based on CGWB data.
- Hydrological source references and metadata.
- Integration of geographical and environmental datasets.

---

## 🛠️ Technology Stack

| Category | Technologies |
|---|---|
| Backend | Python, Django |
| Frontend | HTML5, CSS3, JavaScript |
| Data Visualization & Geography | GeoJSON |
| Data Processing | CSV, JSON |
| Database | Django-supported database configuration |
| Development Tools | Git, GitHub, VS Code |

---

## 📁 Project Structure

```text
Bhoomi-Insight/
│
├── bhoomi_insight/
│   ├── manage.py
│   │
│   ├── portal/
│   │   ├── views.py
│   │   ├── territory_views.py
│   │   └── urls.py
│   │
│   ├── templates/
│   │   └── portal/
│   │       └── home.html
│   │
│   └── static/
│       └── portal/
│           ├── css/
│           │   └── style.css
│           ├── js/
│           │   └── app.js
│           └── data/
│               ├── india_states.geojson
│               ├── groundwater_resources_cgwb_2024.csv
│               ├── hydrology_sources.json
│               ├── population_census_2011.csv
│               └── regional_indicators.json
│
└── README.md
```

---

## 🚀 Getting Started

Follow these steps to run Bhoomi Insight locally.

### Prerequisites

- Python 3.10 or later (depending on dependency compatibility)
- pip
