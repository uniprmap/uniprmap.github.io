// Google Maps addresses and links for buildings drawn on QGIS {QGIS Building Name: [Address, Google Maps Link]}
const googleMapsAddressesDict = { 
    "Ingegneria Didattica": ["Parco Area delle Scienze 69/A - Parma", "https://maps.app.goo.gl/2XqZK2fhurvEQw917"],
    "Ingegneria Ampliamento": ["Parco Area delle Scienze 69/A - Parma", "https://maps.app.goo.gl/xzcWDhpwXt7GGofN6"],
    "Ingegneria Scientifica": ["Parco Area delle Scienze 181/A - Parma", "https://maps.app.goo.gl/QJEzdxLE4URmrAgd7"]
 };

// Layer styles and options.
export const LAYER_CONFIG = {
    "Base": {
        style: { color: "#263238", fillColor: "#37474F", fillOpacity: 0.9 },
        hasTooltip: false, hasPopup: false
    },
    "Hallway": {
        style: { color: "#8D6E63", fillColor: "#D7CCC8", fillOpacity: 0.65, weight: 1.5 },
        hasTooltip: false, hasPopup: false
    },
    "Wall": {
        style: { color: "#424242", fillColor: "#616161", fillOpacity: 0.85 },
        hasTooltip: false, hasPopup: false
    },
    "Room": {
        style: { color: "#1565C0", fillColor: "#64B5F6", fillOpacity: 0.85, weight: 2.5 },
        hasTooltip: true, hasPopup: true
    },
    "Toilets": {
        style: { color: "#00838F", fillColor: "#80DEEA", fillOpacity: 0.8, weight: 2 },
        hasTooltip: true, hasPopup: true
    },
    "Reception": {
        style: { color: "#B71C1C", fillColor: "#EF5350", fillOpacity: 0.88 },
        hasTooltip: true, hasPopup: true
    },
    "Tables": {
        style: { color: "#6D4C41", fillColor: "#A1887F", fillOpacity: 0.75 },
        hasTooltip: false, hasPopup: true
    },
    "Staff Room": {
        style: { color: "#6A1B9A", fillColor: "#BA68C8", fillOpacity: 0.8, weight: 2.5 },
        hasTooltip: false, hasPopup: true
    },
    "Refreshment Area": {
        style: { color: "#E65100", fillColor: "#FFB74D", fillOpacity: 0.82, weight: 2.5 },
        hasTooltip: true, hasPopup: true
    },
    "Laboratory": {
        style: { color: "#558B2F", fillColor: "#9CCC65", fillOpacity: 0.83, weight: 2.5 },
        hasTooltip: true, hasPopup: true
    },
    "Door": {
        style: { color: "#F57C00", fillColor: "#FFD54F", fillOpacity: 0.65, weight: 1.5 },
        hasTooltip: false, hasPopup: false
    },
    "Roof": {
        style: { color: "#546E7A", fillColor: "#90A4AE", fillOpacity: 1, weight: 3 },
        hasTooltip: true, hasPopup: true
    },
    "Study Room": {
        style: { color: "#283593", fillColor: "#5C6BC0", fillOpacity: 0.8, weight: 2 },
        hasTooltip: true,hasPopup: true
    },
    "Wing": {
        style: { color: "#009688", fillColor: "#26A69A", fillOpacity: 0.82, weight: 1 },
        hasTooltip: true, hasPopup: true
    },
    "Stairs": {
        style: { color: "#5D4037", fillColor: "#8D6E63", fillOpacity: 0.8,  weight: 2.5 },
        hasTooltip: true, hasPopup: false
    },
    "Elevator": {
        style: { color: "#003DA5", fillColor: "#0047AB", fillOpacity: 0.82,  weight: 2.5 },
        hasTooltip: true, hasPopup: false
    },
    "WebsitePoint": { hasTooltip: false, hasPopup: true } 
};

// Render order list
export const RENDER_ORDER = [
    "Base",
    "Hallway",
    "Wall",
    "Wing",
    "Room",
    "Toilets",
    "Reception",
    "Tables",
    "Staff Room",
    "Refreshment Area",
    "Laboratory",
    "Study Room",
    "Stairs",
    "Elevator",
    "Door",
    "Roof",
    "WebsitePoint"
];

/**
 * Create a data structure for pre processed data { Building || Markers: { Floor: { Type: [features] } } }
 * @param {Object} geojsonData 
 * @returns [ processedData, searchableFeatures ]
 */
export function preProcessedGeoJSONData(geojsonData) {
    const processedData = {};
    const searchableFeatures = [];
    geojsonData.features.forEach(feature => {
        const type = feature.properties.Type;
        const floor = feature.properties.Floor;
        if (type === "WebsitePoint") {
            if (!processedData['Markers']) {
                processedData['Markers'] = {};
            }
            if (!processedData['Markers'][floor]) {
                processedData['Markers'][floor] = [];
            }
            processedData['Markers'][floor].push(feature);
            searchableFeatures.push(feature);
        } else {
            const building = feature.properties.Building;
            if (!processedData[building]) {
                processedData[building] = {};
            }
            if (!processedData[building][floor]) {
                processedData[building][floor] = {};
            }
            if (!processedData[building][floor][type]) {
                processedData[building][floor][type] = [];
            }
            processedData[building][floor][type].push(feature);
            if (type === "Room" || type === "Laboratory" || type === "Roof" || type === "Wing") {
                searchableFeatures.push(feature);
            }
        }
    });
    return [processedData, searchableFeatures];
}

/**
 * Create cluster layer for WebsitePoint features
 * @param {Object} features  
 * @returns {L.MarkerClusterGroup}
 */
