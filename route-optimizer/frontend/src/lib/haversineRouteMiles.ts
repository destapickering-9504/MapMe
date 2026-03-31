const EARTH_MI = 3958.7613;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function haversineMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_MI * c;
}

export function chainHaversineMiles(points: { lat: number; lng: number }[]): number {
  if (points.length < 2) return 0;
  let sum = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    sum += haversineMiles(a.lat, a.lng, b.lat, b.lng);
  }
  return sum;
}
