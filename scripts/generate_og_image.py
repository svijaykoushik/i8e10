from PIL import Image, ImageDraw, ImageFont
import os

# Paths
BASE_DIR = os.getcwd()
PUBLIC_DIR = os.path.join(BASE_DIR, "public")
LOGO_PATH = os.path.join(PUBLIC_DIR, "pwa-512x512.png")
OUTPUT_PATH = os.path.join(PUBLIC_DIR, "og-image.png")

# Fonts - Noto Sans
FONT_BOLD_PATH = "/usr/share/fonts/truetype/noto/NotoSans-Bold.ttf"
FONT_LIGHT_PATH = "/usr/share/fonts/truetype/noto/NotoSans-Light.ttf"


def draw_checkmark(draw, x, y, size, color, width=4):
    """Draws a checkmark manually to avoid font issues."""
    # Points: start, mid, end
    # Start: (x, y + 50% height)
    # Mid: (x + 35% width, y + 100% height)
    # End: (x + 100% width, y)

    start = (x, y + size * 0.5)
    mid = (x + size * 0.35, y + size)
    end = (x + size, y)

    draw.line([start, mid, end], fill=color, width=width, joint="curve")


def create_og_image():
    # 1. Setup Canvas (1200x630)
    width, height = 1200, 630
    bg_color = (15, 23, 42)  # Slate-900
    img = Image.new("RGB", (width, height), bg_color)
    draw = ImageDraw.Draw(img)

    # 3. Fonts
    try:
        font_title = ImageFont.truetype(FONT_BOLD_PATH, 80)
        font_subtitle = ImageFont.truetype(FONT_LIGHT_PATH, 38)
        font_feature = ImageFont.truetype(FONT_LIGHT_PATH, 34)
    except Exception as e:
        print(f"Error loading fonts: {e}")
        font_title = ImageFont.load_default()
        font_subtitle = ImageFont.load_default()
        font_feature = ImageFont.load_default()

    # --- LEFT SIDE CONTENT ---
    # Logo
    logo_size = 200
    logo_x, logo_y = 60, 80

    if os.path.exists(LOGO_PATH):
        logo = Image.open(LOGO_PATH).convert("RGBA")
        logo = logo.resize((logo_size, logo_size), Image.Resampling.LANCZOS)
        img.paste(logo, (logo_x, logo_y), logo)

    # Title "i8·e10"
    text_x = logo_x
    text_y = logo_y + logo_size + 30
    draw.text((text_x, text_y), "i8·e10", font=font_title, fill=(255, 255, 255))

    # Tagline
    tagline_y = text_y + 110
    draw.text(
        (text_x, tagline_y),
        "Offline Expense Tracker",
        font=font_subtitle,
        fill=(148, 163, 184),
    )  # Slate-400

    # --- SEPARATOR ---
    # Move separator further right to prevent overlap with Tagline
    separator_x = 550
    draw.line(
        (separator_x, 60, separator_x, 570), fill=(51, 65, 85), width=2
    )  # Slate-700

    # --- RIGHT SIDE CONTENT ---
    features = [
        "Offline First",
        "100% Private (Local DB)",
        "Zero Ads / No Tracking",
        "Expense & Debt Tracking",
    ]

    # Move features start further right
    start_x = 600
    start_y = 140
    line_height = 80

    for i, feature in enumerate(features):
        y = start_y + (i * line_height)

        # Draw Checkmark manually
        check_size = 30
        check_color = (52, 211, 153)  # emerald-400
        # Vertically align checkmark with text
        # Approx centering based on font size 34
        draw_checkmark(draw, start_x, y + 5, check_size, check_color, width=5)

        # Feature text
        text_color = (226, 232, 240)  # Slate-200
        # Offset text by check width + padding
        draw.text((start_x + 60, y), feature, font=font_feature, fill=text_color)

    # 6. Save
    img.save(OUTPUT_PATH)
    print(f"Generated OG Image at {OUTPUT_PATH}")


if __name__ == "__main__":
    create_og_image()
