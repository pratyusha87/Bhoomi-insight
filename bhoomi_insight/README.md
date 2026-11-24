# 🌍 Bhoomi Insight
### Geospatial Intelligence & Land Governance Platform for India

Bhoomi Insight is a Django-based web application designed to bring India's geographical, agricultural, environmental, and regional datasets together into a unified intelligence platform.

The project aims to simplify access to complex public datasets and support geographical exploration, regional analysis, and evidence-based land governance.

---

## ✨ Features

### 1. Overview Dashboard
- Centralized dashboard for exploring regional indicators.
- Structured presentation of geographical and environmental information.
- Quick access to major platform modules.

### 2. Evidence Library
- Organized collection of datasets and supporting resources.
- Agricultural, population, forest-cover, and hydrological information.
- Structured CSV and JSON data for exploration.

### 3. Territory Watch
- Geographical exploration of Indian states and union territories.
- Integration of India state boundaries through GeoJSON.
- Regional data exploration.

### 4. Policy Studio
- Dedicated module for policy-related insights.
- Designed to support evidence-based land governance.
- Foundation for future policy analysis capabilities.

### 5. Hydrology & Environmental Intelligence
- Groundwater resource information based on CGWB data.
- Hydrological source references and metadata.
- Integration of environmental and geographical datasets.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python, Django |
| Frontend | HTML5, CSS3, JavaScript |
| Geospatial Data | GeoJSON |
| Data Storage & Exchange | CSV, JSON |
| Version Control | Git, GitHub |

---

## 📂 Project Structure

```text
Bhoomi-Insight/
│
├── bhoomi_insight/
│   ├── manage.py
│   ├── requirements.txt
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
│           ├── js/
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

# 🚀 Installation & Setup

Follow these instructions to download, configure, and run Bhoomi Insight on your local machine.

## Prerequisites

Make sure you have installed:

- Python 3.10 or later (subject to project dependency compatibility).
- pip (Python package manager).
- Git.
- A code editor such as Visual Studio Code.

### Step 1: Clone the Repository

Open your terminal or PowerShell and execute:

```bash
git clone https://github.com/pratyusha87/Bhoomi-insight.git
```

### Step 2: Navigate to the Project Directory

Move into the folder containing `manage.py`:

```bash
cd Bhoomi-insight/bhoomi_insight
```

**Important:** All remaining Django commands must be executed from this directory.

### Step 3: Create a Virtual Environment

A virtual environment keeps project dependencies isolated from other Python projects.

```bash
python -m venv venv
```

### Step 4: Activate the Virtual Environment

**Windows (PowerShell):**

```powershell
.\venv\Scripts\Activate.ps1
```

If PowerShell blocks script execution, run:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

Then activate again:

```powershell
.\venv\Scripts\Activate.ps1
```

**Windows (Command Prompt):**

```cmd
venv\Scripts\activate.bat
```

**Linux / macOS:**

```bash
source venv/bin/activate
```

### Step 5: Install Project Dependencies

Install the required Python packages:

```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### Step 6: Check the Django Configuration

Run the Django system check:

```bash
python manage.py check
```

If there are no configuration errors, continue to the next step.

### Step 7: Apply Database Migrations

Initialize the database:

```bash
python manage.py migrate
```

This applies the database migrations required by Django.

### Step 8: Start the Development Server

Run:

```bash
python manage.py runserver
```

### Step 9: Open the Application

Once the server starts successfully, open your browser and visit:

**http://127.0.0.1:8000/**

<details>
<summary>Complete Windows command sequence</summary>

```powershell
git clone https://github.com/pratyusha87/Bhoomi-insight.git

cd Bhoomi-insight\bhoomi_insight

python -m venv venv

.\venv\Scripts\Activate.ps1

python -m pip install --upgrade pip

pip install -r requirements.txt

python manage.py check

python manage.py migrate

python manage.py runserver
```

</details>

---

## 🧪 Troubleshooting

| Problem | Solution |
|---|---|
| `python` is not recognized | Install Python and enable Add Python to PATH. |
| `pip` is not recognized | Use `python -m pip` instead. |
| `No module named django` | Activate the virtual environment and install requirements. |
| `manage.py` not found | Navigate into the `bhoomi_insight` directory. |
| PowerShell activation blocked | Use the execution policy command given above. |
| Database errors | Run `python manage.py migrate`. |
| Port 8000 already in use | Run `python manage.py runserver 8001`. |

---

## 📊 Data Sources

The project integrates structured geographical and regional datasets, including:

- **India State Boundaries:** GeoJSON geographical boundary data.
- **Groundwater Resources:** Central Ground Water Board (CGWB) resource information.
- **Population Data:** Census 2011 data.
- **Regional Indicators:** Structured regional indicator datasets.
- **Hydrology References:** Hydrological source metadata and references.

Data coverage and reporting periods vary by source. Consult the corresponding metadata before using the data for research or policy decisions.

---

## 🎯 Project Objectives

- Make geographical and environmental information easier to access.
- Integrate multiple public datasets into a unified platform.
- Enable geographical and regional data exploration.
- Support evidence-based land governance.
- Establish a foundation for data-driven policy research.

---

## 🔮 Future Enhancements

- Interactive state-wise analytical dashboards.
- Advanced geospatial visualizations.
- Integration of additional official government datasets.
- Improved regional comparisons and trend analysis.
- Advanced search and filtering.
- More comprehensive groundwater and flood-related data integration.
- Downloadable analytical reports.

---

## 🤝 Contributing

Contributions and suggestions are welcome.

1. Fork this repository.
2. Create a feature branch.
3. Make your changes.
4. Commit your changes.
5. Push your branch.
6. Open a Pull Request.

---

## 👩‍💻 Developer

**Pratyusha Sagar**

B.Tech – Computer Science and Engineering

GitHub: [@pratyusha87](https://github.com/pratyusha87)

---

## 📄 License

No open-source license has been specified yet. Please contact the repository owner for permission before redistributing or using this project beyond applicable rights in its components and datasets.

---

<p align="center">
  <strong>🌱 Bhoomi Insight</strong><br/>
  Turning Geographical Data into Meaningful Insights.
</p>