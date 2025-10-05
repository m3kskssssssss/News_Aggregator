# news_aggregator/summary_generator.py - ПОЛНАЯ ВЕРСИЯ

import re
from collections import Counter, defaultdict
from datetime import datetime, timedelta
from models import Article


def filter_articles_by_topic(articles, topic):
    """Фильтрует статьи по заданной теме"""

    # Определяем ключевые слова для каждой темы
    topic_keywords = {
        'politics': {
            'keywords': ['путин', 'президент', 'правительство', 'госдума', 'министр',
                         'депутат', 'парламент', 'закон', 'указ', 'выборы', 'партия',
                         'политика', 'государство', 'власть', 'регион', 'губернатор'],
            'weight': 1.0
        },
        'technology': {
            'keywords': ['технология', 'цифровой', 'интернет', 'компьютер', 'софт',
                         'приложение', 'стартап', 'инновация', 'искусственный интеллект',
                         'ai', 'программное обеспечение', 'гаджет', 'смартфон', 'робот',
                         'данные', 'кибер', 'облако', 'блокчейн'],
            'weight': 1.0
        },
        'economy': {
            'keywords': ['рубль', 'доллар', 'экономика', 'инфляция', 'банк', 'нефть',
                         'газ', 'цена', 'рост', 'падение', 'ввп', 'бизнес', 'финансы',
                         'инвестиции', 'акции', 'биржа', 'торговля', 'экспорт', 'импорт',
                         'промышленность', 'производство'],
            'weight': 1.0
        },
        'sports': {
            'keywords': ['футбол', 'хоккей', 'олимпиада', 'чемпионат', 'матч', 'игра',
                         'команда', 'спортсмен', 'тренер', 'победа', 'поражение', 'гол',
                         'спорт', 'турнир', 'лига', 'кубок', 'соревнование', 'атлет'],
            'weight': 1.0
        },
        'culture': {
            'keywords': ['театр', 'кино', 'музыка', 'художник', 'фестиваль', 'концерт',
                         'выставка', 'книга', 'литература', 'искусство', 'культура',
                         'актер', 'режиссер', 'писатель', 'музей', 'галерея', 'премия'],
            'weight': 1.0
        },
        'science': {
            'keywords': ['исследование', 'ученый', 'открытие', 'эксперимент', 'медицина',
                         'лечение', 'вакцина', 'наука', 'научный', 'космос', 'физика',
                         'химия', 'биология', 'генетика', 'клиника', 'больница', 'врач'],
            'weight': 1.0
        },
        'world': {
            'keywords': ['сша', 'китай', 'европа', 'украина', 'санкции', 'переговоры',
                         'соглашение', 'договор', 'страна', 'международный', 'мир',
                         'конфликт', 'война', 'мирный', 'дипломатия', 'визит'],
            'weight': 1.0
        },
        'society': {
            'keywords': ['общество', 'люди', 'город', 'регион', 'жители', 'социальный',
                         'образование', 'школа', 'университет', 'студент', 'учитель',
                         'пенсия', 'зарплата', 'работа', 'безработица', 'демография'],
            'weight': 1.0
        },
        'incidents': {
            'keywords': ['авария', 'пожар', 'взрыв', 'катастрофа', 'происшествие', 'чп',
                         'спасение', 'жертвы', 'пострадавшие', 'эвакуация', 'мчс',
                         'полиция', 'следствие', 'преступление', 'суд'],
            'weight': 1.0
        }
    }

    if topic not in topic_keywords:
        return articles

    keywords = topic_keywords[topic]['keywords']
    filtered_articles = []

    # Фильтруем статьи по ключевым словам
    for article in articles:
        # Объединяем весь текст статьи
        full_text = f"{article.title} {article.description or ''} {article.summary or ''}".lower()

        # Подсчитываем количество совпадений
        matches = sum(full_text.count(keyword) for keyword in keywords)

        # Если есть хотя бы 1 совпадение, добавляем статью
        if matches > 0:
            filtered_articles.append((article, matches))

    # Сортируем по количеству совпадений (релевантности)
    filtered_articles.sort(key=lambda x: x[1], reverse=True)

    # Возвращаем только статьи (без счетчика совпадений)
    return [article for article, _ in filtered_articles[:15]]


