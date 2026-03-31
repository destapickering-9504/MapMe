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
    # Top N geocoder hits per stop to try as alternate store locations (chain options).
    optimizer_chain_alt_ranks: int = int(os.getenv("OPTIMIZER_CHAIN_ALT_RANKS", "4"))
    # Optional congestion fudge: comma-separated south,west,north,east (decimal degrees).
    # Legs whose midpoint or an endpoint falls in the box get duration × multiplier (>1).
    optimizer_congestion_bbox: str = os.getenv("OPTIMIZER_CONGESTION_BBOX", "")
    optimizer_congestion_leg_multiplier: float = float(
        os.getenv("OPTIMIZER_CONGESTION_LEG_MULTIPLIER", "1.0")
    )
    public_suggest_min_chars: int = int(os.getenv("PUBLIC_SUGGEST_MIN_CHARS", "3"))
    public_suggest_limit: int = int(os.getenv("PUBLIC_SUGGEST_LIMIT", "8"))


settings = Settings()
