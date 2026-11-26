import json
import os
import subprocess

SCRIPT_PATH = "content/ai-dictionary-pro/script.json"
OUT_DIR = "public/audio/ai-dictionary-pro"
TIMELINE_PATH = "content/ai-dictionary-pro/audio-timeline.json"


def tts_line(text: str, voice: str, rate: str, dst_aiff: str):
    subprocess.run(
        [
            "say",
            "-v",
            "Tingting",
            "-r",
            "215",
            "-o",
            dst_aiff,
            text,
        ],
        check=True,
    )


def get_duration_sec(path: str) -> float:
    out = subprocess.check_output(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "default=noprint_wrappers=1:nokey=1",
            path,
        ]
    ).decode().strip()
    return float(out)


def make_silence_wav(dur_sec: float, dst_wav: str):
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-v",
            "error",
            "-f",
            "lavfi",
            "-i",
            "anullsrc=r=44100:cl=mono",
            "-t",
            f"{dur_sec:.3f}",
            dst_wav,
        ],
        check=True,
    )


def main():
    cfg = json.load(open(SCRIPT_PATH, encoding="utf-8"))
    os.makedirs(OUT_DIR, exist_ok=True)
    fps = cfg["fps"]
    voice = cfg["voice"]
    rate = cfg["rate"]

    parts: list[str] = []
    cleanup: list[str] = []

    lead_wav = os.path.join(OUT_DIR, "_lead.wav")
    make_silence_wav(0.35, lead_wav)
    parts.append(lead_wav)
    cleanup.append(lead_wav)

    cursor_sec = 0.35
    scenes_out = []
    subtitles_out = []

    pause_wav = os.path.join(OUT_DIR, "_pause.wav")
    make_silence_wav(0.24, pause_wav)
    cleanup.append(pause_wav)

    gap_wav = os.path.join(OUT_DIR, "_gap.wav")
    make_silence_wav(0.42, gap_wav)
    cleanup.append(gap_wav)

    for scene in cfg["scenes"]:
        scene_start_sec = cursor_sec
        line_timings = []

        for idx, line in enumerate(scene["lines"]):
            raw_aiff = os.path.join(OUT_DIR, f"{scene['id']}_{idx:02d}.aiff")
            wav = os.path.join(OUT_DIR, f"{scene['id']}_{idx:02d}.wav")
            tts_line(line, voice, rate, raw_aiff)
            subprocess.run(
                ["ffmpeg", "-y", "-v", "error", "-i", raw_aiff, "-ar", "44100", "-ac", "1", wav],
                check=True,
            )
            os.remove(raw_aiff)
            dur = get_duration_sec(wav)
            l_start = cursor_sec
            l_end = cursor_sec + dur

            parts.append(wav)
            cleanup.append(wav)
            parts.append(pause_wav)
            cursor_sec = l_end + 0.24

            line_timings.append(
                {
                    "text": line,
                    "startSec": round(l_start, 3),
                    "endSec": round(l_end, 3),
                    "startFrame": round(l_start * fps),
                    "endFrame": round(l_end * fps),
                }
            )
            subtitles_out.append(line_timings[-1])

        parts.append(gap_wav)
        cursor_sec += 0.42

        s_frame = round(scene_start_sec * fps)
        e_frame = round(cursor_sec * fps)
        scenes_out.append(
            {
                "id": scene["id"],
                "type": scene["type"],
                "chapter": scene["chapter"],
                "startFrame": s_frame,
                "durationInFrames": max(1, e_frame - s_frame),
                "lines": [
                    {
                        **lt,
                        "localStartFrame": max(0, lt["startFrame"] - s_frame),
                        "localEndFrame": max(1, lt["endFrame"] - s_frame),
                    }
                    for lt in line_timings
                ],
            }
        )
        print(
            f"  [{scene['id']}] {scene['type']:18s} {s_frame:4d}..{e_frame:4d} ({(e_frame-s_frame)/fps:.2f}s)"
        )

    tail_wav = os.path.join(OUT_DIR, "_tail.wav")
    make_silence_wav(1.2, tail_wav)
    parts.append(tail_wav)
    cleanup.append(tail_wav)
    cursor_sec += 1.2
    if scenes_out:
        scenes_out[-1]["durationInFrames"] += round(1.2 * fps)
        offset = scenes_out[0]["startFrame"]
        scenes_out[0]["startFrame"] = 0
        scenes_out[0]["durationInFrames"] += offset
        for lt in scenes_out[0]["lines"]:
            lt["localStartFrame"] += offset
            lt["localEndFrame"] += offset

    list_txt = os.path.join(OUT_DIR, "_concat.txt")
    with open(list_txt, "w", encoding="utf-8") as f:
        for p in parts:
            f.write(f"file '{os.path.abspath(p)}'\n")
    cleanup.append(list_txt)

    narration_path = os.path.join(OUT_DIR, "narration.mp3")
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-v",
            "error",
            "-f",
            "concat",
            "-safe",
            "0",
            "-i",
            list_txt,
            "-c:a",
            "libmp3lame",
            "-b:a",
            "192k",
            narration_path,
        ],
        check=True,
    )

    for p in set(cleanup):
        if os.path.exists(p):
            os.remove(p)

    total_frames = sum(s["durationInFrames"] for s in scenes_out)
    out_data = {
        "title": cfg["title"],
        "fps": fps,
        "width": 1920,
        "height": 1080,
        "chapters": cfg["chapters"],
        "narrationFile": "audio/ai-dictionary-pro/narration.mp3",
        "bgmFile": "bgm/tech-groove.wav",
        "totalFrames": total_frames,
        "totalSec": round(total_frames / fps, 2),
        "scenes": scenes_out,
        "subtitles": subtitles_out,
    }
    with open(TIMELINE_PATH, "w", encoding="utf-8") as f:
        json.dump(out_data, f, ensure_ascii=False, indent=2)

    print(f"✓ 旁白合成完成: {narration_path} ({out_data['totalSec']}s, {total_frames} 帧)")


if __name__ == "__main__":
    main()
