import os
from PIL import Image
from pillow_heif import register_heif_opener

# Register HEIF opener with Pillow
register_heif_opener()

def convert_heic_to_jpg(file_path):
    """
    Converts a HEIC/HEIF file to JPEG.
    If the file is already a JPEG or PNG, it returns the original path.
    """
    filename, ext = os.path.splitext(file_path)
    if ext.lower() in ['.heic', '.heif']:
        try:
            image = Image.open(file_path)
            new_path = filename + ".jpg"
            image.convert("RGB").save(new_path, "JPEG", quality=95)
            # Optionally remove the original HEIC file
            # os.remove(file_path)
            return new_path
        except Exception as e:
            print(f"Error converting HEIC: {e}")
            return file_path
    return file_path
