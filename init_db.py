#!/usr/bin/env python
# init_db.py - скрипт инициализации БД

import time
import sys
import os
from app import app, db
from models import User, NewsSource, Article, user_sources, user_favorites
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
                print(f"⏳ Waiting... ({i + 1}/{max_retries})")
                time.sleep(2)
            else:
                print(f"❌ Failed to connect to database: {e}")
                return False
    return False


def is_db_initialized():
    """Проверка инициализации БД"""
    try:
        with app.app_context():
            # Проверяем существование таблиц
            from sqlalchemy import inspect
            inspector = inspect(db.engine)
            tables = inspector.get_table_names()
            return 'user' in tables and 'article' in tables
    except Exception as e:
        print(f"⚠️ Error checking DB: {e}")
        return False


def cleanup_meduza():
    """Удаление источника Meduza и всех связанных статей"""
    with app.app_context():
        # Находим источник Meduza
        meduza_source = NewsSource.query.filter_by(name='Meduza').first()

        if meduza_source:
            print("🗑️ Removing Meduza source and all related articles...")

            # Находим все статьи от Meduza
            meduza_articles = Article.query.filter_by(source_id=meduza_source.id).all()

            # Удаляем связи из избранного для этих статей
            for article in meduza_articles:
                # Удаляем связи из user_favorites
                delete_stmt = user_favorites.delete().where(
                    user_favorites.c.article_id == article.id
                )
                db.session.execute(delete_stmt)

            # Удаляем все статьи Meduza
            Article.query.filter_by(source_id=meduza_source.id).delete()

            # Удаляем связи из user_sources
            delete_stmt = user_sources.delete().where(
                user_sources.c.source_id == meduza_source.id
            )
            db.session.execute(delete_stmt)

            # Удаляем сам источник
            db.session.delete(meduza_source)

            db.session.commit()
            print(f"✅ Removed Meduza source and {len(meduza_articles)} articles")
        else:
            print("ℹ️ Meduza source not found - nothing to remove")


def initialize_database():
    """Инициализация базы данных и загрузка новостей"""
    print("🚀 Starting database initialization...")

    if not wait_for_db():
        print("❌ Database not available")
        sys.exit(1)

    with app.app_context():
        if is_db_initialized():
            print("✅ Database already initialized - skipping full init")

            # УДАЛЯЕМ MEDUZA ПЕРЕД ОБНОВЛЕНИЕМ НОВОСТЕЙ
            cleanup_meduza()

            print("🔄 Updating news...")

            # Обновляем новости
            try:
                rss_count = fetch_rss_sources()
                print(f"📡 RSS: added {rss_count} articles")
            except Exception as e:
                print(f"⚠️ RSS update failed: {e}")

            try:
                # Пытаемся обновить из API, но не критично если не получится
                api_count = fetch_news_from_sources(days_back=1)
                print(f"📰 NewsAPI: added {api_count} articles")
            except Exception as e:
                print(f"⚠️ NewsAPI update failed (not critical): {e}")
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