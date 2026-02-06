# GPS Heatmap - Rychlý start

## Co tento projekt obsahuje?

Kompletní HACS doplněk pro Home Assistant, který vytváří **interaktivní GPS heatmapu** z historie vašich GPS senzorů.

## 📦 Obsah balíčku

### Backend (Python integrace)
- `custom_components/gps_heatmap/` - Python integrace
  - Načítání GPS historie z HA recorderu
  - REST API endpoint pro data
  - UI konfigurace přes Nastavení

### Frontend (Lovelace karta)
- `www/gps-heatmap-card.js` - JavaScript karta
  - Leaflet mapa s heatmap vrstvou
  - Časové rozsahy (den, týden, měsíc, rok, vlastní)
  - Statistiky (počet bodů, návštěv)

### Dokumentace
- `README.md` - Hlavní dokumentace
- `INSTALACE.md` - Krok za krokem instalace
- `TROUBLESHOOTING.md` - Řešení problémů
- `lovelace-examples.md` - Příklady konfigurace
- `STRUCTURE.md` - Struktura projektu

## 🚀 Instalace za 3 kroky

### 1. Instalace přes HACS

```
HACS → Integrace → ⋮ → Vlastní repozitáře
URL: https://github.com/vasusername/gps_heatmap
Kategorie: Integration
→ Přidat → Stáhnout → Restartovat HA
```

### 2. Konfigurace integrace

```
Nastavení → Zařízení a služby → + Přidat integraci
→ Vyhledat "GPS Heatmap"
→ Vybrat entity latitude/longitude
→ Uložit
```

### 3. Přidat kartu

```
Dashboard → Upravit → + Přidat kartu
→ Custom: GPS Heatmap Card
```

Minimální konfigurace:
```yaml
type: custom:gps-heatmap-card
entity: sensor.gps_heatmap
```

## 📋 Požadavky

### Senzory GPS

Potřebujete 2 senzory:
- ✅ **Latitude** (zeměpisná šířka) - např. `50.0755`
- ✅ **Longitude** (zeměpisná délka) - např. `14.4378`

### Pokud máte device_tracker

Vytvořte template senzory v `configuration.yaml`:

```yaml
template:
  - sensor:
      - name: "Phone Latitude"
        state: "{{ state_attr('device_tracker.phone', 'latitude') }}"
        unit_of_measurement: "°"
        
      - name: "Phone Longitude"
        state: "{{ state_attr('device_tracker.phone', 'longitude') }}"
        unit_of_measurement: "°"
```

## 🎨 Přizpůsobení

### Základní parametry

```yaml
type: custom:gps-heatmap-card
entity: sensor.gps_heatmap
title: Moje cesty           # Název karty
height: 600px               # Výška mapy
default_days: 7             # Výchozí počet dní
radius: 25                  # Poloměr bodu
blur: 15                    # Rozmazání
```

### Barevný gradient

```yaml
gradient:
  0.0: blue      # Nízká četnost
  0.5: lime      # Střední četnost
  0.7: yellow    # Vysoká četnost
  1.0: red       # Maximální četnost
```

## 📊 Co karta zobrazuje?

1. **Interaktivní mapa** - stejný podklad jako HA
2. **Heatmapa** - barvy podle četnosti návštěv
3. **Ovládání**:
   - Výběr časového období
   - Vlastní datum/čas
   - Tlačítko načtení dat
4. **Statistiky**:
   - Počet unikátních míst
   - Celkový počet návštěv

## 🔧 Řešení problémů

### Karta se nezobrazuje?
1. Přidejte JavaScript resource: `/local/gps-heatmap-card.js`
2. Vyčistěte cache: Ctrl+Shift+R

### Žádná data?
1. Zkontrolujte senzory v **Vývojářské nástroje → Stavy**
2. Zkuste delší časové období (měsíc)
3. Ověřte recorder konfiguraci

### API chyba?
1. Zkontrolujte logy: **Nastavení → Systém → Logy**
2. Hledejte `gps_heatmap`

Více v `TROUBLESHOOTING.md`

## 📚 Další dokumentace

- **INSTALACE.md** - Podrobný instalační návod
- **lovelace-examples.md** - Příklady konfigurací
- **TROUBLESHOOTING.md** - Řešení problémů
- **STRUCTURE.md** - Technická dokumentace

## 💡 Příklady použití

### Sledování pohybu osoby
```yaml
type: custom:gps-heatmap-card
entity: sensor.jana_heatmap
title: Pohyb Jany za měsíc
height: 500px
default_days: 30
```

### Více osob vedle sebe
```yaml
type: horizontal-stack
cards:
  - type: custom:gps-heatmap-card
    entity: sensor.jana_heatmap
    title: Jana
  - type: custom:gps-heatmap-card
    entity: sensor.petr_heatmap
    title: Petr
```

## 🛠️ Technologie

- **Backend**: Python 3.11+, Home Assistant API
- **Frontend**: Vanilla JavaScript, Leaflet.js
- **Data**: Home Assistant Recorder
- **License**: MIT

## 📞 Podpora

- **Issues**: https://github.com/vasusername/gps_heatmap/issues
- **Dokumentace**: Viz soubory README, INSTALACE, TROUBLESHOOTING

---

**Vytvořeno pro Home Assistant Community** 🏡
