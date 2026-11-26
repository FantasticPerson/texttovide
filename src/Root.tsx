import React from "react";
import { Composition } from "remotion";
import { Video } from "./Video";
import { ProVideo, ProTimeline } from "./ProVideo";
import defaultTimeline from "../content/demo-tech/timeline.json";
import proTimeline from "../content/ai-dictionary-pro/audio-timeline.json";
import { TimelineData } from "./schema/storyboard";

const typedDefault = defaultTimeline as TimelineData;
const typedPro = proTimeline as ProTimeline;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="MainVideo"
        component={Video}
        width={typedDefault.width}
        height={typedDefault.height}
        fps={typedDefault.fps}
        durationInFrames={typedDefault.totalFrames}
        defaultProps={{ timeline: typedDefault }}
        calculateMetadata={({ props }) => {
          const tl = props.timeline;
          return {
            durationInFrames: tl.totalFrames,
            fps: tl.fps,
            width: tl.width,
            height: tl.height,
          };
        }}
      />
      <Composition
        id="ProVideo"
        component={ProVideo}
        width={typedPro.width}
        height={typedPro.height}
        fps={typedPro.fps}
        durationInFrames={typedPro.totalFrames}
        defaultProps={{ timeline: typedPro }}
        calculateMetadata={({ props }) => {
          const tl = props.timeline;
          return {
            durationInFrames: tl.totalFrames,
            fps: tl.fps,
            width: tl.width,
            height: tl.height,
          };
        }}
      />
    </>
  );
};
