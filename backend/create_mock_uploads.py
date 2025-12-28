from PIL import Image, ImageDraw, ImageFont
import os

def create_mock_thoub():
    # Create a white image (Thoub color)
    img = Image.new('RGB', (600, 800), color='#FDFDFD')
    d = ImageDraw.Draw(img)
    d.line([(250, 50), (300, 100), (350, 50)], fill='#D4AF37', width=5)
    d.text((200, 400), "THOUB-AI TEST IMAGE", fill='#000000')
    
    # Save to uploads dir for backend test
    output_path = "uploads/test_mock.png"
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    img.save(output_path)
    print(f"Saved mock to {output_path}")

if __name__ == "__main__":
    create_mock_thoub()
