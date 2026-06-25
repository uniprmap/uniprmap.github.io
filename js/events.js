import { loadMapData, map, geojsonActiveLayers, geojsonFeatures, searchableFeatures, resetMapView, showLegend, legendLanguage} from './map.js';
import { renderFloor } from './mapElements.js';
// Defalut floor
let currentFloor = 99;
// Currently closest building to map center variable
let currentBuilding = null;

// Minimum zoom levels and distances
const MIN_ZOOM_LABELS = 19;
const MIN_ZOOM_ROOF_LABELS = 17;
const MIN_ZOOM_FLOOR_SELECTOR = 19;
const MIN_DISTANCE_FLOOR_SELECTOR = 100; // in meters

// Event listeners and initial setups
document.addEventListener('DOMContentLoaded', () => {
    loadMapData();

    map.on('zoomend', function() {
        updateLabelsVisibility();
    });

    map.on('moveend', function() {
        updateFloorSelectorVisibility();
    });

    setupFloorSelector();
    setupSearchBar();
    setupHomeButton();
    setupLegendButton();
});

window.addEventListener('legend-language-change', () => {
    if (currentBuilding && document.querySelector('.floor-selector')?.style.display !== 'none') {
        updateFloorSelectorOptions(currentBuilding);

        const floorText = document.querySelector('.floor-select-text');
        if (floorText) {
            floorText.textContent = getFloorLabel(currentFloor);
        }
    }
});

/**
 * Returns the label for a given floor number based on the current legend language.
 * @param {number} floor - The floor number (99 for roof).
 * @returns {string} - The label for the floor.
 */
function getFloorLabel(floor) {
    if (legendLanguage === 'it') {
        return floor === 99 ? 'Tetto' : `Piano ${floor}`;
    }
    return floor === 99 ? 'Roof' : `Floor ${floor}`;
}

/**
 * Updates floor selector options based on the selected building and current building floors.
 * @param {String} building 
 */
function updateFloorSelectorOptions(building) {
    const floorSelectButton = document.getElementById('floor-select');
    const floorOptions = document.getElementById('floor-options');
    const floorText = floorSelectButton?.querySelector('.floor-select-text');
    
    if (!floorSelectButton || !floorOptions || !building || !geojsonFeatures[building]) return;
    
    const floors = Object.keys(geojsonFeatures[building]).map(floor => parseInt(floor)).sort((a, b) => a - b);
    const currentValue = Object.keys(geojsonActiveLayers[building])[0];
    
    floorOptions.innerHTML = '';
    floors.forEach(floor => {
        const option = document.createElement('div');
        option.className = 'floor-option';
        option.dataset.floor = floor;
        option.textContent = getFloorLabel(floor);
        
        if (floor === parseInt(currentValue)) {
            option.classList.add('selected');
            if (floorText) {
                floorText.textContent = option.textContent;
            }
        }
        
        floorOptions.appendChild(option);
    });
    
    if (!floors.includes(parseInt(currentValue))) {
        if (floorText) {
            floorText.textContent = getFloorLabel(99);
        }
        currentFloor = 99;
        const roofOption = floorOptions.querySelector('[data-floor="99"]');
        if (roofOption) {
            roofOption.classList.add('selected');
        }
    }
}

/**
 * Sets up the floor selector element functionality
 */
function setupFloorSelector() {
    const floorSelectButton = document.getElementById('floor-select');
    const floorOptions = document.querySelector('.floor-options');

    if (!floorSelectButton || !floorOptions) return;

    floorSelectButton.addEventListener('click', function(e) {
        e.stopPropagation();
        floorOptions.classList.toggle('visible');
        floorSelectButton.classList.toggle('active');
    });

    document.addEventListener('click', function(e) {
        if (!floorSelectButton.contains(e.target) && !floorOptions.contains(e.target)) {
            floorOptions.classList.remove('visible');
            floorSelectButton.classList.remove('active');
        }
    });

    floorOptions.addEventListener('click', function(e) {
        const option = e.target;
        if (!option) return;

        const newFloor = parseInt(option.dataset.floor);
        const closestBuilding = getCurrentClosestBuilding();

        if (closestBuilding && geojsonFeatures[closestBuilding]) {
            currentFloor = newFloor;
            renderFloor(geojsonFeatures, closestBuilding, currentFloor, map, geojsonActiveLayers);

            const floorText = floorSelectButton.querySelector('.floor-select-text');
            floorText.textContent = option.textContent;
            
            floorOptions.querySelectorAll('.floor-option').forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            
            floorOptions.classList.remove('visible');
            floorSelectButton.classList.remove('active');
        }
    });
}

/**
 * Gets the currently closest building to the map center
 * @returns {String|null} closestBuilding
 */
