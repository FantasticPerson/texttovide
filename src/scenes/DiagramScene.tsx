import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { DiagramScene as DiagramSceneType, ItemTiming } from "../schema/storyboard";
import { ThemeTokens, motion } from "../theme";
import { HighlightText } from "../components/HighlightText";
import { AnimatedConnector } from "../motion/AnimatedConnector";

interface Props {
  scene: DiagramSceneType;
  itemTimings: ItemTiming[];
  theme: ThemeTokens;
}

const STAGE_W = 1380;
const STAGE_H = 520;

type NodeTone = "default" | "accent" | "danger";

function getNodeColors(tone: NodeTone, theme: ThemeTokens) {
  if (tone === "danger") {
    return {
      bg: theme.isDark ? "rgba(239, 68, 68, 0.12)" : "rgba(239, 68, 68, 0.08)",
      border: "#EF4444",
      title: theme.isDark ? "#FCA5A5" : "#B91C1C",
      line: "#EF4444",
    };
  }
  if (tone === "accent") {
    return {
      bg: theme.colors.surfaceActive,
      border: theme.colors.accent,
      title: theme.colors.accent,
      line: theme.colors.accent,
    };
  }
  return {
    bg: theme.colors.surface,
    border: theme.colors.border,
    title: theme.colors.textPrimary,
    line: theme.colors.accent,
  };
}

