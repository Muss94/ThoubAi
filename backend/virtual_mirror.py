import google.generativeai as genai
import os
from dotenv import load_dotenv

# Load env variables if .env file exists
load_dotenv()

class NeuralMirror:
    def __init__(self):
        self._model = None
        self.system_instruction = """
(Masterpiece, best quality, 8k, UHD:1.3), hyper-realistic portrait of a male model (Image of model will be attached) using the attached image of the model, wearing a (luxurious straight Thoub:1.2), crisp tailoring, expensive fabric texture, standing against a (clean light brown beige najdi home background:1.1), fashion photography, Gucci and Hermes advertising style, quiet luxury, studio lighting, soft shadows, (hyper-detailed skin texture, visible pores, realistic complexion:1.4), intense eyes, shot on 85mm lens, f/1.8, cinematic lighting, sharp focus. Full body image.

Recommended Settings for Realism:
Sampler: DPM++ 2M Karras or Euler A
Steps: 25-40
CFG Scale: 3.0 - 5.0 (Keep it low for photorealism; high CFG burns the skin texture).
Resolution: 1024x1536 (Portrait)

Input 1: (image of model to be used)
Input 2: (Colour of the Thoub)
Input 3: Type of collar 

only use attached model images.
            """

    @property
    def model(self):
        if self._model is None:
            api_key = os.environ.get("GEMINI_API_KEY")
            if api_key:
                print("INFO: Initializing Gemini model...")
                genai.configure(api_key=api_key)
                try:
                    self._model = genai.GenerativeModel(
                        model_name='models/nano-banana-pro-preview',
                        system_instruction=self.system_instruction
                    )
                except Exception as e:
                    print(f"Error init custom model: {e}. Fallback to Flash.")
                    self._model = genai.GenerativeModel('gemini-2.0-flash')
            else:
                print("Warning: GEMINI_API_KEY not found.")
        return self._model

    def generate_try_on(self, image_path: str, texture_id: str, pattern_id: str, style_config: str, closure_type: str, has_pocket: bool, extra_details: str, front_image_id: str = "custom_thoub", supabase_client=None, bucket_name="thoub-images"):
        if not self.model:
            # Fallback to Mock if no key
            return {
                "image_url": "/thoub_mock_white.png", 
                "description": "Mock description: Please set GEMINI_API_KEY."
            }
            
        try:
            # 1. Upload/Load image for Gemini
            print(f"Analyzing image: {image_path}")
            # Explicitly set mime_type to fix 'Unknown mime type' error
            sample_file = genai.upload_file(path=image_path, display_name="User Image", mime_type="image/jpeg")
            print(f"Uploaded file: {sample_file.uri}")

            # 2. Construct User Input with Rich Descriptions
            
            # Mapping dictionaries for better semantic understanding
            COLOR_MAP = {
                "fabric_white": "Pristine white fabric with a subtle silk-like sheen",
                "fabric_cream": "Warm desert cream beige fabric, soft and luxurious",
                "fabric_grey": "Sophisticated slate grey fabric with a professional matte finish",
                "fabric_black": "Deep midnight black fabric, high-density and premium",
                "fabric_blue": "Regal royal blue fabric, vibrant and elegant",
                "fabric_purple": "Rich deep purple plum fabric, bold and bespoke"
            }
            
            PATTERN_MAP = {
                "solid": "Solid weave with smooth texture",
                "pinstripe": "Subtle, narrow pinstripe weave for a tailored look",
                "checkered": "Elegant fine checkered pattern weave"
            }
            
            STYLE_MAP = {
                "saudi_collar": "Traditional Saudi-style standing collar, crisp and structured",
                "kuwaiti_collar": "Classic Kuwaiti-style medium-height collar with refined stitching",
                "emirati_collar": "Minimalist Emirati-style collarless design with clean neckline",
                "round_collar": "Modern round neckline, soft and contemporary",
                "official_collar": "Formal official-style high collar, sharp and authoritative"
            }

            color_desc = COLOR_MAP.get(texture_id, texture_id)
            pattern_desc = PATTERN_MAP.get(pattern_id, pattern_id)
            style_desc = STYLE_MAP.get(style_config, style_config)
            pocket_str = "with a premium chest pocket" if has_pocket else "without any chest pocket"
            
            user_prompt = f"""
            Input 2 (Color & Fabric): {color_desc}
            Input 3 (Collar Architecture): {style_desc}. {extra_details}
            Input 4 (Weave Pattern): {pattern_desc}
            Input 5 (Refined Details): {closure_type} closure system, {pocket_str}.
            
            Maintain the exact proportions and features of the model in the image.
            """
            
            print(f"Sending prompt to Gemini: {user_prompt.strip()}")
            
            # 3. Generate Content with Safety Settings & Retries
            import time
            
            safety_settings = [
                {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE"},
                {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
                {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE"},
            ]

            max_retries = 3
            retry_delay = 2 # seconds
            
            response = None
            last_error = ""

            for attempt in range(max_retries):
                try:
                    print(f"AI Generation Attempt {attempt + 1}/{max_retries}...")
                    response = self.model.generate_content(
                        [sample_file, user_prompt],
                        safety_settings=safety_settings
                    )
                    break # Success!
                except Exception as e:
                    last_error = str(e)
                    print(f"Attempt {attempt + 1} failed: {last_error}")
                    if attempt < max_retries - 1:
                        time.sleep(retry_delay * (attempt + 1))
                    else:
                        raise e # Final attempt failed

            description = ""
            image_url = None

            try:
                # Check for standard text
                if response and response.text:
                    description = response.text
            except Exception as text_err:
                print(f"Post-Generation Response Notice: {text_err}")
                description = "Design analysis complete."
                
            # Check parts for images
            if hasattr(response, 'parts'):
                for part in response.parts:
                    if hasattr(part, 'text') and part.text:
                        description += part.text
                    if hasattr(part, 'inline_data') and part.inline_data:
                        # It's an image!
                        print("Image generated by NanoBanana!")
                        image_data = part.inline_data.data
                        
                        # Generate a truly unique path for the image
                        import time
                        import uuid
                        # Use a clean base for the ID, removing URL parts if present
                        base_id = front_image_id.split('/')[-1].split('?')[0].split('.')[0]
                        timestamp = int(time.time() * 1000) # Millisecond precision
                        unique_id = str(uuid.uuid4())[:8] # Add a short UUID for absolute uniqueness
                        output_filename = f"gen_{base_id}_{timestamp}_{unique_id}.png"
                        
                        if supabase_client:
                            # Upload to Supabase
                            supabase_client.storage.from_(bucket_name).upload(
                                path=output_filename,
                                file=image_data,
                                file_options={"upsert": "true", "content-type": "image/png"}
                            )
                            image_url = supabase_client.storage.from_(bucket_name).get_public_url(output_filename)
                        else:
                            # Save locally for development
                            BASE_DIR = os.path.dirname(os.path.abspath(__file__))
                            output_path = os.path.abspath(os.path.join(BASE_DIR, "..", "frontend", "public", output_filename))
                            os.makedirs(os.path.dirname(output_path), exist_ok=True)
                            with open(output_path, "wb") as f:
                                f.write(image_data)
                            image_url = f"/{output_filename}"
                            
                        description += " [Image Generated]"

            if not image_url:
                 raise Exception("Gemini completed but did not produce an image. Please check your prompt or try again.")

            print("Gemini Analysis Complete.")
            
            return {
                "image_url": image_url, 
                "description": description if description else "Generated successfully."
            }

        except Exception as e:
            print(f"Gemini Error: {e}")
            # Instead of fallback, return the actual error
            return {
                 "image_url": None, 
                 "error": str(e),
                 "description": f"AI Generation failed: {str(e)}"
            }
