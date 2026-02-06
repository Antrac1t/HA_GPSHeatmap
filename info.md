# GPS Heatmap

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg)](https://github.com/custom-components/hacs)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Custom integrace pro Home Assistant, která vytváří interaktivní heatmapu z GPS historie vašich zařízení.

## 🌟 Hlavní funkce

- 📍 **GPS heatmapa** - vizualizace četnosti návštěv různých lokalit
- ⏱️ **Časové rozsahy** - den, týden, měsíc, rok nebo vlastní období
- 🗺️ **Leaflet mapa** - stejný podklad jako používá Home Assistant
- 📊 **Statistiky** - počet unikátních bodů a celkový počet návštěv
- 🎨 **Přizpůsobitelný design** - barvy, velikost, rozmazání
- 🔄 **Real-time načítání** - data z Home Assistant recorderu

## 📸 Screenshot

![GPS Heatmap Card](https://via.placeholder.com/800x400?text=GPS+Heatmap+Screenshot)

## 🚀 Rychlý start

1. **Instalace přes HACS**
2. **Přidejte integraci** - Nastavení → Zařízení a služby → GPS Heatmap
3. **Přidejte JavaScript** - /local/gps-heatmap-card.js
4. **Přidejte kartu** do dashboardu

```yaml
type: custom:gps-heatmap-card
entity: sensor.gps_heatmap
```

## 📖 Dokumentace

- [Podrobná instalace](INSTALACE.md)
- [Příklady konfigurace](lovelace-examples.md)
- [Řešení problémů](TROUBLESHOOTING.md)

## 💡 Příklady použití

### Sledování pohybu osoby
```yaml
type: custom:gps-heatmap-card
entity: sensor.jana_heatmap
title: Pohyb Jany
height: 500px
default_days: 30
```

### Vlastní barevné schéma
```yaml
type: custom:gps-heatmap-card
entity: sensor.gps_heatmap
gradient:
  0.0: '#0000ff'
  0.5: '#00ffff'
  0.7: '#00ff00'
  1.0: '#ffff00'
```

## ⚙️ Požadavky

- Home Assistant 2024.1.0+
- Recorder komponenta
- GPS senzory (latitude/longitude)

## 🛠️ Technologie

- **Backend**: Python 3.11+
- **Frontend**: JavaScript (Vanilla)
- **Mapa**: Leaflet.js + Leaflet.heat
- **Data**: Home Assistant Recorder API

## 🤝 Přispívání

Příspěvky jsou vítány! Prosím:

1. Forkněte repozitář
2. Vytvořte feature branch
3. Commitněte změny
4. Pushněte do branch
5. Otevřete Pull Request

## 📄 Licence

MIT License - viz [LICENSE](LICENSE)

## 🐛 Nahlášení chyb

Našli jste chybu? [Vytvořte issue](https://github.com/vasusername/gps_heatmap/issues)

## ⭐ Podpora projektu

Pokud se vám integrace líbí, dejte hvězdičku na GitHubu! ⭐
