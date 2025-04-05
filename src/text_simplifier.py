def call_simplify_on_gemini_model(client, text):
    base_prompt = """**Apply these simplification rules:**
                    *   **Sentences:** Keep them medium length.
                    *   **Words:** Use simple, common words. Avoid complex ones.
                    *   **Paragraphs:** Break into short chunks. No dense blocks.
                    *   **Language:** Be direct and clear.
                    *   **Voice:** Use active voice. Avoid passive.
                    *   **Idioms:** Remove or explain them literally.
                    *   **Meaning:** Retain the core message. Aim for meaning similarity with the original. Don't lose key information.
                    **Output Instruction: Provide ONLY the rewritten text as your response. Do not include any introductory phrases, explanations, or concluding remarks.**
                    **Original Text:**"""
    query = base_prompt + "\"" + text + "\""
    return client.models.generate_content(
        model="gemini-2.0-flash",
        contents=query,
    ).text
