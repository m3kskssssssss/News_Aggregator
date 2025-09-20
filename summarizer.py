import nltk
from sumy.parsers.plaintext import PlaintextParser
from sumy.nlp.tokenizers import Tokenizer
from sumy.summarizers.lsa import LsaSummarizer

# Грузим токенизаторы (один раз)
nltk.download("punkt")
nltk.download("punkt_tab")

def summarize_text(text, sentences_count=2):
    parser = PlaintextParser.from_string(text, Tokenizer("russian"))
    summarizer = LsaSummarizer()
    summary = summarizer(parser.document, sentences_count)
    return " ".join(str(sentence) for sentence in summary)