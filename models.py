# news_aggregator/models.py

from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

db = SQLAlchemy()

# Таблица связи многие-ко-многим для пользователей и источников новостей
user_sources = db.Table(
    'user_sources',
    db.Column('user_id', db.Integer, db.ForeignKey('user.id'), primary_key=True),
    db.Column('source_id', db.Integer, db.ForeignKey('news_source.id'), primary_key=True)
)

# Таблица связи многие-ко-многим для избранных статей пользователей
user_favorites = db.Table(
    'user_favorites',
    db.Column('user_id', db.Integer, db.ForeignKey('user.id'), primary_key=True),
    db.Column('article_id', db.Integer, db.ForeignKey('article.id'), primary_key=True),
    db.Column('created_at', db.DateTime, default=datetime.utcnow)
)


class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Связь с источниками новостей
    selected_sources = db.relationship(
        'NewsSource',
        secondary=user_sources,
        backref=db.backref('users', lazy='dynamic'),
        lazy='dynamic'
    )

    # Избранные статьи (many-to-many через user_favorites)
    # lazy='select' чтобы current_user.favorites.append/remove работали привычно
    favorites = db.relationship(
        'Article',
        secondary=user_favorites,
        backref=db.backref('favorited_by', lazy='dynamic'),
        lazy='select'
    )

    def set_password(self, password: str):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    def add_favorite(self, article):
        """Добавить статью в избранное (если ещё не добавлена)."""
        if article not in self.favorites:
            self.favorites.append(article)
            db.session.commit()

    def remove_favorite(self, article):
        """Удалить статью из избранного (если есть)."""
        if article in self.favorites:
            self.favorites.remove(article)
            db.session.commit()

    def is_favorite(self, article) -> bool:
        """Проверить, в избранном ли статья."""
        return article in self.favorites

    def __repr__(self):
        return f'<User {self.username}>'


class NewsSource(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    source_id = db.Column(db.String(50), unique=True, nullable=False)  # ID для NewsAPI
    description = db.Column(db.Text)
    category = db.Column(db.String(50))
    country = db.Column(db.String(10))
    language = db.Column(db.String(10))
    url = db.Column(db.String(200))
    is_active = db.Column(db.Boolean, default=True)

    def __repr__(self):
        return f'<NewsSource {self.name}>'


class Article(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(500), nullable=False)
    description = db.Column(db.Text)
    content = db.Column(db.Text)
    url = db.Column(db.String(500), unique=True, nullable=False)
    url_to_image = db.Column(db.String(500))
    published_at = db.Column(db.DateTime, nullable=False)
    source_id = db.Column(db.Integer, db.ForeignKey('news_source.id'), nullable=False)
    summary = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    source = db.relationship('NewsSource', backref=db.backref('articles', lazy=True))

    def __repr__(self):
        return f'<Article {self.title[:50]}>'
