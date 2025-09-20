#news_aggregator/news_fetcher.py

import requests
from datetime import datetime, timedelta
from models import db, NewsSource, Article
from summarizer import summarize_text
from config import Config


def fetch_all_sources():
    """Получает список всех доступных источников новостей"""
    url = f"https://newsapi.org/v2/sources"
    params = {
        'apiKey': Config.NEWS_API_KEY,
        'language': 'ru',
        'country': 'ru'
    }

    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()

        sources_data = data.get('sources', [])

        for source_data in sources_data:
            existing_source = NewsSource.query.filter_by(
                source_id=source_data['id']).first()

            if not existing_source:
                source = NewsSource(
                    name=source_data['name'],
                    source_id=source_data['id'],
                    description=source_data.get('description', ''),
                    category=source_data.get('category', ''),
                    country=source_data.get('country', ''),
                    language=source_data.get('language', ''),
                    url=source_data.get('url', ''),
                    is_active=True
                )
                db.session.add(source)

        db.session.commit()
        return len(sources_data)

    except requests.RequestException as e:
        print(f"Ошибка при получении источников: {e}")
        return 0


def fetch_news_from_sources(source_ids=None, days_back=1):
    """Получает новости из указанных источников"""
    if not source_ids:
        sources = NewsSource.query.filter_by(is_active=True).all()
        source_ids = [source.source_id for source in sources]

    from_date = (datetime.now() - timedelta(days=days_back)).isoformat()

    url = "https://newsapi.org/v2/everything"
    params = {
        'apiKey': Config.NEWS_API_KEY,
        'sources': ','.join(source_ids),
        'from': from_date,
        'sortBy': 'publishedAt',
        'pageSize': 100
    }

    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()

        articles_data = data.get('articles', [])
        new_articles_count = 0

        for article_data in articles_data:
            # Проверяем, не существует ли уже такая статья
            existing_article = Article.query.filter_by(
                url=article_data['url']).first()

            if existing_article:
                continue

            # Находим источник в БД
            source = NewsSource.query.filter_by(
                source_id=article_data['source']['id']).first()

            if not source:
                continue

            # Создаем полный текст для суммаризации
            title = article_data.get('title', '')
            description = article_data.get('description', '')
            content = article_data.get('content', '')
            full_text = ' '.join([part for part in [title, description, content] if part])

            # Создаем сводку
            summary = ""
            if full_text.strip():
                try:
                    summary = summarize_text(full_text, sentences_count=2)
                except:
                    summary = description[:200] + "..." if description else ""

            # Парсим дату публикации
            published_at = datetime.fromisoformat(
                article_data['publishedAt'].replace('Z', '+00:00'))

            article = Article(
                title=title,
                description=description,
                content=content,
                url=article_data['url'],
                url_to_image=article_data.get('urlToImage'),
                published_at=published_at,
                source_id=source.id,
                summary=summary
            )

            db.session.add(article)
            new_articles_count += 1

        db.session.commit()
        return new_articles_count

    except requests.RequestException as e:
        print(f"Ошибка при получении новостей: {e}")
        return 0


def get_user_articles(user, page=1, per_page=20):
    """Получает статьи для пользователя на основе выбранных источников"""
    if not user.selected_sources:
        # Если пользователь не выбрал источники, показываем все
        return Article.query.order_by(Article.published_at.desc()).paginate(
            page=page, per_page=per_page, error_out=False)

    source_ids = [source.id for source in user.selected_sources]
    return Article.query.filter(Article.source_id.in_(source_ids)).order_by(
        Article.published_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False)