def generate_news_summary(articles, max_articles=5, topic=None):
    """Генерирует краткую выжимку из топ новостей (обновленная версия)"""

    if not articles:
        return {
            'summary': 'Новости не найдены.',
            'top_articles': [],
            'generated_at': datetime.now()
        }

    # Берем топ статей и анализируем их
    top_articles = sorted(articles, key=lambda x: x.published_at, reverse=True)[:max_articles]

    # Создаем выжимку с учетом темы
    summary_text = create_intelligent_summary(top_articles, articles, topic)

    # Подготавливаем данные статей
    article_links = []
    for article in top_articles:
        article_links.append({
            'id': article.id,
            'title': article.title,
            'url': article.url,
            'source': article.source.name,
            'published_at': article.published_at,
            'importance_score': calculate_article_importance(article)
        })

    # Сортируем по важности
    article_links.sort(key=lambda x: x['importance_score'], reverse=True)

    return {
        'summary': summary_text,
        'top_articles': article_links,
        'generated_at': datetime.now()
    }


def create_intelligent_summary(top_articles, all_articles, topic=None):
    """Создает умную выжимку на основе анализа текста (обновленная версия)"""

    # Названия тем на русском
    topic_names = {
        'politics': 'Политика',
        'technology': 'Технологии',
        'economy': 'Экономика',
        'sports': 'Спорт',
        'culture': 'Культура',
        'science': 'Наука',
        'world': 'Международные отношения',
        'society': 'Общество',
        'incidents': 'Происшествия'
    }

    # Анализируем темы и тренды
    sources_stats = analyze_sources(all_articles)
    time_stats = analyze_time_distribution(all_articles)

    # Находим ключевые события
    key_events = extract_key_events(top_articles)

    # Создаем структурированную выжимку
    summary_parts = []

    # Добавляем информацию о теме, если она указана
    if topic and topic in topic_names:
        topic_name = topic_names[topic]
        summary_parts.append(f"Выжимка по теме '{topic_name}'")

    # Временная статистика
    today = datetime.now().date()
    today_count = len([a for a in all_articles if a.published_at.date() == today])

    if today_count > 0:
        summary_parts.append(f"За сегодня опубликовано {today_count} новостей")
    else:
        summary_parts.append(f"В последние дни опубликовано {len(all_articles)} новостей")

    # Основные источники
    top_sources = list(sources_stats.keys())[:3]
    if len(top_sources) > 1:
        sources_text = ", ".join(top_sources[:-1]) + f" и {top_sources[-1]}"
        summary_parts.append(f"от источников: {sources_text}")
    elif len(top_sources) == 1:
        summary_parts.append(f"от источника: {top_sources[0]}")

    # Ключевые события
    if key_events:
        summary_parts.append(f"Главные события: {key_events}")

    return ". ".join(summary_parts) + "."