function createClusterLayer(features) {
    const markersCluster = L.markerClusterGroup({
        maxClusterRadius: 50,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        chunkedLoading: true,
        iconCreateFunction: function(cluster) {
            const count = cluster.getChildCount();
            let size = count > 100 ? 'large' : (count > 10 ? 'medium' : 'small');
            return L.divIcon({
                html: `<div><span>${count}</span></div>`,
                className: `marker-cluster marker-cluster-${size}`,
                iconSize: L.point(40, 40)
            });
        }
    });

    features.forEach(f => {
        const lon = f.geometry.coordinates[0];
        const lat = f.geometry.coordinates[1];
        
        const marker = L.marker([lat, lon]);
        
        const popupContent = f.properties.popup; 
        marker.bindPopup(popupContent);

        markersCluster.addLayer(marker);
    });

    return markersCluster;
}

/**
 * Create layer for the given type and add it to the map and to geojsonActiveLayers
 * @param {String} type 
 * @param {Array} features 
 * @param {String} building 
 * @param {Number} floor 
 * @param {Object} map 
 * @param {Object} geojsonActiveLayers 
 */
function createLayer(type, features, building, floor, map, geojsonActiveLayers) {
    const filteredFeatures = features;
    
    if (!filteredFeatures || filteredFeatures.length === 0) return;

    let layer;

    if (type === "WebsitePoint") {
        layer = createClusterLayer(filteredFeatures);
    } else {
        const config = LAYER_CONFIG[type];
        if (!config) {
            console.error(`Layer configuration for type "${type}" not found. Please check LAYER_CONFIG, RENDER_ORDER and map.geojson in mapElements.js .`);
            return;
        }
        
        layer = L.geoJSON(filteredFeatures, {
            style: config.style,
            onEachFeature: function(feature, leafletLayer) {
                const props = feature.properties;

                if (!googleMapsAddressesDict.hasOwnProperty(props.Building)) {
                    console.error(`Building "${props.Building}" not found in googleMapsAddressesDict in mapElements.js . Please check the data in this constant and map.geojson file.`);
                    return;
                }
                
                if (config.hasPopup) {
                    let popupContent = `<b>${props.Name === null ? props.Type : props.Name}</b>`;
                    popupContent += `<br>Building: ${props.Building}`;
                    popupContent += `<br>Floor: ${props.Floor !== 99 ? props.Floor : 'Roof'}`;
                    
                    popupContent += `<br>Address: ${googleMapsAddressesDict[props.Building][0]}`;
                    popupContent += `<br><a href="${googleMapsAddressesDict[props.Building][1]}" target="_blank">View on Google Maps</a>`;
                    
                    leafletLayer.bindPopup(popupContent);
                }

                if (config.hasTooltip) {
                    const labelText = props.Name === null ? props.Type : props.Name;
                    if (labelText) leafletLayer.bindTooltip(labelText, { permanent: true, direction: "center" });
                }
            }
        });
    }

    layer.addTo(map);

    // Saves layer to active layers structure
    if (!geojsonActiveLayers[building]) {
        geojsonActiveLayers[building] = {};
    }
    if (!geojsonActiveLayers[building][floor]) {
        geojsonActiveLayers[building][floor] = {};
    }
    if (!geojsonActiveLayers[building][floor][type]) {
        geojsonActiveLayers[building][floor][type] = [];
    }
    geojsonActiveLayers[building][floor][type].push(layer);
}

/**
 * Removes all layers of a specific building from the map and from geojsonActiveLayers
 * @param {String} building 
 * @param {Object} map 
 * @param {Object} geojsonActiveLayers  
 */
export function clearBuildingLayers(building, map, geojsonActiveLayers) {
    if (!geojsonActiveLayers[building]) return;
    
    Object.keys(geojsonActiveLayers[building]).forEach(floor => {
        Object.keys(geojsonActiveLayers[building][floor]).forEach(type => {
            geojsonActiveLayers[building][floor][type].forEach(layer => {
                map.removeLayer(layer);
            });
        });
    });
    
    // Pulisce la struttura per il building
    delete geojsonActiveLayers[building];
}

/**
 * Render roof layers and markers on startup
 * @param {Object} map 
 * @param {Object} geojsonFeatures 
 * @param {Object} geojsonActiveLayers 
 */
export function renderOnStartup(map, geojsonFeatures, geojsonActiveLayers) {
    Object.keys(geojsonFeatures).forEach(building => {
        // Markers are in the end of the data structure
        if (building === 'Markers') {
            return;
        }
        // Renders roof layer
        const roofFloor = '99';
        if (geojsonFeatures[building][roofFloor]) {
            const roofFeatures = geojsonFeatures[building][roofFloor]['Roof'];
            if (roofFeatures) {
                createLayer('Roof', roofFeatures, building, roofFloor, map, geojsonActiveLayers);
            }
        }
    });
    
    // Renders all markers
    if (geojsonFeatures['Markers'] && geojsonFeatures['Markers']['99']) {
        const markerFeatures = geojsonFeatures['Markers']['99'];
        createLayer('WebsitePoint', markerFeatures, 'Markers', '99', map, geojsonActiveLayers);
    }
}

/**
 * Render all layers for a specific building and floor
 * @param {Object} geojsonFeatures 
 * @param {String} selectedBuilding 
 * @param {String} selectedFloor 
 * @param {Object} map 
 * @param {Object} geojsonActiveLayers 
 */
export function renderFloor(geojsonFeatures, selectedBuilding, selectedFloor, map, geojsonActiveLayers) {
    
    clearBuildingLayers(selectedBuilding, map, geojsonActiveLayers);
    
    RENDER_ORDER.forEach(type => {
        const features = geojsonFeatures[selectedBuilding][selectedFloor][type];
        if (features) {
            createLayer(type, features, selectedBuilding, selectedFloor, map, geojsonActiveLayers);
        }
    });
}