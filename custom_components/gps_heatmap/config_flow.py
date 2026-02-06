"""Config flow for GPS Heatmap integration."""
import logging
import voluptuous as vol

from homeassistant import config_entries
from homeassistant.core import callback
from homeassistant.helpers import selector

from .const import (
    DOMAIN,
    CONF_LATITUDE_ENTITY,
    CONF_LONGITUDE_ENTITY,
    CONF_NAME,
    DEFAULT_NAME,
)

_LOGGER = logging.getLogger(__name__)


class GpsHeatmapConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Handle a config flow for GPS Heatmap."""

    VERSION = 1

    async def async_step_user(self, user_input=None):
        """Handle the initial step."""
        errors = {}

        if user_input is not None:
            # Validate that entities exist
            lat_entity = user_input[CONF_LATITUDE_ENTITY]
            lon_entity = user_input[CONF_LONGITUDE_ENTITY]
            
            if not self.hass.states.get(lat_entity):
                errors[CONF_LATITUDE_ENTITY] = "entity_not_found"
            if not self.hass.states.get(lon_entity):
                errors[CONF_LONGITUDE_ENTITY] = "entity_not_found"
            
            if not errors:
                return self.async_create_entry(
                    title=user_input.get(CONF_NAME, DEFAULT_NAME),
                    data=user_input,
                )

        data_schema = vol.Schema({
            vol.Required(CONF_NAME, default=DEFAULT_NAME): str,
            vol.Required(CONF_LATITUDE_ENTITY): selector.EntitySelector(
                selector.EntitySelectorConfig(domain=["sensor", "device_tracker", "person"])
            ),
            vol.Required(CONF_LONGITUDE_ENTITY): selector.EntitySelector(
                selector.EntitySelectorConfig(domain=["sensor", "device_tracker", "person"])
            ),
        })

        return self.async_show_form(
            step_id="user",
            data_schema=data_schema,
            errors=errors,
        )

    @staticmethod
    @callback
    def async_get_options_flow(config_entry):
        """Get the options flow for this handler."""
        return GpsHeatmapOptionsFlow(config_entry)


class GpsHeatmapOptionsFlow(config_entries.OptionsFlow):
    """Handle options flow for GPS Heatmap."""

    def __init__(self, config_entry):
        """Initialize options flow."""
        self.config_entry = config_entry

    async def async_step_init(self, user_input=None):
        """Manage the options."""
        if user_input is not None:
            return self.async_create_entry(title="", data=user_input)

        data_schema = vol.Schema({
            vol.Required(
                CONF_LATITUDE_ENTITY,
                default=self.config_entry.data.get(CONF_LATITUDE_ENTITY)
            ): selector.EntitySelector(
                selector.EntitySelectorConfig(domain=["sensor", "device_tracker", "person"])
            ),
            vol.Required(
                CONF_LONGITUDE_ENTITY,
                default=self.config_entry.data.get(CONF_LONGITUDE_ENTITY)
            ): selector.EntitySelector(
                selector.EntitySelectorConfig(domain=["sensor", "device_tracker", "person"])
            ),
        })

        return self.async_show_form(
            step_id="init",
            data_schema=data_schema,
        )
