from sentence_transformers import SentenceTransformer, util

# Load the model once (keep this global for performance)
model = SentenceTransformer('paraphrase-mpnet-base-v2')

def semantic_similarity(text1: str, text2: str) -> float:
    """
    Computes semantic similarity between two pieces of text using Sentence-BERT.

    Args:
        text1 (str): Original or complex text
        text2 (str): Simplified or paraphrased version

    Returns:
        float: Similarity score between 0.0 and 1.0
    """
    embedding1 = model.encode(text1, convert_to_tensor=True)
    embedding2 = model.encode(text2, convert_to_tensor=True)

    similarity = util.pytorch_cos_sim(embedding1, embedding2)

    return float(similarity.item())


def test_similarity_on_examples():
    sentence_pairs = [
        ("The cat was sitting on the mat.", "The kitty was resting on the carpet."),
        ("He quickly ran to the store before it closed.", "He hurried to the shop before it shut."),
        ("I'm going to start cooking dinner now.", "I'll begin making dinner now."),
        ("The weather is nice today.", "Today’s weather is pleasant."),
        ("She didn't like the movie.", "She wasn't a fan of the film."),
        ("They decided to cancel the meeting.", "The meeting was called off by them."),
        ("I need to finish this project soon.", "This project must be completed quickly."),
        ("He plays the guitar very well.", "He's really good at playing guitar."),
        ("The exam was extremely difficult.", "The test was really hard."),
        ("She enjoys going for long walks.", "She likes taking long strolls.")
    ]

    print("🧪 Testing Semantic Similarity Scores:\n")
    for i, (text1, text2) in enumerate(sentence_pairs, 1):
        embedding1 = model.encode(text1, convert_to_tensor=True)
        embedding2 = model.encode(text2, convert_to_tensor=True)
        similarity = util.pytorch_cos_sim(embedding1, embedding2).item()
        print(f"{i}. \"{text1}\" ⬌ \"{text2}\"\n   → Similarity Score: {similarity:.3f}\n")

print(test_similarity_on_examples())
