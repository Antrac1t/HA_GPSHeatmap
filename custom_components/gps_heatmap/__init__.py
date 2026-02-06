"""GPS Heatmap integration for Home Assistant."""
import logging
from datetime import timedelta

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.typing import ConfigType

from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)

PLATFORMS = ["sensor"]


async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Set up the GPS Heatmap component."""
    hass.data.setdefault(DOMAIN, {})
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up GPS Heatmap from a config entry."""
    hass.data.setdefault(DOMAIN, {})
    hass.data[DOMAIN][entry.entry_id] = entry.data

    # Register HTTP view for heatmap data
    hass.http.register_view(GpsHeatmapView(hass))

    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    unload_ok = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    
    if unload_ok:
        hass.data[DOMAIN].pop(entry.entry_id)

    return unload_ok


from homeassistant.components.http import HomeAssistantView
from aiohttp import web
import json
from datetime import datetime
from homeassistant.components import recorder
from homeassistant.components.recorder import history


class GpsHeatmapView(HomeAssistantView):
    """View to handle heatmap data requests."""

    url = "/api/gps_heatmap/data"
    name = "api:gps_heatmap:data"
    requires_auth = True

    def __init__(self, hass):
        """Initialize the view."""
        self.hass = hass

    async def post(self, request):
        """Handle POST request for heatmap data."""
        try:
            data = await request.json()
            
            latitude_entity = data.get("latitude_entity")
            longitude_entity = data.get("longitude_entity")
            start_time = data.get("start_time")
            end_time = data.get("end_time")
            
            if not all([latitude_entity, longitude_entity, start_time, end_time]):
                return web.json_response(
                    {"error": "Missing required parameters"},
                    status=400
                )
            
            # Convert timestamps
            start_dt = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
            end_dt = datetime.fromisoformat(end_time.replace('Z', '+00:00'))
            
            # Get historical data
            heatmap_data = await self._get_heatmap_data(
                latitude_entity,
                longitude_entity,
                start_dt,
                end_dt
            )
            
            return web.json_response(heatmap_data)
            
        except Exception as e:
            _LOGGER.error(f"Error processing heatmap request: {e}")
            return web.json_response(
                {"error": str(e)},
                status=500
            )

    async def _get_heatmap_data(self, lat_entity, lon_entity, start_time, end_time):
        """Fetch and process historical GPS data."""
        
        # Get history from recorder
        lat_history = await recorder.get_instance(self.hass).async_add_executor_job(
            history.state_changes_during_period,
            self.hass,
            start_time,
            end_time,
            lat_entity
        )
        
        lon_history = await recorder.get_instance(self.hass).async_add_executor_job(
            history.state_changes_during_period,
            self.hass,
            start_time,
            end_time,
            lon_entity
        )
        
        # Process data
        points = []
        intensity_map = {}
        
        if lat_entity in lat_history and lon_entity in lon_history:
            lat_states = lat_history[lat_entity]
            lon_states = lon_history[lon_entity]
            
            # Create timestamp-indexed dictionaries
            lat_dict = {state.last_updated: state.state for state in lat_states}
            lon_dict = {state.last_updated: state.state for state in lon_states}
            
            # Match timestamps (with tolerance)
            for lat_time, lat_val in lat_dict.items():
                # Find closest longitude reading
                closest_lon = None
                min_diff = timedelta(seconds=60)  # 60 second tolerance
                
                for lon_time, lon_val in lon_dict.items():
                    diff = abs(lat_time - lon_time)
                    if diff < min_diff:
                        min_diff = diff
                        closest_lon = lon_val
                
                if closest_lon:
                    try:
                        lat = float(lat_val)
                        lon = float(closest_lon)
                        
                        # Round to reduce precision for grouping
                        lat_rounded = round(lat, 5)
                        lon_rounded = round(lon, 5)
                        key = f"{lat_rounded},{lon_rounded}"
                        
                        if key in intensity_map:
                            intensity_map[key]["count"] += 1
                        else:
                            intensity_map[key] = {
                                "lat": lat_rounded,
                                "lon": lon_rounded,
                                "count": 1
                            }
                    except (ValueError, TypeError):
                        continue
        
        # Convert to list format for heatmap
        for key, value in intensity_map.items():
            points.append([value["lat"], value["lon"], value["count"]])
        
        return {
            "points": points,
            "total_points": len(points),
            "total_visits": sum(p[2] for p in points)
        }
