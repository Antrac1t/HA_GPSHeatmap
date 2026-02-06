# Řešení problémů - GPS Heatmap

## Časté problémy a jejich řešení

### 1. Integrace se nezobrazuje v seznamu integrací

**Příznaky:**
- Po instalaci nevidíte "GPS Heatmap" v seznamu integrací

**Řešení:**

1. **Zkontrolujte umístění souborů:**
   ```
   config/
   └── custom_components/
       └── gps_heatmap/
           ├── __init__.py
           ├── config_flow.py
           ├── const.py
           ├── manifest.json
           ├── sensor.py
           └── strings.json
   ```

2. **Zkontrolujte logy:**
   - Přejděte do **Nastavení** → **Systém** → **Logy**
   - Hledejte chyby související s `gps_heatmap`

3. **Restartujte Home Assistant:**
   - **Nastavení** → **Systém** → **Restartovat**

4. **Vyčistěte cache:**
   - V prohlížeči stiskněte **Ctrl+Shift+R** (Windows/Linux) nebo **Cmd+Shift+R** (Mac)

### 2. Karta se nezobrazuje v dashboardu

**Příznaky:**
- Po přidání karty vidíte chybovou hlášku
- Karta je prázdná nebo se nezobrazuje

**Řešení:**

1. **Zkontrolujte JavaScript resource:**
   - **Nastavení** → **Dashboardy** → **⋮** → **Zdroje**
   - Měl by existovat záznam: `/local/gps-heatmap-card.js` typu `JavaScript Module`

2. **Zkontrolujte umístění souboru:**
   ```
   config/
   └── www/
       └── gps-heatmap-card.js
   ```

3. **Vyčistěte cache prohlížeče:**
   - **Ctrl+Shift+R** (Windows/Linux) nebo **Cmd+Shift+R** (Mac)

4. **Zkontrolujte konzoli prohlížeče:**
   - Stiskněte **F12**
   - Přejděte na záložku **Console**
   - Hledejte chyby související s `gps-heatmap-card`

5. **Zkuste odstranit a znovu přidat resource:**
   - Odstraňte resource z **Zdroje**
   - Restartujte HA
   - Přidejte resource znovu

### 3. Žádná data na mapě

**Příznaky:**
- Mapa se zobrazuje, ale po kliknutí na "Načíst data" se zobrazí: "Žádná data pro zobrazení"

**Řešení:**

1. **Zkontrolujte, že senzory existují:**
   - Přejděte do **Vývojářské nástroje** → **Stavy**
   - Vyhledejte senzory latitude a longitude
   - Ověřte, že mají numerické hodnoty (např. `50.0755`, `14.4378`)

2. **Zkontrolujte typ senzorů:**
   - Senzory musí poskytovat **čísla**, ne text
   - Špatně: `"50.0755"` (text)
   - Správně: `50.0755` (číslo)

3. **Zkontrolujte historii v recorderu:**
   
   Přidejte do `configuration.yaml`:
   ```yaml
   recorder:
     include:
       entities:
         - sensor.phone_latitude
         - sensor.phone_longitude
   ```
   
   Restartujte HA a počkejte pár hodin na nasbírání dat.

4. **Zkuste delší časové období:**
   - Místo "Poslední den" zkuste "Poslední měsíc"
   - Pokud jste integraci právě nainstalovali, historie nemusí existovat

5. **Ověřte konfiguraci integrace:**
   - **Nastavení** → **Zařízení a služby** → **GPS Heatmap**
   - Klikněte na **Konfigurovat**
   - Zkontrolujte správnost vybraných entit

### 4. Chyba při načítání dat (API error)

**Příznaky:**
- Zobrazí se chyba: "Chyba při načítání dat: ..."

**Řešení:**

1. **Zkontrolujte logy Home Assistant:**
   - **Nastavení** → **Systém** → **Logy**
   - Hledejte chyby s `gps_heatmap` nebo `GpsHeatmapView`

2. **Zkontrolujte formát dat:**
   - Otevřete **Vývojářské nástroje** → **Stavy**
   - Najděte `sensor.gps_heatmap`
   - V atributech by měly být: `latitude_entity` a `longitude_entity`

3. **Restartujte Home Assistant:**
   - **Nastavení** → **Systém** → **Restartovat**

### 5. Mapa je prázdná (bílá obrazovka)

