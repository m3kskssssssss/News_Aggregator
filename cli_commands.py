#news_aggregator/cli_commands.py

import click
from flask.cli import with_appcontext
from models import db, User, NewsSource, Article
from news_fetcher import fetch_all_sources, fetch_news_from_sources
from datetime import datetime, timedelta


@click.command()
@with_appcontext
def init_db():
    """Инициализация базы данных"""
    db.create_all()
    click.echo('База данных инициализирована.')


@click.command()
@with_appcontext
def clear_db():
    """Очистка всех данных из базы данных"""
    if click.confirm('Вы уверены, что хотите очистить всю базу данных?'):
        db.drop_all()
        db.create_all()
        click.echo('База данных очищена.')


@click.command()
@with_appcontext
def clear_articles():
    """Очистка только статей"""
    if click.confirm('Удалить все статьи?'):
        Article.query.delete()
        db.session.commit()
        click.echo('Все статьи удалены.')


@click.command()
@click.option('--days', default=7, help='Количество дней для удаления старых статей')
@with_appcontext
def clean_old_articles(days):
    """Удаление старых статей"""
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    old_articles = Article.query.filter(Article.published_at < cutoff_date)
    count = old_articles.count()

    if count > 0 and click.confirm(f'Удалить {count} статей старше {days} дней?'):
        old_articles.delete()
        db.session.commit()
        click.echo(f'Удалено {count} старых статей.')
    else:
        click.echo('Старых статей не найдено.')


@click.command()
@with_appcontext
def fetch_sources():
    """Загрузка источников новостей"""
    count = fetch_all_sources()
    click.echo(f'Загружено {count} источников новостей.')


@click.command()
@click.option('--days', default=1, help='Количество дней назад для загрузки')
@with_appcontext
def fetch_news(days):
    """Загрузка новостей"""
    count = fetch_news_from_sources(days_back=days)
    click.echo(f'Загружено {count} новых статей.')


@click.command()
@click.argument('username')
@click.argument('email')
@click.argument('password')
@with_appcontext
def create_user(username, email, password):
    """Создание нового пользователя"""
    if User.query.filter_by(username=username).first():
        click.echo(f'Пользователь {username} уже существует.')
        return

    if User.query.filter_by(email=email).first():
        click.echo(f'Email {email} уже используется.')
        return

    user = User(username=username, email=email)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    click.echo(f'Пользователь {username} создан.')


@click.command()
@with_appcontext
def list_users():
    """Список всех пользователей"""
    users = User.query.all()
    for user in users:
        click.echo(f'ID: {user.id}, Логин: {user.username}, Email: {user.email}')


@click.command()
@with_appcontext
def list_sources():
    """Список всех источников новостей"""
    sources = NewsSource.query.all()
    for source in sources:
        status = "Активен" if source.is_active else "Неактивен"
        click.echo(f'ID: {source.id}, Название: {source.name}, Статус: {status}')


@click.command()
@with_appcontext
def stats():
    """Статистика базы данных"""
    users_count = User.query.count()
    sources_count = NewsSource.query.count()
    articles_count = Article.query.count()

    click.echo(f'Пользователей: {users_count}')
    click.echo(f'Источников: {sources_count}')
    click.echo(f'Статей: {articles_count}')


@click.command()
@click.option('--hours', default=2, help='Интервал автоматического обновления в часах')
@with_appcontext
def auto_update_news(hours):
    """Запуск автоматического обновления новостей"""
    import time
    import threading

    def update_loop():
        while True:
            try:
                click.echo(f'🔄 Автоматическое обновление новостей...')
                count = fetch_news_from_sources(days_back=1)
                click.echo(f'✅ Загружено {count} новых статей')
            except Exception as e:
                click.echo(f'❌ Ошибка обновления: {e}')

            time.sleep(hours * 3600)  # Переводим часы в секунды

    click.echo(f'🚀 Запуск автоматического обновления каждые {hours} ч.')
    thread = threading.Thread(target=update_loop, daemon=True)
    thread.start()

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        click.echo('\n⏹️  Автоматическое обновление остановлено')


@click.command()
@with_appcontext
def clear_users():
    """Удаление всех пользователей кроме админа"""
    users = User.query.filter(User.username != 'admin').all()
    count = len(users)

    if count > 0 and click.confirm(f'Удалить {count} пользователей (кроме админа)?'):
        for user in users:
            user.selected_sources.clear()
        db.session.commit()

        User.query.filter(User.username != 'admin').delete()
        db.session.commit()
        click.echo(f'Удалено {count} пользователей.')
    else:
        click.echo('Нет пользователей для удаления или операция отменена.')


def register_commands(app):
    """Регистрация всех команд в приложении"""
    app.cli.add_command(init_db)
    app.cli.add_command(clear_db)
    app.cli.add_command(clear_articles)
    app.cli.add_command(clean_old_articles)
    app.cli.add_command(fetch_sources)
    app.cli.add_command(fetch_news)
    app.cli.add_command(create_user)
    app.cli.add_command(list_users)
    app.cli.add_command(list_sources)
    app.cli.add_command(stats)
    app.cli.add_command(clear_users)
    app.cli.add_command(auto_update_news)