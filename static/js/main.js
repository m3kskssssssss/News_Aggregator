// Основной JavaScript файл для новостного агрегатора

document.addEventListener('DOMContentLoaded', function() {
    // Закрытие flash сообщений
    initFlashMessages();

    // Ленивая загрузка изображений
    initLazyLoading();

    // Анимации при скролле
    initScrollAnimations();

    // Обработка форм
    initFormHandlers();

    // Интерактивные элементы
    initInteractiveElements();

    // Автоматическое обновление времени
    initTimeUpdates();
});

// Закрытие flash сообщений
function initFlashMessages() {
    const closeButtons = document.querySelectorAll('.close-alert');

    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const alert = this.parentElement;
            alert.style.opacity = '0';
            alert.style.transform = 'translateY(-10px)';

            setTimeout(() => {
                alert.remove();
            }, 300);
        });
    });

    // Автоматическое закрытие через 7 секунд
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(alert => {
        setTimeout(() => {
            const closeBtn = alert.querySelector('.close-alert');
            if (closeBtn) {
                closeBtn.click();
            }
        }, 7000);
    });
}

// Ленивая загрузка изображений
function initLazyLoading() {
    const images = document.querySelectorAll('img[loading="lazy"]');

    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.style.opacity = '0';
                    img.style.transition = 'opacity 0.6s ease';

                    img.onload = function() {
                        this.style.opacity = '1';
                    };

                    img.onerror = function() {
                        // Если изображение не загружается, показываем плейсхолдер
                        const container = this.parentElement;
                        container.classList.add('news-image-placeholder');
                        container.innerHTML = `
                            <div class="placeholder-icon">
                                <i class="fas fa-image"></i>
                            </div>
                            <div class="image-overlay">
                                <span class="source-badge">${container.dataset.source || 'Новости'}</span>
                            </div>
                        `;
                    };

                    observer.unobserve(img);
                }
            });
        });

        images.forEach(img => imageObserver.observe(img));
    }
}

// Анимации при скролле
function initScrollAnimations() {
    const cards = document.querySelectorAll('.modern-card');

    if ('IntersectionObserver' in window) {
        const cardObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        cards.forEach((card, index) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            card.style.transition = `opacity 0.8s ease ${index * 0.1}s, transform 0.8s ease ${index * 0.1}s`;
            cardObserver.observe(card);
        });
    }

    // Параллакс эффект для заголовка
    const newsHeader = document.querySelector('.news-header');
    if (newsHeader) {
        window.addEventListener('scroll', () => {
            const scrolled = window.pageYOffset;
            const rate = scrolled * -0.5;
            newsHeader.style.transform = `translateY(${rate}px)`;
        });
    }
}

// Обработка форм
function initFormHandlers() {
    // Настройки источников
    const sourceForm = document.querySelector('.settings-form');
    if (sourceForm) {
        initSourceSelection();
    }

    // Формы авторизации
    const authForms = document.querySelectorAll('.auth-form');
    authForms.forEach(initFormValidation);
}

// Выбор источников новостей
function initSourceSelection() {
    const sourceItems = document.querySelectorAll('.source-item');

    sourceItems.forEach(item => {
        const checkbox = item.querySelector('input[type="checkbox"]');
        const label = item.querySelector('.source-label');

        // Визуальная обратная связь при клике
        label.addEventListener('click', function() {
            setTimeout(() => {
                if (checkbox.checked) {
                    item.style.borderColor = 'var(--primary-color)';
                    item.style.background = 'rgba(99, 102, 241, 0.05)';
                    item.style.transform = 'translateY(-2px)';
                    item.style.boxShadow = 'var(--shadow-lg)';
                } else {
                    item.style.borderColor = 'rgba(99, 102, 241, 0.1)';
                    item.style.background = 'rgba(255, 255, 255, 0.9)';
                    item.style.transform = 'translateY(0)';
                    item.style.boxShadow = 'none';
                }
            }, 50);
        });

        // Инициализация текущего состояния
        if (checkbox.checked) {
            item.style.borderColor = 'var(--primary-color)';
            item.style.background = 'rgba(99, 102, 241, 0.05)';
            item.style.transform = 'translateY(-2px)';
            item.style.boxShadow = 'var(--shadow-lg)';
        }
    });
}