**Příznaky:**
- Karta se zobrazuje, ale uvnitř je pouze bílá plocha

**Řešení:**

1. **Zkontrolujte internetové připojení:**
   - Leaflet mapy potřebují přístup k internetu pro načtení dlaždic
   - Zkontrolujte firewall a síťové nastavení

2. **Zkontrolujte konzoli prohlížeče:**
   - **F12** → **Console**
   - Hledejte chyby načítání Leaflet nebo tile serveru

3. **Zkontrolujte HA konfiguraci:**
   - **Nastavení** → **Systém** → **Obecné**
   - Ověřte, že **Zeměpisná šířka** a **Zeměpisná délka** jsou správně nastaveny

### 6. Template senzory nefungují

**Příznaky:**
- Template senzory pro latitude/longitude se nezobrazují

**Řešení:**

1. **Zkontrolujte syntaxi:**
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

2. **Zkontrolujte, že device_tracker existuje:**
   - **Vývojářské nástroje** → **Stavy**
   - Vyhledejte `device_tracker.phone`
   - Ověřte, že má atributy `latitude` a `longitude`

3. **Restartujte Home Assistant:**
   - Po změně `configuration.yaml` je nutný restart

4. **Zkontrolujte logy:**
   - Hledejte chyby v template senzorech

### 7. Heatmapa nezobrazuje správnou intenzitu

**Příznaky:**
- Všechny body mají stejnou barvu
- Barvy neodpovídají frekvenci návštěv

**Řešení:**

1. **Upravte parametry heatmapy:**
   ```yaml
   type: custom:gps-heatmap-card
   entity: sensor.gps_heatmap
   radius: 35        # Zvětšete poloměr
   blur: 20          # Zvětšete rozmazání
   ```

2. **Změňte gradient:**
   ```yaml
   gradient:
     0.0: blue
     0.3: cyan
     0.5: lime
     0.7: yellow
     0.9: orange
     1.0: red
   ```

3. **Zkontrolujte data:**
   - Otevřte **Vývojářské nástroje** → **Network** (F12)
   - Načtěte data
   - Najděte požadavek na `/api/gps_heatmap/data`
   - Zkontrolujte odpověď - měla by obsahovat `points` s různými hodnotami intenzity

### 8. Pomalé načítání dat

**Příznaky:**
- Načítání dat trvá velmi dlouho (desítky sekund)

**Řešení:**

1. **Zmenšete časové období:**
   - Místo roku zkuste měsíc
   - Místo měsíce zkuste týden

2. **Optimalizujte recorder:**
   
   Přidejte do `configuration.yaml`:
   ```yaml
   recorder:
     purge_keep_days: 30  # Uchováváte jen 30 dní
     commit_interval: 1   # Commitujte častěji
   ```

3. **Vyčistěte databázi:**
   ```bash
   # V SSH terminálu
   cd /config
   sqlite3 home-assistant_v2.db "VACUUM;"
   ```

## Diagnostické příkazy

### Zkontrolovat logy pouze pro GPS Heatmap

```bash
# V SSH terminálu
grep -i "gps_heatmap" /config/home-assistant.log
```

### Zkontrolovat velikost databáze

```bash
# V SSH terminálu
du -h /config/home-assistant_v2.db
```

### Zkontrolovat počet záznamů v historii

```sql
-- V SQLite
SELECT COUNT(*) FROM states WHERE entity_id = 'sensor.phone_latitude';
SELECT COUNT(*) FROM states WHERE entity_id = 'sensor.phone_longitude';
```

## Debug režim

Pro zapnutí podrobného logování přidejte do `configuration.yaml`:

```yaml
logger:
  default: info
  logs:
    custom_components.gps_heatmap: debug
```

Restartujte HA a zkontrolujte logy v **Nastavení** → **Systém** → **Logy**.

## Kontakt na podporu

Pokud problém přetrvává:

1. **Shromážděte informace:**
   - Verze Home Assistant
   - Chybové hlášky z logů
   - Konfigurace karty (YAML)
   - Screenshot problému

2. **Vytvořte GitHub Issue:**
   - https://github.com/vasusername/gps_heatmap/issues
   - Uveďte všechny shromážděné informace

3. **Zkontrolujte existující issues:**
   - Možná už někdo řešil stejný problém
   - Hledejte podle chybové hlášky
