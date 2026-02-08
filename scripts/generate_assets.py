
import os
from PIL import Image

def generate_assets(base_path, output_dir):
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    icons_dir = os.path.join(output_dir, "icons")
    if not os.path.exists(icons_dir):
        os.makedirs(icons_dir)

    img = Image.open(base_path)

    # Sizes from vite.config.ts
    sizes = [48, 72, 96, 128, 144, 152, 192, 256, 384, 512]
    
    # Generate PWA icons
    for size in sizes:
        resized_img = img.resize((size, size), Image.Resampling.LANCZOS)
        resized_img.save(os.path.join(icons_dir, f"pwa-{size}x{size}.png"))
        print(f"Generated pwa-{size}x{size}.png")

    # Generate root PWA icons (192 and 512)
    img.resize((192, 192), Image.Resampling.LANCZOS).save(os.path.join(output_dir, "pwa-192x192.png"))
    img.resize((512, 512), Image.Resampling.LANCZOS).save(os.path.join(output_dir, "pwa-512x512.png"))
    
    # Generate Apple Touch Icon
    img.resize((180, 180), Image.Resampling.LANCZOS).save(os.path.join(output_dir, "apple-touch-icon.png"))
    
    # Generate Favicon (ico)
    img.resize((48, 48), Image.Resampling.LANCZOS).save(os.path.join(output_dir, "favicon.ico")) # Simple resize for ico
    
    # Generate OG Image (1200x630) - centered logo on dark background
    og_width, og_height = 1200, 630
    og_img = Image.new('RGB', (og_width, og_height), color='#001c3e') # Dark Blue background
    
    # Calculate position to center the logo
    logo_size = 400
    logo_resized = img.resize((logo_size, logo_size), Image.Resampling.LANCZOS)
    x = (og_width - logo_size) // 2
    y = (og_height - logo_size) // 2
    
    og_img.paste(logo_resized, (x, y), logo_resized if logo_resized.mode == 'RGBA' else None)
    og_img.save(os.path.join(output_dir, "og-image.png"))
    print("Generated og-image.png")

if __name__ == "__main__":
    base_logo = "/home/vijaykoushik/.gemini/antigravity/brain/1b42f421-469b-41fa-b57b-60b88f48263b/logo_base_1770526907343.png"
    public_dir = "/home/vijaykoushik/Evee/My Documents/GitHub/i8e10/public"
    generate_assets(base_logo, public_dir)
