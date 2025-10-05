// static/js/main.js - ПОЛНАЯ ВЕРСИЯ С МОБИЛЬНЫМ МЕНЮ

// --- Утилиты ---
function getCsrfToken() {
    const el = document.querySelector('meta[name="csrf-token"]');
    return el ? el.getAttribute('content') : null;
}

// Универсальный обработчик toggle favorite для кнопок с классом .favorite-btn или .bookmark-btn
async function toggleFavoriteRequest(articleId) {
    const url = `/favorite/toggle/${articleId}`;
    const headers = {
        "X-Requested-With": "XMLHttpRequest"
    };
    const csrf = getCsrfToken();
    if (csrf) headers["X-CSRFToken"] = csrf;

    try {
        const res = await fetch(url, {
            method: "POST",
            credentials: "same-origin",
            headers: headers
        });

        // Если сервер вернул редирект на логин — перенаправим
        if (res.redirected) {
            window.location.href = res.url;
            return null;
        }

        // Попытка распарсить JSON, с защитой от не-json ответов
        const text = await res.text();
        try {
            return JSON.parse(text);
        } catch (e) {
            console.error("Ответ не в JSON:", res.status, text);
            return null;
        }
    } catch (err) {
        console.error("Ошибка запроса toggleFavorite:", err);
        return null;
    }
}

function updateFavoriteUI(btn, status) {
    if (!btn) return;
    if (status === "added") {
        btn.classList.add("active");
        btn.setAttribute("title", "Убрать из избранного");
    } else if (status === "removed") {
        btn.classList.remove("active");
        btn.setAttribute("title", "Добавить в избранное");
        // Если мы на странице favorites — удаляем карточку
        const card = btn.closest(".news-card");
        if (card && window.location.pathname.includes("favorites")) {
            card.remove();
        }
    }
}

// Инициализация favorite (делегирование)
function initFavoriteButtons() {
    // делегирование: один обработчик на документ
    document.addEventListener("click", async function (e) {
        const btn = e.target.closest(".favorite-btn, .bookmark-btn, .action-btn.favorite-btn, .action-btn.bookmark-btn");
        if (!btn) return;
        // предотвращаем двойные срабатывания
        e.preventDefault();

        const articleId = btn.dataset.articleId;
        if (!articleId) {
            console.warn("Нет data-article-id у кнопки избранного", btn);
            return;
        }

        // визуальная индикация ожидания
        btn.classList.add("loading");
        const result = await toggleFavoriteRequest(articleId);
        btn.classList.remove("loading");

        if (result && result.status) {
            updateFavoriteUI(btn, result.status);
        } else {
            console.warn("Не удалось получить статус добавления/удаления избранного", result);
        }
    });
}

// --- Share ---
function initShareButtons() {
    document.addEventListener("click", function (e) {
        const btn = e.target.closest(".share-btn, .action-btn.share-btn");
        if (!btn) return;
        e.preventDefault();

        const url = btn.dataset.url;
        if (!url) {
            console.warn("Нет data-url у кнопки share", btn);
            return;
        }

        if (navigator.share) {
            navigator.share({ title: document.title, url: url }).catch(() => {});
        } else {
            // Фallback: открываем окно Telegram как быстрый способ, и показываем prompt
            const telegram = `https://t.me/share/url?url=${encodeURIComponent(url)}`;
            window.open(telegram, "_blank", "width=600,height=400");
            setTimeout(() => {
                prompt("Скопируйте ссылку для шаринга:", url);
            }, 200);
        }
    });
}

// --- Автоудаление flash сообщений ---
function initFlashMessages() {
    const alerts = document.querySelectorAll(".alert");

    alerts.forEach(alert => {
        // Кнопка закрытия (если есть)
        const closeBtn = alert.querySelector(".close-alert");
        if (closeBtn) {
            closeBtn.addEventListener("click", () => {
                alert.style.opacity = "0";
                setTimeout(() => alert.remove(), 300);
            });
        }

        // Автоудаление через 3 секунды
        setTimeout(() => {
            alert.style.opacity = "0";
            setTimeout(() => alert.remove(), 300);
        }, 3000);
    });
}

