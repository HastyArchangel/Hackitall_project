from sentence_transformers import util

def semantic_similarity(model, text1: str, text2: str) -> float:
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
