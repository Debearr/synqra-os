#!/usr/bin/env python3
"""
Generate Thumbnails and Upload to Supabase Storage
- Generates JPEG thumbnails for images and videos
- Uploads thumbnails to Supabase Storage bucket `asset_thumbs`

Env:
  SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY

Dependencies:
  pip install pillow moviepy supabase

Usage:
  python cursor/scripts/generate_thumbnails.py
"""

import os
from io import BytesIO
from typing import Iterable

from PIL import Image
import moviepy.editor as mp
from supabase import create_client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

client = None
if SUPABASE_URL and SUPABASE_KEY:
    client = create_client(SUPABASE_URL, SUPABASE_KEY)

THUMB_SIZE = (480, 270)
STATIC_PATH = "assets/static"
MOTION_PATHS = ["assets/motion", "assets/motions"]
THUMB_OUTPUT = "assets/thumbs"
BUCKET = "asset_thumbs"

os.makedirs(THUMB_OUTPUT, exist_ok=True)

IMAGE_EXTS = (".png", ".jpg", ".jpeg", ".webp")
VIDEO_EXTS = (".mp4", ".mov", ".m4v", ".webm")


def _thumb_dest_for(src_path: str) -> str:
    base = os.path.splitext(os.path.basename(src_path))[0]
    return os.path.join(THUMB_OUTPUT, f"{base}_thumb.jpg")


def make_image_thumb(src: str, dest: str) -> None:
    with Image.open(src) as img:
        img = img.convert("RGB")
        img.thumbnail(THUMB_SIZE)
        img.save(dest, "JPEG", quality=85, optimize=True)


def make_video_thumb(src: str, dest: str) -> None:
    clip = mp.VideoFileClip(src)
    try:
        frame = clip.get_frame(1.0)
        image = Image.fromarray(frame).convert("RGB")
        image.thumbnail(THUMB_SIZE)
        image.save(dest, "JPEG", quality=85, optimize=True)
    finally:
        clip.close()


def iter_media_files(paths: Iterable[str]):
    for root in paths:
        if not os.path.isdir(root):
            continue
        for dirpath, _, filenames in os.walk(root):
            for name in filenames:
                lower = name.lower()
                if lower.endswith(IMAGE_EXTS) or lower.endswith(VIDEO_EXTS):
                    yield os.path.join(dirpath, name)


def upload_to_storage(local_path: str, storage_path: str) -> None:
    if client is None:
        return
    with open(local_path, "rb") as fh:
        # overwrite if exists
        client.storage.from_(BUCKET).upload(
            storage_path,
            fh,
            file_options={
                "contentType": "image/jpeg",
                "upsert": True,
            },
        )


def process_media_file(src: str) -> None:
    dest = _thumb_dest_for(src)
    lower = src.lower()
    if lower.endswith(IMAGE_EXTS):
        make_image_thumb(src, dest)
    elif lower.endswith(VIDEO_EXTS):
        make_video_thumb(src, dest)
    else:
        return

    storage_path = os.path.basename(dest)
    upload_to_storage(dest, storage_path)
    print(f"🖼️  {os.path.basename(src)} → {os.path.basename(dest)} (uploaded)")


def main() -> None:
    for src in iter_media_files([STATIC_PATH, *MOTION_PATHS]):
        try:
            process_media_file(src)
        except Exception as exc:
            print(f"⚠️  Failed to process {src}: {exc}")
    print("\n✅ Thumbnails generated + uploaded to Supabase Storage.")


if __name__ == "__main__":
    main()
