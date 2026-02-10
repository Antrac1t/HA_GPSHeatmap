// GPS Heatmap Card for Home Assistant
// Ensure we wait for customElements to be ready
if (!customElements.get('gps-heatmap-card')) {
  
class GpsHeatmapCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = {};
    this._hass = null;
    this._map = null;
    this._heatLayer = null;
  this._pointLayer = null;
    this._resizeObserver = null;
    this._pendingHeatmapData = null;
    this._heatmapRetryCount = 0;
    this._isRendered = false;
    this._isConnected = false;
    this._pendingInit = false;
    this._leafletCssPromise = null;
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error('Please define an entity');
    }
    
    this._config = {
      entity: config.entity,
      title: config.title || 'GPS Heatmap',
      height: config.height || '500px',
      radius: config.radius || 25,
      blur: config.blur || 15,
      max_zoom: config.max_zoom || 18,
      default_days: config.default_days || 7,
      min_opacity: config.min_opacity ?? 0.2,
      adaptive_radius: config.adaptive_radius ?? true,
      min_radius: config.min_radius || 10,
      max_radius: config.max_radius || 120,
  show_points: config.show_points ?? false,
  max_point_markers: config.max_point_markers || 200,
  visit_min_gap_minutes: config.visit_min_gap_minutes ?? 10,
  visit_min_distance_m: config.visit_min_distance_m ?? 25,
  cluster_radius_m: config.cluster_radius_m ?? 0,
      gradient: config.gradient || {
        0.0: 'blue',
        0.5: 'lime',
        0.7: 'yellow',
        1.0: 'red'
      }
    };

    this.render();
    this._isRendered = true;
    if (this._pendingInit) {
      this._pendingInit = false;
      this.tryInitMap();
    }
  }

  set hass(hass) {
    this._hass = hass;
    
    const entity = hass.states[this._config.entity];
    if (!entity) {
      console.error(`Entity ${this._config.entity} not found`);
      return;
    }

    // Initialize map if not exists
    this.tryInitMap();
  }

  connectedCallback() {
    this._isConnected = true;
    this.tryInitMap();
  }

  disconnectedCallback() {
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }
    this._isConnected = false;
  }

  tryInitMap() {
    if (this._map) {
      return;
    }
    if (!this._hass || !this._isRendered || !this._isConnected) {
      this._pendingInit = true;
      return;
    }
    requestAnimationFrame(() => this.initMap());
  }

  render() {
    this.shadowRoot.innerHTML = `
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" data-leaflet-style>
      <style>
        :host {
          display: block;
          width: 100%;
        }
        
        ha-card {
          overflow: hidden;
          display: block;
          width: 100%;
        }
        
        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
        }
        
        .card-content {
          padding: 0;
          position: relative;
          width: 100%;
        }
        
        #map {
          width: 100%;
          height: ${this._config.height};
          min-height: 200px;
        }
        
        .controls {
          position: absolute;
          top: 10px;
          right: 10px;
          z-index: 1000;
          background: white;
          padding: 10px;
          border-radius: 4px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        .controls label {
          display: block;
          margin-bottom: 5px;
          font-size: 12px;
        }
        
        .controls input,
        .controls select {
          width: 100%;
          margin-bottom: 10px;
          padding: 5px;
        }
        
        .controls button {
          width: 100%;
          padding: 8px;
          background: var(--primary-color);
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .controls button:hover {
          opacity: 0.9;
        }
        
        .stats {
          position: absolute;
          bottom: 10px;
          left: 10px;
          z-index: 1000;
          background: white;
          padding: 10px;
          border-radius: 4px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          font-size: 12px;
        }
        
        .loading {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 2000;
          background: white;
          padding: 20px;
          border-radius: 4px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
      </style>
      
      <ha-card>
        <div class="card-header">
          <div class="name">${this._config.title}</div>
        </div>
        
        <div class="card-content">
          <div id="map"></div>
          
          <div class="controls">
            <label>Časové období:</label>
            <select id="timeRange">
              <option value="1">Poslední den</option>
              <option value="7" selected>Poslední týden</option>
              <option value="30">Poslední měsíc</option>
              <option value="90">Poslední 3 měsíce</option>
              <option value="365">Poslední rok</option>
              <option value="custom">Vlastní období</option>
            </select>
            
            <div id="customDates" style="display: none;">
              <label>Od:</label>
              <input type="datetime-local" id="startDate">
              <label>Do:</label>
              <input type="datetime-local" id="endDate">
            </div>
            
            <button id="loadBtn">Načíst data</button>
          </div>
          
          <div class="stats" id="stats" style="display: none;">
            <div>Body: <span id="totalPoints">0</span></div>
            <div>Návštěvy: <span id="totalVisits">0</span></div>
          </div>
          
          <div class="loading" id="loading" style="display: none;">
            Načítám data...
          </div>
        </div>
      </ha-card>
    `;

    this.setupEventListeners();
  }

  setupEventListeners() {
    const timeRange = this.shadowRoot.getElementById('timeRange');
    const customDates = this.shadowRoot.getElementById('customDates');
    const loadBtn = this.shadowRoot.getElementById('loadBtn');

    timeRange.addEventListener('change', (e) => {
      customDates.style.display = e.target.value === 'custom' ? 'block' : 'none';
    });

    loadBtn.addEventListener('click', () => this.loadHeatmapData());
  }

  async initMap() {
    // Wait for Leaflet to be available
    if (typeof L === 'undefined' || typeof L.heatLayer === 'undefined') {
      try {
        await this.loadLeaflet();
      } catch (error) {
        console.error('Failed to load Leaflet:', error);
        alert('Chyba při načítání mapových knihoven. Zkontrolujte internetové připojení.');
        return;
      }
    }

    // Verify L.heatLayer is available
    if (typeof L.heatLayer === 'undefined') {
      console.error('L.heatLayer is not available after loading');
      alert('Leaflet.heat plugin se nepodařilo načíst. Zkuste obnovit stránku.');
      return;
    }

    const mapElement = this.shadowRoot.getElementById('map');
    
    // Get HA map configuration
    const haConfig = this._hass.config;
    const center = [haConfig.latitude || 50.0, haConfig.longitude || 14.0];
    
    this._map = L.map(mapElement, {
      center: center,
      zoom: 13,
      zoomControl: true
    });

    this._map.whenReady(() => {
      this._map.invalidateSize();
      if (this._pendingHeatmapData) {
        this.updateHeatmap(this._pendingHeatmapData);
      }
    });

    // Ensure map size is correct after first render
    requestAnimationFrame(() => {
      if (this._map) {
        this._map.invalidateSize();
      }
    });

    setTimeout(() => {
      if (this._map) {
        this._map.invalidateSize();
        if (this._heatLayer && typeof this._heatLayer.redraw === 'function') {
          this._heatLayer.redraw();
        }
      }
    }, 250);

    // Observe size changes to keep Leaflet canvas in sync
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
    }
    this._resizeObserver = new ResizeObserver(() => {
      if (this._map) {
        this._map.invalidateSize();
        if (this._heatLayer && typeof this._heatLayer.redraw === 'function') {
          this._heatLayer.redraw();
        }
        if (this._pendingHeatmapData) {
          this.updateHeatmap(this._pendingHeatmapData);
        }
      }
    });
    this._resizeObserver.observe(mapElement);

    // Use HA tile layer (same as HA map)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: this._config.max_zoom
    }).addTo(this._map);

    // Load initial data
    this.loadHeatmapData();
  }

  async loadLeaflet() {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (typeof L !== 'undefined' && typeof L.heatLayer !== 'undefined') {
        resolve();
        return;
      }

      // Load Leaflet CSS
      if (!this._leafletCssPromise) {
        this._leafletCssPromise = new Promise((cssResolve) => {
          let cssLink = this.shadowRoot.querySelector('link[data-leaflet-style]');
          if (!cssLink) {
            cssLink = document.createElement('link');
            cssLink.rel = 'stylesheet';
            cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            cssLink.setAttribute('data-leaflet-style', 'true');
            this.shadowRoot.prepend(cssLink);
          }

          if (cssLink.sheet) {
            cssResolve();
            return;
          }

          cssLink.addEventListener('load', () => cssResolve(), { once: true });
          cssLink.addEventListener('error', () => cssResolve(), { once: true });
        });
      }

      // Load Leaflet JS
      if (typeof L === 'undefined') {
        const leafletScript = document.createElement('script');
        leafletScript.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        leafletScript.onload = async () => {
          console.log('Leaflet loaded');
          await this._leafletCssPromise;
          this.loadHeatPlugin().then(resolve).catch(reject);
        };
        leafletScript.onerror = () => reject(new Error('Failed to load Leaflet'));
        document.head.appendChild(leafletScript);
      } else {
        this._leafletCssPromise.then(() => {
          this.loadHeatPlugin().then(resolve).catch(reject);
        });
      }
    });
  }

  async loadHeatPlugin() {
    return new Promise((resolve, reject) => {
      if (typeof L.heatLayer !== 'undefined') {
        resolve();
        return;
      }

      const heatScript = document.createElement('script');
      heatScript.src = 'https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js';
      heatScript.onload = () => {
        console.log('Leaflet.heat loaded');
        // Wait a bit to ensure it's fully initialized
        setTimeout(resolve, 100);
      };
      heatScript.onerror = () => reject(new Error('Failed to load Leaflet.heat'));
      document.head.appendChild(heatScript);
    });
  }

  async loadHeatmapData() {
    const entity = this._hass.states[this._config.entity];
    if (!entity) return;

    const latEntity = entity.attributes.latitude_entity;
    const lonEntity = entity.attributes.longitude_entity;

    if (!latEntity || !lonEntity) {
      console.error('Latitude or longitude entity not configured');
      return;
    }

    // Calculate time range
    const timeRange = this.shadowRoot.getElementById('timeRange').value;
    let startDate, endDate;

    if (timeRange === 'custom') {
      startDate = new Date(this.shadowRoot.getElementById('startDate').value);
      endDate = new Date(this.shadowRoot.getElementById('endDate').value);
    } else {
      endDate = new Date();
      startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(timeRange));
    }

    // Show loading
    this.shadowRoot.getElementById('loading').style.display = 'block';

    try {
      const response = await this._hass.callWS({
        type: 'call_service',
        domain: 'system_log',
        service: 'write',
        service_data: {
          message: 'Fetching heatmap data',
          level: 'info'
        }
      });

      // Call our API endpoint
      const result = await fetch('/api/gps_heatmap/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this._hass.auth.data.access_token}`
        },
        body: JSON.stringify({
          latitude_entity: latEntity,
          longitude_entity: lonEntity,
          start_time: startDate.toISOString(),
          end_time: endDate.toISOString(),
          visit_min_gap_minutes: this._config.visit_min_gap_minutes,
          visit_min_distance_m: this._config.visit_min_distance_m,
          cluster_radius_m: this._config.cluster_radius_m
        })
      });

      const data = await result.json();

      if (data.error) {
        throw new Error(data.error);
      }

      this.updateHeatmap(data);
      
    } catch (error) {
      console.error('Error loading heatmap data:', error);
      alert('Chyba při načítání dat: ' + error.message);
    } finally {
      this.shadowRoot.getElementById('loading').style.display = 'none';
    }
  }

  updateHeatmap(data) {
    this._pendingHeatmapData = data;
    const mapElement = this.shadowRoot.getElementById('map');
    const size = this._map ? this._map.getSize() : { x: 0, y: 0 };
    const isVisible = mapElement && mapElement.offsetParent !== null && mapElement.offsetWidth > 0 && mapElement.offsetHeight > 0;
    if (!this._map || size.x === 0 || size.y === 0 || !isVisible) {
      this._heatmapRetryCount += 1;
      if (this._heatmapRetryCount <= 10) {
        setTimeout(() => {
          if (this._pendingHeatmapData) {
            this.updateHeatmap(this._pendingHeatmapData);
          }
        }, 150);
      } else {
        console.error('Map size is still zero after retries');
        alert('Mapa se zatím nenačetla. Zkuste chvíli počkat a pak znovu načíst data.');
      }
      return;
    }
    this._heatmapRetryCount = 0;

    this._map.invalidateSize();

    // Remove existing heat layer
    if (this._heatLayer) {
      this._map.removeLayer(this._heatLayer);
    }

    if (this._pointLayer) {
      this._map.removeLayer(this._pointLayer);
      this._pointLayer = null;
    }

    if (!data.points || data.points.length === 0) {
      alert('Žádná data pro zobrazení');
      return;
    }

    // Verify L.heatLayer exists
    if (typeof L.heatLayer === 'undefined') {
      console.error('L.heatLayer is not defined!');
      alert('Leaflet.heat plugin není načten. Zkuste obnovit stránku (Ctrl+Shift+R).');
      return;
    }

    try {
      const radius = this.getAdaptiveRadius();
      const blur = this.getAdaptiveBlur(radius);
      const maxIntensity = data.max_count && data.max_count > 0 ? data.max_count : undefined;

      // Create heat layer
      this._heatLayer = L.heatLayer(data.points, {
        radius: radius,
        blur: blur,
        maxZoom: this._config.max_zoom,
        gradient: this._config.gradient,
        minOpacity: this._config.min_opacity,
        max: maxIntensity
      }).addTo(this._map);

      if (this._config.show_points) {
        const pointsSorted = data.points
          .slice()
          .sort((a, b) => b[2] - a[2])
          .slice(0, this._config.max_point_markers);

        this._pointLayer = L.layerGroup();
        pointsSorted.forEach(([lat, lon, count]) => {
          const marker = L.circleMarker([lat, lon], {
            radius: Math.max(4, Math.min(12, Math.round(count))),
            color: '#111827',
            weight: 1,
            fillColor: '#ffffff',
            fillOpacity: 0.75
          });
          marker.bindTooltip(`Návštěvy: ${count}`, { direction: 'top' });
          marker.addTo(this._pointLayer);
        });

        this._pointLayer.addTo(this._map);
      }

      // Update stats
      this.shadowRoot.getElementById('totalPoints').textContent = data.total_points;
      this.shadowRoot.getElementById('totalVisits').textContent = data.total_visits;
      this.shadowRoot.getElementById('stats').style.display = 'block';

      // Fit bounds to data
      if (data.points.length > 0) {
        const bounds = L.latLngBounds(data.points.map(p => [p[0], p[1]]));
        this._map.fitBounds(bounds, { padding: [50, 50] });
      }
    } catch (error) {
      console.error('Error creating heatmap:', error);
      alert('Chyba při vytváření heatmapy: ' + error.message);
    }
  }

  getCardSize() {
    return 5;
  }

  static getConfigElement() {
    return document.createElement("gps-heatmap-card-editor");
  }

  static getStubConfig() {
    return {
      entity: "",
      title: "GPS Heatmap",
      height: "500px",
      default_days: 7
    };
  }

  getAdaptiveRadius() {
    if (!this._map || !this._config.adaptive_radius) {
      return this._config.radius;
    }
    const baseZoom = 13;
    const zoom = this._map.getZoom();
    const scale = Math.pow(2, baseZoom - zoom);
    const radius = this._config.radius * scale;
    return Math.max(this._config.min_radius, Math.min(radius, this._config.max_radius));
  }

  getAdaptiveBlur(radius) {
    if (!this._config.adaptive_radius) {
      return this._config.blur;
    }
    const blur = Math.round(radius * 0.6);
    return Math.max(10, Math.min(blur, this._config.max_radius));
  }
}

// Register the custom element
customElements.define('gps-heatmap-card', GpsHeatmapCard);

// Register with custom cards
window.customCards = window.customCards || [];
window.customCards.push({
  type: 'gps-heatmap-card',
  name: 'GPS Heatmap Card',
  description: 'Zobrazí heatmapu GPS dat z historie'
});

console.info(
  '%c GPS-HEATMAP-CARD %c 1.0.0 ',
  'color: white; background: #2196F3; font-weight: 700;',
  'color: #2196F3; background: white; font-weight: 700;'
);

} // End of if (!customElements.get('gps-heatmap-card'))
