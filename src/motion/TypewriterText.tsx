import React from "react";
import { useCurrentFrame } from "remotion";

interface TypewriterTextProps {
  text: string;
  startFrame: number;
  charsPerFrame?: number;
  showCursor?: boolean;
  cursorColor?: string;
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  startFrame,
  charsPerFrame = 0.65,
  showCursor = true,
  cursorColor = "#34D399",
}) => {
  const frame = useCurrentFrame();
  const elapsed = Math.max(0, frame - startFrame);
  const count = Math.min(text.length, Math.floor(elapsed * charsPerFrame));
  const visible = text.slice(0, count);
  const isTyping = elapsed > 0 && count < text.length;
  const blink = Math.floor(frame / 12) % 2 === 0;

  return (
    <span>
      {visible}
      {showCursor && (isTyping || blink) && (
        <span
          style={{
            display: "inline-block",
            width: 3,
            height: "0.95em",
            backgroundColor: cursorColor,
            marginLeft: 4,
            verticalAlign: "text-bottom",
          }}
        />
      )}
    </span>
  );
};
