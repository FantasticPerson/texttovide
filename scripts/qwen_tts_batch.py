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
    """优先使用 ModelScope 国内镜像下载/缓存权重，失败回退直接传 repo id"""
    if os.path.isdir(model_id):
        return model_id
    try:
        from modelscope import snapshot_download

        print(f"▶ 检查/下载 ModelScope 权重: {model_id} ...")
        local_dir = snapshot_download(model_id)
        print(f"✓ 权重就绪: {local_dir}")
        return local_dir
    except Exception as exc:
        print(f"⚠️  ModelScope 下载回退 ({exc})，改用默认 HuggingFace 加载...")
        return model_id


def load_model(model_id: str, force_cpu: bool = False):
    model_path = resolve_model_path(model_id)
    if not force_cpu and torch.cuda.is_available():
        device, dtype = "cuda:0", torch.bfloat16
    elif not force_cpu and torch.backends.mps.is_available():
        device, dtype = "mps", torch.float16
    else:
        device, dtype = "cpu", torch.float32

    print(f"▶ 加载 Qwen3-TTS 模型 | device={device} | dtype={dtype}")
    t0 = time.time()
    try:
        model = Qwen3TTSModel.from_pretrained(
            model_path,
            device_map=device,
            dtype=dtype,
        )
    except Exception as exc:
        if device != "cpu":
            print(f"⚠️  {device} 加载失败 ({exc})，自动回退 CPU float32 ...")
            model = Qwen3TTSModel.from_pretrained(
                model_path,
                device_map="cpu",
                dtype=torch.float32,
            )
        else:
            raise
    print(f"✓ 模型加载完成 ({time.time() - t0:.1f}s)")
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


def make_silence_wav(dur_sec: float, dst_wav: str, sr: int = 24000):
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
            dst_wav,
        ],
        check=True,
    )


def run_test(args):
    model = load_model(args.model, args.cpu)
    print("▶ 提取参考音频音色特征...")
    prompt = model.create_voice_clone_prompt(
        ref_audio=args.ref,
        ref_text=args.ref_text,
    )
    print(f"▶ 生成测试语音: {args.text}")
    t0 = time.time()
    wavs, sr = model.generate_voice_clone(
        text=args.text,
        language=args.language,
        voice_clone_prompt=prompt,
    )
    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
    sf.write(args.out, wavs[0], sr)
    dur = len(wavs[0]) / sr
    print(f"✓ 生成成功: {args.out} ({dur:.2f}s 音频，耗时 {time.time() - t0:.1f}s)")


