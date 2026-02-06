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
      gradient: config.gradient || {
        0.0: 'blue',
        0.5: 'lime',
        0.7: 'yellow',
        1.0: 'red'
      }
    };

    this.render();
  }

  set hass(hass) {
    this._hass = hass;
    
    const entity = hass.states[this._config.entity];
    if (!entity) {
      console.error(`Entity ${this._config.entity} not found`);
      return;
    }

    // Initialize map if not exists
    if (!this._map) {
      this.initMap();
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }
        
        ha-card {
          overflow: hidden;
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
        }
        
        #map {
          width: 100%;
          height: ${this._config.height};
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
    if (typeof L === 'undefined') {
      await this.loadLeaflet();
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
      // Load Leaflet CSS
      const cssLink = document.createElement('link');
      cssLink.rel = 'stylesheet';
      cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(cssLink);

      // Load Leaflet JS
      const leafletScript = document.createElement('script');
      leafletScript.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      leafletScript.onload = () => {
        // Load Leaflet.heat plugin
        const heatScript = document.createElement('script');
        heatScript.src = 'https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js';
        heatScript.onload = resolve;
        heatScript.onerror = reject;
        document.head.appendChild(heatScript);
      };
      leafletScript.onerror = reject;
      document.head.appendChild(leafletScript);
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
          end_time: endDate.toISOString()
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
    // Remove existing heat layer
    if (this._heatLayer) {
      this._map.removeLayer(this._heatLayer);
    }

    if (!data.points || data.points.length === 0) {
      alert('Žádná data pro zobrazení');
      return;
    }

    // Create heat layer
    this._heatLayer = L.heatLayer(data.points, {
      radius: this._config.radius,
      blur: this._config.blur,
      maxZoom: this._config.max_zoom,
      gradient: this._config.gradient
    }).addTo(this._map);

    // Update stats
    this.shadowRoot.getElementById('totalPoints').textContent = data.total_points;
    this.shadowRoot.getElementById('totalVisits').textContent = data.total_visits;
    this.shadowRoot.getElementById('stats').style.display = 'block';

    // Fit bounds to data
    if (data.points.length > 0) {
      const bounds = L.latLngBounds(data.points.map(p => [p[0], p[1]]));
      this._map.fitBounds(bounds, { padding: [50, 50] });
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
