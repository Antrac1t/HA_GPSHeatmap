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
            visit_min_gap_minutes = data.get("visit_min_gap_minutes", 10)
            visit_min_distance_m = data.get("visit_min_distance_m", 25)
            cluster_radius_m = data.get("cluster_radius_m", 0)
            
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
                end_dt,
                visit_min_gap_minutes,
                visit_min_distance_m,
                cluster_radius_m,
            )
            
            return web.json_response(heatmap_data)
            
        except Exception as e:
            _LOGGER.error(f"Error processing heatmap request: {e}")
            return web.json_response(
                {"error": str(e)},
                status=500
            )

    async def _get_heatmap_data(
        self,
        lat_entity,
        lon_entity,
        start_time,
        end_time,
        visit_min_gap_minutes,
        visit_min_distance_m,
        cluster_radius_m,
    ):
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
            last_point = None
            last_time = None
            min_gap = timedelta(minutes=float(visit_min_gap_minutes))
            min_distance_m = float(visit_min_distance_m)
            for lat_time, lat_val in sorted(lat_dict.items()):
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

                        if last_point is not None and last_time is not None:
                            time_diff = abs(lat_time - last_time)
                            distance_m = _haversine_m(last_point[0], last_point[1], lat, lon)
                            # Always ignore nearly identical locations
                            if distance_m < min_distance_m:
                                continue
                            # Ignore too-frequent movement updates
                            if time_diff < min_gap:
                                continue

                        last_point = (lat, lon)
                        last_time = lat_time
                        
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

        # Cluster nearby points into a single marker if configured
        cluster_radius_m = float(cluster_radius_m or 0)
        if cluster_radius_m > 0 and points:
            clusters = []
            for lat, lon, count in points:
                merged = False
                for cluster in clusters:
                    distance_m = _haversine_m(cluster["lat"], cluster["lon"], lat, lon)
                    if distance_m <= cluster_radius_m:
                        total_count = cluster["count"] + count
                        cluster["lat"] = (cluster["lat"] * cluster["count"] + lat * count) / total_count
                        cluster["lon"] = (cluster["lon"] * cluster["count"] + lon * count) / total_count
                        cluster["count"] = total_count
                        merged = True
                        break
                if not merged:
                    clusters.append({"lat": lat, "lon": lon, "count": count})

            points = [[c["lat"], c["lon"], c["count"]] for c in clusters]

        max_count = max((value["count"] for value in intensity_map.values()), default=0)
        
        return {
            "points": points,
            "total_points": len(points),
            "total_visits": sum(p[2] for p in points),
            "max_count": max_count
        }


def _haversine_m(lat1, lon1, lat2, lon2):
    """Return distance between two coordinates in meters."""
    from math import radians, sin, cos, sqrt, atan2

    r = 6371000.0
    d_lat = radians(lat2 - lat1)
    d_lon = radians(lon2 - lon1)
    a = sin(d_lat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(d_lon / 2) ** 2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    return r * c
