import "./plannerRef.css";
import RouteMap from "../RouteMap";
import type { OptimizeResponse } from "../../domain/routeTypes";

interface Props {
  result: OptimizeResponse | null;
  selectedRouteIndex: number;
}

function WorldMapWatermark() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.07]"
      viewBox="0 0 960 480"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        <linearGradient id="wm-fade" x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="#94a3b8" stopOpacity="0" />
          <stop offset="20%" stopColor="#94a3b8" stopOpacity="1" />
          <stop offset="80%" stopColor="#94a3b8" stopOpacity="1" />
          <stop offset="100%" stopColor="#94a3b8" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g fill="url(#wm-fade)" stroke="none">
        <path d="M180 120c40-30 95-25 130 5 35 35 20 85-25 100-50 18-105-15-105-70 0-18 0-35 0-35z M320 100c55-10 100 25 95 80-5 45-55 70-100 50-40-18-45-80 5-130z M460 140c35-40 90-50 130-15 45 40 30 100-20 120-55 22-115-25-110-105z M620 160c30-25 75-20 100 15 28 40 10 85-35 95-48 12-85-40-65-110z M200 260c45-20 95 5 110 55 12 42-25 80-70 75-48-5-75-65 30-130z M380 280c40-35 100-30 135 10 38 42 25 105-30 125-58 22-120-35-105-135z M540 300c35-30 85-25 115 15 32 42 15 95-40 105-52 12-95-50-75-125z" />
      </g>
    </svg>
  );
}

function MapPreview() {
  return (
    <div
      className="hm-ref-planner-map-preview relative flex h-full min-h-[280px] w-full flex-col"
      aria-label="Map preview"
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.2]"
        style={{
          backgroundImage: `linear-gradient(rgba(148,163,184,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.06) 1px, transparent 1px)`,
          backgroundSize: "48px 48px"
        }}
      />
      <WorldMapWatermark />
      <div className="hm-ref-planner-map-preview-tint pointer-events-none absolute inset-0" />
      <div className="relative z-[1] flex flex-1 flex-col items-center justify-center px-8 py-12">
        <p className="hm-ref-planner-map-placeholder-title text-center text-[15px] font-semibold text-[color:var(--ref-path,#aeb4bf)]">
          Your route will appear here.
        </p>
      </div>
      <div className="absolute bottom-4 right-4 z-[1] flex flex-col gap-2">
        <div className="hm-ref-planner-map-fake-control text-lg">+</div>
        <div className="hm-ref-planner-map-fake-control text-lg">−</div>
        <div className="hm-ref-planner-map-fake-control text-base">⌖</div>
      </div>
    </div>
  );
}

export default function MapCanvas({ result, selectedRouteIndex }: Props) {
  if (result) {
    return (
      <div className="route-planner-live-map hm-ref-planner-map-fill relative h-full min-h-0 w-full flex-1 overflow-hidden">
        <RouteMap result={result} selectedRouteIndex={selectedRouteIndex} embedded />
      </div>
    );
  }
  return <MapPreview />;
}
