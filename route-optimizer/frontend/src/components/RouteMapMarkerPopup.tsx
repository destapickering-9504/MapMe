import { useMemo, useState } from "react";
import { osmStaticMapPreviewUrl } from "./mapStaticPreview";

type FieldRow = { label: string; value: string; href?: string };

interface Props {
  title: string;
  fields: FieldRow[];
  lat: number;
  lng: number;
  imageAlt: string;
}

export default function RouteMapMarkerPopup({ title, fields, lat, lng, imageAlt }: Props) {
  const [imgFailed, setImgFailed] = useState(false);
  const src = useMemo(() => osmStaticMapPreviewUrl(lat, lng, 360, 160), [lat, lng]);

  const streetViewUrl = `https://www.google.com/maps?layer=c&cbll=${lat},${lng}`;
  const osmUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=18/${lat}/${lng}`;
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

  return (
    <div className="route-marker-card">
      <div className="route-marker-card-preview">
        {!imgFailed ? (
          <img
            className="route-marker-card-img"
            src={src}
            alt={imageAlt}
            width={360}
            height={160}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="route-marker-card-img-fallback" role="img" aria-label={imageAlt} />
        )}
      </div>
      <div className="route-marker-card-body">
        <h3 className="route-marker-card-title">{title}</h3>
        <dl className="route-marker-card-fields">
          {fields.map((row) => (
            <div className="route-marker-card-field" key={row.label}>
              <dt>{row.label}</dt>
              <dd>
                {row.href ? (
                  <a href={row.href} target="_blank" rel="noopener noreferrer">
                    {row.value}
                  </a>
                ) : (
                  row.value
                )}
              </dd>
            </div>
          ))}
        </dl>
        <div className="route-marker-card-links" role="navigation" aria-label="Open in other maps">
          <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
            Google Maps
          </a>
          <span className="route-marker-card-links-sep" aria-hidden>
            ·
          </span>
          <a href={streetViewUrl} target="_blank" rel="noopener noreferrer">
            Street View
          </a>
          <span className="route-marker-card-links-sep" aria-hidden>
            ·
          </span>
          <a href={osmUrl} target="_blank" rel="noopener noreferrer">
            OpenStreetMap
          </a>
        </div>
      </div>
    </div>
  );
}
