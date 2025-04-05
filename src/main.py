from google import genai
import os


os.load_dotenv()
api_key = os.environ.get("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)

response = client.models.generate_content(
    model="gemini-2.5-pro-exp-03-25",
    contents="Explain how AI works",
)

print(response.text)
