from dotenv import load_dotenv
from flask import Flask, request, jsonify
from google import genai
import nltk
from nltk.corpus import words
import os
from sentence_transformers import SentenceTransformer

from dyslexia_scorer import dyslexia_score
from text_simplifier import call_simplify_on_gemini_model
from text_comparer import semantic_similarity

app = Flask(__name__)

# Gemini
load_dotenv()
api_key = os.environ.get("GEMINI_API_KEY")
client = genai.Client(api_key=api_key)
# Sentance Transformer
model = SentenceTransformer('paraphrase-mpnet-base-v2')
# NTKL
nltk.download('words')
word_list = set(words.words())

@app.route('/simplify', methods=['POST'])
def simplify_text():
    data = request.get_json()
    original_text = data.get('text')

    if not original_text:
        return jsonify({'error': 'Missing "text" in request body'}), 400

    original_score = dyslexia_score(word_list, original_text)

    reformulated_text = call_simplify_on_gemini_model(client, original_text)

    simplified_score = dyslexia_score(word_list, reformulated_text)

    similarity = semantic_similarity(model, original_text, reformulated_text)

    if (similarity < 0.5 or abs(original_score - simplified_score) < 0.06):
        return jsonify({
            "status": "FAILURE",
            "message": "Unable to reformulate.",
        }), 422
    else :
        return jsonify({
            "status": "SUCCESS",
            "original_text": original_text,
            "original_score": original_score,
            "reformulated_text": reformulated_text,
            "simplified_score": simplified_score,
            "semantic_similarity": similarity,
        }), 200

@app.route('/', methods=['GET'])
def home():
    return "Simplifier is live on localhost:5000"

if __name__ == '__main__':
    app.run(debug=True, use_reloader=False)
    app.run(host='127.0.0.1', port=5000)
