from typing import Any, Optional

from pydantic import BaseModel, Field, field_validator, model_validator


class StopDetail(BaseModel):
    """User search text plus the resolved address used for routing."""

    query: str
    address: str
    lat: float
    lng: float


class OptimizeRequest(BaseModel):
    origin_place: str = Field(
        ...,
        max_length=300,
        description="Full street address, ZIP, city, or town for the starting point",
    )
    origin_label: Optional[str] = Field(
        default=None,
        max_length=80,
        description="Optional display-only label when start is a saved place (Home, Gym, …).",
    )
    stores: list[str] = Field(min_length=1, max_length=10)
    trip_mode: str = Field(default="round_trip", pattern="^(round_trip|one_way)$")
    destination_place: Optional[str] = Field(
        default=None,
        max_length=300,
        description="Optional end address: start → optimized stop order → destination",
    )

    @field_validator("origin_place")
    @classmethod
    def strip_origin_place(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("origin_place cannot be empty")
        return stripped

    @field_validator("destination_place")
    @classmethod
    def strip_destination_place(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return None
        s = value.strip()
        return s if s else None

    @field_validator("stores", mode="before")
    @classmethod
    def normalize_stores(cls, value: object) -> list[str]:
        if not isinstance(value, list):
            raise TypeError("stores must be a list")
        out: list[str] = []
        for item in value:
            if not isinstance(item, str):
                continue
            s = item.strip()
            if not s:
                continue
            if len(s) > 300:
                raise ValueError("Each stop must be 300 characters or fewer")
            out.append(s)
        return out

    @model_validator(mode="after")
    def stores_count_vs_destination(self) -> "OptimizeRequest":
        if self.destination_place is None and len(self.stores) < 2:
            raise ValueError("Enter at least 2 stops, or set an end location to use 1 stop.")
        return self


class RouteOption(BaseModel):
    ordered_stores: list[str]
    ordered_stops: list[StopDetail]
    total_minutes: float


class OptimizeResponse(BaseModel):
    trip_mode: str
    origin_query: str
    origin_label: Optional[str] = None
    origin_address: str
    origin_lat: float
    origin_lng: float
    stops_resolved: list[StopDetail]
    permutations_considered: int
    best_route: RouteOption
    alternatives: list[RouteOption]
    explanation: str
    travel_time_note: str = Field(
        ...,
        description="How drive times are estimated (traffic model) and optional congestion fudge.",
    )
    best_route_geojson: Optional[dict[str, Any]] = None
    route_geojson_options: list[Optional[dict[str, Any]]] = Field(
        default_factory=list,
        description="Line geometry per ranked route: index 0 = best, then alternatives in order.",
    )
    destination_query: Optional[str] = None
    destination_address: Optional[str] = None
    destination_lat: Optional[float] = None
    destination_lng: Optional[float] = None


class AddressSuggestion(BaseModel):
    label: str
    lat: float
    lng: float


class AddressSuggestResponse(BaseModel):
    suggestions: list[AddressSuggestion]