// Валидация форм
function initFormValidation(form) {
    const inputs = form.querySelectorAll('.form-input');

    inputs.forEach(input => {
        // Удаление ошибок при фокусе
        input.addEventListener('focus', function() {
            const errorContainer = this.parentElement.querySelector('.form-errors');
            if (errorContainer) {
                errorContainer.style.opacity = '0.5';
            }
            this.style.borderColor = 'var(--primary-color)';
        });

        // Восстановление ошибок при потере фокуса (если они есть)
        input.addEventListener('blur', function() {
            const errorContainer = this.parentElement.querySelector('.form-errors');
            if (errorContainer) {
                errorContainer.style.opacity = '1';
            }
            if (!this.value) {
                this.style.borderColor = 'var(--border-color)';
            }
        });

        // Реалтайм валидация для email
        if (input.type === 'email') {
            input.addEventListener('input', function() {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (this.value && !emailRegex.test(this.value)) {
                    this.style.borderColor = 'var(--error-color)';
                    this.style.boxShadow = '0 0 0 4px rgba(239, 68, 68, 0.1)';
                } else {
                    this.style.borderColor = 'var(--success-color)';
                    this.style.boxShadow = '0 0 0 4px rgba(16, 185, 129, 0.1)';
                }
            });
        }

        // Валидация паролей
        if (input.type === 'password' && input.name === 'password2') {
            const passwordField = form.querySelector('input[name="password"]');

            const validatePasswords = () => {
                if (input.value && passwordField.value !== input.value) {
                    input.style.borderColor = 'var(--error-color)';
                    input.style.boxShadow = '0 0 0 4px rgba(239, 68, 68, 0.1)';
                } else if (input.value) {
                    input.style.borderColor = 'var(--success-color)';
                    input.style.boxShadow = '0 0 0 4px rgba(16, 185, 129, 0.1)';
                }
            };

            input.addEventListener('input', validatePasswords);
            passwordField?.addEventListener('input', validatePasswords);
        }
    });
}

// Интерактивные элементы
function initInteractiveElements() {
    // Кнопки действий на карточках
    const actionButtons = document.querySelectorAll('.action-btn');

    actionButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();

            if (this.classList.contains('share-btn')) {
                handleShare(this);
            } else if (this.classList.contains('bookmark-btn')) {
                handleBookmark(this);
            }
        });
    });

    // Эффект нажатия на кнопки
    const buttons = document.querySelectorAll('.btn, .read-more-btn, .pagination-btn');
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            this.style.transform = 'scale(0.98)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
        });
    });

    // Плавная прокрутка для пагинации
    const paginationLinks = document.querySelectorAll('.pagination-btn');
    paginationLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Показываем загрузку
            showLoadingIndicator();
        });
    });
}

// Обработка кнопки "Поделиться"
function handleShare(button) {
    const card = button.closest('.news-card');
    const title = card.querySelector('.news-title a').textContent;
    const url = card.querySelector('.news-title a').href;

    if (navigator.share) {
        navigator.share({
            title: title,
            url: url
        }).catch(console.error);
    } else {
        // Fallback - копирование в буфер обмена
        navigator.clipboard.writeText(url).then(() => {
            showNotification('Ссылка скопирована в буфер обмена!', 'success');
        }).catch(() => {
            showNotification('Не удалось скопировать ссылку', 'error');
        });
    }

    // Анимация кнопки
    button.style.background = 'var(--success-color)';
    button.style.color = 'white';
    setTimeout(() => {
        button.style.background = '';
        button.style.color = '';
    }, 1000);
}

// Обработка кнопки "В закладки"
function handleBookmark(button) {
    const isBookmarked = button.classList.contains('bookmarked');

    if (isBookmarked) {
        button.classList.remove('bookmarked');
        button.innerHTML = '<i class="fas fa-bookmark"></i>';
        button.style.background = 'rgba(99, 102, 241, 0.1)';
        button.style.color = 'var(--primary-color)';
        showNotification('Удалено из закладок', 'info');
    } else {
        button.classList.add('bookmarked');
        button.innerHTML = '<i class="fas fa-bookmark"></i>';
        button.style.background = 'var(--warning-color)';
        button.style.color = 'white';
        showNotification('Добавлено в закладки!', 'success');
    }
}

