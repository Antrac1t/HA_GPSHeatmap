"""Constants for GPS Heatmap integration."""

DOMAIN = "gps_heatmap"

CONF_LATITUDE_ENTITY = "latitude_entity"
CONF_LONGITUDE_ENTITY = "longitude_entity"
CONF_NAME = "name"
CONF_VISIT_MIN_GAP_MINUTES = "visit_min_gap_minutes"
CONF_VISIT_MIN_DISTANCE_M = "visit_min_distance_m"
CONF_CLUSTER_RADIUS_M = "cluster_radius_m"

DEFAULT_NAME = "GPS Heatmap"
DEFAULT_VISIT_MIN_GAP_MINUTES = 10
DEFAULT_VISIT_MIN_DISTANCE_M = 25
DEFAULT_CLUSTER_RADIUS_M = 0
