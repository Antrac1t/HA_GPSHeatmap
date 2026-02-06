# GPS Heatmap pro Home Assistant

Custom integrace pro Home Assistant, která vytváří heatmapu z GPS historie.

## Funkce

- ✅ Načítání GPS historie z HA senzorů
- ✅ Heatmapa s intenzitou návštěv (číslo/barvy)
- ✅ Časový rozsah (den, týden, měsíc, rok, vlastní období)
- ✅ Stejný mapový podklad jako HA (OpenStreetMap)
- ✅ Statistiky (počet bodů, návštěv)
- ✅ Interaktivní Leaflet mapa

## Instalace

### Metoda 1: HACS (Doporučeno)

1. Otevřete HACS v Home Assistant
2. Přejděte na "Integrace"
3. Klikněte na tři tečky vpravo nahoře → "Vlastní repozitáře"
4. Přidejte URL: `https://github.com/vasusername/gps_heatmap`
5. Kategorie: `Integration`
6. Klikněte na "GPS Heatmap" a nainstalujte

### Metoda 2: Manuální instalace

1. Zkopírujte složku `custom_components/gps_heatmap` do `config/custom_components/`
2. Zkopírujte soubor `www/gps-heatmap-card.js` do `config/www/`
3. Restartujte Home Assistant

## Konfigurace

### 1. Nastavení integrace

1. Přejděte do **Nastavení** → **Zařízení a služby**
2. Klikněte na **+ Přidat integraci**
3. Vyhledejte "GPS Heatmap"
4. Zadejte:
   - **Název**: název vaší heatmapy (např. "Moje pohyby")
   - **Entita zeměpisné šířky**: senzor s latitude (např. `sensor.phone_latitude`)
   - **Entita zeměpisné délky**: senzor s longitude (např. `sensor.phone_longitude`)

### 2. Přidání Lovelace karty

Nejprve přidejte JavaScript soubor do resources:

1. Přejděte do **Nastavení** → **Dashboards** → **Resources**
2. Klikněte na **+ Add Resource**
3. URL: `/local/gps-heatmap-card.js`
4. Type: `JavaScript Module`

Pak přidejte kartu do dashboardu:

```yaml
type: custom:gps-heatmap-card
entity: sensor.gps_heatmap  # entita vytvořená integrací
title: Mapa mých cest
height: 600px
default_days: 7
radius: 25
blur: 15
gradient:
  0.0: blue
  0.5: lime
  0.7: yellow
  1.0: red
```

## Parametry karty

| Parametr | Typ | Výchozí | Popis |
|----------|-----|---------|-------|
| `entity` | string | **povinné** | Entita GPS Heatmap senzoru |
| `title` | string | "GPS Heatmap" | Název karty |
| `height` | string | "500px" | Výška mapy |
| `default_days` | number | 7 | Výchozí počet dní historie |
| `radius` | number | 25 | Poloměr bodu heatmapy |
| `blur` | number | 15 | Rozmazání heatmapy |
| `gradient` | object | viz níže | Barevný gradient |

### Gradient

Výchozí gradient:
```yaml
gradient:
  0.0: blue    # Nízká intenzita
  0.5: lime    # Střední intenzita
  0.7: yellow  # Vysoká intenzita
  1.0: red     # Maximální intenzita
```

## Příklad použití

### Sledování pohybu osoby

```yaml
type: custom:gps-heatmap-card
entity: sensor.jana_heatmap
title: Pohyb Jany
height: 500px
default_days: 30
```

### Sledování více osob

Vytvořte více instancí integrace pro každou osobu:

1. **Jana** → `sensor.jana_heatmap`
2. **Petr** → `sensor.petr_heatmap`

Pak vytvořte karty pro každou osobu.

## Požadavky na senzory

Senzory musí poskytovat numerické hodnoty:

- **Latitude**: např. `50.0755` (zeměpisná šířka)
- **Longitude**: např. `14.4378` (zeměpisná délka)

### Příklad vytvoření senzorů z device_tracker

Pokud máte `device_tracker.phone`, můžete vytvořit senzory pomocí template:

```yaml
# configuration.yaml
template:
  - sensor:
      - name: "Phone Latitude"
        state: "{{ state_attr('device_tracker.phone', 'latitude') }}"
        unit_of_measurement: "°"
        
      - name: "Phone Longitude"
        state: "{{ state_attr('device_tracker.phone', 'longitude') }}"
        unit_of_measurement: "°"
```

## Troubleshooting

### Karta se nezobrazuje

1. Zkontrolujte, že je JavaScript soubor v resources
2. Vyčistěte cache prohlížeče (Ctrl+Shift+R)
3. Zkontrolujte konzoli prohlížeče (F12) pro chyby

### Žádná data

1. Zkontrolujte, že senzory existují a mají hodnoty
2. Zkuste delší časové období
3. Zkontrolujte, že recorder ukládá historii senzorů

### API chyby

1. Zkontrolujte logs: **Nastavení** → **Systém** → **Logy**
2. Hledejte chyby s `gps_heatmap`

## Podpora

Pro hlášení chyb nebo návrhy:
- GitHub Issues: https://github.com/vasusername/gps_heatmap/issues

## Licence

MIT License

## Autor

Vytvořeno pro Home Assistant s použitím:
- Leaflet.js
- Leaflet.heat plugin
- Home Assistant Recorder API
