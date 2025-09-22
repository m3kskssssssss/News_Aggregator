# news_aggregator/app.py

from flask import Flask, render_template, redirect, url_for, flash, request, jsonify
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from config import Config
from models import db, User, NewsSource, Article
from forms import LoginForm, RegistrationForm, SourceSelectionForm
from news_fetcher import get_user_articles, fetch_news_from_sources
from cli_commands import register_commands
import threading
import time


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Инициализация расширений
    db.init_app(app)

    login_manager = LoginManager()
    login_manager.init_app(app)
    login_manager.login_view = 'login'
    login_manager.login_message = 'Для доступа к этой странице необходимо войти в систему.'
    login_manager.login_message_category = 'info'

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))

    # Регистрация CLI команд
    register_commands(app)

    return app


app = create_app()


def auto_update_news():
    """Фоновая задача для автоматического обновления новостей каждые 2 часа"""
    with app.app_context():
        while True:
            try:
                print("🔄 Автоматическое обновление новостей...")
                count = fetch_news_from_sources(days_back=1)
                print(f"✅ Загружено {count} новых статей")
            except Exception as e:
                print(f"❌ Ошибка обновления новостей: {e}")

            # Ждем 2 часа (7200 секунд)
            time.sleep(7200)


# Запуск фоновой задачи
def start_background_tasks():
    """Запускает фоновые задачи"""
    news_thread = threading.Thread(target=auto_update_news, daemon=True)
    news_thread.start()


@app.route('/')
def index():
    page = request.args.get('page', 1, type=int)

    if current_user.is_authenticated:
        # Для авторизованных пользователей - персональная лента
        articles = get_user_articles(current_user, page, app.config['POSTS_PER_PAGE'])
    else:
        # Для неавторизованных - все новости
        articles = Article.query.order_by(Article.published_at.desc()).paginate(
            page=page, per_page=app.config['POSTS_PER_PAGE'], error_out=False)

    return render_template('index.html', articles=articles)


@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('index'))

    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(username=form.username.data).first()

        if user and user.check_password(form.password.data):
            login_user(user, remember=form.remember_me.data)
            next_page = request.args.get('next')
            if not next_page or not next_page.startswith('/'):
                next_page = url_for('index')
            return redirect(next_page)

        flash('Неверный логин или пароль', 'error')

    return render_template('auth/login.html', form=form)


@app.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('index'))

    form = RegistrationForm()
    if form.validate_on_submit():
        user = User(username=form.username.data, email=form.email.data)
        user.set_password(form.password.data)
        db.session.add(user)
        db.session.commit()

        flash('Регистрация прошла успешно!', 'success')
        return redirect(url_for('login'))

    return render_template('auth/register.html', form=form)


@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('index'))


@app.route('/settings', methods=['GET', 'POST'])
@login_required
def settings():
    form = SourceSelectionForm()

    if form.validate_on_submit():
        # Очищаем текущие источники пользователя
        current_user.selected_sources = []

        # Добавляем выбранные источники
        selected_source_ids = form.sources.data
        for source_id in selected_source_ids:
            source = NewsSource.query.get(source_id)
            if source:
                current_user.selected_sources.append(source)

        db.session.commit()
        flash('Настройки источников сохранены!', 'success')
        return redirect(url_for('index'))

    # Предзаполняем форму текущими настройками
    if request.method == 'GET':
        form.sources.data = [source.id for source in current_user.selected_sources]

    return render_template('settings.html', form=form)


@app.route('/article/<int:article_id>')
def article_detail(article_id):
    article = Article.query.get_or_404(article_id)
    return render_template('article_detail.html', article=article)


# 🔹 Добавляем избранное
@app.route('/favorite/toggle/<int:article_id>', methods=['POST'])
@login_required
def toggle_favorite(article_id):
    article = Article.query.get_or_404(article_id)

    if current_user.is_favorite(article):
        current_user.remove_favorite(article)
        status = 'removed'
    else:
        current_user.add_favorite(article)
        status = 'added'

    return jsonify({'status': status})


@app.route('/favorites')
@login_required
def favorites():
    page = request.args.get('page', 1, type=int)
    per_page = app.config.get('POSTS_PER_PAGE', 10)

    favorites_query = Article.query.join(User.favorites).filter(User.id == current_user.id).order_by(Article.published_at.desc())
    articles = favorites_query.paginate(page=page, per_page=per_page, error_out=False)

    return render_template('favorites.html', articles=articles)


if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        # Запускаем фоновые задачи
        start_background_tasks()
    # Для Docker нужно слушать все интерфейсы (0.0.0.0)
    app.run(host='0.0.0.0', port=5000, debug=True)