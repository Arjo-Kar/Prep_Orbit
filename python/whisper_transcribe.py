import sys
import whisper
import warnings

warnings.filterwarnings("ignore")  # Suppress all warnings

def transcribe(file_path):
    model = whisper.load_model("small")  # or tiny/base/medium
    result = model.transcribe(file_path)
    print(result["text"])

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python whisper_transcribe.py <audio_file_path>")
        sys.exit(1)
    audio_path = sys.argv[1]
    transcribe(audio_path)