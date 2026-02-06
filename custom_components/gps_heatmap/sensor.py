"""Sensor platform for GPS Heatmap."""
import logging

from homeassistant.components.sensor import SensorEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from .const import DOMAIN, CONF_LATITUDE_ENTITY, CONF_LONGITUDE_ENTITY, CONF_NAME

_LOGGER = logging.getLogger(__name__)


async def async_setup_entry(
    hass: HomeAssistant,
    config_entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up GPS Heatmap sensor from a config entry."""
    
    latitude_entity = config_entry.data[CONF_LATITUDE_ENTITY]
    longitude_entity = config_entry.data[CONF_LONGITUDE_ENTITY]
    name = config_entry.data.get(CONF_NAME, "GPS Heatmap")
    
    async_add_entities([
        GpsHeatmapSensor(
            hass,
            config_entry.entry_id,
            name,
            latitude_entity,
            longitude_entity
        )
    ])


class GpsHeatmapSensor(SensorEntity):
    """Representation of a GPS Heatmap sensor."""

    def __init__(self, hass, entry_id, name, latitude_entity, longitude_entity):
        """Initialize the sensor."""
        self.hass = hass
        self._entry_id = entry_id
        self._attr_name = name
        self._latitude_entity = latitude_entity
        self._longitude_entity = longitude_entity
        self._attr_unique_id = f"{DOMAIN}_{entry_id}"
        self._attr_icon = "mdi:map-marker-radius"
        
    @property
    def state(self):
        """Return the state of the sensor."""
        return "ready"
    
    @property
    def extra_state_attributes(self):
        """Return the state attributes."""
        return {
            "latitude_entity": self._latitude_entity,
            "longitude_entity": self._longitude_entity,
        }