function getCurrentClosestBuilding() {
    const center = map.getCenter();
    const buildings = Object.keys(geojsonActiveLayers).filter(b => b !== 'Markers');
    let minDist = MIN_DISTANCE_FLOOR_SELECTOR;
    let closestBuilding = null;
    
    buildings.forEach(building => {
        Object.keys(geojsonActiveLayers[building]).forEach(floor => {
            Object.keys(geojsonActiveLayers[building][floor]).forEach(type => {
                geojsonActiveLayers[building][floor][type].forEach(layer => {
                    layer.eachLayer(featureLayer => {
                        const feature = featureLayer.feature;
                        if (!feature || !feature.geometry) return;
                        
                        let coords;
                        if (feature.geometry.type === 'Polygon') {
                            const bounds = featureLayer.getBounds();
                            coords = bounds.getCenter();
                        } else if (feature.geometry.type === 'Point') {
                            coords = featureLayer.getLatLng();
                        }
                        
                        if (coords) {
                            const dist = map.distance(center, coords);
                            if (dist < minDist) {
                                minDist = dist;
                                closestBuilding = building;
                            }
                        }
                    });
                });
            });
        });
    });
    
    return closestBuilding;
}

/**
 * Show or hide labels based on zoom level and resets to roof floor if zoomed out too far
 */
function updateLabelsVisibility() {
    const currentZoom = map.getZoom();
    const buildingsToReset = new Set();

    Object.keys(geojsonActiveLayers).forEach(building => {
        if (building === 'Markers') return;
        
        Object.keys(geojsonActiveLayers[building]).forEach(floor => {
            Object.keys(geojsonActiveLayers[building][floor]).forEach(type => {
                geojsonActiveLayers[building][floor][type].forEach(layer => {
                    layer.eachLayer(featureLayer => {
                        const tooltip = featureLayer.getTooltip();
                        if (tooltip) {
                            const feature = featureLayer.feature;
                            const isRoof = feature.properties.Floor === 99;
                            const minZoom = isRoof ? MIN_ZOOM_ROOF_LABELS : MIN_ZOOM_LABELS;

                            if (currentZoom >= minZoom) {
                                if (!featureLayer.isTooltipOpen()) {
                                    featureLayer.openTooltip();
                                }
                            } else {
                                featureLayer.closeTooltip();
                                featureLayer.closePopup();

                                if (floor !== '99') {
                                    buildingsToReset.add(building);
                                }
                            }
                        }
                    });
                });
            });
        });
    });
    
    if (buildingsToReset.size > 0) {
        currentFloor = 99;
        const floorText = document.querySelector('.floor-select-text');
        if (floorText) {
            floorText.textContent = getFloorLabel(99);
        }
        buildingsToReset.forEach(building => {
            renderFloor(geojsonFeatures, building, '99', map, geojsonActiveLayers);
        });
    }
}

/**
 * Show or hide the floor selector based on zoom level and proximity to buildings
 */
function updateFloorSelectorVisibility() {
    const currentZoom = map.getZoom();
    const floorSelectorDiv = document.querySelector('.floor-selector');
    const floorLabel = document.querySelector('label[for="floor-select"]');

    let closestBuilding = getCurrentClosestBuilding();
    
    if (closestBuilding && currentZoom >= MIN_ZOOM_FLOOR_SELECTOR) {
        if (closestBuilding !== currentBuilding) {
            currentBuilding = closestBuilding;
            updateFloorSelectorOptions(closestBuilding);
        }
        
        if (floorLabel && closestBuilding) {
            floorLabel.textContent = `${closestBuilding}:`;
        }
        if (floorSelectorDiv) floorSelectorDiv.style.display = 'flex';
    } else {
        if (floorSelectorDiv) floorSelectorDiv.style.display = 'none';
        currentBuilding = null;
    }
}

/**
 * Extract name and building from marker popup HTML for search functionality
 * @param {String} popup 
 * @returns 
 */
function extractMarkerInfo(popup) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(popup, 'text/html');
    
    // Extract name from link
    const nameLink = doc.querySelector('a.link-clean');
    const name = nameLink ? nameLink.textContent.trim() : 'N/A';
    
    // Extract building/campus from the small text
    const campusDiv = doc.querySelector('.text-uppercase.xx-small.fw-bolder');
    const building = campusDiv ? campusDiv.textContent.trim() : '';
    
    return { name, building };
}

/**
 * Sets up the search bar functionality
 */
