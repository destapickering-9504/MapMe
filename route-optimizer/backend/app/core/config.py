from pydantic import BaseModel
import os


class Settings(BaseModel):
    provider_mode: str = os.getenv("PROVIDER_MODE", "public")
    public_geocode_url: str = os.getenv("PUBLIC_GEOCODE_URL", "https://nominatim.openstreetmap.org/search")
    public_routing_url: str = os.getenv("PUBLIC_ROUTING_URL", "https://router.project-osrm.org/table/v1/driving")
    public_route_url: str = os.getenv("PUBLIC_ROUTE_URL", "https://router.project-osrm.org/route/v1/driving")
    public_request_timeout_seconds: float = float(os.getenv("PUBLIC_REQUEST_TIMEOUT_SECONDS", "8"))
    public_geocoder_limit: int = int(os.getenv("PUBLIC_GEOCODER_LIMIT", "10"))
    public_geocoder_viewbox_degrees: float = float(os.getenv("PUBLIC_GEOCODER_VIEWBOX_DEGREES", "2.5"))
    public_user_agent: str = os.getenv("PUBLIC_USER_AGENT", "route-optimizer-local/0.1")
    # Stops resolved within this radius (m) share one parking lot: store↔store matrix legs become 0 min.
    optimizer_same_lot_radius_m: float = float(os.getenv("OPTIMIZER_SAME_LOT_RADIUS_M", "500"))
    public_nearby_viewbox_span_deg: float = float(os.getenv("PUBLIC_NEARBY_VIEWBOX_SPAN_DEG", "0.06"))
    public_nearby_max_results: int = int(os.getenv("PUBLIC_NEARBY_MAX_RESULTS", "24"))
    public_nearby_max_distance_m: float = float(os.getenv("PUBLIC_NEARBY_MAX_DISTANCE_M", "15000"))
    public_suggest_min_chars: int = int(os.getenv("PUBLIC_SUGGEST_MIN_CHARS", "3"))
    public_suggest_limit: int = int(os.getenv("PUBLIC_SUGGEST_LIMIT", "8"))


settings = Settings()