def run_batch(args):
    slug = args.slug
    script_path = os.path.join("content", slug, "script.json")
    if not os.path.exists(script_path):
        print(f"✗ 找不到脚本文件: {script_path}", file=sys.stderr)
        sys.exit(1)

    cfg = json.load(open(script_path, encoding="utf-8"))
    out_dir = os.path.join("public", "audio", slug)
    timeline_path = os.path.join("content", slug, "audio-timeline.json")
    os.makedirs(out_dir, exist_ok=True)
    fps = cfg.get("fps", 30)

    model = load_model(args.model, args.cpu)
    print("▶ 预提取参考音色特征（整片复用）...")
    voice_prompt = model.create_voice_clone_prompt(
        ref_audio=args.ref,
        ref_text=args.ref_text,
    )

    parts = []
    cleanup = []
    sr_target = 24000

    lead_wav = os.path.join(out_dir, "_lead.wav")
    pause_wav = os.path.join(out_dir, "_pause.wav")
    gap_wav = os.path.join(out_dir, "_gap.wav")
    tail_wav = os.path.join(out_dir, "_tail.wav")
    make_silence_wav(0.35, lead_wav, sr_target)
    make_silence_wav(0.24, pause_wav, sr_target)
    make_silence_wav(0.42, gap_wav, sr_target)
    make_silence_wav(1.20, tail_wav, sr_target)
    cleanup.extend([lead_wav, pause_wav, gap_wav, tail_wav])

    parts.append(lead_wav)
    cursor_sec = 0.35
    scenes_out = []
    subtitles_out = []

    for scene in cfg["scenes"]:
        scene_start_sec = cursor_sec
        line_timings = []
        for idx, line in enumerate(scene["lines"]):
            raw_wav = os.path.join(out_dir, f"{scene['id']}_{idx:02d}_raw.wav")
            norm_wav = os.path.join(out_dir, f"{scene['id']}_{idx:02d}.wav")
            t0 = time.time()
            wavs, sr = model.generate_voice_clone(
                text=line,
                language=args.language,
                voice_clone_prompt=voice_prompt,
            )
            sf.write(raw_wav, wavs[0], sr)
            subprocess.run(
                [
                    "ffmpeg",
                    "-y",
                    "-v",
                    "error",
                    "-i",
                    raw_wav,
                    "-ar",
                    str(sr_target),
                    "-ac",
                    "1",
                    norm_wav,
                ],
                check=True,
            )
            os.remove(raw_wav)
            dur = get_duration_sec(norm_wav)
            print(
                f"  [{scene['id']}-{idx:02d}] {dur:.2f}s (gen {time.time()-t0:.1f}s) | {line[:22]}"
            )

            l_start = cursor_sec
            l_end = cursor_sec + dur
            parts.append(norm_wav)
            cleanup.append(norm_wav)
            parts.append(pause_wav)
            cursor_sec = l_end + 0.24

            lt = {
                "text": line,
                "startSec": round(l_start, 3),
                "endSec": round(l_end, 3),
                "startFrame": round(l_start * fps),
                "endFrame": round(l_end * fps),
            }
            line_timings.append(lt)
            subtitles_out.append(lt)

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

    parts.append(tail_wav)
    cursor_sec += 1.20
    if scenes_out:
        scenes_out[-1]["durationInFrames"] += round(1.20 * fps)
        offset = scenes_out[0]["startFrame"]
        scenes_out[0]["startFrame"] = 0
        scenes_out[0]["durationInFrames"] += offset
        for lt in scenes_out[0]["lines"]:
            lt["localStartFrame"] += offset
            lt["localEndFrame"] += offset

    list_txt = os.path.join(out_dir, "_concat.txt")
    with open(list_txt, "w", encoding="utf-8") as f:
        for p in parts:
            f.write(f"file '{os.path.abspath(p)}'\n")
    cleanup.append(list_txt)

    narration_path = os.path.join(out_dir, "narration.mp3")
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
        "chapters": cfg.get("chapters", []),
        "narrationFile": f"audio/{slug}/narration.mp3",
        "bgmFile": "bgm/tech-groove.wav",
        "totalFrames": total_frames,
        "totalSec": round(total_frames / fps, 2),
        "scenes": scenes_out,
        "subtitles": subtitles_out,
    }
    with open(timeline_path, "w", encoding="utf-8") as f:
        json.dump(out_data, f, ensure_ascii=False, indent=2)

    print(f"✓ 克隆旁白合成完成: {narration_path} ({out_data['totalSec']}s, {total_frames} 帧)")


def main():
    parser = argparse.ArgumentParser(description="Qwen3-TTS 本地零样本声音克隆工具")
    parser.add_argument("--model", default=MODEL_ID, help="模型 ID 或本地目录")
    parser.add_argument("--ref", required=True, help="本人 10~20 秒参考音频路径 (wav/mp3)")
    parser.add_argument("--ref-text", required=True, help="参考音频逐字转写文本（含标点）")
    parser.add_argument("--language", default="Chinese", help="目标语言，默认 Chinese")
    parser.add_argument("--cpu", action="store_true", help="强制使用 CPU")
    parser.add_argument("--test", action="store_true", help="单句克隆测试模式")
    parser.add_argument("--text", default="你好，这是我用本地声音克隆生成的第一段测试旁白。", help="测试文本")
    parser.add_argument("--out", default="out/voice-test.wav", help="测试输出路径")
    parser.add_argument("--slug", help="批量合成模式：content/<slug>/script.json")
    args = parser.parse_args()

    if args.test:
        run_test(args)
    elif args.slug:
        run_batch(args)
    else:
        parser.error("请指定 --test（单句测试）或 --slug <name>（批量合成）")


if __name__ == "__main__":
    main()
