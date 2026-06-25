import {preProcessedGeoJSONData, renderOnStartup, LAYER_CONFIG, RENDER_ORDER} from './mapElements.js';

const repositoryName = 'uniprmap';

// Map initialization
const START_CENTER = [44.7649, 10.3123];
const START_ZOOM = 17;
export const map = L.map('map', {
    center: START_CENTER,
    zoom: START_ZOOM,
    zoomControl: false
});

// Zoom control position
L.control.zoom({ position: 'bottomleft' }).addTo(map);

// Background map layer: OpenStreetMap 
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 23,
    maxNativeZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

// Data structures and variables
// geoJSON raw data from geojson files
let geojsonData = null;
// Processed geoJSON features organized by Building/Markers, Floor, and Type
export let geojsonFeatures = {}; // { Building || Markers: { Floor: { Type: [features] } } }
// Active layers currently displayed on the map. Same structure as geojsonFeatures.
export let geojsonActiveLayers = {};
// Searchable features list for search functionality (Buildings, Rooms, Labs and Markers)
export let searchableFeatures = [];
// Legend panel variable
let legendPanel = null;
// Default Legend language
export let legendLanguage = 'it';

/**
 * Populates data structures, pre-processes GeoJSON data, and renders map elements on startup. 
 * It loads all the data on the start of the website.
 * @returns
 */
export function loadMapData() {
    if (geojsonData) {
        return;
    }
    RENDER_ORDER.forEach(type => {
        if (!LAYER_CONFIG.hasOwnProperty(type)) {
            console.error(`Layer type "${type}" in RENDER_ORDER is not defined in LAYER_CONFIG in mapElements.js . Please ensure both contain the same types of elements.`);
            return;
        }
    });
    Promise.all([
        fetch('./json/map.geojson').then(res => res.json()),
        fetch('./json/websiteFeatures.geojson').then(res => res.json())
    ])
    .then(([mapData, websiteData]) => {
        if (websiteData.features) {
            mapData.features.push(...websiteData.features);
        }
        geojsonData = mapData;
        const [features, searchables] = preProcessedGeoJSONData(geojsonData);
        geojsonFeatures = features;
        searchableFeatures = searchables;
        geojsonActiveLayers = {};
        renderOnStartup(map, geojsonFeatures, geojsonActiveLayers);
        console.log("Map data loaded successfully.");
    });
}

export function resetMapView() {
    map.setView(START_CENTER, START_ZOOM);
}

/**
 * Shows legend panel with colours and elements names based on LAYER_CONFIG
 * @returns 
 */
export function showLegend() {
    const legendButton = document.querySelector('.legend-button');
    if (legendPanel) {
        legendPanel.remove();
        legendPanel = null;
        if (legendButton) {
            legendButton.classList.remove('legend-active');
        }
        return;
    }

    legendPanel = document.createElement('div');
    legendPanel.className = 'info legend legend-panel';
    
    const legendLabels = {
        Base: "Walls",
        Wall: "Partitions"
    }

    // Render legend content reading HTML from DOM fragments (SEO-friendly)
    const renderLegendContent = (language) => {
        const fragment = document.querySelector(`#legend-texts [data-lang="${language}"]`);
        const selectedHtml = fragment ? fragment.innerHTML : '';

        let legendHtml = `
            <div style="margin-bottom: 8px; font-size: 12px;">
                <span data-language="it" style="cursor: pointer; font-weight: ${language === 'it' ? 'bold' : 'normal'};">IT</span>
                |
                <span data-language="en" style="cursor: pointer; font-weight: ${language === 'en' ? 'bold' : 'normal'};">EN</span>
            </div>
            ${selectedHtml}
        `;

        // append color legend from LAYER_CONFIG
        for (const layerName in LAYER_CONFIG) {
            const layer = LAYER_CONFIG[layerName];
            if (layer.style && layer.style.fillColor) {
                legendHtml +=
                    `<i style="background:${layer.style.fillColor}; border: 3px solid ${layer.style.color};"></i>` +
                    `${legendLabels[layerName] || layerName}<br>`;
            }
        }

        legendPanel.innerHTML = legendHtml;

        legendPanel.querySelectorAll('[data-language]').forEach((element) => {
            element.addEventListener('click', () => {
                legendLanguage = element.dataset.language;
                window.dispatchEvent(new CustomEvent('legend-language-change', {
                    detail: { language: legendLanguage }
                }));
                renderLegendContent(legendLanguage);
            });
        });

        const updateFragments = (language) => {
            document.querySelectorAll('#legend-texts [data-lang]').forEach(el => {
                if (el.dataset.lang === language) {
                el.classList.add('active');
                el.setAttribute('aria-hidden', 'false');
                } else {
                el.classList.remove('active');
                el.setAttribute('aria-hidden', 'true');
                }
            });
        };

        updateFragments(language);
    };

    renderLegendContent(legendLanguage);
    
    document.querySelector('.map-container').appendChild(legendPanel);

    if (legendButton) {
        legendButton.classList.add('legend-active');
    }
}