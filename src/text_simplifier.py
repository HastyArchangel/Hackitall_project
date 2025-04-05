def call_simplify_on_gemini_model(client, text):
    base_prompt = """Adapt the text below to be dyslexia-friendly. Follow these guidelines:
*   Use simple words and short sentences.
*   Use short paragraphs with clear breaks.
*   Focus on clarity and ease of reading. Keep the original meaning as much as you can.
*   Prioritise semantic similarity over making the text very simple, the original context shouldremain the same.
*   Reply only with the answer in plain text format. Do not provide aditional information.
"""
    query = base_prompt + "\"" + text + "\""
    return client.models.generate_content(
        model="gemini-2.5-pro-exp-03-25",
        contents=query,
    ).text
