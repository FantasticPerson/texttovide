import React from "react";
import { Easing, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { IsoStackScene as IsoStackSceneType, ItemTiming } from "../schema/storyboard";
import { ThemeTokens, motion } from "../theme";
import { HighlightText } from "../components/HighlightText";
import { resolveIsoColor } from "../motion/iso/math";
import { IsoBoard, IsoBox } from "../motion/iso/primitives";

interface Props {
  scene: IsoStackSceneType;
  itemTimings: ItemTiming[];
  theme: ThemeTokens;
}

const SVG_W = 1120;
const SVG_H = 590;
const BOARD_SIZE = 9;
const UNIT = 44;

export const IsoStackScene: React.FC<Props> = ({ scene, itemTimings, theme }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const isVertical = height > width;

  const titleS = spring({ frame, fps, config: motion.spring });
  const layerH = scene.layers.length >= 6 ? 0.82 : 1.0;
  const blockSize = 3.2;

  // 当前已落位层数，用来驱动左侧状态卡 & 镜头温和下移让高楼始终居中
  let activeIdx = 0;
  let visibleCount = 0;
  scene.layers.forEach((_, idx) => {
    const tStart = itemTimings[idx]?.startFrame ?? 8 + idx * 20;
    if (frame >= tStart) {
      activeIdx = idx;
      visibleCount = idx + 1;
    }
  });

  const activeLayer = scene.layers[activeIdx];
  const baseOriginY = 178;
  const targetPanY = Math.max(0, (visibleCount - 2) * layerH * UNIT * 0.45);
  const panY = interpolate(
    frame,
    [0, Math.max(1, (itemTimings[scene.layers.length - 1]?.startFrame ?? 90) + 18)],
    [0, Math.max(0, (scene.layers.length - 2) * layerH * UNIT * 0.44)],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    },
  );
  const originX = isVertical ? SVG_W / 2 : 660;
  const originY = baseOriginY + Math.min(targetPanY + 18, panY);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        width: "100%",
      }}
    >
      <div
        style={{
          fontFamily: theme.fonts.heading,
          fontSize: isVertical ? 46 : 50,
          fontWeight: 800,
          color: theme.colors.textPrimary,
          textAlign: "center",
          opacity: titleS,
          transform: `translateY(${(1 - titleS) * 14}px)`,
        }}
      >
        <HighlightText text={scene.title} theme={theme} />
      </div>

      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: isVertical ? "100%" : 1180,
          display: "flex",
          justifyContent: "center",
        }}
      >
        {/* 左侧实时替换/叠加信息卡（参考片左上角「RabbitMQ → pgmq」状态提示） */}
        {activeLayer && !isVertical && (
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 40,
              width: 340,
              padding: "22px 24px",
              borderRadius: 18,
              backgroundColor: theme.colors.surface,
              border: `1.5px solid ${theme.colors.borderActive}`,
              display: "flex",
              flexDirection: "column",
              gap: 10,
              zIndex: 5,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontFamily: theme.fonts.mono,
                fontSize: 16,
                color: theme.colors.textMuted,
              }}
            >
              <span>{activeLayer.from ?? "新增能力层"}</span>
              <span style={{ color: theme.colors.accent, fontWeight: 800 }}>
                {String(activeIdx + 1).padStart(2, "0")} /{" "}
                {String(scene.layers.length).padStart(2, "0")}
              </span>
            </div>
            <div
              style={{
                fontFamily: theme.fonts.heading,
                fontSize: 32,
                fontWeight: 800,
                color: theme.colors.accent,
                lineHeight: 1.2,
              }}
            >
              → {activeLayer.label}
            </div>
            {activeLayer.note && (
              <div
                style={{
                  fontSize: 20,
                  color: theme.colors.textSecondary,
                  lineHeight: 1.4,
                }}
              >
                {activeLayer.note}
              </div>
            )}
          </div>
        )}

        <svg
          width="100%"
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          style={{
            maxWidth: isVertical ? "100%" : 1120,
            maxHeight: isVertical ? 680 : 610,
            overflow: "visible",
          }}
        >
          <IsoBoard
            size={BOARD_SIZE}
            originX={originX}
            originY={originY}
            unit={UNIT}
            theme={theme}
            gridStep={1.5}
          />

          {/* 积木塔逐层从天而降堆叠 */}
          {scene.layers.map((layer, idx) => {
            const tStart = itemTimings[idx]?.startFrame ?? 8 + idx * 20;
            const dropS =
              frame >= tStart
                ? spring({
                    frame: frame - tStart,
                    fps,
                    config: { damping: 15, stiffness: 165, mass: 0.78 },
                  })
                : 0;
            if (dropS <= 0.01) return null;

            const baseZ = idx * layerH;
            const zPos = baseZ + (1 - dropS) * 3.2;
            const isTopVisible = idx === visibleCount - 1;
            const color = resolveIsoColor(layer.tone ?? "blue", theme.isDark);

            return (
              <IsoBox
                key={idx}
                cx={BOARD_SIZE / 2}
                cy={BOARD_SIZE / 2}
                z={zPos}
                w={blockSize}
                d={blockSize}
                h={layerH * 0.96}
                color={color}
                originX={originX}
                originY={originY}
                unit={UNIT}
                opacity={Math.min(1, dropS * 2)}
                leftLabel={layer.label}
                topLabel={isTopVisible ? scene.topLabel : undefined}
                showShadow={idx === 0}
              />
            );
          })}
        </svg>
      </div>
    </div>
  );
};
