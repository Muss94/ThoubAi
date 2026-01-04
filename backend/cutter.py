import mediapipe as mp
import cv2
import numpy as np
import math

class Cutter:
    def __init__(self):
        self.mp_pose = mp.solutions.pose
        self._pose = None

    @property
    def pose(self):
        if self._pose is None:
            print("INFO: Loading MediaPipe Pose model...")
            self._pose = self.mp_pose.Pose(
                static_image_mode=True,
                model_complexity=2,
                enable_segmentation=True,
                min_detection_confidence=0.5
            )
        return self._pose

    def process(self, image_content: bytes, true_height_cm: float, fit_type: str = "Standard"):
        # Decode image
        nparr = np.frombuffer(image_content, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if image is None:
            raise ValueError("Could not decode image")

        image_height, image_width, _ = image.shape
        
        # Run MediaPipe Pose
        results = self.pose.process(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))
        
        if not results.pose_landmarks:
            print("Warning: No pose detected. Using fallback/mock measurements for testing.")
            # For testing/MVP robustness, return estimated based on height alone
            # Standard human ratios
            return {
                "measurements": {
                    "thobe_length": round(true_height_cm * 0.8, 1),
                    "shoulder_width": round(true_height_cm * 0.25, 1),
                    "sleeve_length": round(true_height_cm * 0.35, 1),
                    "chest_circumference": round(true_height_cm * 0.55, 1),
                    "neck_circumference": 40.0,
                    "wrist_circumference": 18.0
                },
                "fit_type": fit_type,
                "note": "Estimated from height (No pose detected)"
            }
            # raise ValueError("No pose detected in image")

        landmarks = results.pose_landmarks.landmark

        # Get key landmark coordinates (normalized 0-1)
        # 11: left_shoulder, 12: right_shoulder
        # 23: left_hip, 24: right_hip
        # 25: left_knee, 26: right_knee
        # 27: left_ankle, 28: right_ankle
        # 29: left_heel, 30: right_heel
        # 15: left_wrist, 16: right_wrist
        # 0: nose, 7: left_ear, 8: right_ear

        def get_pt(idx):
            return (landmarks[idx].x * image_width, landmarks[idx].y * image_height)

        l_shoulder = get_pt(11)
        r_shoulder = get_pt(12)
        l_wrist = get_pt(15)
        r_wrist = get_pt(16)
        l_ankle = get_pt(27)
        r_ankle = get_pt(28)
        l_heel = get_pt(29)
        r_heel = get_pt(30)
        nose = get_pt(0)
        l_ear = get_pt(7)
        r_ear = get_pt(8)

        # --- 1. Height Calibration ---
        # Estimate Head Top: Use nose and ears to guess top of head (approx)
        # Heuristic: Top is above nose by (Nose - MidShoulder) * 0.5? 
        # Simpler: Min Y of face landmarks minus a small buffer.
        min_face_y = min(nose[1], l_ear[1], r_ear[1])
        # Estimate heel level (lowest point of feet)
        max_foot_y = max(l_heel[1], r_heel[1], l_ankle[1], r_ankle[1])

        # We assume the user's input height corresponds to (Head Top to Heel Bottom)
        # Since we can't see the top of head perfectly, let's assume the face top landmarks are ~10cm from top of head in real life?
        # A safer approach for "PixelsPerCM":
        # User Height maps to the pixel distance between HeadTop and Heel.
        # Let's estimate pixel height of person.
        # Head Top Y estimate: Nose Y - (MeanShoulder Y - Nose Y) * 0.8 (Neck+Head ratio)
        avg_shoulder_y = (l_shoulder[1] + r_shoulder[1]) / 2
        head_height_est_pixels = (avg_shoulder_y - nose[1]) * 2.0 # Crude approximation
        top_head_y = nose[1] - (head_height_est_pixels * 0.5) 

        person_pixel_height = max_foot_y - top_head_y
        
        if person_pixel_height <= 0:
             raise ValueError("Invalid pose detection (negative height)")

        pixels_per_cm = person_pixel_height / true_height_cm

        def dist(p1, p2):
            return math.hypot(p1[0] - p2[0], p1[1] - p2[1]) / pixels_per_cm

        # --- 2. Raw Body Measurements ---
        
        # Shoulder Width (Acromion to Acromion)
        shoulder_width = dist(l_shoulder, r_shoulder)

        # Sleeve Length (Shoulder to Wrist)
        # Average of left and right
        sleeve_l = dist(l_shoulder, l_wrist)
        sleeve_r = dist(r_shoulder, r_wrist)
        sleeve_length_raw = (sleeve_l + sleeve_r) / 2

        # Total Length (Neck/Shoulder to Ankle)
        # Midpoint of shoulders (roughly C7 level projected) to Midpoint of ankles
        mid_shoulder = ((l_shoulder[0] + r_shoulder[0])/2, (l_shoulder[1] + r_shoulder[1])/2)
        mid_ankle = ((l_ankle[0] + r_ankle[0])/2, (l_ankle[1] + r_ankle[1])/2)
        body_length = dist(mid_shoulder, mid_ankle)

        # Chest (Estimate roughly from shoulder width or landmarks?)
        # MediaPipe doesn't give 3D circumference nicely.
        # Heuristic from flat image: Chest Width usually ~ Shoulder Width * 0.8? OR use mesh segmentation if available.
        # For this prototype, we will use a heuristic based on Shoulder Width for "Chest Width" * 2 * factor approx?
        # Better: Chest Width is roughly distance between armpits (landmark 11, 12 is acromion, armpit slightly inside/lower).
        # Let's assume Chest Circumference ~ Shoulder Width * 2.5 (Very rough) or rely on user input? 
        # PRD says "AI must explicitly calculate". 
        # We will use width at chest level * PI/1.5 (flattened cylinder assumption).
        # Chest level is below shoulders. 11-12 is width. 
        chest_width = dist(l_shoulder, r_shoulder) # Using shoulder width as proxy for chest width at wide point?
        chest_circ_raw = chest_width * 2.2 # Heuristic.

        # --- 3. Ease Logic (Thoub Specific) ---
        # Rule: Final Chest = Raw + Ease (10-12 Std, 6-8 Slim)
        # Rule: Final Length = Body Length + NeckHeight? - 1cm
        
        ease_chest = 12 if fit_type == "Standard" else 8
        final_chest = chest_circ_raw + ease_chest
        
        # Sleeve + 2cm for cuff drop
        final_sleeve = sleeve_length_raw + 2.0

        # Length: Neck to Ankle. Our body_length is MidShoulder to MidAnkle.
        # C7 is slightly above mid-shoulder line usually.
        # Let's add 2cm to body_length to account for C7 height?
        # And subtract 1cm for "no drag".
        final_length = (body_length + 2.0) - 1.0

        return {
            "measurements": {
                "shoulder_width": round(shoulder_width, 1),
                "sleeve_length": round(final_sleeve, 1),
                "chest_circumference": round(final_chest, 1),
                "thobe_length": round(final_length, 1),
                "neck_circumference": 40.0, # Placeholder/Hard to measure from pose only, requires fallback
                "wrist_circumference": 22.0 # Placeholder
            },
            "debug": {
                "pixels_per_cm": pixels_per_cm,
                "fit_type": fit_type,
                "raw_height_pixels": person_pixel_height
            }
        }
