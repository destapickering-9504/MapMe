/** Small map snapshot around a point (OpenStreetMap static image service). */

export function osmStaticMapPreviewUrl(lat: number, lng: number, width = 240, height = 140): string {
  const c = `${lat},${lng}`;
  const m = `${lat},${lng},red-pushpin`;
  const params = new URLSearchParams({
    center: c,
    zoom: "17",
    size: `${width}x${height}`,
    maptype: "mapnik",
    markers: m
  });
  return `https://staticmap.openstreetmap.de/staticmap.php?${params.toString()}`;
}
