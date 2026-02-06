# Instalační návod GPS Heatmap

## Předpoklady

1. Home Assistant verze 2024.1.0 nebo novější
2. HACS nainstalovaný (doporučeno) nebo možnost manuální instalace
3. Senzory s GPS souřadnicami (latitude/longitude)

## Krok 1: Instalace integrace

### Varianta A: Pomocí HACS (Doporučeno)

1. Otevřete **HACS** v Home Assistant
2. Přejděte na záložku **"Integrace"**
3. Klikněte na **tři tečky** (⋮) vpravo nahoře
4. Vyberte **"Vlastní repozitáře"**
5. Do pole **"Repozitář"** vložte: `https://github.com/vasusername/gps_heatmap`
6. **Kategorie**: vyberte `Integration`
7. Klikněte na **"Přidat"**
8. Najděte **"GPS Heatmap"** v seznamu a klikněte na **"Stáhnout"**
9. **Restartujte Home Assistant**

### Varianta B: Manuální instalace

1. Stáhněte všechny soubory z tohoto repozitáře
2. Zkopírujte složku `custom_components/gps_heatmap` do složky `config/custom_components/` vašeho Home Assistant
3. Zkopírujte soubor `www/gps-heatmap-card.js` do složky `config/www/`
4. **Restartujte Home Assistant**

Struktura složek by měla vypadat takto:
```
config/
├── custom_components/
│   └── gps_heatmap/
│       ├── __init__.py
│       ├── config_flow.py
│       ├── const.py
│       ├── manifest.json
│       ├── sensor.py
│       └── strings.json
└── www/
    └── gps-heatmap-card.js
```

## Krok 2: Konfigurace integrace

1. Přejděte do **Nastavení** → **Zařízení a služby**
2. Klikněte na tlačítko **"+ Přidat integraci"** vpravo dole
3. Do vyhledávacího pole napište **"GPS Heatmap"**
4. Klikněte na integraci **GPS Heatmap**
5. Vyplňte formulář:
   - **Název**: zadejte název (např. "Moje GPS Heatmap" nebo "GPS - Jana")
   - **Entita zeměpisné šířky**: vyberte senzor s latitude (např. `sensor.phone_latitude`)
   - **Entita zeměpisné délky**: vyberte senzor s longitude (např. `sensor.phone_longitude`)
6. Klikněte na **"Odeslat"**

### Pokud nemáte senzory latitude/longitude

Pokud máte pouze `device_tracker` (např. `device_tracker.phone`), vytvořte template senzory:

Přidejte do `configuration.yaml`:

```yaml
template:
  - sensor:
      - name: "Phone Latitude"
        state: "{{ state_attr('device_tracker.phone', 'latitude') }}"
        unit_of_measurement: "°"
        device_class: "distance"
        
      - name: "Phone Longitude"
        state: "{{ state_attr('device_tracker.phone', 'longitude') }}"
        unit_of_measurement: "°"
        device_class: "distance"
```

Po uložení restartujte Home Assistant a použijte nově vytvořené senzory.

## Krok 3: Přidání JavaScript resource

1. Přejděte do **Nastavení** → **Dashboardy**
2. V pravém horním rohu klikněte na **tři tečky** (⋮)
3. Vyberte **"Zdroje"** (Resources)
4. Klikněte na **"+ Přidat zdroj"** vpravo dole
5. Vyplňte:
   - **URL**: `/local/gps-heatmap-card.js`
   - **Typ zdroje**: `JavaScript Module`
6. Klikněte na **"Vytvořit"**

## Krok 4: Přidání karty do dashboardu

1. Otevřete dashboard, kam chcete přidat kartu
2. Klikněte na **tři tečky** (⋮) vpravo nahoře → **"Upravit panel"**
3. Klikněte na **"+ Přidat kartu"** vpravo dole
4. Scrollujte dolů a vyberte **"Custom: GPS Heatmap Card"**
   - Pokud kartu nevidíte, zkuste:
     - Obnovit stránku (Ctrl+Shift+R)
     - Zkontrolovat konzoli prohlížeče (F12) pro chyby
5. Nakonfigurujte kartu:

**Základní konfigurace:**
```yaml
type: custom:gps-heatmap-card
entity: sensor.gps_heatmap
```

**Pokročilá konfigurace:**
```yaml
type: custom:gps-heatmap-card
entity: sensor.gps_heatmap
title: Moje cesty
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

6. Klikněte na **"Uložit"**

## Krok 5: Ověření funkčnosti

1. Karta by se měla zobrazit s mapou
2. V pravém horním rohu jsou ovládací prvky:
   - **Časové období**: vyberte (den, týden, měsíc, rok, vlastní)
   - **Tlačítko "Načíst data"**: klikněte pro zobrazení heatmapy
3. Po načtení se zobrazí:
   - Barevná heatmapa s intenzitou návštěv
   - Statistiky v levém dolním rohu (počet bodů, návštěv)

## Řešení problémů

### Integrace se nezobrazuje v seznamu

- Zkontrolujte, že složka `gps_heatmap` je ve správném umístění
- Restartujte Home Assistant
- Zkontrolujte logy: **Nastavení** → **Systém** → **Logy**

### Karta se nenačítá

1. Vyčistěte cache prohlížeče: **Ctrl+Shift+R** (Windows/Linux) nebo **Cmd+Shift+R** (Mac)
2. Zkontrolujte, že JavaScript soubor je v resources
3. Otevřete konzoli prohlížeče (F12) a hledejte chyby

### Žádná data na mapě

1. Zkontrolujte, že senzory mají hodnoty: **Vývojářské nástroje** → **Stavy**
2. Zkuste delší časové období (např. měsíc místo dne)
3. Zkontrolujte, že recorder ukládá historii těchto senzorů:

```yaml
# configuration.yaml
recorder:
  include:
    entities:
      - sensor.phone_latitude
      - sensor.phone_longitude
```

### Entity not found

- Zkontrolujte názvy entit v konfiguraci integrace
- Entity musí existovat a mít numerické hodnoty

## Konfigurace pro více osob

Můžete vytvořit více instancí integrace:

1. Opakujte **Krok 2** pro každou osobu
2. Použijte jiné senzory pro každou osobu
3. Vytvořte více karet s různými `entity`

Příklad:
```yaml
# Jana
type: custom:gps-heatmap-card
entity: sensor.jana_heatmap
title: Jana

# Petr  
type: custom:gps-heatmap-card
entity: sensor.petr_heatmap
title: Petr
```

## Další kroky

- Přizpůsobte si barevný gradient
- Upravte výšku mapy podle vašich potřeb
- Experimentujte s parametry `radius` a `blur`
- Použijte různá časová období pro různé analýzy

## Podpora

Pro problémy nebo dotazy:
- GitHub Issues: https://github.com/vasusername/gps_heatmap/issues
