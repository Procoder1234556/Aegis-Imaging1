"""
Heatmap generation using Pillow.
Draws semi-transparent bounding-box overlays on images.
"""
import io
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont


def overlay_heatmap(image_path: str, regions: list, output_path: str) -> str:
    """
    regions: list of {"bbox": [x1,y1,x2,y2] (fractions 0-1),
                       "label": str, "score": float}
    Returns output_path.
    """
    try:
        img = Image.open(image_path).convert("RGBA")
        overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(overlay)

        w, h = img.size

        for r in regions:
            bbox = r.get("bbox", [0.1, 0.1, 0.9, 0.9])
            x1, y1, x2, y2 = [
                int(bbox[0] * w), int(bbox[1] * h),
                int(bbox[2] * w), int(bbox[3] * h),
            ]
            score = r.get("score", 0.8)
            alpha = int(80 + score * 80)  # 80–160 alpha

            # Red translucent fill
            draw.rectangle([x1, y1, x2, y2], fill=(220, 38, 38, alpha))

        # Composite overlay
        out = Image.alpha_composite(img, overlay)
        out_rgb = out.convert("RGB")

        # Draw borders on top
        draw2 = ImageDraw.Draw(out_rgb)
        for r in regions:
            bbox = r.get("bbox", [0.1, 0.1, 0.9, 0.9])
            x1, y1, x2, y2 = [
                int(bbox[0] * w), int(bbox[1] * h),
                int(bbox[2] * w), int(bbox[3] * h),
            ]
            draw2.rectangle([x1, y1, x2, y2], outline=(220, 38, 38), width=3)
            label = r.get("label", "Artifact")
            score = r.get("score", 0.8)
            text = f"{label} {score:.2f}"
            draw2.text((x1 + 4, max(y1 - 20, 4)), text, fill=(220, 38, 38))

        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        out_rgb.save(output_path, quality=90)
        return output_path

    except Exception as e:
        # If image processing fails, save a placeholder
        placeholder = Image.new("RGB", (512, 512), color=(240, 240, 240))
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        placeholder.save(output_path)
        return output_path


def generate_fft_heatmap(image_bytes: bytes) -> list:
    """
    Return mock bounding boxes based on FFT-detected anomalous regions.
    In production this would use real FFT analysis.
    """
    import numpy as np

    try:
        img = Image.open(io.BytesIO(image_bytes)).convert("L")
        arr = np.array(img, dtype=float)
        f = np.fft.fft2(arr)
        fshift = np.fft.fftshift(f)
        mag = 20 * np.log(np.abs(fshift) + 1)

        # Find high-energy regions
        threshold = mag.mean() + mag.std() * 1.5
        high_energy = (mag > threshold).astype(float)

        # Return a simplified region around the energy cluster
        h, w = high_energy.shape
        cy, cx = np.unravel_index(mag.argmax(), mag.shape)
        region_size = 0.15

        return [{
            "bbox": [
                max(0, cx / w - region_size / 2),
                max(0, cy / h - region_size / 2),
                min(1, cx / w + region_size / 2),
                min(1, cy / h + region_size / 2),
            ],
            "label": "Frequency Artifact",
            "score": round(float(mag.max() / 300), 2),
        }]
    except Exception:
        return [{"bbox": [0.25, 0.25, 0.75, 0.75], "label": "Suspected Artifact", "score": 0.78}]
