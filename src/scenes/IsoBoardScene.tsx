import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { IsoBoardScene as IsoBoardSceneType, ItemTiming } from "../schema/storyboard";
import { ThemeTokens, motion } from "../theme";
import { HighlightText } from "../components/HighlightText";
import { resolveIsoColor } from "../motion/iso/math";
import {
  IsoBoard,
  IsoBox,
  IsoCallout,
  IsoCylinder,
  IsoLink,
} from "../motion/iso/primitives";

interface Props {
  scene: IsoBoardSceneType;
  itemTimings: ItemTiming[];
  theme: ThemeTokens;
}

const SVG_W = 1120;
const SVG_H = 590;
const BOARD_SIZE = 10;
const UNIT = 44;
const ORIGIN_X = SVG_W / 2;
const ORIGIN_Y = 128;

export const IsoBoardScene: React.FC<Props> = ({ scene, itemTimings, theme }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const isVertical = height > width;

  const titleS = spring({ frame, fps, config: motion.spring });
  const boardS = spring({ frame, fps, config: { damping: 20, stiffness: 110, mass: 0.9 } });

  // 按等距深度 (x + y) 排序，确保近处积木永远遮挡远处积木
  const sortedNodes = scene.nodes
    .map((node, idx) => ({ node, idx }))
    .sort((a, b) => a.node.x + a.node.y - (b.node.x + b.node.y));

  const linksStart =
    (itemTimings[scene.nodes.length - 1]?.startFrame ?? 12 + scene.nodes.length * 10) + 12;

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

      <svg
        width="100%"
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        style={{
          maxWidth: isVertical ? "100%" : 1120,
          maxHeight: isVertical ? 680 : 620,
          overflow: "visible",
          opacity: boardS,
        }}
      >
        <IsoBoard
          size={BOARD_SIZE}
          originX={ORIGIN_X}
          originY={ORIGIN_Y}
          unit={UNIT}
          theme={theme}
          gridStep={1.25}
        />

        {/* 沙盘平面连线 */}
        {(scene.links ?? []).map((link, lIdx) => {
          const fromNode = scene.nodes[link.from];
          const toNode = scene.nodes[link.to];
          if (!fromNode || !toNode) return null;
          const linkColor = link.tone
            ? resolveIsoColor(link.tone, theme.isDark)
            : theme.colors.accent;
          return (
            <IsoLink
              key={lIdx}
              from={{ x: fromNode.x, y: fromNode.y }}
              to={{ x: toNode.x, y: toNode.y }}
              originX={ORIGIN_X}
              originY={ORIGIN_Y}
              unit={UNIT}
              startFrame={linksStart + lIdx * 5}
              color={linkColor}
              dashed={link.dashed !== false}
              showOrb={link.flowOrb !== false}
              orbPhase={lIdx * 0.22}
            />
          );
        })}

        {/* 2.5D 积木与圆柱节点（从天而降弹跳落位） */}
        {sortedNodes.map(({ node, idx }) => {
          const tStart = itemTimings[idx]?.startFrame ?? 8 + idx * 10;
          const dropS =
            frame >= tStart
              ? spring({
                  frame: frame - tStart,
                  fps,
                  config: { damping: 14, stiffness: 150, mass: 0.8 },
                })
              : 0;
          const zDrop = (1 - dropS) * 3.8;
          const opacity = Math.min(1, dropS * 1.8);
          const color = resolveIsoColor(node.tone ?? "blue", theme.isDark);
          const nodeH = node.height ?? 1.25;
          const nodeSize = node.size ?? 1.6;

          return (
            <g key={idx}>
              {node.shape === "cylinder" ? (
                <IsoCylinder
                  cx={node.x}
                  cy={node.y}
                  z={zDrop}
                  radius={nodeSize * 0.45}
                  h={nodeH}
                  color={color}
                  originX={ORIGIN_X}
                  originY={ORIGIN_Y}
                  unit={UNIT}
                  opacity={opacity}
                />
              ) : (
                <IsoBox
                  cx={node.x}
                  cy={node.y}
                  z={zDrop}
                  w={nodeSize}
                  d={nodeSize}
                  h={nodeH}
                  color={color}
                  originX={ORIGIN_X}
                  originY={ORIGIN_Y}
                  unit={UNIT}
                  opacity={opacity}
                  topLabel={node.topText}
                />
              )}
            </g>
          );
        })}

        {/* 垂直细引线标注放最顶层，防止被前面积木遮挡文字 */}
        {sortedNodes.map(({ node, idx }) => {
          if (!node.label) return null;
          const tStart = (itemTimings[idx]?.startFrame ?? 8 + idx * 10) + 8;
          const callS =
            frame >= tStart
              ? spring({ frame: frame - tStart, fps, config: motion.spring })
              : 0;
          return (
            <IsoCallout
              key={`call-${idx}`}
              cx={node.x}
              cy={node.y}
              zTop={node.height ?? 1.25}
              label={node.label}
              sub={node.sub}
              stemHeight={node.stemHeight ?? 44}
              originX={ORIGIN_X}
              originY={ORIGIN_Y}
              unit={UNIT}
              theme={theme}
              accent={node.featured}
              opacity={callS}
            />
          );
        })}
      </svg>

      {scene.caption && (
        <div
          style={{
            fontSize: 23,
            color: theme.colors.textSecondary,
            textAlign: "center",
          }}
        >
          {scene.caption}
        </div>
      )}
    </div>
  );
};
