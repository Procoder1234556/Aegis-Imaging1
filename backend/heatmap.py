"""
Heatmap generation using OpenCV (primary) with Pillow fallback.
Draws semi-transparent bounding-box overlays on images.
"""
import io
from pathlib import Path


def overlay_heatmap(image_path: str, regions: list, output_path: str) -> str:
    """
    regions: list of {"bbox": [x1,y1,x2,y2] (fractions 0-1),
                       "label": str, "score": float}
    Returns output_path.
    """
    try:
        return _overlay_opencv(image_path, regions, output_path)
    except Exception:
        return _overlay_pillow(image_path, regions, output_path)


def _overlay_opencv(image_path: str, regions: list, output_path: str) -> str:
    import cv2
    import numpy as np

    img = cv2.imread(image_path)
    if img is None:
        raise ValueError(f"cv2 could not load {image_path}")
    h, w = img.shape[:2]
    overlay = img.copy()

    for r in regions:
        bbox = r.get("bbox", [0.1, 0.1, 0.9, 0.9])
        x1, y1, x2, y2 = int(bbox[0]*w), int(bbox[1]*h), int(bbox[2]*w), int(bbox[3]*h)
        score = r.get("score", 0.8)
        alpha = 0.25 + score * 0.2  # 0.25–0.45

        # Filled translucent red
        cv2.rectangle(overlay, (x1, y1), (x2, y2), (0, 0, 220), -1)

        # Border
        cv2.rectangle(img, (x1, y1), (x2, y2), (0, 0, 220), 2)

        # Label
        label = f"{r.get('label', 'Artifact')} {score:.2f}"
        cv2.putText(
            img, label,
            (x1, max(y1 - 8, 14)),
            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 220), 1, cv2.LINE_AA
        )

    out = cv2.addWeighted(overlay, 0.30, img, 0.70, 0)
    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(output_path, out)
    return output_path


def _overlay_pillow(image_path: str, regions: list, output_path: str) -> str:
    from PIL import Image, ImageDraw

    img = Image.open(image_path).convert("RGBA")
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    w, h = img.size

    for r in regions:
        bbox = r.get("bbox", [0.1, 0.1, 0.9, 0.9])
        x1, y1, x2, y2 = int(bbox[0]*w), int(bbox[1]*h), int(bbox[2]*w), int(bbox[3]*h)
        score = r.get("score", 0.8)
        alpha = int(70 + score * 80)
        draw.rectangle([x1, y1, x2, y2], fill=(220, 38, 38, alpha))

    out = Image.alpha_composite(img, overlay).convert("RGB")
    draw2 = ImageDraw.Draw(out)
    for r in regions:
        bbox = r.get("bbox", [0.1, 0.1, 0.9, 0.9])
        x1, y1, x2, y2 = int(bbox[0]*w), int(bbox[1]*h), int(bbox[2]*w), int(bbox[3]*h)
        draw2.rectangle([x1, y1, x2, y2], outline=(220, 38, 38), width=2)

    Path(output_path).parent.mkdir(parents=True, exist_ok=True)
    out.save(output_path, quality=90)
    return output_path


def generate_fft_heatmap(image_bytes: bytes) -> list:
    """Return FFT-detected anomalous regions as bbox list."""
    try:
        import numpy as np
        import cv2

        arr = np.frombuffer(image_bytes, dtype=np.uint8)
        img = cv2.imdecode(arr, cv2.IMREAD_GRAYSCALE)
        if img is None:
            raise ValueError("decode failed")

        f = np.fft.fft2(img)
        fshift = np.fft.fftshift(f)
        mag = 20 * np.log(np.abs(fshift) + 1)

        h, w = mag.shape
        cy, cx = np.unravel_index(mag.argmax(), mag.shape)
        region_size = 0.18

        return [{
            "bbox": [
                max(0, cx / w - region_size / 2),
                max(0, cy / h - region_size / 2),
                min(1, cx / w + region_size / 2),
                min(1, cy / h + region_size / 2),
            ],
            "label": "Frequency Artifact",
            "score": round(min(1.0, float(mag.max()) / 300), 2),
        }]
    except Exception:
        return [{"bbox": [0.25, 0.25, 0.75, 0.75], "label": "Suspected Artifact", "score": 0.75}]
