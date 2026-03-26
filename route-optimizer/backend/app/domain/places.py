from pydantic import BaseModel


class ResolvedLocation(BaseModel):
    """A single geocoded point with human-readable address."""

    lat: float
    lng: float
    display_address: str
