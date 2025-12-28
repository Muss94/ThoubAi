from PIL import Image, ImageDraw, ImageFont
import os

def create_mock_thoub():
    # Create a white image (Thoub color)
    img = Image.new('RGB', (600, 800), color='#FDFDFD')
    d = ImageDraw.Draw(img)
    
    # Draw a simple "Thobe" outline or just text
    # Since we can't draw a perfect thobe easily, let's make it look like a placeholder
    # Draw a V-neck line
    d.line([(250, 50), (300, 100), (350, 50)], fill='#D4AF37', width=5)
    
    # Draw "generated" text
    try:
        # Try to load a font, else default
        font = ImageFont.load_default()
    except:
        font = None
        
    d.text((200, 400), "THOUB-AI PREVIEW", fill='#000000')
    
    # Save to frontend public dir
    output_path = "/Users/mussa/Library/CloudStorage/GoogleDrive-m@invari.tech/Shared drives/Invari/Anti Gravity Projects/thoub-ai/frontend/public/thoub_mock_white.png"
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    img.save(output_path)
    print(f"Saved mock to {output_path}")

if __name__ == "__main__":
    create_mock_thoub()
