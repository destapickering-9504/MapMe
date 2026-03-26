import os

from app.services.provider_factory import build_providers
from app.services.providers.local.geocoder_local import LocalGeocoderProvider
from app.services.providers.local.router_local import LocalRoutingProvider
from app.services.providers.public.geocoder_public import PublicGeocoderProvider
from app.services.providers.public.router_public import PublicRoutingProvider


def test_factory_public_default():
    os.environ["PROVIDER_MODE"] = "public"
    geocoder, routing = build_providers()
    assert isinstance(geocoder, PublicGeocoderProvider)
    assert isinstance(routing, PublicRoutingProvider)


def test_factory_local_mode():
    os.environ["PROVIDER_MODE"] = "local"
    # Re-import settings module behavior is simplified in current scaffold.
    from app.core import config

    config.settings.provider_mode = "local"
    geocoder, routing = build_providers()
    assert isinstance(geocoder, LocalGeocoderProvider)
    assert isinstance(routing, LocalRoutingProvider)
