#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""从 Markdown 文章的「原文」标签页提取正文，生成接近雅思听力语速的朗读音频。

依赖：
    - Python 3.9+
    - edge-tts（微软神经网络 TTS，免费）
    - ffmpeg / ffprobe（拼接、EQ、响度归一化、格式转换）

示例：
    python scripts/gen_reading_audio.py \
        "docs/english/IELTS/剑桥雅思/19/Test1_reading_passage_1.md" \
        --out "docs/english/IELTS/剑桥雅思/19/audio/How_tennis_rackets_have_changed.wav"

默认行为：
    1. 抽取 `=== "原文"` 标签页下的所有段落（忽略“译文”和后面的小节）；
    2. 按目标语速（默认 150 wpm，雅思听力常速）自动校准 edge-tts 的 rate；
    3. 逐段合成，段间插入长度随段落长短浮动的停顿；
    4. 可选人声增强（EQ + 轻压缩 + 两遍响度归一化）；
    5. 输出 WAV（默认，24 kHz 单声道）或 MP3。
"""

from __future__ import annotations

import argparse
import asyncio
import hashlib
import json
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

try:
    import edge_tts
except ImportError:  # pragma: no cover
    sys.exit(
        "缺少 edge-tts。请先安装：\n"
        "  python3 -m venv .venv && . .venv/bin/activate && pip install edge-tts"
    )

# ---------------------------------------------------------------- 文本处理

WORD_RE = re.compile(r"[A-Za-z0-9’'%€$£\-]+")


def extract_passage(md_path: Path, tab: str = "原文") -> list[str]:
    """取出 `=== "tab"` 标签页里的段落，返回去掉缩进后的段落列表。"""
    lines = md_path.read_text(encoding="utf-8").splitlines()
    start = None
    for i, line in enumerate(lines):
        if re.match(r'^===\s*["\']' + re.escape(tab) + r'["\']', line.strip()):
            start = i + 1
            break
    if start is None:
        raise SystemExit(f'未在 {md_path} 中找到 === "{tab}" 标签页')

    blocks: list[list[str]] = []
    buf: list[str] = []
    for line in lines[start:]:
        stripped = line.strip()
        # 标签页结束：下一个 === "..." 或任何一级/二级标题
        if re.match(r"^(===|#{1,2}\s)", stripped):
            break
        # 标签页内容整体缩进 4 空格，遇到顶格内容（如 <audio>）也视为结束
        if stripped and not line[:1].isspace():
            break
        if not stripped:
            if buf:
                blocks.append(buf)
                buf = []
            continue
        buf.append(stripped)
    if buf:
        blocks.append(buf)
    return [" ".join(b) for b in blocks if any(b)]


def normalize(text: str) -> str:
    """把书面标记改写成更适合朗读的形式。"""
    text = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", text)  # markdown 链接
    text = text.replace("**", "").replace("`", "")
    text = re.sub(r"(?<!\w)[*_](\S.*?\S)[*_](?!\w)", r"\1", text)  # 轻量强调
    text = re.sub(r"\bi\.e\.", "that is", text)
    text = re.sub(r"\be\.g\.", "for example", text)
    text = re.sub(r"\s+[-–—]\s+", ", ", text)  # 破折号读作停顿
    text = text.replace("…", ", ")
    text = re.sub(r"\s{2,}", " ", text)
    return text.strip()


def count_words(paragraphs: list[str]) -> int:
    return sum(len(WORD_RE.findall(p)) for p in paragraphs)


def gap_seconds(index: int, total: int, para: str, base: float) -> float:
    """段间停顿：随段落长度浮动，末段之后不加。"""
    if index >= total - 1:
        return 0.0
    extra = min(len(para) / 900.0, 0.5)  # 长段落读完换气更久
    return round(base + extra, 2)


# ---------------------------------------------------------------- 音频工具


def run(cmd: list[str]) -> None:
    proc = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if proc.returncode != 0:
        sys.exit("命令失败：" + " ".join(cmd) + "\n" + proc.stderr.decode()[-800:])


def duration(path: Path) -> float:
    out = subprocess.run(
        [
            "ffprobe", "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=nw=1:nk=1", str(path),
        ],
        stdout=subprocess.PIPE, check=True,
    ).stdout.decode().strip()
    return float(out)


def silence(path: Path, seconds: float, rate: int = 24000) -> None:
    run([
        "ffmpeg", "-v", "error", "-y", "-f", "lavfi",
        "-i", f"anullsrc=r={rate}:cl=mono",
        "-t", f"{seconds:.2f}", "-c:a", "pcm_s16le", str(path),
    ])


def to_wav(src: Path, dst: Path, rate: int = 24000) -> None:
    run([
        "ffmpeg", "-v", "error", "-y", "-i", str(src),
        "-ar", str(rate), "-ac", "1", "-c:a", "pcm_s16le", str(dst),
    ])


def concat(parts: list[Path], dst: Path, work: Path) -> None:
    listing = work / "concat.txt"
    listing.write_text(
        "".join(f"file '{p.as_posix()}'\n" for p in parts), encoding="utf-8"
    )
    run([
        "ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0",
        "-i", str(listing), "-c:a", "pcm_s16le", str(dst),
    ])


def enhance(src: Path, dst: Path, fmt: str) -> None:
    """EQ + 轻压缩 + 两遍 loudnorm，去掉 TTS 的干瘪感。"""
    chain = (
        "highpass=f=75,"
        "equalizer=f=180:t=q:w=1.0:g=-1.5,"
        "equalizer=f=3200:t=q:w=1.2:g=2,"
        "acompressor=threshold=-20dB:ratio=2.5:attack=8:release=180:makeup=2"
    )
    # 第一遍：测量
    proc = subprocess.run(
        [
            "ffmpeg", "-hide_banner", "-i", str(src),
            "-af", f"{chain},loudnorm=I=-16:TP=-1.5:LRA=9:print_format=json",
            "-f", "null", "-",
        ],
        stderr=subprocess.PIPE, stdout=subprocess.DEVNULL,
    )
    raw = proc.stderr.decode()
    try:
        measured = json.loads(raw[raw.rindex("{"): raw.rindex("}") + 1])
    except ValueError:
        sys.exit("loudnorm 测量失败：\n" + raw[-800:])

    loudnorm = (
        "loudnorm=I=-16:TP=-1.5:LRA=9"
        f":measured_I={measured['input_i']}"
        f":measured_TP={measured['input_tp']}"
        f":measured_LRA={measured['input_lra']}"
        f":measured_thresh={measured['input_thresh']}"
        f":offset={measured['target_offset']}:linear=true"
    )
    out = [
        "ffmpeg", "-v", "error", "-y", "-i", str(src),
        "-af", f"{chain},{loudnorm}", "-ar", "44100", "-ac", "1",
    ]
    if fmt == "mp3":
        out += ["-c:a", "libmp3lame", "-b:a", "96k", "-id3v2_version", "3"]
        out += ["-metadata", "title=IELTS reading passage", str(dst)]
    else:
        out += ["-c:a", "pcm_s16le", str(dst)]
    run(out)


# ---------------------------------------------------------------- 合成主流程


async def synth(text: str, voice: str, rate: int, pitch: int, out: Path) -> None:
    communicate = edge_tts.Communicate(
        text, voice, rate=f"{rate:+d}%", pitch=f"{pitch:+d}Hz"
    )
    await communicate.save(str(out))


async def synth_all(
    paragraphs: list[str], voice: str, rate: int, pitch: int, work: Path
) -> list[Path]:
    key = voice + "|" + str(rate) + "|" + str(pitch) + "|" + "\n".join(paragraphs)
    tag = hashlib.md5(key.encode()).hexdigest()[:10]
    seg_dir = work / f"seg-{tag}"
    seg_dir.mkdir(parents=True, exist_ok=True)

    todo = []
    for i, para in enumerate(paragraphs):
        f = seg_dir / f"p{i:02d}.mp3"
        if not (f.exists() and f.stat().st_size > 1000):
            todo.append(synth(para, voice, rate, pitch, f))
    for i in range(0, len(todo), 3):  # 并发 3 个，避免被限流
        await asyncio.gather(*todo[i:i + 3])
    return [seg_dir / f"p{i:02d}.mp3" for i in range(len(paragraphs))]


def speech_seconds(segments: list[Path]) -> float:
    return sum(duration(s) for s in segments)


def main() -> None:
    ap = argparse.ArgumentParser(
        description="把 Markdown 原文生成雅思语速朗读音频",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    ap.add_argument("md", type=Path, help="Markdown 文件路径")
    ap.add_argument("--out", type=Path, required=True, help="输出音频路径")
    ap.add_argument("--tab", default="原文", help="要朗读的标签页名")
    ap.add_argument("--voice", default="en-GB-SoniaNeural", help="edge-tts 音色")
    ap.add_argument("--wpm", type=float, default=150, help="目标语速（词/分钟）")
    ap.add_argument("--rate", type=int, default=None,
                    help="手动指定语速偏移百分比，指定后不再自动校准")
    ap.add_argument("--pitch", type=int, default=0, help="音高偏移（Hz）")
    ap.add_argument("--gap", type=float, default=0.7, help="段间基础停顿（秒）")
    ap.add_argument("--lead", type=float, default=0.6, help="开头静音（秒）")
    ap.add_argument("--tail", type=float, default=1.2, help="结尾静音（秒）")
    ap.add_argument("--format", choices=["wav", "mp3"], default=None,
                    help="输出格式，默认按 --out 后缀")
    ap.add_argument("--enhance", dest="enhance", action="store_true", default=True,
                    help="开启人声增强（默认开启）")
    ap.add_argument("--no-enhance", dest="enhance", action="store_false",
                    help="关闭人声增强")
    ap.add_argument("--work-dir", type=Path, default=None,
                    help="缓存目录，默认使用临时目录")
    ap.add_argument("--keep-work", action="store_true", help="保留临时目录")
    ap.add_argument("--dry-run", action="store_true", help="只输出文本与统计")
    args = ap.parse_args()

    if not shutil.which("ffmpeg"):
        sys.exit("未找到 ffmpeg，请先安装")

    paragraphs = [normalize(p) for p in extract_passage(args.md, args.tab)]
    if not paragraphs:
        sys.exit("没有提取到任何段落")
    words = count_words(paragraphs)
    gaps = [gap_seconds(i, len(paragraphs), p, args.gap)
            for i, p in enumerate(paragraphs)]
    fixed = sum(gaps) + args.lead + args.tail
    target_total = words / args.wpm * 60 if args.wpm else 0

    print(f"段落 {len(paragraphs)} 个，共 {words} 词；目标 {args.wpm:g} wpm "
          f"→ 约 {target_total:.0f} 秒（含停顿）")

    if args.dry_run:
        for i, p in enumerate(paragraphs, 1):
            print(f"[{i}] {len(p):>4} 字符 | {p[:60]}…")
        return

    work = args.work_dir or Path(tempfile.mkdtemp(prefix="reading-audio-"))
    work.mkdir(parents=True, exist_ok=True)

    # ---- 语速校准：先按 0% 合成一遍，用实际时长反推需要的 rate
    if args.rate is None:
        probe = asyncio.run(synth_all(paragraphs, args.voice, 0, args.pitch, work))
        target_speech = max(target_total - fixed, 1.0)
        factor = speech_seconds(probe) / target_speech
        rate = round((factor - 1) * 100)
        rate = max(-45, min(45, rate))
        print(f"校准：0% 时 {speech_seconds(probe):.1f}s，目标语音 "
              f"{target_speech:.1f}s → rate={rate:+d}%")
    else:
        rate = args.rate

    segments = asyncio.run(synth_all(paragraphs, args.voice, rate, args.pitch, work))
    speech = speech_seconds(segments)
    total = speech + fixed
    achieved = words / total * 60
    print(f"合成完成：{total:.1f}s，实际 {achieved:.0f} wpm（rate={rate:+d}%）")

    # ---- 拼接
    pieces: list[Path] = []
    if args.lead:
        lead = work / "lead.wav"
        silence(lead, args.lead)
        pieces.append(lead)
    for i, seg in enumerate(segments):
        wav = work / f"p{i:02d}.wav"
        to_wav(seg, wav)
        pieces.append(wav)
        if gaps[i]:
            gap = work / f"gap{i:02d}.wav"
            silence(gap, gaps[i])
            pieces.append(gap)
    if args.tail:
        tail = work / "tail.wav"
        silence(tail, args.tail)
        pieces.append(tail)

    raw = work / "raw.wav"
    concat(pieces, raw, work)

    fmt = args.format or (args.out.suffix.lower().lstrip(".") or "wav")
    if fmt not in ("wav", "mp3"):
        sys.exit(f"不支持的输出格式：{fmt}")
    args.out.parent.mkdir(parents=True, exist_ok=True)
    if args.enhance:
        enhance(raw, args.out, fmt)
    elif fmt == "mp3":
        run(["ffmpeg", "-v", "error", "-y", "-i", str(raw),
             "-c:a", "libmp3lame", "-b:a", "96k", str(args.out)])
    else:
        shutil.copyfile(raw, args.out)

    final = duration(args.out)
    print(f"已写入 {args.out}（{final:.1f}s，{args.out.stat().st_size/1e6:.1f} MB，"
          f"{words/final*60:.0f} wpm）")

    if not args.keep_work and args.work_dir is None:
        shutil.rmtree(work, ignore_errors=True)


if __name__ == "__main__":
    main()
