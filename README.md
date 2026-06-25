# 🗺️ UniPR Interactive Map (Italiano)

Sito disponibile su: https://uniprmap.github.io

**UniPR Interactive Map** è una proposta di nuova mappa interattiva per l’**Università di Parma**, progettata principalmente per **nuovi studenti** e **studenti Erasmus**.  
Fornisce una navigazione dettagliata delle strutture universitarie, sia **all’interno degli edifici** (piante dei piani) sia **a livello cittadino**.

Il progetto può essere considerato un’**evoluzione dell’attuale mappa interattiva ufficiale dell’università**, offrendo maggiore dettaglio, usabilità ed estendibilità.

---

## ✨ Funzionalità

- 🔍 Ricerca interattiva per individuare **aule e servizi specifici**
- 🏙️ **Localizzazione degli edifici universitari** distribuiti in città
- 🧭 **Navigazione multi-piano** per alcuni edifici universitari
- 🎨 **Elementi colorati** in base alla tipologia di luogo
- 💬 Tooltip e pop-up con **informazioni dettagliate** e **link a Google Maps**
- 📱 **Interfaccia responsive**, utilizzabile sia da desktop che da dispositivi mobili
- 🆓 Realizzato interamente con **software libero e open-source**
- 🧩 Progettato per essere **facilmente estendibile** con nuovi edifici

---

## 🧱 Struttura e caratteristiche dei GeoJSON

Ogni elemento poligonale disegnato in QGIS ed esportato in GeoJSON contiene **cinque attributi**:

1. **fid** – Identificatore univoco dell’elemento  (obbligatorio, auto-incrementale)
2. **Building** – Nome dell’edificio  (obbligatorio)
3. **Floor** – Piano dell’edificio  (obbligatorio)
4. **Type** – Tipologia dell’elemento  (obbligatorio)
5. **Name** – Nome dell’elemento (facoltativo)

---

### 🗂️ Tipologie di elementi supportate già presenti nel progetto QGIS

- Room  
- Stairs  
- Toilets  
- Wall  
- Tables  
- Hallway  
- Reception  
- Door  
- Staff Room  
- Base  
- Roof  
- Refreshment Area  
- Laboratory
- Study Room
- Wing
- Elevator

---

## 🗃️ Origine dei dati, struttura interna e tecnologie utilizzate

### 📍 Origine dei dati

- Tutti i dati della mappa vengono caricati **interamente all’avvio del sito**
- I dati sono contenuti in file `.geojson`:
  - `websiteFeatures.geojson` contiene i marker puntuali legacy
  - `map.geojson` contiene gli elementi poligonali disegnati in QGIS
- I GeoJSON sono esportati utilizzando il sistema di riferimento **EPSG:4326**
- Le piante dei piani provengono dal **sito ufficiale dei piani di emergenza dell’università**
- Tutto il lavoro di disegno in QGIS è svolto **manualmente**

---

### 🧠 Struttura dati principale

La struttura dati principale utilizzata dall’applicazione è una **Map**, scelta per il suo **accesso in tempo O(1)**.

Struttura:

{
    Building || Markers: {
        Floor: {
            Type: [array di features]
        }
    }
}


Durante l’utilizzo del sito viene utilizzata una **seconda struttura dati** per tracciare la **vista corrente della mappa**.

---

### ⚙️ Tecnologie utilizzate
Il sito è stato pensato per essere autonomo, non sono stati utilizzati frameworks e non dispone di dipendenze esterne. 

Le tecnologie utilizzate sono:
- 🟥 HTML
- 🟨 Javascript
- 🍃 Leaflet (libreria Javascript per gestire la mappa)
- 🌐 Geojson (file format dei dati)
- 🟪 CSS
- 🟩 QGIS
- 🗺️ OpenStreetMap

QGIS è un software GIS gratuito ed open-sorce. La mappa in background è OpenStreetMap.

---

## ➕ Aggiunta di nuove tipologie di elementi

Per aggiungere nuove tipologie di elementi alla mappa dato un nuovo file map.geojson aggiornato ed esportato da QGIS:

1. Aggiornare la costante `LAYER_CONFIG`  
2. Aggiornare la costante `RENDER_ORDER`
3. Aggiornare la costante `googleMapsAddressesDict` 

Tutte si trovano nel file `mapElements.js`.

---
---

# 🗺️ UniPR Interactive Map (English)

Website available on: https://uniprmap.github.io

**UniPR Interactive Map** is a proposed new interactive map for the **University of Parma**, designed primarily for **new students** and **Erasmus students**.  
It provides detailed navigation across university facilities, both **inside buildings** (floor plans) and **across the city**.

The project can be considered an **evolution of the current official university interactive map**, offering greater detail, usability, and extensibility.

---

## ✨ Features

- 🔍 Interactive search to locate **specific rooms and facilities**
- 🏙️ **Campus-wide building locations** distributed throughout the city
- 🧭 **Multi-floor navigation** for some university buildings
- 🎨 **Color-coded elements** based on location type
- 💬 Tooltips and pop-ups with **detailed information** and **Google Maps links**
- 📱 Fully **responsive UI**, designed for both desktop and mobile devices
- 🆓 Built entirely using **free and open-source software**
- 🧩 Designed to be **easily expandable** with new buildings

---

## 🧱 GeoJSON Features and Structure

Each polygon element drawn in QGIS and exported to GeoJSON contains **five attributes**:

1. **fid** – Unique identifier of the element  (mandatory, auto-incremented)
2. **Building** – Name of the building  (mandatory)
3. **Floor** – Floor number  (mandatory, 99 for the roofs)
4. **Type** – Type of element  (mandatory)
5. **Name** – Name of the element (optional)

---

### 🗂️ Supported Element Types already in QGIS project

- Room  
- Stairs  
- Toilets  
- Wall  
- Tables  
- Hallway  
- Reception  
- Door  
- Staff Room  
- Base  
- Roof  
- Refreshment Area  
- Laboratory
- Study Room
- Wing
- Elevator

---

## 🗃️ Data Source, Internal Data Structure and Implemented Technologies

### 📍 Data Source

- All map data is loaded **entirely at website startup**
- Data is stored in `.geojson` files:
  - `websiteFeatures.geojson` contains point markers taken from the original map website
  - `map.geojson` contains polygon elements drawn in QGIS
- GeoJSON files are exported using **EPSG:4326**
- Floor plans are sourced from the **official university emergency plans**
- All drawings in QGIS are created **manually**

---

### 🧠 Main Data Structure

The core data structure used by the application is a **Map**, chosen for its **O(1) access complexity**.

Structure:

{
Building || Markers: {
    Floor: {
        Type: [features array]
        }
    }
}


During interaction with the website, a **secondary data structure** is used to track the **current map view**.

---

### ⚙️ Technologies
The website is thought to be autonomous, no frameworks were used and it hasn't any external dependency. 

Implemented technologies are:
- 🟥 HTML
- 🟨 Javascript
- 🍃 Leaflet (JavaScript library to manage the map)
- 🌐 Geojson (data file format)
- 🟪 CSS
- 🟩 QGIS
- 🗺️ OpenStreetMap

QGIS is a geographic information system software that is free and open-source. Background map is OpenStreetMap.

---

## ➕ Adding New Element Types

To add support for new types of map elements given a new and updated map.geojson file exported from QGIS:

1. Update the `LAYER_CONFIG` constant  
2. Update the `RENDER_ORDER` constant  
3. Update the `googleMapsAddressesDict` constant

All are located in the `mapElements.js` file.
