# Struktura projektu GPS Heatmap

## Přehled struktury souborů

```
gps_heatmap/
├── custom_components/
│   └── gps_heatmap/              # Backend integrace (Python)
│       ├── __init__.py           # Hlavní soubor integrace
│       ├── config_flow.py        # UI konfigurace
│       ├── const.py              # Konstanty
│       ├── manifest.json         # Metadata integrace
│       ├── sensor.py             # Sensor platforma
│       └── strings.json          # Překlady (čeština)
│
├── www/
│   └── gps-heatmap-card.js       # Frontend karta (JavaScript)
│
├── README.md                      # Hlavní dokumentace
├── INSTALACE.md                   # Instalační návod (CZ)
├── TROUBLESHOOTING.md             # Řešení problémů (CZ)
├── lovelace-examples.md           # Příklady konfigurace
├── info.md                        # HACS info
├── hacs.json                      # HACS konfigurace
├── LICENSE                        # MIT licence
└── .gitignore                     # Git ignore soubory
```

## Popis souborů

### Backend (Python)

#### `__init__.py`
- Hlavní entry point integrace
- Registrace HTTP view pro API endpoint
- Setup/unload funkcionalita
- `GpsHeatmapView` - API endpoint pro načítání dat z recorderu
  - URL: `/api/gps_heatmap/data`
  - Metoda: POST
  - Parametry: latitude_entity, longitude_entity, start_time, end_time
  - Vrací: JSON s body heatmapy

#### `config_flow.py`
- UI konfigurace přes Nastavení → Zařízení a služby
- Výběr entit latitude/longitude
- Validace existence entit
- Options flow pro změnu konfigurace

#### `const.py`
- Konstanty použité v integraci
- Domain, názvy konfigurací, výchozí hodnoty

#### `manifest.json`
- Metadata pro Home Assistant
- Závislosti (recorder, http)
- Verze, dokumentace, autor

#### `sensor.py`
- Vytvoření senzoru `sensor.gps_heatmap`
- Uchování konfigurace (latitude_entity, longitude_entity)
- State: "ready"

#### `strings.json`
- České překlady pro UI
- Config flow texty
- Chybové hlášky

### Frontend (JavaScript)

#### `gps-heatmap-card.js`
- Custom Lovelace karta
- Implementace Web Components API
- Leaflet.js mapa
- Leaflet.heat plugin pro heatmapu
- Ovládací prvky:
  - Výběr časového období
  - Vlastní datum/čas
  - Tlačítko načtení dat
- Zobrazení statistik
- Gradient konfigurace

### Dokumentace

#### `README.md`
- Přehled funkčnosti
- Instalace (HACS + manuální)
- Základní konfigurace
- Parametry karty
- Příklady použití

#### `INSTALACE.md`
- Krok za krokem instalační návod
- Template senzory
- Řešení častých problémů při instalaci
- Konfigurace pro více osob

#### `TROUBLESHOOTING.md`
- Řešení problémů
- Diagnostické příkazy
- Debug režim
- Časté chyby a jejich opravy

#### `lovelace-examples.md`
- Příklady konfigurací karet
- Různé barevné schéma
- Layout příklady (horizontal, vertical)
- Různé use cases

## Datový tok

```
1. Uživatel klikne "Načíst data"
   ↓
2. JavaScript card odešle POST na /api/gps_heatmap/data
   ↓
3. GpsHeatmapView (Python) přijme požadavek
   ↓
4. Načte historii z recorderu pro latitude_entity a longitude_entity
   ↓
5. Spáruje hodnoty podle časového razítka
   ↓
6. Zaokrouhlí souřadnice a spočítá četnost
   ↓
7. Vrátí JSON s body [lat, lon, count]
   ↓
8. JavaScript card vytvoří Leaflet.heat layer
   ↓
9. Zobrazí heatmapu na mapě
```

## Architektura

### Backend (Python)
- **Framework**: Home Assistant custom_component
- **API**: Home Assistant HTTP view
- **Data**: Recorder history API
- **Zpracování**: Python 3.11+

### Frontend (JavaScript)
- **Framework**: Vanilla JavaScript (Web Components)
- **Mapa**: Leaflet.js 1.9.4
- **Heatmapa**: Leaflet.heat 0.2.0
- **UI**: Shadow DOM, Custom Elements

### Komunikace
- **Backend → Frontend**: REST API (JSON)
- **Auth**: Home Assistant Bearer token
- **Format**: JSON

## Konfigurace

### Integration Config Entry
```python
{
    "name": "GPS Heatmap",
    "latitude_entity": "sensor.phone_latitude",
    "longitude_entity": "sensor.phone_longitude"
}
```

### Card Config
```yaml
type: custom:gps-heatmap-card
entity: sensor.gps_heatmap
title: "Moje cesty"
height: "600px"
default_days: 7
radius: 25
blur: 15
gradient:
  0.0: blue
  0.5: lime
  0.7: yellow
  1.0: red
```

## API Response Format

```json
{
  "points": [
    [50.0755, 14.4378, 5],    // [lat, lon, count]
    [50.0756, 14.4379, 12],
    ...
  ],
  "total_points": 150,          // Počet unikátních lokací
  "total_visits": 487           // Celkový počet návštěv
}
```

## Závislosti

### Python
- homeassistant >= 2024.1.0
- aiohttp (součást HA)
- recorder component (HA)

### JavaScript
- Leaflet.js 1.9.4 (CDN)
- Leaflet.heat 0.2.0 (CDN)
- Moderní prohlížeč s Web Components

## Budoucí vylepšení

- [ ] Export dat do CSV/JSON
- [ ] Animace časového vývoje
- [ ] Srovnání období
- [ ] Filtrování podle rychlosti pohybu
- [ ] Clusterování místo heatmapy
- [ ] Offline tile cache
- [ ] Více mapových podkladů
- [ ] 3D heatmapa
- [ ] Automatické refresh
- [ ] Widget pro statistiky
