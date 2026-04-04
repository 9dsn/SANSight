import os
import zipfile
from pathlib import Path

import cv2
import numpy as np

DATA_DIR = Path(__file__).resolve().parent 
SANS_DIR = DATA_DIR / "SANS"
NORMAL_DIR = DATA_DIR / "Normal"
SANS_CLEAN_DIR = DATA_DIR / "SANS_clean"
NORMAL_CLEAN_DIR = DATA_DIR / "Normal_clean"

IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg"}


def unzip_normal_zip():
    zip_path = NORMAL_DIR / "Normal.zip"
    if not zip_path.exists():
        return

    with zipfile.ZipFile(zip_path, "r") as zf:
        zf.extractall(NORMAL_DIR)


def find_normal_source_dir():
    unzip_normal_zip()
    candidate_dirs = [
        p for p in NORMAL_DIR.rglob("*") if p.is_dir() and p.name.lower() == "normal"
    ]
    if candidate_dirs:
        return sorted(candidate_dirs, key=lambda p: len(str(p)))[0]
    return NORMAL_DIR


def is_image_file(path: Path) -> bool:
    return path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS


def load_image(path: Path):
    image = cv2.imdecode(np.fromfile(str(path), dtype=np.uint8), cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError("corrupt or unsupported image")
    return image


def validate_image(image: np.ndarray, path: Path):
    h, w = image.shape[:2]
    if h < 100 or w < 100:
        raise ValueError("too small")

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    mean_brightness = float(np.mean(gray))
    if mean_brightness < 20:
        raise ValueError("too dark")
    if mean_brightness > 235:
        raise ValueError("overexposed")

    return mean_brightness


def crop_black_border(image: np.ndarray) -> np.ndarray:
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    _, mask = cv2.threshold(gray, 10, 255, cv2.THRESH_BINARY)
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
    contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return image

    largest = max(contours, key=cv2.contourArea)
    x, y, w, h = cv2.boundingRect(largest)
    if w < 100 or h < 100:
        return image

    cropped = image[y : y + h, x : x + w]
    if cropped.size == 0:
        return image
    return cropped


def enhance_contrast(image: np.ndarray) -> np.ndarray:
    lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l = clahe.apply(l)
    lab = cv2.merge((l, a, b))
    return cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)


def resize_image(image: np.ndarray, size=(512, 512)) -> np.ndarray:
    return cv2.resize(image, size, interpolation=cv2.INTER_LANCZOS4)


def save_image(path: Path, image: np.ndarray):
    path.parent.mkdir(parents=True, exist_ok=True)
    if not cv2.imwrite(str(path), image):
        raise IOError("failed to write image")


def process_dataset(source_dir: Path, output_dir: Path):
    stats = {
        "saved": 0,
        "rejected": 0,
        "reasons": {},
    }

    source_paths = sorted(source_dir.rglob("*"), key=lambda p: str(p))
    for path in source_paths:
        if not is_image_file(path):
            continue

        target_path = output_dir / path.name
        try:
            image = load_image(path)
            validate_image(image, path)
            image = crop_black_border(image)
            image = enhance_contrast(image)
            image = resize_image(image)
            save_image(target_path, image)
            stats["saved"] += 1
        except Exception as exc:
            reason = str(exc)
            stats["rejected"] += 1
            stats["reasons"][reason] = stats["reasons"].get(reason, 0) + 1

    return stats


def print_summary(name: str, stats: dict):
    print(f"\n{name} summary:")
    print(f"  saved: {stats['saved']}")
    print(f"  rejected: {stats['rejected']}")
    for reason, count in sorted(stats["reasons"].items(), key=lambda item: (-item[1], item[0])):
        print(f"    {reason}: {count}")


def main():
    if not SANS_DIR.exists():
        raise FileNotFoundError(f"Missing dataset folder: {SANS_DIR}")
    if not NORMAL_DIR.exists():
        raise FileNotFoundError(f"Missing dataset folder: {NORMAL_DIR}")

    normal_source = find_normal_source_dir()
    print(f"Using Normal source directory: {normal_source}")

    sans_stats = process_dataset(SANS_DIR, SANS_CLEAN_DIR)
    normal_stats = process_dataset(normal_source, NORMAL_CLEAN_DIR)

    print_summary("SANS", sans_stats)
    print_summary("Normal", normal_stats)


if __name__ == "__main__":
    main()