def analyze_topics(articles):
    """Анализирует основные темы в новостях"""

    # Ключевые слова по темам
    topic_keywords = {
        'Политика': ['путин', 'президент', 'правительство', 'госдума', 'министр', 'депутат', 'парламент', 'закон',
                     'указ'],
        'Экономика': ['рубль', 'доллар', 'экономика', 'инфляция', 'банк', 'нефть', 'газ', 'цена', 'рост', 'падение',
                      'ввп'],
        'Международные отношения': ['сша', 'китай', 'европа', 'украина', 'санкции', 'переговоры', 'соглашение',
                                    'договор'],
        'Технологии': ['технология', 'цифровой', 'интернет', 'компьютер', 'софт', 'приложение', 'стартап', 'инновация'],
        'Спорт': ['футбол', 'хоккей', 'олимпиада', 'чемпионат', 'матч', 'игра', 'команда', 'спортсмен'],
        'Культура': ['театр', 'кино', 'музыка', 'художник', 'фестиваль', 'концерт', 'выставка', 'книга'],
        'Наука': ['исследование', 'ученый', 'открытие', 'эксперимент', 'медицина', 'лечение', 'вакцина'],
        'Происшествия': ['авария', 'пожар', 'взрыв', 'катастрофа', 'происшествие', 'чп', 'спасение']
    }

    topics = defaultdict(list)

    for article in articles:
        # Объединяем весь текст статьи
        full_text = f"{article.title} {article.description or ''} {article.summary or ''}".lower()

        # Определяем тему статьи
        topic_scores = {}
        for topic, keywords in topic_keywords.items():
            score = sum(full_text.count(keyword) for keyword in keywords)
            if score > 0:
                topic_scores[topic] = score

        # Присваиваем статью наиболее подходящей теме
        if topic_scores:
            best_topic = max(topic_scores.items(), key=lambda x: x[1])[0]
            topics[best_topic].append(article)
        else:
            topics['Общие новости'].append(article)

    # Сортируем темы по количеству статей
    return dict(sorted(topics.items(), key=lambda x: len(x[1]), reverse=True))


def analyze_sources(articles):
    """Анализирует статистику по источникам"""
    sources = Counter([article.source.name for article in articles])
    return dict(sources.most_common())


def analyze_time_distribution(articles):
    """Анализирует временное распределение новостей"""
    now = datetime.now()
    time_buckets = {
        'Последний час': 0,
        'Последние 3 часа': 0,
        'Сегодня': 0,
        'Вчера': 0,
        'Раньше': 0
    }

    for article in articles:
        time_diff = now - article.published_at

        if time_diff.total_seconds() < 3600:  # 1 час
            time_buckets['Последний час'] += 1
        elif time_diff.total_seconds() < 3600 * 3:  # 3 часа
            time_buckets['Последние 3 часа'] += 1
        elif time_diff.days == 0:  # сегодня
            time_buckets['Сегодня'] += 1
        elif time_diff.days == 1:  # вчера
            time_buckets['Вчера'] += 1
        else:
            time_buckets['Раньше'] += 1

    return time_buckets


def extract_key_events(articles):
    """Извлекает ключевые события из новостей"""

    # Слова-индикаторы важных событий
    important_indicators = [
        'объявил', 'заявил', 'сообщил', 'принял решение', 'подписал',
        'запретил', 'разрешил', 'одобрил', 'отклонил', 'утвердил',
        'началось', 'завершилось', 'произошло', 'случилось',
        'увеличил', 'снизил', 'повысил', 'понизил',
        'встретился', 'переговоры', 'соглашение', 'договор'
    ]

    key_events = []

    for article in articles[:3]:  # Берем топ-3 статьи
        title = article.title.lower()

        # Проверяем наличие индикаторов важности
        for indicator in important_indicators:
            if indicator in title:
                # Извлекаем ключевую фразу
                event = extract_key_phrase(article.title)
                if event and len(event) > 10:
                    key_events.append(event)
                break

    return "; ".join(key_events[:2])  # Максимум 2 события


def extract_key_phrase(title):
    """Извлекает ключевую фразу из заголовка"""

    # Убираем лишние символы и слова
    title = re.sub(r'[^\w\s]', '', title)
    words = title.split()

    # Убираем стоп-слова
    stop_words = {'в', 'на', 'с', 'по', 'из', 'к', 'от', 'для', 'о', 'об', 'и', 'а', 'но', 'да', 'или', 'если', 'что',
                  'как', 'где', 'когда'}
    filtered_words = [word for word in words if word.lower() not in stop_words and len(word) > 2]

    # Возвращаем первые 6-8 значимых слов
    return ' '.join(filtered_words[:8])


