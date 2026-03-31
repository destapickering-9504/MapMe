import type { ReactNode } from "react";
import type { StopIconVariant } from "./stopRowIcon";

interface Props {
  orderIndex: number;
  icon: ReactNode;
  iconVariant: StopIconVariant;
  title: ReactNode;
  onRemove?: () => void;
  showRemove: boolean;
  children: ReactNode;
  dragId: string;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
}

function iconSquareClass(v: StopIconVariant): string {
  return `hm-ref-planner-icon-square hm-ref-planner-icon-square--${v}`;
}

export default function StopRow({
  orderIndex,
  icon,
  iconVariant,
  title,
  onRemove,
  showRemove,
  children,
  dragId,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd
}: Props) {
  return (
    <div className="hm-ref-planner-stop" onDragOver={onDragOver} onDrop={(e) => onDrop(e, dragId)}>
      <div className="flex items-start gap-2">
        <button
          type="button"
          className="hm-ref-planner-drag"
          aria-label={`Reorder stop ${orderIndex}`}
          data-drag-handle="true"
          draggable
          onDragStart={(e) => onDragStart(e, dragId)}
          onDragEnd={onDragEnd}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
            <rect x="3" y="2" width="2" height="12" rx="0.5" />
            <rect x="7" y="2" width="2" height="12" rx="0.5" />
            <rect x="11" y="2" width="2" height="12" rx="0.5" />
          </svg>
        </button>
        <div className="flex min-w-0 flex-1 flex-col gap-2.5">
          <div className="flex items-center gap-3">
            <div className={iconSquareClass(iconVariant)}>{icon}</div>
            <div className="min-w-0 flex-1">
              <div className="hm-ref-planner-stop-title">{title}</div>
            </div>
            <span className="hm-ref-planner-stop-menu-dots shrink-0" aria-hidden title="">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="6" r="1.75" />
                <circle cx="12" cy="12" r="1.75" />
                <circle cx="12" cy="18" r="1.75" />
              </svg>
            </span>
            {showRemove && onRemove ? (
              <button
                type="button"
                onClick={onRemove}
                className="hm-ref-planner-stop-remove"
                aria-label={`Remove stop ${orderIndex}`}
              >
                Remove
              </button>
            ) : null}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
