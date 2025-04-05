import textstat


def dyslexia_score(word_list, text):
    word_score = word_difficulty_score(word_list, text)
    syntax_score = readability_score(text) / 20.0
    return round((word_score + syntax_score) / 2, 2)

def word_difficulty_score(word_list, text):
    tokens = [word for word in text.lower().split() if word.isalpha()]
    uncommon = [w for w in tokens if w not in word_list or len(w) > 8]
    return len(uncommon) / max(len(tokens), 1)

def readability_score(text):
    return textstat.flesch_kincaid_grade(text)  # Lower = easier to read
