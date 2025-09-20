import requests

API_KEY = "06e9d18a3b5543e3be6e2500e9366a79"
URL = f"https://newsapi.org/v2/everything?q=Россия&apiKey={API_KEY}&language=ru&sortBy=publishedAt"

def fetch_news(limit=5):
    response = requests.get(URL)
    data = response.json()
    return data.get("articles", [])[:limit]
