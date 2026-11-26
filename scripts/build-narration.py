import argparse
import json
import os
import subprocess
import sys
import time
import soundfile as sf
import torch
from qwen_tts import Qwen3TTSModel

MODEL_ID = "Qwen/Qwen3-TTS-12Hz-1.7B-Base"


def resolve_model_path(model_id: str) -> str:
    if os.path.isdir(model_id):
        return model_id
    try:
        from modelscope import snapshot_download

        return snapshot_download(model_id)
    except Exception:
        return model_id


def load_model(model_id: str, force_cpu: bool = False):
    model_path = resolve_model_path(model_id)
    if not force_cpu and torch.cuda.is_available():
        device, dtype = "cuda:0", torch.bfloat16
    elif not force_cpu and torch.backends.mps.is_available():
        device, dtype = "mps", torch.float16
    else:
        device, dtype = "cpu", torch.float32

    print(f"▶ 加载 Qwen3-TTS | device={device} | dtype={dtype}")
    t0 = time.time()
    try:
        model = Qwen3TTSModel.from_pretrained(model_path, device_map=device, dtype=dtype)
    except Exception as exc:
        if device != "cpu":
            print(f"⚠️  {device} 回退 CPU: {exc}")
            model = Qwen3TTSModel.from_pretrained(model_path, device_map="cpu", dtype=torch.float32)
        else:
            raise
    print(f"✓ 模型就绪 ({time.time() - t0:.1f}s)")
    return model


def get_duration_sec(path: str) -> float:
    out = (
        subprocess.check_output(
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
        )
        .decode()
        .strip()
    )
    return float(out)


def make_silence(dur_sec: float, dst: str, sr: int = 24000):
    subprocess.run(
        [
            "ffmpeg",
            "-y",
            "-v",
            "error",
            "-f",
            "lavfi",
            "-i",
            f"anullsrc=r={sr}:cl=mono",
            "-t",
            f"{dur_sec:.3f}",
            dst,
        ],
        check=True,
    )


