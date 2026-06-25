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
 * Fetches JSON data from multiple paths, returning the first successful response.
 * @param {string[]} paths - An array of paths to fetch JSON data from.
 * @returns {Promise<Object>} - A promise that resolves to the JSON data from the first successful fetch.
 * @throws {Error} - Throws an error if all fetch attempts fail.
 */
async function fetchJsonWithFallback(paths) {
    for (const path of paths) {
        const response = await fetch(path);
        if (response.ok) {
            return response.json();
        }
    }
    throw new Error(`Impossibile caricare JSON da: ${paths.join(', ')}`);
}

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
        fetchJsonWithFallback([
            `/${repositoryName}/json/map.geojson`,
            './json/map.geojson'
        ]),
        fetchJsonWithFallback([
            `/${repositoryName}/json/websiteFeatures.geojson`,
            './json/websiteFeatures.geojson'
        ])
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

    const legendTexts = {
        it: {
            title: 'Informazioni e legenda colori',
            intro: 'Questa è una mappa interattiva dell\'<a href="https://www.unipr.it" target="_blank" rel="noopener noreferrer">Università di Parma</a>, pensata per studenti e visitatori.',
            search: 'Cerca edifici, aule e laboratori dell\'università usando la barra di ricerca. Il risultato selezionato ti porterà nella posizione corrispondente sulla mappa.',
            zoom: 'Ingrandisci la vista sugli edifici del Dipartimento di Ingegneria e Architettura (quelli grigi) per mostrare i controlli dei piani ed esplorare ogni edificio nel dettaglio. I pulsanti di interazione diventano disponibili solo a livelli di zoom più alti.',
            click: 'Clicca sui tetti degli edifici interattivi e sulle stanze colorate al loro interno per vedere informazioni dettagliate.',
            project: 'Il progetto è open source ed è disponibile su <a href="https://github.com/uniprmap/uniprmap.github.io" target="_blank" rel="noopener noreferrer">GitHub</a>. Chiunque è invitato/a a collaborare per ampliare la mappa con nuovi dipartimenti interattivi.',
            author: 'Realizzato con passione da: Leonardo Capodacqua',
            quote: '“Un piccolo progetto con un obiettivo semplice: aiutare le persone ad orientarsi facilmente.”',
            legend: 'Legenda'
        },
        en: {
            title: 'Information and Color Legend',
            intro: 'This is an interactive map of the <a href="https://www.unipr.it" target="_blank" rel="noopener noreferrer">University of Parma</a> designed for students and visitors.',
            search: 'Search for university buildings, rooms, and laboratories using the search bar. The selected result will bring you to the corresponding location on the map.',
            zoom: 'Zoom in on the Department of Engineering and Architecture buildings (the grey ones) to reveal floor controls and explore each building in detail. Interaction buttons become available only at higher zoom levels.',
            click: 'Click on the roofs of the interactive buildings and on the colored rooms inside them to view detailed information.',
            project: 'The project is open source and available on <a href="https://github.com/uniprmap/uniprmap.github.io" target="_blank" rel="noopener noreferrer">GitHub</a>. Collaborators are welcome to help expand the map with new interactive departments.',
            author: 'Made with passion by: Leonardo Capodacqua',
            quote: '“A little project with a simple goal: helping people find their way easily.”',
            legend: 'Legend'
        }
    };

    const renderLegendContent = (language) => {
        const selectedText = legendTexts[language];

        let legendHtml = `
        <div style="margin-bottom: 8px; font-size: 12px;">
            <span data-language="it" style="cursor: pointer; font-weight: ${language === 'it' ? 'bold' : 'normal'};">IT</span>
            |
            <span data-language="en" style="cursor: pointer; font-weight: ${language === 'en' ? 'bold' : 'normal'};">EN</span>
        </div>
        <h4>${selectedText.title}</h4>
        <p>${selectedText.intro}</p>
        
        <p>
        ${selectedText.search}
        </p>

        <p>
        ${selectedText.zoom}
        </p>

        <p>
        ${selectedText.click}
        </p>

        <p>
        ${selectedText.project}
        </p>

        <p>
            ${selectedText.author}
        </p>
        
        <p style="margin-top:10px; font-style: italic;">
            ${selectedText.quote}
        </p>

        <h4>${selectedText.legend}</h4>
        `;

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
    };

    renderLegendContent(legendLanguage);
    
    document.querySelector('.map-container').appendChild(legendPanel);

    if (legendButton) {
        legendButton.classList.add('legend-active');
    }
}