# /cursor/agents/visual_inspector.py
# Automated brand compliance checker for image & video assets

import cv2
import numpy as np
import os
import datetime
import json
from colorthief import ColorThief
from PIL import Image, ImageStat

ASSETS_DIR = "./assets"
LOG_PATH = "./logs/visual_inspector_log.json"

# Brand palette (RGB)
BRAND_COLORS = {
    "matte_black": (10, 10, 10),
    "gold_foil": (212, 175, 55),
    "neon_teal": (0, 255, 209)
}

TOLERANCE = 40  # allowable RGB variance

def color_match(sample, target, tolerance):
    return all(abs(sample[i] - target[i]) <= tolerance for i in range(3))

def inspect_image(file_path):
    image = Image.open(file_path).convert("RGB")
    stat = ImageStat.Stat(image)
    avg_color = tuple(map(int, stat.mean))

    thief = ColorThief(file_path)
    dominant = thief.get_color(quality=1)

    matches = {
        "matte_black": color_match(dominant, BRAND_COLORS["matte_black"], TOLERANCE),
        "gold_foil": color_match(dominant, BRAND_COLORS["gold_foil"], TOLERANCE),
        "neon_teal": color_match(dominant, BRAND_COLORS["neon_teal"], TOLERANCE)
    }

    compliance = any(matches.values())
    return {
        "filename": os.path.basename(file_path),
        "dominant_color": dominant,
        "matches": matches,
        "compliant": compliance,
        "timestamp": datetime.datetime.utcnow().isoformat()
    }

def run_visual_inspector():
    results = []
    for root, _, files in os.walk(ASSETS_DIR):
        for f in files:
            if f.lower().endswith((".png", ".jpg", ".jpeg")):
                full_path = os.path.join(root, f)
                result = inspect_image(full_path)
                results.append(result)
                print(f"✅ {f} → Compliant: {result['compliant']}")
    os.makedirs(os.path.dirname(LOG_PATH), exist_ok=True)
    with open(LOG_PATH, "w") as log_file:
        json.dump(results, log_file, indent=2)
    print("📘 Visual Inspection complete. Log saved at:", LOG_PATH)

if __name__ == "__main__":
    run_visual_inspector()
