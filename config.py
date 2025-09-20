#news_aggregator/config.py

import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'your-secret-key-here'
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'postgresql://postgres:password@localhost/news_aggregator'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    NEWS_API_KEY = os.environ.get('NEWS_API_KEY') or '06e9d18a3b5543e3be6e2500e9366a79'
    POSTS_PER_PAGE = 20