function setupSearchBar() {
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    
    if (!searchInput || !searchResults) return;
    
    searchInput.value = '';
    searchResults.innerHTML = '';
    searchResults.classList.remove('visible');
    
    searchInput.addEventListener('input', function() {
        const query = this.value.trim().toLowerCase();
        
        if (query.length === 0) {
            searchResults.classList.remove('visible');
            searchResults.innerHTML = '';
            return;
        }
        
        // Search by name
        const filtered = searchableFeatures.filter(feature => {
            if (feature.properties.Type === 'WebsitePoint' && feature.properties.popup) {
                const info = extractMarkerInfo(feature.properties.popup);
                return info.name.toLowerCase().includes(query);
            }
            const name = (feature.properties.Name || '').toLowerCase();
            return name.includes(query);
        });
        
        const topResults = filtered;
        
        if (topResults.length === 0) {
            searchResults.innerHTML = '<div class="no-results">No results found</div>';
            searchResults.classList.add('visible');
            return;
        }
        
        // Display results
        searchResults.innerHTML = topResults.map(feature => {
            let name, building, floor;
            const isMarker = feature.properties.Type === 'WebsitePoint';
            
            if (isMarker && feature.properties.popup) {
                const info = extractMarkerInfo(feature.properties.popup);
                name = info.name;
                building = info.building;
                floor = 'Point';
            } else {
                name = feature.properties.Name || feature.properties.Type;
                building = feature.properties.Building || 'N/A';
                floor = getFloorLabel(parseInt(feature.properties.Floor));
            }
            
            
            return `
                <div class="search-result-item" data-feature='${JSON.stringify(feature)}'>
                    <div class="search-result-name">${name}</div>
                    <div class="search-result-details">
                        <span class="search-result-building">${building}</span>
                        <span class="search-result-floor">${floor}</span>
                    </div>
                </div>
            `;
        }).join('');
        
        searchResults.classList.add('visible');
        
        // Add click listeners to results
        searchResults.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', function() {
                const feature = JSON.parse(this.getAttribute('data-feature'));
                flyToFeature(feature);
                searchResults.classList.remove('visible');
                searchInput.value = '';
            });
        });

        // Scroll results using up and down, left and right arrow keys and select element with Enter key
        let selectedIndex = -1;
        searchInput.addEventListener('keydown', function(e) {
            const items = searchResults.querySelectorAll('.search-result-item');

            if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                e.preventDefault();

                items[selectedIndex]?.classList.remove('selected');
                if ((e.key === 'ArrowDown' || e.key === 'ArrowRight') && selectedIndex < items.length - 1) {
                    selectedIndex += 1;
                } else if ((e.key === 'ArrowUp' || e.key === 'ArrowLeft') && selectedIndex > 0) {
                    selectedIndex -= 1;
                }

                items[selectedIndex].classList.add('selected');
                items[selectedIndex].scrollIntoView({ block: 'nearest', behavior: 'smooth' });

            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (selectedIndex >= 0 && selectedIndex < items.length) {
                    items[selectedIndex].click();
                }
            }
        });
    });
    
    // Close search results when clicking outside
    document.addEventListener('click', function(e) {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.classList.remove('visible');
        }
    });
}

/**
 * Fly to a specific feature on the map
 * @param {Object} feature 
 * @returns 
 */
function flyToFeature(feature) {
    const building = feature.properties.Building;
    const floor = feature.properties.Floor.toString();
    const geometry = feature.geometry;
    
    let targetCoords;
    let zoomValue;
    
    if (geometry.type === 'Point') {
        const lon = geometry.coordinates[0];
        const lat = geometry.coordinates[1];
        targetCoords = [lat, lon];
        zoomValue = MIN_ZOOM_ROOF_LABELS;
    } else if (geometry.type === 'Polygon') {
        // Calculate centroid
        const coords = geometry.coordinates[0];
        let latSum = 0, lonSum = 0;
        coords.forEach(coord => {
            lonSum += coord[0];
            latSum += coord[1];
        });
        targetCoords = [latSum / coords.length, lonSum / coords.length];
        zoomValue = MIN_ZOOM_LABELS;
    }
    
    if (!targetCoords) return;
    
    // Change floor if necessary
    if (building && building !== 'N/A' && geojsonFeatures[building]) {
        currentFloor = parseInt(floor);
        renderFloor(geojsonFeatures, building, floor, map, geojsonActiveLayers);
        
        const floorText = document.querySelector('.floor-select-text');
        if (floorText) {
            const floorLabel = getFloorLabel(parseInt(floor));
            floorText.textContent = floorLabel;
        }
        
        const floorOptions = document.querySelectorAll('.floor-option');
        floorOptions.forEach(opt => {
            opt.classList.remove('selected');
            if (opt.dataset.floor === floor) {
                opt.classList.add('selected');
            }
        });
        
        currentBuilding = building;
    }
    
    map.flyTo(targetCoords, zoomValue, {
        duration: 1.5,
        easeLinearity: 0.5
    });
}

/**
 * Sets up the home button functionality
 */
function setupHomeButton() {
    const homeButton = document.getElementById('home-button');
    if (homeButton) {
        homeButton.addEventListener('click', resetMapView);
    }
}

/**
 * Sets up the legend button and legend panel functionality
 */
function setupLegendButton() {
    const legendButton = document.getElementById('legend-button');
    if (legendButton) {
        legendButton.addEventListener('click', () => {
            showLegend();
        });
    }
}