# Příklady konfigurace Lovelace karty

## Základní konfigurace

```yaml
type: custom:gps-heatmap-card
entity: sensor.gps_heatmap
title: GPS Heatmap
```

## Kompletní konfigurace

```yaml
type: custom:gps-heatmap-card
entity: sensor.gps_heatmap
title: Moje cesty
height: 600px
default_days: 7
radius: 25
blur: 15
max_zoom: 18
gradient:
  0.0: blue
  0.5: lime
  0.7: yellow
  1.0: red
```

## Více osob - horizontální layout

```yaml
type: horizontal-stack
cards:
  - type: custom:gps-heatmap-card
    entity: sensor.jana_heatmap
    title: Jana
    height: 400px
    default_days: 30
    
  - type: custom:gps-heatmap-card
    entity: sensor.petr_heatmap
    title: Petr
    height: 400px
    default_days: 30
```

## Více osob - vertikální layout

```yaml
type: vertical-stack
cards:
  - type: custom:gps-heatmap-card
    entity: sensor.jana_heatmap
    title: Jana - Poslední měsíc
    height: 400px
    default_days: 30
    
  - type: custom:gps-heatmap-card
    entity: sensor.petr_heatmap
    title: Petr - Poslední měsíc
    height: 400px
    default_days: 30
```

## Různé barevné schéma

### Modrá varianta
```yaml
type: custom:gps-heatmap-card
entity: sensor.gps_heatmap
title: Modrá heatmapa
gradient:
  0.0: '#0000ff'
  0.5: '#00ffff'
  0.7: '#00ff00'
  1.0: '#ffff00'
```

### Červená varianta
```yaml
type: custom:gps-heatmap-card
entity: sensor.gps_heatmap
title: Červená heatmapa
gradient:
  0.0: '#ffff00'
  0.5: '#ff8800'
  0.7: '#ff0000'
  1.0: '#880000'
```

### Fialová varianta
```yaml
type: custom:gps-heatmap-card
entity: sensor.gps_heatmap
title: Fialová heatmapa
gradient:
  0.0: '#0000ff'
  0.5: '#8800ff'
  0.7: '#ff00ff'
  1.0: '#ff0088'
```

## Velká mapa přes celou obrazovku

```yaml
type: custom:gps-heatmap-card
entity: sensor.gps_heatmap
title: Moje cesty
height: 800px
default_days: 365
radius: 30
blur: 20
```

## Malá mapa - přehled

```yaml
type: custom:gps-heatmap-card
entity: sensor.gps_heatmap
title: Týdenní přehled
height: 300px
default_days: 7
radius: 15
blur: 10
```
