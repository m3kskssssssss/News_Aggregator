#!/usr/bin/env python
# init_db.py - скрипт инициализации БД

import time
import sys
from app import app, db
from models import User, NewsSource, Article
from rss_fetcher import fetch_rss_sources
from news_fetcher import fetch_all_sources, fetch_news_from_sources

def wait_for_db():
    """Ожидание готовности PostgreSQL"""
    print("🔄 Waiting for PostgreSQL...")
    max_retries = 30
    for i in range(max_retries):
        try:
            with app.app_context():
                db.engine.connect()
            print("✅ PostgreSQL is ready!")
            return True
        except Exception as e:
            if i < max_retries - 1:
                time.sleep(1)
            else:
                print(f"❌ Failed to connect to database: {e}")
                return False
    return False

def is_db_initialized():
    """Проверка инициализации БД"""
    try:
        with app.app_context():
            User.query.count()
        return True
    except:
        return False

def initialize_database():
    """Инициализация базы данных и загрузка новостей"""
    print("🚀 Starting database initialization...")
    
    if not wait_for_db():
        sys.exit(1)
    
    with app.app_context():
        if is_db_initialized():
            print("✅ Database already initialized - skipping init")
            print("🔄 Updating news...")
            
            # Обновляем новости
            try:
                rss_count = fetch_rss_sources()
                print(f"📡 RSS: added {rss_count} articles")
            except Exception as e:
                print(f"⚠️ RSS update failed: {e}")
            
            try:
                api_count = fetch_news_from_sources(days_back=1)
                print(f"📰 NewsAPI: added {api_count} articles")
            except Exception as e:
                print(f"⚠️ NewsAPI update failed: {e}")
        else:
            print("🆕 First run detected - full initialization...")
            
            # Создаем таблицы
            print("📊 Creating database tables...")
            db.create_all()
            print("✅ Tables created")
            
            # Загружаем RSS новости
            print("📡 Fetching RSS news...")
            try:
                rss_count = fetch_rss_sources()
                print(f"✅ RSS: loaded {rss_count} articles")
            except Exception as e:
                print(f"⚠️ RSS failed: {e}")
            
            # Загружаем источники из NewsAPI
            print("🌐 Fetching sources from NewsAPI...")
            try:
                sources_count = fetch_all_sources()
                print(f"✅ NewsAPI sources: loaded {sources_count}")
            except Exception as e:
                print(f"⚠️ NewsAPI sources failed: {e}")
            
            # Загружаем новости из NewsAPI
            print("📰 Fetching news from NewsAPI...")
            try:
                news_count = fetch_news_from_sources(days_back=2)
                print(f"✅ NewsAPI news: loaded {news_count} articles")
            except Exception as e:
                print(f"⚠️ NewsAPI news failed: {e}")
            
            print("🎉 Initialization complete!")

if __name__ == "__main__":
    initialize_database()