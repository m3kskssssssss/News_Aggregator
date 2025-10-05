// static/js/game.js - УПРОЩЕННАЯ ВЕРСИЯ

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
            gravity: 0.35,  // Уменьшили с 0.5 - легче управлять
            jumpForce: -8   // Уменьшили с -10 - более плавный прыжок
        };

        this.pipes = [];
        this.pipeGap = 220;  // Увеличили с 180 - легче пролетать
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
        this.firstJump = false; // Флаг первого прыжка

        // Эффекты столкновений
        this.hitCooldown = 0;
        this.isHit = false;

        // UI элементы
        this.startScreen = document.getElementById('startScreen');
        this.pauseScreen = document.getElementById('pauseScreen');
        this.gameOverScreen = document.getElementById('gameOverScreen');

        this.init();
    }

    init() {
        console.log('Инициализация игры...');

        // Загружаем случайные статьи
        this.loadRandomArticles();

        // =============== ОБРАБОТЧИКИ ДЛЯ CANVAS ===============

        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleInput();
        }, { passive: false });

        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
        }, { passive: false });

        this.canvas.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.handleInput();
        });

        // =============== ОБРАБОТЧИКИ ДЛЯ ЭКРАНОВ ===============

        this.startScreen.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.handleInput();
        }, { passive: false });

        this.startScreen.addEventListener('click', (e) => {
            e.preventDefault();
            this.handleInput();
        });

        // =============== КЛАВИАТУРА ===============

        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.handleInput();
            }
        });

        // =============== КНОПКИ ===============

        const playAgainBtn = document.getElementById('playAgainBtn');
        const restartBtn = document.getElementById('restartBtn');

        // Кнопка "Читать статью" есть в обоих экранах (pause и gameOver)
        const readArticleBtns = document.querySelectorAll('#readArticleBtn');

        if (playAgainBtn) {
            playAgainBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.restart();
            }, { passive: false });
            playAgainBtn.addEventListener('click', () => this.restart());
        }

        if (restartBtn) {
            restartBtn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.restart();
            }, { passive: false });
            restartBtn.addEventListener('click', () => this.restart());
        }

        // Добавляем обработчики для всех кнопок "Читать статью"
        readArticleBtns.forEach(btn => {
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.readArticle();
            }, { passive: false });
            btn.addEventListener('click', () => this.readArticle());
        });

        // Обновляем UI
        this.updateUI();

        // Запускаем игровой цикл
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
                y: this.canvas.height - this.articleHeight
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
                y: this.canvas.height - this.articleHeight
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
        this.firstJump = false; // Еще не было первого прыжка
        this.bird.velocity = 0; // Обнуляем скорость
    }

    jump() {
        this.firstJump = true; // Теперь был первый прыжок
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

    // Метод для нахождения статьи под птицей
    getArticleUnderBird() {
        const birdCenterX = this.bird.x + this.bird.width / 2;
        const articleWidth = 230;

        for (let article of this.articles) {
            if (birdCenterX >= article.x && birdCenterX <= article.x + articleWidth) {
                return article;
            }
        }

        // Если не нашли точную, берем ближайшую
        if (this.articles.length > 0) {
            let closestArticle = this.articles[0];
            let minDistance = Math.abs(birdCenterX - (this.articles[0].x + articleWidth / 2));

            for (let article of this.articles) {
                const distance = Math.abs(birdCenterX - (article.x + articleWidth / 2));
                if (distance < minDistance) {
                    minDistance = distance;
                    closestArticle = article;
                }
            }

            return closestArticle;
        }

        return null;
    }

    update() {
        if (this.gameState !== 'playing') return;

        // Обновление птицы - применяем гравитацию только после первого прыжка
        if (this.firstJump) {
            this.bird.velocity += this.bird.gravity;
            this.bird.y += this.bird.velocity;
        } else {
            // До первого прыжка птица летит прямо
            this.bird.velocity = 0;
        }

        // Генерация труб - РЕЖЕ (увеличили с 90 до 150 фреймов)
        this.frameCount++;
        if (this.frameCount % 150 === 0 && this.firstJump) { // Трубы появляются только после первого прыжка
            const minHeight = 50;
            const maxHeight = this.canvas.height - this.pipeGap - this.articleHeight - 50;
            const height = Math.random() * (maxHeight - minHeight) + minHeight;

            this.pipes.push({
                x: this.canvas.width,
                topHeight: height,
                bottomY: height + this.pipeGap,
                scored: false
            });
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

        let isCollidingWithPipe = false;

        for (let pipe of this.pipes) {
            if (this.bird.x + this.bird.width > pipe.x &&
                this.bird.x < pipe.x + this.pipeWidth) {

                if (this.bird.y < pipe.topHeight) {
                    isCollidingWithPipe = true;
                    this.bird.y = pipe.topHeight;
                    this.bird.velocity = Math.max(this.bird.velocity, 0);
                    this.hitPipe();
                }
                else if (this.bird.y + this.bird.height > pipe.bottomY) {
                    isCollidingWithPipe = true;
                    this.bird.y = pipe.bottomY - this.bird.height;
                    this.bird.velocity = Math.min(this.bird.velocity, 0);
                    this.hitPipe();
                }
            }
        }

        if (isCollidingWithPipe) {
            for (let pipe of this.pipes) {
                if (pipe.x <= this.bird.x + this.bird.width &&
                    pipe.x + this.pipeWidth > this.bird.x) {
                    if (pipe.x > this.bird.x + this.bird.width / 2) {
                        console.log('💀 Застряла между блоками!');
                        // Берем статью под птицей в момент врезания
                        this.landedArticle = this.getArticleUnderBird();
                        this.gameOver();
                        return;
                    }
                }
            }
        }

        if (this.bird.y < -10) {
            console.log('💀 Улетела за верхнюю границу!');
            // Берем статью под птицей в момент врезания
            this.landedArticle = this.getArticleUnderBird();
            this.gameOver();
            return;
        }

        if (this.bird.y + this.bird.height >= this.canvas.height - this.articleHeight) {
            this.landOnArticle();
        }
    }

    hitPipe() {
        if (!this.isHit) {
            this.isHit = true;
            this.hitCooldown = 15;
            this.hitCount++;
            console.log('💥 Столкновение с блоком! (всего: ' + this.hitCount + ')');
        }
    }

    landOnArticle() {
        // Находим статью под птицей
        this.landedArticle = this.getArticleUnderBird();

        if (this.landedArticle) {
            console.log('✅ Приземлились на статью:', this.landedArticle.title);
        }

        this.pause();
    }

    pause() {
        this.gameState = 'paused';

        if (this.landedArticle) {
            const articleInfo = document.querySelector('#pauseScreen #landedArticle');

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
        this.gameState = 'gameover';
        document.getElementById('finalScore').textContent = this.score;

        const deathMessage = document.querySelector('.death-message');

        // Показываем статью на которую упал
        if (this.landedArticle) {
            const articleInfo = document.querySelector('#gameOverScreen #landedArticle');
            if (articleInfo) {
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

        // Рисуем сетку
        this.drawGrid();

        // Рисуем птицу
        this.drawBird();

        // Рисуем трубы
        this.drawPipes();

        // Рисуем статьи
        this.drawArticles();

        // Рисуем счет
        if (this.gameState === 'playing') {
            this.drawScore();
        }
    }

    drawGrid() {
        this.ctx.strokeStyle = '#f0f0f0';
        this.ctx.lineWidth = 1;

        for (let x = 0; x < this.canvas.width; x += 40) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }

        for (let y = 0; y < this.canvas.height; y += 40) {
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

        const articleWidth = 230;
        const spacing = 10;

        for (let article of this.articles) {
            const x = article.x;
            const y = bottomY;

            if (x + articleWidth < 0 || x > this.canvas.width) {
                continue;
            }

            this.ctx.fillStyle = '#2a2a2a';
            this.ctx.fillRect(x + spacing, y + spacing, articleWidth - spacing * 2, this.articleHeight - spacing * 2);

            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x + spacing, y + spacing, articleWidth - spacing * 2, this.articleHeight - spacing * 2);

            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'bold 12px Arial, sans-serif';
            this.ctx.textAlign = 'left';

            const textX = x + spacing + 8;
            const textStartY = y + spacing + 20;
            const maxTextWidth = articleWidth - spacing * 2 - 16;

            const words = article.title.split(' ');
            let line = '';
            let lineY = textStartY;
            const lineHeight = 14;
            let lineCount = 0;
            const maxLines = 4;

            for (let i = 0; i < words.length; i++) {
                const testLine = line + words[i] + ' ';
                const metrics = this.ctx.measureText(testLine);

                if (metrics.width > maxTextWidth && line !== '') {
                    this.ctx.fillText(line.trim(), textX, lineY);
                    line = words[i] + ' ';
                    lineY += lineHeight;
                    lineCount++;

                    if (lineCount >= maxLines - 1) {
                        const remainingWords = words.slice(i + 1).join(' ');
                        if (remainingWords) {
                            line = line.trim() + '...';
                        }
                        break;
                    }
                } else {
                    line = testLine;
                }
            }

            if (line.trim()) {
                this.ctx.fillText(line.trim(), textX, lineY);
            }

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
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Инициализация игры при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    const game = new NewsFlappyGame();
});