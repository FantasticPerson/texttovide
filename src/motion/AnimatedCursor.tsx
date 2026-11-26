import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";

export interface CursorWaypoint {
  frame: number;
  x: number;
  y: number;
  click?: boolean;
}

interface AnimatedCursorProps {
  waypoints: CursorWaypoint[];
}

export const AnimatedCursor: React.FC<AnimatedCursorProps> = ({ waypoints }) => {
  const frame = useCurrentFrame();
  if (waypoints.length === 0) return null;

  const first = waypoints[0];
  const last = waypoints[waypoints.length - 1];
  if (frame < first.frame - 6) return null;

  let x = first.x;
  let y = first.y;

  for (let i = 0; i < waypoints.length - 1; i++) {
    const a = waypoints[i];
    const b = waypoints[i + 1];
    if (frame >= a.frame && frame <= b.frame) {
      const p = interpolate(frame, [a.frame, b.frame], [0, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.inOut(Easing.cubic),
      });
      x = a.x + (b.x - a.x) * p;
      y = a.y + (b.y - a.y) * p;
      break;
    } else if (frame > b.frame) {
      x = b.x;
      y = b.y;
    }
  }

  // 检查点击动画
  let clickProgress = 0;
  for (const wp of waypoints) {
    if (wp.click && frame >= wp.frame && frame <= wp.frame + 14) {
      clickProgress = (frame - wp.frame) / 14;
      break;
    }
  }

  const appearOpacity = interpolate(frame, [first.frame - 6, first.frame + 6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(frame, [last.frame + 24, last.frame + 36], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const scale = clickProgress > 0 && clickProgress < 0.35 ? 0.86 : 1;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        pointerEvents: "none",
        zIndex: 50,
        opacity: appearOpacity * fadeOut,
        transform: `scale(${scale})`,
        transformOrigin: "top left",
      }}
    >
      {/* 点击波纹 */}
      {clickProgress > 0 && (
        <div
          style={{
            position: "absolute",
            left: -20,
            top: -20,
            width: 44,
            height: 44,
            borderRadius: "50%",
            border: "2.5px solid #34D399",
            opacity: 1 - clickProgress,
            transform: `scale(${0.4 + clickProgress * 1.4})`,
          }}
        />
      )}

      {/* 经典暖金/米色箭头光标 */}
      <svg width="34" height="38" viewBox="0 0 24 28" fill="none">
        <path
          d="M3 2L20 15.5L12.2 16.5L15.8 24.2L12.5 25.8L8.9 18L3 23.2V2Z"
          fill="#FDE68A"
          stroke="#111827"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};