// --- Мобильное меню ---
function initMobileMenu() {
    const menuBtn = document.getElementById('mobileMenuBtn');
    const overlay = document.getElementById('mobileOverlay');
    const sidebar = document.getElementById('sidebar');
    const body = document.body;

    if (!menuBtn || !overlay || !sidebar) {
        console.warn("Элементы мобильного меню не найдены");
        return;
    }

    // Открытие/закрытие меню по кнопке
    menuBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleMobileMenu();
    });

    // Закрытие меню по клику на overlay
    overlay.addEventListener('click', function() {
        closeMobileMenu();
    });

    // Закрытие меню по клику на ссылку в меню
    const navLinks = sidebar.querySelectorAll('.nav-link, .logout-btn, .login-btn, .register-btn');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            // Небольшая задержка для визуального эффекта
            setTimeout(() => {
                closeMobileMenu();
            }, 150);
        });
    });

    // Закрытие меню по Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && body.classList.contains('menu-open')) {
            closeMobileMenu();
        }
    });

    // Закрытие меню при изменении размера окна (если перешли на десктоп)
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768 && body.classList.contains('menu-open')) {
            closeMobileMenu();
        }
    });

    function toggleMobileMenu() {
        const isOpen = body.classList.toggle('menu-open');
        menuBtn.classList.toggle('active');

        // Блокируем скролл body когда меню открыто
        if (isOpen) {
            body.style.overflow = 'hidden';
        } else {
            body.style.overflow = '';
        }

        console.log('Мобильное меню:', isOpen ? 'открыто' : 'закрыто');
    }

    function closeMobileMenu() {
        body.classList.remove('menu-open');
        menuBtn.classList.remove('active');
        body.style.overflow = '';
        console.log('Мобильное меню закрыто');
    }
}

// --- Плавная прокрутка для якорей ---
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#') return;

            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// --- Ленивая загрузка изображений (если браузер не поддерживает loading="lazy") ---
function initLazyLoading() {
    if ('loading' in HTMLImageElement.prototype) {
        // Браузер поддерживает нативную ленивую загрузку
        return;
    }

    // Полифилл для старых браузеров
    const images = document.querySelectorAll('img[loading="lazy"]');

    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src || img.src;
                img.classList.add('loaded');
                observer.unobserve(img);
            }
        });
    });

    images.forEach(img => imageObserver.observe(img));
}

// --- Улучшение производительности скролла ---
function initScrollPerformance() {
    let ticking = false;
    let lastScrollY = window.scrollY;

    window.addEventListener('scroll', function() {
        lastScrollY = window.scrollY;

        if (!ticking) {
            window.requestAnimationFrame(function() {
                handleScroll(lastScrollY);
                ticking = false;
            });

            ticking = true;
        }
    });

    function handleScroll(scrollY) {
        // Можно добавить логику, например показ кнопки "наверх"
        // или изменение стилей header при скролле
    }
}

// --- Обработка ошибок загрузки изображений ---
function initImageErrorHandling() {
    document.addEventListener('error', function(e) {
        if (e.target.tagName === 'IMG') {
            const img = e.target;
            // Устанавливаем placeholder если изображение не загрузилось
            if (!img.dataset.errorHandled) {
                img.dataset.errorHandled = 'true';

                // Создаем placeholder
                const placeholder = document.createElement('div');
                placeholder.className = 'news-image news-image-placeholder';
                placeholder.innerHTML = `
                    <div class="placeholder-icon">
                        <i class="fas fa-newspaper"></i>
                    </div>
                `;

                // Заменяем изображение на placeholder
                const parent = img.parentElement;
                if (parent && parent.classList.contains('news-image')) {
                    parent.innerHTML = placeholder.innerHTML;
                }
            }
        }
    }, true);
}

// --- Инициализация после загрузки DOM ---
document.addEventListener("DOMContentLoaded", function () {
    try {
        console.log("🚀 Инициализация main.js...");

        // Основные функции
        initFavoriteButtons();
        initShareButtons();
        initFlashMessages();
        initMobileMenu();

        // Дополнительные улучшения
        initSmoothScroll();
        initLazyLoading();
        initScrollPerformance();
        initImageErrorHandling();

        console.log("✅ main.js: все обработчики инициализированы");
    } catch (err) {
        console.error("❌ main.js init error:", err);
    }
});

// --- Экспорт функций для использования в других скриптах ---
window.NewsApp = {
    closeMobileMenu: function() {
        document.body.classList.remove('menu-open');
        document.getElementById('mobileMenuBtn')?.classList.remove('active');
        document.body.style.overflow = '';
    }
};