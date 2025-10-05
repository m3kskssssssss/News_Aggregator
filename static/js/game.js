// static/js/game.js - ИСПРАВЛЕННАЯ ВЕРСИЯ

class NewsFlappyGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');

        // Размеры канваса
        this.canvas.width = Math.min(800, window.innerWidth - 40);
        this.canvas.height = 600;

        // Игровые переменные
        this.bird = {
            x: 100,
            y: this.canvas.height / 2,
            width: 40,
            height: 40,
            velocity: 0,
            gravity: 0.35,
            jumpForce: -8
        };

        this.pipes = [];
        this.pipeGap = 220;
        this.pipeWidth = 60;
        this.pipeSpeed = 3;
        this.frameCount = 0;

        this.articles = [];
        this.articleHeight = 100;
        this.articleSpeed = 3;

        this.score = 0;
        this.bestScore = parseInt(localStorage.getItem('newsGameBestScore') || '0');
        this.articlesRead = parseInt(localStorage.getItem('newsGameArticlesRead') || '0');
        this.hitCount = 0;

        this.gameState = 'start';
        this.landedArticle = null;
        this.firstJump = false;

        // Эффекты столкновений
        this.hitCooldown = 0;
        this.isHit = false;

        // UI элементы
        this.startScreen = document.getElementById('startScreen');
        this.pauseScreen = document.getElementById('pauseScreen');
        this.gameOverScreen = document.getElementById('gameOverScreen');

        // Оптимизация: кэшируем значения
        this.lastPipeTime = 0;
        this.pipeInterval = 150; // кадры между трубами

        this.init();
    }

    init() {
        console.log('Инициализация игры...');

        // Загружаем случайные статьи
        this.loadRandomArticles();

        // Обработчики для canvas
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleInput();
        }, { passive: false });

        this.canvas.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.handleInput();
        });

        // Обработчики для экранов
        this.startScreen.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.handleInput();
        }, { passive: false });

        this.startScreen.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleInput();
        });

        // Клавиатура
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.handleInput();
            }
        });

        // Кнопки
        const playAgainBtn = document.getElementById('playAgainBtn');
        const restartBtn = document.getElementById('restartBtn');
        const readArticleBtnPause = document.getElementById('readArticleBtnPause');
        const readArticleBtnGameOver = document.getElementById('readArticleBtnGameOver');

        if (playAgainBtn) {
            playAgainBtn.addEventListener('click', () => this.restart());
        }

        if (restartBtn) {
            restartBtn.addEventListener('click', () => this.restart());
        }

        if (readArticleBtnPause) {
            readArticleBtnPause.addEventListener('click', () => this.readArticle());
        }

        if (readArticleBtnGameOver) {
            readArticleBtnGameOver.addEventListener('click', () => this.readArticle());
        }

        // Обновляем UI
        this.updateUI();

        // Запускаем игровой цикл
        this.lastTime = performance.now();
        this.gameLoop();

        console.log('✅ Игра инициализирована!');
    }

    async loadRandomArticles() {
        try {
            console.log('Загрузка статей для игры...');
            const response = await fetch('/api/game/random-articles?count=6');
            const data = await response.json();

            if (!data.articles || data.articles.length === 0) {
                throw new Error('Нет статей в ответе');
            }

            const articleWidth = 230;
            const spacing = 20;

            this.articles = data.articles.map((article, index) => ({
                ...article,
                x: index * (articleWidth + spacing),
                y: this.canvas.height - this.articleHeight,
                width: articleWidth
            }));

            console.log('✅ Загружено статей:', this.articles.length);

        } catch (error) {
            console.error('❌ Ошибка загрузки статей:', error);

            const articleWidth = 230;
            const spacing = 20;

            this.articles = [
                {id: 1, title: 'В Тбилиси в день выборов прошли массовые митинги', url: '#', source: 'Test News'},
                {id: 2, title: 'Новости технологий: запуск нового смартфона', url: '#', source: 'Tech Daily'},
                {id: 3, title: 'Экономика и бизнес: рост акций', url: '#', source: 'Business'},
                {id: 4, title: 'Спортивные события: финал чемпионата', url: '#', source: 'Sports'},
                {id: 5, title: 'Культура и искусство: новая выставка', url: '#', source: 'Culture'},
                {id: 6, title: 'Наука и образование: новое открытие', url: '#', source: 'Science'}
            ].map((article, index) => ({
                ...article,
                x: index * (articleWidth + spacing),
                y: this.canvas.height - this.articleHeight,
                width: articleWidth
            }));

            console.log('✅ Созданы тестовые статьи');
        }
    }

    handleInput() {
        if (this.gameState === 'start') {
            this.startGame();
        } else if (this.gameState === 'playing') {
            this.jump();
        }
    }

    startGame() {
        console.log('🚀 Игра запущена!');
        this.gameState = 'playing';
        this.startScreen.style.display = 'none';
        this.bird.x = 100;
        this.firstJump = false;
        this.bird.velocity = 0;
    }

    jump() {
        this.firstJump = true;
        this.bird.velocity = this.bird.jumpForce;
    }

    restart() {
        console.log('🔄 Перезапуск игры...');
        this.bird.y = this.canvas.height / 2;
        this.bird.x = 100;
        this.bird.velocity = 0;
        this.pipes = [];
        this.score = 0;
        this.hitCount = 0;
        this.frameCount = 0;
        this.hitCooldown = 0;
        this.isHit = false;
        this.firstJump = false;
        this.gameState = 'playing';
        this.pauseScreen.style.display = 'none';
        this.gameOverScreen.style.display = 'none';
        this.landedArticle = null;
        this.loadRandomArticles();
        this.updateUI();
    }

    readArticle() {
        if (this.landedArticle) {
            window.open(this.landedArticle.url, '_blank');
            this.articlesRead++;
            localStorage.setItem('newsGameArticlesRead', this.articlesRead.toString());
            this.updateUI();
        }
    }

    // Улучшенный метод для нахождения статьи под птицей
    getArticleUnderBird() {
        const birdCenterX = this.bird.x + this.bird.width / 2;
        const birdBottomY = this.bird.y + this.bird.height;

        // Проверяем, находится ли птица в зоне статей
        if (birdBottomY < this.canvas.height - this.articleHeight) {
            return null;
        }

        for (let article of this.articles) {
            if (birdCenterX >= article.x && birdCenterX <= article.x + article.width) {
                return article;
            }
        }

        return null;
    }

    update() {
        if (this.gameState !== 'playing') return;

        // Обновление птицы
        if (this.firstJump) {
            this.bird.velocity += this.bird.gravity;
            this.bird.y += this.bird.velocity;
        }

        // Генерация труб с фиксированным интервалом
        this.frameCount++;
        if (this.frameCount - this.lastPipeTime > this.pipeInterval && this.firstJump) {
            const minHeight = 50;
            const maxHeight = this.canvas.height - this.pipeGap - this.articleHeight - 50;
            const height = Math.random() * (maxHeight - minHeight) + minHeight;

            this.pipes.push({
                x: this.canvas.width,
                topHeight: height,
                bottomY: height + this.pipeGap,
                scored: false
            });

            this.lastPipeTime = this.frameCount;
        }

        // Обновление труб
        for (let i = this.pipes.length - 1; i >= 0; i--) {
            this.pipes[i].x -= this.pipeSpeed;

            if (!this.pipes[i].scored && this.pipes[i].x + this.pipeWidth < this.bird.x) {
                this.pipes[i].scored = true;
                this.score++;
                this.updateUI();
            }

            if (this.pipes[i].x + this.pipeWidth < 0) {
                this.pipes.splice(i, 1);
            }
        }

        // Обновление статей
        const articleWidth = 230;
        const spacing = 20;
        const totalWidth = articleWidth + spacing;

        this.articles.forEach(article => {
            article.x -= this.articleSpeed;

            if (article.x + articleWidth < 0) {
                const maxX = Math.max(...this.articles.map(a => a.x));
                article.x = maxX + totalWidth;
            }
        });

        // Проверка столкновений
        this.checkCollisions();
    }

    checkCollisions() {
        if (this.hitCooldown > 0) {
            this.hitCooldown--;
            if (this.hitCooldown === 0) {
                this.isHit = false;
            }
        }

        // Проверка вылета за верхнюю границу
        if (this.bird.y < -10) {
            console.log('💀 Улетела за верхнюю границу!');
            this.landedArticle = this.getArticleUnderBird();
            console.log('📰 Статья под птицей:', this.landedArticle ? this.landedArticle.title : 'не найдена');
            this.gameOver();
            return;
        }

        // Проверка столкновения с трубами
        for (let pipe of this.pipes) {
            if (this.bird.x + this.bird.width > pipe.x &&
                this.bird.x < pipe.x + this.pipeWidth) {

                if (this.bird.y < pipe.topHeight ||
                    this.bird.y + this.bird.height > pipe.bottomY) {

                    console.log('💀 Столкновение с блоком!');
                    this.landedArticle = this.getArticleUnderBird();
                    console.log('📰 Статья под птицей:', this.landedArticle ? this.landedArticle.title : 'не найдена');
                    this.gameOver();
                    return;
                }
            }
        }

        // Проверка приземления на статью
        if (this.bird.y + this.bird.height >= this.canvas.height - this.articleHeight) {
            this.landOnArticle();
        }
    }

    landOnArticle() {
        // Находим статью под птицей
        this.landedArticle = this.getArticleUnderBird();

        if (this.landedArticle) {
            console.log('✅ Приземлились на статью:', this.landedArticle.title);
        } else {
            console.warn('⚠️ Статья под птицей не найдена!');
            // Если статья не найдена, берем первую доступную
            this.landedArticle = this.articles[0] || null;
        }

        this.pause();
    }

    pause() {
        console.log('⏸️ Пауза. Статья:', this.landedArticle ? this.landedArticle.title : 'не найдена');
        this.gameState = 'paused';

        const articleInfo = document.getElementById('landedArticlePause');

        if (articleInfo && this.landedArticle) {
            let statsText = '';
            if (this.hitCount > 0) {
                statsText = `<p style="color: #ff6b6b; font-size: 0.9rem; margin-bottom: 1rem;">💥 Столкновений: ${this.hitCount}</p>`;
            } else {
                statsText = `<p style="color: #51cf66; font-size: 0.9rem; margin-bottom: 1rem;">✨ Без столкновений!</p>`;
            }

            articleInfo.innerHTML = `
                ${statsText}
                <div class="article-card">
                    <h3>${this.landedArticle.title}</h3>
                    <p class="article-source">
                        <i class="fas fa-newspaper"></i> ${this.landedArticle.source}
                    </p>
                </div>
            `;
        }

        this.pauseScreen.style.display = 'flex';

        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('newsGameBestScore', this.bestScore.toString());
            this.updateUI();
        }
    }

    gameOver() {
        console.log('💀 Game Over! Статья:', this.landedArticle ? this.landedArticle.title : 'не найдена');

        this.gameState = 'gameover';
        document.getElementById('finalScore').textContent = this.score;

        const deathMessage = document.querySelector('.death-message');
        const articleInfo = document.getElementById('landedArticleGameOver');

        if (articleInfo) {
            if (this.landedArticle) {
                let statsText = '';
                if (this.hitCount > 0) {
                    statsText = `<p style="color: #ff6b6b; font-size: 0.9rem; margin-bottom: 1rem;">💥 Столкновений: ${this.hitCount}</p>`;
                } else {
                    statsText = `<p style="color: #51cf66; font-size: 0.9rem; margin-bottom: 1rem;">✨ Без столкновений!</p>`;
                }

                articleInfo.innerHTML = `
                    ${statsText}
                    <div class="article-card">
                        <h3>${this.landedArticle.title}</h3>
                        <p class="article-source">
                            <i class="fas fa-newspaper"></i> ${this.landedArticle.source}
                        </p>
                    </div>
                `;
            } else {
                // Если статья не установлена, пробуем найти
                this.landedArticle = this.getArticleUnderBird() || this.articles[0] || null;

                if (this.landedArticle) {
                    articleInfo.innerHTML = `
                        <div class="article-card">
                            <h3>${this.landedArticle.title}</h3>
                            <p class="article-source">
                                <i class="fas fa-newspaper"></i> ${this.landedArticle.source}
                            </p>
                        </div>
                    `;
                } else {
                    articleInfo.innerHTML = `
                        <div class="article-card">
                            <p style="color: #999;">Статья не найдена</p>
                        </div>
                    `;
                }
            }
        }

        if (this.hitCount > 0) {
            deathMessage.textContent = `Game Over! (${this.hitCount} столкновений)`;
        } else {
            deathMessage.textContent = 'Game Over!';
        }

        this.gameOverScreen.style.display = 'flex';

        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('newsGameBestScore', this.bestScore.toString());
            this.updateUI();
        }
    }

    draw() {
        // Очистка канваса
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Рисуем сетку (упрощенная версия для производительности)
        this.drawGrid();

        // Рисуем трубы
        this.drawPipes();

        // Рисуем статьи
        this.drawArticles();

        // Рисуем птицу
        this.drawBird();

        // Рисуем счет
        if (this.gameState === 'playing') {
            this.drawScore();
        }
    }

    drawGrid() {
        this.ctx.strokeStyle = '#f0f0f0';
        this.ctx.lineWidth = 1;

        // Рисуем только видимые линии для производительности
        const gridSize = 40;
        const startX = Math.floor(0 / gridSize) * gridSize;
        const startY = Math.floor(0 / gridSize) * gridSize;

        for (let x = startX; x < this.canvas.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }

        for (let y = startY; y < this.canvas.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    drawBird() {
        const birdColor = this.isHit ? '#ff0000' : '#000000';

        this.ctx.fillStyle = birdColor;
        this.ctx.fillRect(this.bird.x, this.bird.y, this.bird.width, this.bird.height);

        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(this.bird.x + 25, this.bird.y + 10, 8, 8);

        this.ctx.fillStyle = birdColor;
        this.ctx.fillRect(this.bird.x + 40, this.bird.y + 15, 8, 8);

        if (Math.floor(this.frameCount / 10) % 2 === 0) {
            this.ctx.fillRect(this.bird.x - 8, this.bird.y + 20, 15, 8);
        }
    }

    drawPipes() {
        this.ctx.fillStyle = '#000000';

        for (let pipe of this.pipes) {
            // Рисуем только видимые трубы
            if (pipe.x + this.pipeWidth < 0 || pipe.x > this.canvas.width) {
                continue;
            }

            this.ctx.fillRect(pipe.x, 0, this.pipeWidth, pipe.topHeight);

            const bottomHeight = this.canvas.height - this.articleHeight - pipe.bottomY;
            this.ctx.fillRect(pipe.x, pipe.bottomY, this.pipeWidth, bottomHeight);

            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(pipe.x, 0, this.pipeWidth, pipe.topHeight);
            this.ctx.strokeRect(pipe.x, pipe.bottomY, this.pipeWidth, bottomHeight);
        }
    }

    drawArticles() {
        const bottomY = this.canvas.height - this.articleHeight;

        this.ctx.fillStyle = '#000000';
        this.ctx.fillRect(0, bottomY, this.canvas.width, this.articleHeight);

        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(0, bottomY);
        this.ctx.lineTo(this.canvas.width, bottomY);
        this.ctx.stroke();

        if (!this.articles || this.articles.length === 0) {
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'bold 16px monospace';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('ЗАГРУЗКА НОВОСТЕЙ...', this.canvas.width / 2, bottomY + this.articleHeight / 2);
            this.ctx.textAlign = 'left';
            return;
        }

        const spacing = 10;

        for (let article of this.articles) {
            const x = article.x;
            const y = bottomY;

            // Рисуем только видимые статьи
            if (x + article.width < 0 || x > this.canvas.width) {
                continue;
            }

            this.ctx.fillStyle = '#2a2a2a';
            this.ctx.fillRect(x + spacing, y + spacing, article.width - spacing * 2, this.articleHeight - spacing * 2);

            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x + spacing, y + spacing, article.width - spacing * 2, this.articleHeight - spacing * 2);

            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'bold 12px Arial, sans-serif';
            this.ctx.textAlign = 'left';

            const textX = x + spacing + 8;
            const textStartY = y + spacing + 20;
            const maxTextWidth = article.width - spacing * 2 - 16;

            // Упрощенный текст для производительности
            let title = article.title;
            const metrics = this.ctx.measureText(title);
            if (metrics.width > maxTextWidth) {
                title = title.substring(0, 30) + '...';
            }

            this.ctx.fillText(title, textX, textStartY);

            this.ctx.fillStyle = '#888888';
            this.ctx.font = '10px monospace';
            const sourceY = y + this.articleHeight - spacing - 8;
            this.ctx.fillText('📰 ' + article.source, textX, sourceY);
        }

        this.ctx.textAlign = 'left';
    }

    drawScore() {
        this.ctx.fillStyle = '#000000';
        this.ctx.font = 'bold 36px monospace';
        this.ctx.textAlign = 'center';

        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 4;
        this.ctx.strokeText(this.score.toString(), this.canvas.width / 2, 50);
        this.ctx.fillText(this.score.toString(), this.canvas.width / 2, 50);

        if (this.hitCount > 0) {
            this.ctx.font = 'bold 18px monospace';
            this.ctx.textAlign = 'right';
            this.ctx.fillStyle = '#ff0000';
            const hitText = '💥 ' + this.hitCount;

            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 3;
            this.ctx.strokeText(hitText, this.canvas.width - 20, 30);
            this.ctx.fillText(hitText, this.canvas.width - 20, 30);
        }

        this.ctx.textAlign = 'left';
    }

    updateUI() {
        document.getElementById('currentScore').textContent = this.score;
        document.getElementById('bestScore').textContent = this.bestScore;
        document.getElementById('articlesRead').textContent = this.articlesRead;
    }

    gameLoop() {
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastTime;

        // Ограничиваем FPS для производительности
        if (deltaTime > 16) { // ~60 FPS
            this.update();
            this.draw();
            this.lastTime = currentTime;
        }

        requestAnimationFrame(() => this.gameLoop());
    }
}

// Инициализация игры при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    const game = new NewsFlappyGame();
});