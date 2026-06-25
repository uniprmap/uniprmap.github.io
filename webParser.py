"""
Script to parse the webpage at https://www.unipr.it/mappa and to extract markers data on the map.
"""
import requests
import json
import os

URL = "https://www.unipr.it/mappa"
START_HTML_ELEMENT = "<script type=\"application/json\" data-drupal-selector=\"drupal-settings-json\">"
END_HTML_ELEMENT = "</script>"

GEOJSON_OUTPUT_FILE = "./json/websiteFeatures.geojson"

os.makedirs(os.path.dirname(GEOJSON_OUTPUT_FILE), exist_ok=True)

# Fetch the webpage content
def fetch_page(url):
    response = requests.get(url)
    response.raise_for_status()
    return response.text

# Extract JSON data embedded in the HTML from starting element to ending element
def extract_json_data(html):
    start_index = html.find(START_HTML_ELEMENT) + len(START_HTML_ELEMENT)
    end_index = html.find(END_HTML_ELEMENT, start_index)
    json_data = html[start_index:end_index].strip()
    return json_data

# Extract features from the JSON data
def extract_features(json_data):
    data = json.loads(json_data)
    # Features are in the 'leaflet' section
    leaflet_data = data.get('leaflet', {})
    for key, value in leaflet_data.items():
        if 'features' in value:
            return value['features']
    return []

# Save features as GeoJSON
def save_as_geojson(raw_features, filename):
    geojson_features = []
    
    for d in raw_features:
        if "lat" in d and "lon" in d:
            try:
                feature = {
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [float(d["lon"]), float(d["lat"])]
                    },
                    "properties": {
                        "Type": "WebsitePoint", 
                        "Floor": 99,
                                    
                        "popup": d.get("popup", {}).get("value", "")
                    }
                }
                geojson_features.append(feature)
            except (ValueError, TypeError):
                continue

    geojson_structure = {
        "type": "FeatureCollection",
        "features": geojson_features
    }
    
    with open(filename, 'w', encoding='utf-8') as file:
        json.dump(geojson_structure, file, ensure_ascii=False, indent=2)

def main():
    html_content = fetch_page(URL)
    
    json_data = extract_json_data(html_content)
    
    features = extract_features(json_data)
    
    print(f"Trovate {len(features)} features.")

    save_as_geojson(features, GEOJSON_OUTPUT_FILE)
    print(f"File salvato in: {GEOJSON_OUTPUT_FILE}")

if __name__ == "__main__":
    main()