def rebuild_item_timings(num_items: int, duration_frames: int, fps: int, is_grid: bool = False):
    if num_items <= 0:
        return []
    lead = round(0.45 * fps)
    exit_f = round(0.24 * fps)
    hold = round(0.85 * fps)
    span = max(round(0.8 * fps), duration_frames - lead - exit_f - hold)
    if is_grid:
        step = max(4, min(round(0.22 * fps), span // num_items))
        return [{"startFrame": lead + i * step, "endFrame": duration_frames - exit_f} for i in range(num_items)]
    slot = span / num_items
    out = []
    for i in range(num_items):
        sf_i = lead + round(i * slot)
        ef_i = duration_frames - exit_f if i == num_items - 1 else lead + round((i + 1) * slot)
        out.append({"startFrame": sf_i, "endFrame": max(sf_i + 1, ef_i)})
    return out


def main():
    parser = argparse.ArgumentParser(description="按 storyboard.json 的 narration 生成本人克隆旁白并同步 timeline.json")
    parser.add_argument("slug", help="content/<slug>")
    parser.add_argument("--ref", default="voice/my-ref.wav")
    parser.add_argument("--ref-text-file", default="voice/my-ref.txt")
    parser.add_argument("--cpu", action="store_true")
    args = parser.parse_args()

    slug = args.slug
    timeline_path = os.path.join("content", slug, "timeline.json")
    if not os.path.exists(timeline_path):
        print(f"✗ 请先运行 build-timeline.ts 生成 {timeline_path}", file=sys.stderr)
        sys.exit(1)

    tl = json.load(open(timeline_path, encoding="utf-8"))
    has_narration = any(s["scene"].get("narration") for s in tl["scenes"])
    if not has_narration:
        print(f"ℹ️  {slug} 未配置 narration 字段，跳过旁白合成。")
        return

    ref_text = open(args.ref_text_file, encoding="utf-8").read().strip()
    fps = tl["fps"]
    out_dir = os.path.join("public", "audio", slug)
    os.makedirs(out_dir, exist_ok=True)
    sr_target = 24000

    model = load_model(MODEL_ID, args.cpu)
    print("▶ 预提取本人参考音色特征...")
    voice_prompt = model.create_voice_clone_prompt(ref_audio=args.ref, ref_text=ref_text)

    lead_wav = os.path.join(out_dir, "_lead.wav")
    pause_wav = os.path.join(out_dir, "_pause.wav")
    gap_wav = os.path.join(out_dir, "_gap.wav")
    tail_wav = os.path.join(out_dir, "_tail.wav")
    make_silence(0.35, lead_wav, sr_target)
    make_silence(0.22, pause_wav, sr_target)
    make_silence(0.45, gap_wav, sr_target)
    make_silence(1.10, tail_wav, sr_target)

    parts = [lead_wav]
    cleanup = [lead_wav, pause_wav, gap_wav, tail_wav]
    cursor_sec = 0.35
    subtitles = []

    for s_item in tl["scenes"]:
        scene = s_item["scene"]
        lines = scene.get("narration") or ([scene["subtitle"]] if scene.get("subtitle") else [])
        scene_start_sec = cursor_sec

        for idx, line in enumerate(lines):
            raw_wav = os.path.join(out_dir, f"{scene['id']}_{idx:02d}_raw.wav")
            norm_wav = os.path.join(out_dir, f"{scene['id']}_{idx:02d}.wav")
            t0 = time.time()
            wavs, sr = model.generate_voice_clone(
                text=line,
                language="Chinese",
                voice_clone_prompt=voice_prompt,
            )
            sf.write(raw_wav, wavs[0], sr)
            subprocess.run(
                ["ffmpeg", "-y", "-v", "error", "-i", raw_wav, "-ar", str(sr_target), "-ac", "1", norm_wav],
                check=True,
            )
            os.remove(raw_wav)
            dur = get_duration_sec(norm_wav)
            print(f"  [{scene['id']}-{idx:02d}] {dur:.2f}s (耗时 {time.time()-t0:.1f}s) | {line}")

            l_start = cursor_sec
            l_end = cursor_sec + dur
            parts.append(norm_wav)
            cleanup.append(norm_wav)
            parts.append(pause_wav)
            cursor_sec = l_end + 0.22

            subtitles.append(
                {
                    "text": line,
                    "startFrame": round(l_start * fps),
                    "endFrame": round(l_end * fps),
                }
            )

        parts.append(gap_wav)
        cursor_sec += 0.45

        sf_scene = round(scene_start_sec * fps)
        ef_scene = round(cursor_sec * fps)
        dur_frames = max(round(2.5 * fps), ef_scene - sf_scene)
        s_item["startFrame"] = sf_scene
        s_item["durationInFrames"] = dur_frames
        s_item["readingSec"] = round(dur_frames / fps, 2)
        s_item["itemTimings"] = rebuild_item_timings(
            len(s_item.get("itemTimings", [])),
            dur_frames,
            fps,
            is_grid=(scene["type"] == "grid"),
        )

    parts.append(tail_wav)
    cursor_sec += 1.10
    if tl["scenes"]:
        # 首屏对齐 0，末屏加片尾缓冲
        offset = tl["scenes"][0]["startFrame"]
        tl["scenes"][0]["startFrame"] = 0
        tl["scenes"][0]["durationInFrames"] += offset
        tl["scenes"][-1]["durationInFrames"] += round(1.10 * fps)

    list_txt = os.path.join(out_dir, "_concat.txt")
    with open(list_txt, "w", encoding="utf-8") as f:
        for p in parts:
            f.write(f"file '{os.path.abspath(p)}'\n")
    cleanup.append(list_txt)

    narration_mp3 = os.path.join(out_dir, "narration.mp3")
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
            narration_mp3,
        ],
        check=True,
    )

    for p in set(cleanup):
        if os.path.exists(p):
            os.remove(p)

    total_frames = sum(s["durationInFrames"] for s in tl["scenes"])
    tl["totalFrames"] = total_frames
    tl["totalSec"] = round(total_frames / fps, 2)
    tl["narrationFile"] = f"audio/{slug}/narration.mp3"
    tl["subtitles"] = subtitles

    with open(timeline_path, "w", encoding="utf-8") as f:
        json.dump(tl, f, ensure_ascii=False, indent=2)

    print(f"✓ 本人克隆旁白合成完成: {narration_mp3} ({tl['totalSec']}s, {total_frames} 帧)")
    print(f"✓ 已同步音画时间轴与 {len(subtitles)} 条字幕到 {timeline_path}")


if __name__ == "__main__":
    main()