// Обновление времени публикации
function initTimeUpdates() {
    const timeElements = document.querySelectorAll('.publish-date');

    function updateRelativeTime() {
        timeElements.forEach(element => {
            const timeText = element.textContent.trim();
            const match = timeText.match(/(\d{2})\.(\d{2})\.(\d{4}) (\d{2}):(\d{2})/);

            if (match) {
                const [, day, month, year, hour, minute] = match;
                const publishDate = new Date(year, month - 1, day, hour, minute);
                const now = new Date();
                const diffMs = now - publishDate;
                const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                const diffMinutes = Math.floor(diffMs / (1000 * 60));

                let relativeTime = '';
                if (diffMinutes < 60) {
                    relativeTime = `${diffMinutes} мин. назад`;
                } else if (diffHours < 24) {
                    relativeTime = `${diffHours} ч. назад`;
                } else {
                    relativeTime = timeText; // Оставляем оригинальное время
                }

                element.innerHTML = `<i class="fas fa-clock"></i> ${relativeTime}`;
            }
        });
    }

    // Обновляем время каждую минуту
    updateRelativeTime();
    setInterval(updateRelativeTime, 60000);
}

// Утилиты

// Показать уведомление
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type}`;
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.zIndex = '10000';
    notification.style.maxWidth = '400px';
    notification.style.animation = 'slideInRight 0.3s ease';
    notification.innerHTML = `
        <span>${message}</span>
        <button type="button" class="close-alert">&times;</button>
    `;

    document.body.appendChild(notification);

    // Добавляем обработчик закрытия
    const closeBtn = notification.querySelector('.close-alert');
    closeBtn.addEventListener('click', function() {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    });

    // Автоматическое закрытие
    setTimeout(() => {
        if (notification.parentElement) {
            closeBtn.click();
        }
    }, 5000);
}

// Показать индикатор загрузки
function showLoadingIndicator() {
    const loader = document.createElement('div');
    loader.className = 'loading-overlay';
    loader.innerHTML = `
        <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Загрузка новостей...</p>
        </div>
    `;

    // Стили для загрузчика
    loader.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.9);
        backdrop-filter: blur(5px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    `;

    const spinner = loader.querySelector('.loading-spinner');
    spinner.style.cssText = `
        text-align: center;
        color: var(--primary-color);
        font-size: 1.2rem;
    `;

    spinner.querySelector('i').style.cssText = `
        font-size: 2rem;
        display: block;
        margin-bottom: 1rem;
    `;

    document.body.appendChild(loader);

    // Удаляем загрузчик через 2 секунды (или когда страница загрузится)
    setTimeout(() => {
        if (loader.parentElement) {
            loader.style.opacity = '0';
            setTimeout(() => loader.remove(), 300);
        }
    }, 2000);
}

// Плавный скролл к элементу
function scrollToElement(element, offset = 0) {
    const elementPosition = element.offsetTop - offset;
    window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
    });
}

// Дебаунс функция
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Проверка видимости элемента
function isElementInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

// CSS анимации
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }

    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }

    .loading-overlay {
        transition: opacity 0.3s ease;
    }
`;
document.head.appendChild(style);

// Обработка ошибок
window.addEventListener('error', function(e) {
    console.error('JavaScript error:', e.error);
    // Можно добавить отправку ошибок на сервер для мониторинга
});

// Обработка событий клавиатуры
document.addEventListener('keydown', function(e) {
    // Esc - закрытие модальных окон или уведомлений
    if (e.key === 'Escape') {
        const alerts = document.querySelectorAll('.alert');
        alerts.forEach(alert => {
            const closeBtn = alert.querySelector('.close-alert');
            if (closeBtn) closeBtn.click();
        });
    }

    // Ctrl+R - обновление новостей (предотвращаем обычное обновление)
    if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        showNotification('Обновление новостей... Это может занять несколько секунд', 'info');
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    }
});