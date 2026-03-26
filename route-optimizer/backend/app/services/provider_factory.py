from app.core.config import settings
from app.domain.interfaces import GeocoderProvider, RoutingProvider
from app.services.providers.public.geocoder_public import PublicGeocoderProvider
from app.services.providers.public.router_public import PublicRoutingProvider
from app.services.providers.local.geocoder_local import LocalGeocoderProvider
from app.services.providers.local.router_local import LocalRoutingProvider


def build_providers() -> tuple[GeocoderProvider, RoutingProvider]:
    if settings.provider_mode == "local":
        return LocalGeocoderProvider(), LocalRoutingProvider()
    return PublicGeocoderProvider(), PublicRoutingProvider()
