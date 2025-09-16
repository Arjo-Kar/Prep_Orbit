import sys
import whisper
import warnings

warnings.filterwarnings("ignore")  # Suppress warnings

def transcribe(file_path):
    model = whisper.load_model("small")
    result = model.transcribe(file_path)
    # Encode to UTF-8 and decode to avoid Windows console issues
    print(result["text"].encode('utf-8', errors='ignore').decode('utf-8'))

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python whisper_transcribe.py <audio_file_path>")
        sys.exit(1)
    audio_path = sys.argv[1]
    transcribe(audio_path)
