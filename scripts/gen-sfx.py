import os
import wave
import numpy as np

SR = 44100


def save_wav(path: str, samples: np.ndarray):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    peak = np.max(np.abs(samples))
    if peak > 0:
        samples = samples / max(1.0, peak) * 0.92
    pcm = (np.clip(samples, -1.0, 1.0) * 32767).astype(np.int16)
    with wave.open(path, "w") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(SR)
        wf.writeframes(pcm.tobytes())
    print("OK", path, f"({len(samples)/SR:.2f}s)")


def gen_pop():
    dur = 0.11
    t = np.linspace(0, dur, int(SR * dur), endpoint=False)
    freq = 420 * np.exp(t * 7.5)
    env = np.exp(-t * 36) * np.minimum(1.0, t / 0.005)
    sig = np.sin(2 * np.pi * np.cumsum(freq) / SR) * env * 0.65
    save_wav("public/sfx/pop.wav", sig)


def gen_click():
    dur = 0.06
    t = np.linspace(0, dur, int(SR * dur), endpoint=False)
    env = np.exp(-t * 75)
    sig = (np.sin(2 * np.pi * 1500 * t) * 0.5 + np.sin(2 * np.pi * 2800 * t) * 0.35) * env
    save_wav("public/sfx/click.wav", sig)


def gen_type():
    dur = 0.045
    t = np.linspace(0, dur, int(SR * dur), endpoint=False)
    rng = np.random.default_rng(42)
    noise = rng.normal(0, 0.25, len(t))
    env = np.exp(-t * 95)
    sig = (np.sin(2 * np.pi * 920 * t) * 0.4 + noise) * env * 0.5
    save_wav("public/sfx/type.wav", sig)


def gen_whoosh():
    dur = 0.28
    t = np.linspace(0, dur, int(SR * dur), endpoint=False)
    rng = np.random.default_rng(7)
    noise = rng.normal(0, 1, len(t))
    # 简单滑动平均低通滤波模拟柔和扫频
    kernel = np.ones(28) / 28.0
    smooth = np.convolve(noise, kernel, mode="same")
    env = np.sin(np.pi * t / dur) ** 1.6
    tone = np.sin(2 * np.pi * np.cumsum(180 + 460 * (t / dur)) / SR) * 0.14
    sig = (smooth * 0.55 + tone) * env * 0.65
    save_wav("public/sfx/whoosh.wav", sig)


def gen_bgm(total_sec=130.0):
    """柔和深空电子律动 BGM（无版权，112 BPM，不抢人声频段）"""
    n = int(SR * total_sec)
    t = np.linspace(0, total_sec, n, endpoint=False)
    bpm = 112.0
    beat_sec = 60.0 / bpm

    # 四小节和弦进行（Am - F - C - G），柔和低频 Pad
    chords = [
        [220.0, 261.63, 329.63],   # Am
        [174.61, 220.0, 261.63],   # F
        [196.0, 261.63, 329.63],   # C/G
        [196.0, 246.94, 293.66],   # G
    ]
    bar_sec = beat_sec * 4
    pad = np.zeros(n)
    bass = np.zeros(n)

    for i in range(int(total_sec / bar_sec) + 1):
        s_idx = int(i * bar_sec * SR)
        e_idx = min(n, int((i + 1) * bar_sec * SR))
        if s_idx >= n:
            break
        lt = t[s_idx:e_idx] - i * bar_sec
        chord = chords[i % len(chords)]
        env = np.minimum(1.0, lt / 0.18) * np.minimum(1.0, (bar_sec - lt + 0.05) / 0.25)
        for f in chord:
            pad[s_idx:e_idx] += np.sin(2 * np.pi * f * lt) * 0.11 * env
        # 低音柔和贝斯脉冲（八分音符）
        pulse = 0.5 + 0.5 * np.sin(2 * np.pi * (lt / (beat_sec * 0.5)) - np.pi / 2)
        bass[s_idx:e_idx] += np.sin(2 * np.pi * (chord[0] * 0.5) * lt) * 0.22 * (0.4 + 0.6 * pulse)

    # 柔和电子底鼓 + 轻踩镲（避开人声中高频）
    drums = np.zeros(n)
    num_beats = int(total_sec / beat_sec)
    for b in range(num_beats):
        s_idx = int(b * beat_sec * SR)
        # 底鼓每拍
        k_len = min(n - s_idx, int(0.14 * SR))
        if k_len > 0:
            kt = np.linspace(0, k_len / SR, k_len, endpoint=False)
            k_freq = 110 * np.exp(-kt * 22) + 42
            k_env = np.exp(-kt * 20)
            drums[s_idx : s_idx + k_len] += np.sin(2 * np.pi * np.cumsum(k_freq) / SR) * k_env * 0.32
        # 反拍轻点缀
        off_idx = s_idx + int(beat_sec * 0.5 * SR)
        h_len = min(n - off_idx, int(0.035 * SR))
        if h_len > 0:
            ht = np.linspace(0, h_len / SR, h_len, endpoint=False)
            h_env = np.exp(-ht * 85)
            drums[off_idx : off_idx + h_len] += np.sin(2 * np.pi * 6200 * ht) * h_env * 0.045

    mix = pad + bass + drums
    save_wav("public/bgm/tech-groove.wav", mix)


if __name__ == "__main__":
    gen_pop()
    gen_click()
    gen_type()
    gen_whoosh()
    gen_bgm(130.0)
