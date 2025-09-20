from flask import Flask, render_template
from news_fetcher import fetch_news
from summarizer import summarize_text

app = Flask(__name__)

@app.route("/")
def index():
    articles = fetch_news(limit=30)   # лимит 30 новостей
    news_with_summary = []

    for article in articles:
        title = article.get("title", "")
        description = article.get("description", "")
        content = article.get("content", "")
        full_text = " ".join([part for part in [title, description, content] if part])

        if not full_text.strip():
            continue

        summary = summarize_text(full_text, sentences_count=2)

        news_with_summary.append({
            "title": title,
            "url": article.get("url", ""),
            "summary": summary
        })

    return render_template("index.html", articles=news_with_summary)

if __name__ == "__main__":
    app.run(debug=True)
