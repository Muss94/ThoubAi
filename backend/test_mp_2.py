try:
    from mediapipe.python import solutions
    print("Found solutions in mediapipe.python")
    print(solutions.pose)
except ImportError:
    print("Could not import mediapipe.python.solutions")

try:
    import mediapipe as mp
    # Maybe it is lazy loaded?
    import mediapipe.solutions
    print("Imported mediapipe.solutions direct")
except ImportError:
    print("Failed direct import")