export const DiagramScene: React.FC<Props> = ({ scene, itemTimings, theme }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const isVertical = height > width;
  const outputs = scene.outputs ?? [];
  const hasOutputs = outputs.length > 0;

  const titleS = spring({ frame, fps, config: motion.spring });

  const renderNodeCard = (
    node: { label: string; sub?: string; tone?: NodeTone },
    x: number,
    y: number,
    w: number,
    h: number,
    startFrame: number,
    isCenter = false,
  ) => {
    const s =
      frame >= startFrame
        ? spring({ frame: frame - startFrame, fps, config: motion.spring })
        : 0;
    const tone: NodeTone = node.tone ?? (isCenter ? "accent" : "default");
    const c = getNodeColors(tone, theme);

    return (
      <div
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: w,
          height: h,
          borderRadius: isCenter ? 22 : 16,
          backgroundColor: c.bg,
          border: `${isCenter ? 2 : 1.5}px solid ${c.border}`,
          boxShadow: isCenter
            ? theme.isDark
              ? `0 0 36px ${theme.colors.accentSoft}`
              : "0 14px 32px rgba(0, 0, 0, 0.08)"
            : "none",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "14px 20px",
          gap: 6,
          textAlign: "center",
          opacity: s,
          transform: `scale(${0.92 + 0.08 * s})`,
        }}
      >
        <div
          style={{
            fontFamily: theme.fonts.heading,
            fontSize: isCenter ? 32 : 26,
            fontWeight: 800,
            color: c.title,
            lineHeight: 1.2,
          }}
        >
          {node.label}
        </div>
        {node.sub && (
          <div
            style={{
              fontSize: isCenter ? 20 : 18,
              color: theme.colors.textSecondary,
              lineHeight: 1.3,
            }}
          >
            {node.sub}
          </div>
        )}
      </div>
    );
  };

  // 计算 converge 布局坐标
  const renderConverge = () => {
    const nodeW = 310;
    const nodeH = scene.inputs.length >= 4 ? 92 : 108;
    const centerW = 320;
    const centerH = 160;

    const leftX = hasOutputs ? 40 : 150;
    const centerX = hasOutputs ? (STAGE_W - centerW) / 2 : 820;
    const rightX = STAGE_W - nodeW - 40;

    const distributeY = (count: number, boxH: number) => {
      const gap = count >= 4 ? 22 : 34;
      const totalH = count * boxH + (count - 1) * gap;
      const startY = (STAGE_H - totalH) / 2;
      return Array.from({ length: count }, (_, i) => startY + i * (boxH + gap));
    };

    const inYs = distributeY(scene.inputs.length, nodeH);
    const outH = outputs.length >= 4 ? 92 : 108;
    const outYs = distributeY(outputs.length, outH);
    const centerY = (STAGE_H - centerH) / 2;

    const centerStart = itemTimings[scene.inputs.length]?.startFrame ?? 22;

    return (
      <div
        style={{
          position: "relative",
          width: STAGE_W,
          height: STAGE_H,
          transform: isVertical ? "scale(0.66)" : "none",
          transformOrigin: "center center",
        }}
      >
        <svg
          width={STAGE_W}
          height={STAGE_H}
          viewBox={`0 0 ${STAGE_W} ${STAGE_H}`}
          style={{ position: "absolute", inset: 0, overflow: "visible" }}
        >
          {scene.inputs.map((inp, i) => {
            const tStart = itemTimings[i]?.startFrame ?? 6 + i * 10;
            const c = getNodeColors(inp.tone ?? "default", theme);
            return (
              <AnimatedConnector
                key={`in-${i}`}
                from={{ x: leftX + nodeW, y: inYs[i] + nodeH / 2 }}
                to={{ x: centerX, y: centerY + centerH / 2 }}
                startFrame={tStart + 8}
                color={c.line}
                orbPhase={i * 0.25}
              />
            );
          })}
          {outputs.map((out, i) => {
            const tStart =
              itemTimings[scene.inputs.length + 1 + i]?.startFrame ??
              centerStart + 14 + i * 10;
            const c = getNodeColors(out.tone ?? "default", theme);
            return (
              <AnimatedConnector
                key={`out-${i}`}
                from={{ x: centerX + centerW, y: centerY + centerH / 2 }}
                to={{ x: rightX, y: outYs[i] + outH / 2 }}
                startFrame={tStart}
                color={c.line}
                orbPhase={0.15 + i * 0.28}
                dashed={out.tone === "danger"}
                showOrb={out.tone !== "danger"}
              />
            );
          })}
        </svg>

        {scene.inputs.map((inp, i) => {
          const tStart = itemTimings[i]?.startFrame ?? 6 + i * 10;
          return (
            <React.Fragment key={`in-node-${i}`}>
              {renderNodeCard(inp, leftX, inYs[i], nodeW, nodeH, tStart)}
            </React.Fragment>
          );
        })}

        {renderNodeCard(scene.center, centerX, centerY, centerW, centerH, centerStart, true)}

        {outputs.map((out, i) => {
          const tStart =
            itemTimings[scene.inputs.length + 1 + i]?.startFrame ??
            centerStart + 14 + i * 10;
          return (
            <React.Fragment key={`out-node-${i}`}>
              {renderNodeCard(out, rightX, outYs[i], nodeW, outH, tStart + 6)}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  // 计算 hub 中心辐射布局坐标
  const renderHub = () => {
    const cx = STAGE_W / 2;
    const cy = STAGE_H / 2;
    const hubR = 84;
    const satW = 260;
    const satH = 98;
    const rx = 445;
    const ry = 188;
    const count = scene.inputs.length;

    const satPositions = scene.inputs.map((_, i) => {
      // 4 节点放四角，其余均匀分布（避开正上正下过挤）
      const baseAngle = count === 4 ? -Math.PI * 0.75 : -Math.PI * 0.5;
      const angle = baseAngle + (i * Math.PI * 2) / count;
      return {
        x: cx + Math.cos(angle) * rx,
        y: cy + Math.sin(angle) * ry,
        angle,
      };
    });

    const centerS = spring({ frame: Math.max(0, frame - 4), fps, config: motion.spring });

    return (
      <div
        style={{
          position: "relative",
          width: STAGE_W,
          height: STAGE_H,
          transform: isVertical ? "scale(0.66)" : "none",
          transformOrigin: "center center",
        }}
      >
        <svg
          width={STAGE_W}
          height={STAGE_H}
          viewBox={`0 0 ${STAGE_W} ${STAGE_H}`}
          style={{ position: "absolute", inset: 0, overflow: "visible" }}
        >
          {satPositions.map((pos, i) => {
            const tStart = itemTimings[i]?.startFrame ?? 12 + i * 12;
            const c = getNodeColors(scene.inputs[i].tone ?? "default", theme);
            const startPt = {
              x: cx + Math.cos(pos.angle) * hubR,
              y: cy + Math.sin(pos.angle) * hubR,
            };
            const endPt = {
              x: pos.x - Math.cos(pos.angle) * (satW * 0.48),
              y: pos.y - Math.sin(pos.angle) * (satH * 0.45),
            };
            return (
              <AnimatedConnector
                key={`hub-${i}`}
                from={startPt}
                to={endPt}
                mode="radial"
                startFrame={tStart}
                color={c.line}
                orbPhase={i * 0.22}
              />
            );
          })}
        </svg>

        {/* 中心圆形核心 */}
        <div
          style={{
            position: "absolute",
            left: cx - hubR,
            top: cy - hubR,
            width: hubR * 2,
            height: hubR * 2,
            borderRadius: "50%",
            backgroundColor: theme.isDark ? theme.colors.surfaceActive : "#18221F",
            border: `3px solid ${theme.colors.accent}`,
            boxShadow: `0 0 42px ${theme.colors.accentSoft}`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: 16,
            opacity: centerS,
            transform: `scale(${0.8 + 0.2 * centerS})`,
          }}
        >
          <div
            style={{
              fontFamily: theme.fonts.heading,
              fontSize: 34,
              fontWeight: 800,
              color: theme.isDark ? theme.colors.accent : "#FDF5D7",
            }}
          >
            {scene.center.label}
          </div>
          {scene.center.sub && (
            <div
              style={{
                fontSize: 16,
                color: theme.isDark ? theme.colors.textSecondary : "#CBD5E1",
                marginTop: 4,
              }}
            >
              {scene.center.sub}
            </div>
          )}
        </div>

        {satPositions.map((pos, i) => {
          const tStart = itemTimings[i]?.startFrame ?? 12 + i * 12;
          return (
            <React.Fragment key={`sat-${i}`}>
              {renderNodeCard(
                scene.inputs[i],
                pos.x - satW / 2,
                pos.y - satH / 2,
                satW,
                satH,
                tStart + 6,
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 28,
        width: "100%",
      }}
    >
      <div
        style={{
          fontFamily: theme.fonts.heading,
          fontSize: isVertical ? 48 : 50,
          fontWeight: 800,
          color: theme.colors.textPrimary,
          textAlign: "center",
          opacity: titleS,
          transform: `translateY(${(1 - titleS) * 16}px)`,
        }}
      >
        <HighlightText text={scene.title} theme={theme} />
      </div>

      {scene.layout === "hub" ? renderHub() : renderConverge()}
    </div>
  );
};
