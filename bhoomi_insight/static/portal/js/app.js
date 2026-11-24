/* Bhoomi Insight interactions — existing interface retained. */
(() => {
  "use strict";

  // Live federated evidence search. Results are fetched from external APIs via Django;
  // no demo records or hard-coded keyword dictionary are used for search.
  const searchInput = document.getElementById("evidenceSearch");
  const filterButtons = [...document.querySelectorAll(".filter-chip")];
  const evidenceGrid = document.getElementById("evidenceGrid");
  const emptyState = document.getElementById("emptyState");
  const evidenceStatus = document.getElementById("evidenceStatus");
  const ogdCatalogLink = document.getElementById("ogdCatalogLink");
  let activeFilter = "all";
  let searchTimer = null;
  let activeController = null;

  function setSearchMessage(message, status = "") {
    if (emptyState) {
      emptyState.textContent = message;
      emptyState.hidden = false;
    }
    if (evidenceGrid) evidenceGrid.replaceChildren();
    if (evidenceStatus && status) evidenceStatus.textContent = status;
  }

  function makeElement(tag, className, value) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (value !== undefined) node.textContent = value;
    return node;
  }

  function renderLiveResults(results) {
    evidenceGrid.replaceChildren();
    results.forEach(item => {
      const card = makeElement("article", "evidence-card");
      card.dataset.category = item.category || "research";
      const meta = makeElement("div", "card-meta");
      meta.appendChild(makeElement("span", `type-tag ${item.category || "research"}`, item.category || "research"));
      meta.appendChild(makeElement("span", "card-date", item.date || "Date not supplied"));
      card.appendChild(meta);
      card.appendChild(makeElement("h3", "", item.title || "Untitled source"));
      card.appendChild(makeElement("p", "", item.summary || "No summary was supplied by the source."));
      const foot = makeElement("div", "card-foot");
      foot.appendChild(makeElement("span", "", `${item.organisation || "External source"} · ${item.provider || "Source"}`));
      if (item.url) {
        const link = makeElement("a", "open-evidence", "View source ↗");
        link.href = item.url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        foot.appendChild(link);
      }
      card.appendChild(foot);
      evidenceGrid.appendChild(card);
    });
    if (emptyState) emptyState.hidden = results.length > 0;
    if (!results.length && emptyState) emptyState.textContent = "No live results were returned for this keyword. Try a broader search.";
  }

  async function runLiveSearch() {
    const query = (searchInput?.value || "").trim();
    if (query.length < 2) {
      setSearchMessage("Enter at least two characters to search live research publications and public datasets.", "LIVE SEARCH · READY");
      return;
    }
    if (activeController) activeController.abort();
    activeController = new AbortController();
    setSearchMessage("Searching external research and public-data catalogs…", "SEARCHING LIVE SOURCES…");
    try {
      const params = new URLSearchParams({q: query, category: activeFilter});
      const response = await fetch(`/api/search/?${params.toString()}`, {signal: activeController.signal});
      if (!response.ok) throw new Error(`Search service returned ${response.status}`);
      const payload = await response.json();
      if (ogdCatalogLink && payload.ogd_catalog_url) ogdCatalogLink.href = payload.ogd_catalog_url;
      renderLiveResults(payload.results || []);
      const count = (payload.results || []).length;
      if (evidenceStatus) {
        const providers = (payload.sources || []).join(" · ").toUpperCase();
        evidenceStatus.textContent = `${count} RESULTS · ${providers || "SEARCH COMPLETE"}`;
      }
      if (!count && emptyState && payload.message) emptyState.textContent = payload.message;
      if (!count && emptyState && payload.errors?.length) {
        emptyState.textContent += ` ${payload.errors.join(" | ")}`;
      }
    } catch (error) {
      if (error.name === "AbortError") return;
      console.error("Live evidence search failed:", error);
      setSearchMessage("Live search is temporarily unavailable. Check your internet connection and try again.", "SEARCH SERVICE UNAVAILABLE");
    }
  }

  function scheduleSearch() {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(runLiveSearch, 450);
  }

  filterButtons.forEach(button => button.addEventListener("click", () => {
    activeFilter = button.dataset.filter || "all";
    filterButtons.forEach(item => item.classList.toggle("selected", item === button));
    scheduleSearch();
  }));
  searchInput?.addEventListener("input", scheduleSearch);
  searchInput?.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      clearTimeout(searchTimer);
      runLiveSearch();
    }
  });

  // National map: use local GeoJSON if supplied; otherwise fetch the cited hosted
  // 36-region FeatureCollection. No fabricated polygon coordinates are generated.
  const mapElement = document.getElementById("indiaMap");
  if (mapElement) {
    if (!window.L) {
      setMapError("Leaflet could not load. Check your internet connection and refresh.");
    } else {
      initIndiaMap();
    }
  }

  function setMapError(message) {
    const status = document.getElementById("mapStatus");
    const directory = document.getElementById("regionDirectory");
    if (status) status.textContent = "MAP DATA UNAVAILABLE";
    if (directory) directory.innerHTML = "";
    if (directory) {
      const p = document.createElement("p");
      p.className = "directory-loading";
      p.textContent = message;
      directory.appendChild(p);
    }
    const description = document.getElementById("selectedRegionDescription");
    if (description) description.textContent = message;
  }

  function initIndiaMap() {
    const map = L.map("indiaMap", {
      scrollWheelZoom: false,
      zoomControl: true,
      minZoom: 3
    }).setView([22.8, 79.0], 4);

    let stateLayer = null;
    let allFeatures = [];
    let activeTheme = "all";
    let selectedLayer = null;
    const stateSearch = document.getElementById("stateSearch");
    const directory = document.getElementById("regionDirectory");
    const status = document.getElementById("mapStatus");

    const themesByRegion = {
      "Punjab": ["Agriculture", "Groundwater", "Soil health"],
      "Haryana": ["Agriculture", "Groundwater", "Urban growth"],
      "Uttar Pradesh": ["Agriculture", "River systems", "Land records"],
      "Rajasthan": ["Drylands", "Water stress", "Rangelands"],
      "Gujarat": ["Coastal", "Industry", "Drylands"],
      "Maharashtra": ["Urban growth", "Agriculture", "Forest"],
      "Goa": ["Coastal", "Tourism", "Forest"],
      "Kerala": ["Coastal", "Flood resilience", "Agriculture"],
      "Tamil Nadu": ["Coastal", "Urban growth", "Water stress"],
      "Andhra Pradesh": ["Coastal", "Agriculture", "Water"],
      "Telangana": ["Agriculture", "Urban growth", "Water"],
      "Karnataka": ["Agriculture", "Forest", "Urban growth"],
      "Odisha": ["Coastal", "Forest", "Climate resilience"],
      "West Bengal": ["Coastal", "River systems", "Agriculture"],
      "Assam": ["River systems", "Flood resilience", "Agriculture"],
      "Bihar": ["River systems", "Flood resilience", "Agriculture"],
      "Jharkhand": ["Forest", "Mining", "Land rights"],
      "Chhattisgarh": ["Forest", "Agriculture", "Land rights"],
      "Madhya Pradesh": ["Forest", "Agriculture", "Land tenure"],
      "Himachal Pradesh": ["Mountain ecosystems", "Forest", "Climate"],
      "Uttarakhand": ["Mountain ecosystems", "Forest", "Climate"],
      "Arunachal Pradesh": ["Forest", "Biodiversity", "Mountain ecosystems"],
      "Sikkim": ["Mountain ecosystems", "Biodiversity", "Climate"],
      "Manipur": ["Forest", "Agriculture", "Mountain ecosystems"],
      "Meghalaya": ["Forest", "Biodiversity", "Land tenure"],
      "Mizoram": ["Forest", "Biodiversity", "Land tenure"],
      "Nagaland": ["Forest", "Community land", "Biodiversity"],
      "Tripura": ["Forest", "Agriculture", "Land tenure"],
      "Delhi": ["Urban growth", "Land records", "Planning"],
      "Chandigarh": ["Urban growth", "Planning", "Land records"],
      "Puducherry": ["Coastal", "Urban growth", "Water"],
      "Ladakh": ["Mountain ecosystems", "Water stress", "Climate"],
      "Jammu and Kashmir": ["Mountain ecosystems", "Agriculture", "Climate"],
      "Andaman and Nicobar Islands": ["Coastal", "Forest", "Biodiversity"],
      "Lakshadweep": ["Coastal", "Marine ecosystems", "Climate"],
      "Dadra and Nagar Haveli and Daman and Diu": ["Coastal", "Forest", "Urban growth"]
    };

    const unionTerritories = new Set([
      "Andaman and Nicobar Islands", "Chandigarh",
      "Dadra and Nagar Haveli and Daman and Diu", "Delhi",
      "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
    ]);

    function normalise(value) {
      return String(value || "")
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/&/g, "and").replace(/[^a-z0-9]/gi, "")
        .toLowerCase();
    }

    function getProps(feature) {
      const props = feature.properties || {};
      const indexed = {};
      Object.entries(props).forEach(([key, value]) => {
        indexed[normalise(key)] = value;
      });
      const rawName = indexed.shapename || indexed.statename || indexed.name ||
        indexed.stnm || indexed.state || indexed.region || indexed.shapeName ||
        indexed.NAME_1 || indexed.NAME || "Unnamed region";
      return {
        name: String(rawName).normalize("NFC").trim(),
        type: String(indexed.type || indexed.regiontype || indexed.adminlevel || "")
      };
    }

    function regionType(name, sourceType) {
      const type = sourceType.toLowerCase();
      if (type.includes("union") || type === "ut" || unionTerritories.has(name)) {
        return "Union Territory";
      }
      return "State";
    }

    function regionThemes(name) {
      return themesByRegion[name] || ["Land records", "Land use", "Climate resilience"];
    }

    function featureMatches(feature) {
      const name = getProps(feature).name;
      const query = (stateSearch?.value || "").trim().toLocaleLowerCase();
      return !query || name.toLocaleLowerCase().includes(query);
    }

    function baseStyle() {
      return { color: "#f5f0e5", weight: 1.1, fillColor: "#a9b69a", fillOpacity: 0.88 };
    }

    async function updateProfile(feature) {
      const props = getProps(feature);
      const themes = regionThemes(props.name);
      const typeNode = document.getElementById("selectedRegionType");
      const nameNode = document.getElementById("selectedRegionName");
      const descNode = document.getElementById("selectedRegionDescription");
      const tags = document.getElementById("selectedRegionThemes");
      if (typeNode) typeNode.textContent = regionType(props.name, props.type).toUpperCase();
      if (nameNode) nameNode.textContent = props.name;
      if (descNode) descNode.textContent = `${props.name} selected. Loading regional research and source catalogue…`;
      if (tags) {
        tags.replaceChildren();
        themes.forEach(theme => { const span=document.createElement("span"); span.className="theme-tag"; span.textContent=theme; tags.appendChild(span); });
      }
      const panel = document.getElementById("territoryDataPanel");
      if (!panel) return;
      panel.innerHTML = '<p class="profile-loading">Loading verified source links and research…</p>';
      try {
        const response = await fetch(`/api/territory/?region=${encodeURIComponent(props.name)}`);
        if (!response.ok) throw new Error(`Territory service returned ${response.status}`);
        const data = await response.json();
        const overview = document.createElement("div"); overview.className="territory-overview-grid";
        (data.overview || []).forEach(item => {
          const card=document.createElement("article"); card.className="territory-metric";
          const label=document.createElement("span"); label.textContent=item.label;
          const value=document.createElement("strong"); value.textContent=item.value;
          const note=document.createElement("small"); note.textContent=item.note || "";
          card.append(label,value,note); overview.appendChild(card);
        });
        panel.replaceChildren(overview);
        (data.sections || []).forEach(section => {
          const block=document.createElement("section"); block.className="territory-data-section";
          const heading=document.createElement("h4"); heading.textContent=section.title;
          const paragraph=document.createElement("p"); paragraph.textContent=section.description;
          const list=document.createElement("ul"); (section.items || []).forEach(item=>{const li=document.createElement("li");li.textContent=item;list.appendChild(li);});
          block.append(heading,paragraph,list); panel.appendChild(block);
        });
        const researchBlock=document.createElement("section"); researchBlock.className="territory-data-section";
        const rh=document.createElement("h4"); rh.textContent="Research & evidence"; researchBlock.appendChild(rh);
        const research=data.research || [];
        if (!research.length) { const msg=document.createElement("p"); msg.textContent="No matching OpenAlex publications were returned. Try the live Evidence Library search."; researchBlock.appendChild(msg); }
        research.forEach(item=>{ const a=document.createElement("a"); a.className="territory-source-link"; a.href=item.url; a.target="_blank"; a.rel="noopener noreferrer"; a.textContent=`${item.title}${item.year ? ` (${item.year})` : ""} · ${item.source}`; researchBlock.appendChild(a); });
        panel.appendChild(researchBlock);
        const sourceBlock=document.createElement("section"); sourceBlock.className="territory-data-section";
        const sh=document.createElement("h4"); sh.textContent="Official data sources"; sourceBlock.appendChild(sh);
        (data.sources || []).forEach(item=>{const a=document.createElement("a");a.className="territory-source-link";a.href=item.url;a.target="_blank";a.rel="noopener noreferrer";a.textContent=item.label;sourceBlock.appendChild(a);});
        panel.appendChild(sourceBlock);
        if (descNode) descNode.textContent = `${props.name} · ${data.region_type}. Figures are only shown when a validated dataset is connected; unavailable indicators are labelled rather than estimated.`;
      } catch (error) {
        console.error("Territory profile failed:", error);
        panel.textContent = "Regional profile could not load. Check the Django server and /api/territory/ endpoint.";
      }
    }

    function selectFeature(feature, layer, zoomTo = true) {
      if (selectedLayer && stateLayer) stateLayer.resetStyle(selectedLayer);
      selectedLayer = layer;
      layer.setStyle({weight: 2.6, color: "#d7a27d", fillColor: "#c48b68", fillOpacity: 0.96});
      updateProfile(feature);
      if (zoomTo) map.fitBounds(layer.getBounds(), {padding: [28, 28], maxZoom: 6});
      renderDirectory();
    }

    function renderDirectory() {
      const visible = allFeatures.filter(featureMatches).sort((a, b) =>
        getProps(a).name.localeCompare(getProps(b).name));
      directory.replaceChildren();
      visible.forEach(feature => {
        const name = getProps(feature).name;
        const button = document.createElement("button");
        button.className = "directory-item";
        button.type = "button";
        button.textContent = name;
        button.addEventListener("click", () => {
          const layer = stateLayer.getLayers().find(item =>
            normalise(getProps(item.feature).name) === normalise(name));
          if (layer) selectFeature(layer.feature, layer);
        });
        directory.appendChild(button);
      });
      document.getElementById("regionCount").textContent =
        `${visible.length} / ${allFeatures.length} REGIONS`;
      if (!visible.length) {
        const p = document.createElement("p");
        p.className = "directory-loading";
        p.textContent = "No regions match this search or theme.";
        directory.appendChild(p);
      }
    }

    function refreshMap() {
      if (!stateLayer) return;
      stateLayer.eachLayer(layer => stateLayer.resetStyle(layer));
      if (selectedLayer && !featureMatches(selectedLayer.feature)) {
        stateLayer.resetStyle(selectedLayer);
        selectedLayer = null;
      }
      renderDirectory();
    }

    const sources = [
      "/static/portal/data/india_states.geojson",
      "https://raw.githubusercontent.com/geohacker/india/master/state/india_state.geojson",
      "https://static.geodataviewer.com/datasets/india-states.geojson"
    ];

    async function loadGeoJSON() {
      let lastError;
      for (const source of sources) {
        try {
          const response = await fetch(source, {
            cache: "no-cache",
            mode: "cors",
            credentials: "omit"
          });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const data = await response.json();
          if (!data || !Array.isArray(data.features) || data.features.length < 30) {
            throw new Error("GeoJSON does not contain the expected national region collection");
          }
          return data;
        } catch (error) {
          lastError = error;
          console.warn(`Could not load boundary source ${source}`, error);
        }
      }
      throw lastError || new Error("No boundary source available");
    }

    loadGeoJSON().then(data => {
      allFeatures = data.features;
      stateLayer = L.geoJSON(data, {
        style: baseStyle,
        onEachFeature: (feature, layer) => {
          const name = getProps(feature).name;
          layer.bindTooltip(name, {sticky: true, direction: "top"});
          layer.on({
            mouseover: event => {
              if (selectedLayer !== event.target) {
                event.target.setStyle({weight: 2, color: "#d7a27d", fillOpacity: 1});
              }
            },
            mouseout: event => {
              if (selectedLayer !== event.target) stateLayer.resetStyle(event.target);
            },
            click: () => selectFeature(feature, layer)
          });
        }
      }).addTo(map);

      map.fitBounds(stateLayer.getBounds(), {padding: [15, 15]});
      const count = allFeatures.length;
      status.textContent = `${count} GEOJSON FEATURES LOADED`;
      if (count !== 36) status.textContent += " · VERIFY COVERAGE";
      renderDirectory();

      const attribution = document.querySelector(".map-attribution-note");
      if (attribution) {
        attribution.textContent = "Boundary source: GeoJSON · public boundary snapshot · verify vintage before official/legal use";
      }
    }).catch(error => {
      console.error("India boundary loading failed:", error);
      setMapError("India boundary data could not be loaded. Check your internet connection or add india_states.geojson at static/portal/data/india_states.geojson.");
    });

    stateSearch?.addEventListener("input", refreshMap);
    document.querySelectorAll(".map-filter").forEach(button => {
      button.addEventListener("click", () => {
        activeTheme = button.dataset.theme || "all";
        document.querySelectorAll(".map-filter").forEach(item => item.classList.toggle("active", item === button));
        // Category buttons are discovery filters; they never hide administrative regions.
        if (status) status.textContent = `${allFeatures.length} REGIONS · ${activeTheme.toUpperCase()} THEME`;
        renderDirectory();
      });
    });
  }

  // Existing evidence and policy modal behavior.
  const backdrop = document.getElementById("modalBackdrop");
  const modalTitle = document.getElementById("modalTitle");
  const modalText = document.getElementById("modalText");
  const modalSource = document.getElementById("modalSource");
  const modalTag = document.getElementById("modalTag");

  function openModal({title, text, source, tag}) {
    if (!backdrop) return;
    modalTitle.textContent = title;
    modalText.textContent = text;
    modalSource.textContent = source || "BHOOMI INSIGHT";
    modalTag.textContent = tag || "WORKSPACE PREVIEW";
    backdrop.classList.add("show");
    backdrop.setAttribute("aria-hidden", "false");
  }
  function closeModal() {
    if (!backdrop) return;
    backdrop.classList.remove("show");
    backdrop.setAttribute("aria-hidden", "true");
  }


  document.getElementById("openPolicy")?.addEventListener("click", () => openModal({
    title: "Policy studio",
    text: "This concept workspace brings evidence into a decision journey: frame a land governance question, compare relevant research and territorial signals, record assumptions, and prepare a transparent policy brief. Scenario modelling and collaborative review can be connected in the next development phase.",
    source: "DISCOVER / INTERPRET / COLLABORATE",
    tag: "POLICY WORKSPACE PREVIEW"
  }));

  document.getElementById("closeModal")?.addEventListener("click", closeModal);
  document.getElementById("modalDone")?.addEventListener("click", closeModal);
  backdrop?.addEventListener("click", event => {
    if (event.target === backdrop) closeModal();
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeModal();
  });
})();
