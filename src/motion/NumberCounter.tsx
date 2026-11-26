import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";

interface NumberCounterProps {
  from?: number;
  to: number;
  startFrame: number;
  durationFrames: number;
  formatComma?: boolean;
}

export const NumberCounter: React.FC<NumberCounterProps> = ({
  from = 0,
  to,
  startFrame,
  durationFrames,
  formatComma = true,
}) => {
  const frame = useCurrentFrame();
  const val = Math.round(
    interpolate(frame, [startFrame, startFrame + durationFrames], [from, to], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    }),
  );

  return <>{formatComma ? val.toLocaleString("en-US") : String(val)}</>;
};
