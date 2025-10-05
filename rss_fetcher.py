import feedparser
import requests
from datetime import datetime


def fetch_rss_sources():
    """RSS источники русских новостей"""
    # Импортируем здесь чтобы избежать циклических импортов
    from models import db, NewsSource, Article
    from summarizer import summarize_text

    rss_sources = [
        {
            'name': 'Lenta.ru',
            'url': 'https://lenta.ru/rss/news',
            'category': 'general'
        },
        {
            'name': 'RBC',
            'url': 'https://rssexport.rbc.ru/rbcnews/news/20/full.rss',
            'category': 'general'
        },
        {
            'name': 'Kommersant',
            'url': 'https://www.kommersant.ru/RSS/main.xml',
            'category': 'business'
        },
        {
            'name': 'Lenta.ru',
            'url': 'https://lenta.ru/rss/news',
            'category': 'general'
        },
        {
            'name': 'Gazeta.ru',
            'url': 'https://www.gazeta.ru/export/rss/lenta.xml',
            'category': 'general'
        },
        {
            'name': 'Vedomosti',
            'url': 'https://www.vedomosti.ru/rss/news',
            'category': 'business'
        },
        {
            'name': 'Sport Express',
            'url': 'https://www.sport-express.ru/services/materials/rss/',
            'category': 'sports'
        },
        {
            'name': 'Interfax',
            'url': 'https://www.interfax.ru/rss.asp',
            'category': 'general'
        }
    ]

    total_new = 0

    for rss_data in rss_sources:
        try:
            print(f"🔄 Загружаем RSS: {rss_data['name']} - {rss_data['url']}")

            # Парсим RSS с timeout
            feed = feedparser.parse(rss_data['url'])

            if not feed.entries:
                print(f"❌ RSS {rss_data['name']}: нет статей в ленте")
                continue

            print(f"📄 RSS {rss_data['name']}: найдено {len(feed.entries)} статей в ленте")

            # Создать источник если не существует
            source = NewsSource.query.filter_by(name=rss_data['name']).first()
            if not source:
                source = NewsSource(
                    name=rss_data['name'],
                    source_id=rss_data['name'].lower().replace('.', '_').replace(' ', '_'),
                    category=rss_data['category'],
                    language='ru',
                    country='ru',
                    is_active=True
                )
                db.session.add(source)
                db.session.commit()
                print(f"✅ Создан новый источник: {rss_data['name']}")

            # Загрузить статьи из RSS
            new_articles = 0
            for i, entry in enumerate(feed.entries[:20]):  # Первые 20 статей
                if not hasattr(entry, 'link') or not entry.link:
                    print(f"⚠️  Статья {i + 1}: нет ссылки")
                    continue

                existing = Article.query.filter_by(url=entry.link).first()
                if existing:
                    continue

                # Создаем сводку
                title = getattr(entry, 'title', 'Без заголовка')
                description = getattr(entry, 'description', '')
                summary = ""

                if description:
                    try:
                        # Убираем HTML теги
                        import re
                        clean_desc = re.sub(r'<[^>]+>', '', description)
                        summary = summarize_text(clean_desc, sentences_count=1)
                    except Exception as e:
                        print(f"⚠️  Ошибка суммаризации: {e}")
                        summary = description[:200] + "..." if len(description) > 200 else description

                # Парсим дату
                published_at = datetime.now()
                if hasattr(entry, 'published_parsed') and entry.published_parsed:
                    try:
                        published_at = datetime(*entry.published_parsed[:6])
                    except Exception as e:
                        print(f"⚠️  Ошибка парсинга даты: {e}")

                article = Article(
                    title=title,
                    description=description,
                    url=entry.link,
                    published_at=published_at,
                    source_id=source.id,
                    summary=summary
                )

                try:
                    db.session.add(article)
                    new_articles += 1
                    print(f"➕ Добавлена статья {new_articles}: {title[:50]}...")
                except Exception as e:
                    print(f"❌ Ошибка добавления статьи: {e}")

            if new_articles > 0:
                try:
                    db.session.commit()
                    print(f"✅ RSS {rss_data['name']}: добавлено {new_articles} новых статей")
                    total_new += new_articles
                except Exception as e:
                    print(f"❌ Ошибка сохранения в БД: {e}")
                    db.session.rollback()
            else:
                print(f"ℹ️  RSS {rss_data['name']}: новых статей нет (все уже существуют)")

        except Exception as e:
            print(f"❌ Ошибка RSS {rss_data['name']}: {e}")
            db.session.rollback()

    print(f"🎉 Всего добавлено {total_new} новых статей из RSS")
    return total_new