def calculate_article_importance(article):
    """Вычисляет важность статьи"""

    score = 0
    title = article.title.lower()
    description = (article.description or '').lower()

    # Критерии важности
    importance_keywords = [
        'путин', 'президент', 'правительство', 'россия', 'российский',
        'экстренно', 'срочно', 'важно', 'официально', 'первый',
        'главный', 'крупный', 'масштабный', 'серьезный',
        'рекордный', 'исторический', 'уникальный'
    ]

    # Бонус за ключевые слова
    for keyword in importance_keywords:
        score += title.count(keyword) * 3
        score += description.count(keyword) * 1

    # Бонус за свежесть
    time_diff = datetime.now() - article.published_at
    if time_diff.total_seconds() < 3600:  # менее часа
        score += 5
    elif time_diff.total_seconds() < 3600 * 6:  # менее 6 часов
        score += 3
    elif time_diff.days == 0:  # сегодня
        score += 1

    # Бонус за длину заголовка (средние заголовки часто информативнее)
    title_length = len(article.title.split())
    if 5 <= title_length <= 12:
        score += 2

    # Штраф за слишком короткие или длинные заголовки
    if title_length < 3 or title_length > 20:
        score -= 1

    return max(0, score)


def create_trending_summary(articles):
    """Создает выжимку на основе трендов"""

    # Анализируем частоту слов
    word_freq = Counter()

    for article in articles:
        text = f"{article.title} {article.description or ''}".lower()
        # Убираем знаки препинания и разбиваем на слова
        words = re.findall(r'\b[а-яё]{3,}\b', text)
        word_freq.update(words)

    # Исключаем стоп-слова
    stop_words = {
        'это', 'как', 'что', 'для', 'или', 'все', 'уже', 'еще', 'один',
        'два', 'три', 'может', 'быть', 'года', 'году', 'день', 'дня',
        'время', 'раз', 'сказал', 'говорит', 'рассказал'
    }

    # Получаем топ слов
    trending_words = []
    for word, count in word_freq.most_common(10):
        if word not in stop_words and count >= 2:
            trending_words.append(f"{word} ({count})")

    if trending_words:
        return f"Ключевые темы дня: {', '.join(trending_words[:5])}"
    else:
        return "Анализ трендов не выявил выраженных тем"


def get_summary_statistics(articles):
    """Возвращает статистику для отображения"""

    if not articles:
        return {
            'total_articles': 0,
            'today_articles': 0,
            'sources_count': 0,
            'top_source': 'Нет данных'
        }

    today = datetime.now().date()
    today_articles = [a for a in articles if a.published_at.date() == today]
    sources = set([a.source.name for a in articles])
    source_counts = Counter([a.source.name for a in articles])

    return {
        'total_articles': len(articles),
        'today_articles': len(today_articles),
        'sources_count': len(sources),
        'top_source': source_counts.most_common(1)[0][0] if source_counts else 'Нет данных'
    }


def create_experimental_summary(articles):
    """Экспериментальный алгоритм выжимки"""

    if not articles:
        return "Новости отсутствуют."

    # Группируем статьи по времени
    recent = [a for a in articles if (datetime.now() - a.published_at).total_seconds() < 3600 * 6]
    older = [a for a in articles if a not in recent]

    summary_parts = []

    if recent:
        summary_parts.append(f"За последние 6 часов: {len(recent)} новостей")

        # Анализируем заголовки последних новостей
        recent_keywords = []
        for article in recent[:3]:
            words = article.title.split()[:4]  # Первые 4 слова заголовка
            recent_keywords.extend([w for w in words if len(w) > 3])

        if recent_keywords:
            top_words = Counter(recent_keywords).most_common(3)
            keywords_text = ', '.join([word for word, count in top_words])
            summary_parts.append(f"В центре внимания: {keywords_text}")

    if older:
        summary_parts.append(f"Всего новостей в ленте: {len(articles)}")

    # Добавляем информацию об источниках
    sources = Counter([a.source.name for a in articles])
    if sources:
        top_source = sources.most_common(1)[0]
        summary_parts.append(f"Активнее всех публикует: {top_source[0]} ({top_source[1]} новостей)")

    return ". ".join(summary_parts) + "."