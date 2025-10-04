// static/js/main.js

// --- Утилиты ---
function getCsrfToken() {
    const el = document.querySelector('meta[name="csrf-token"]');
    return el ? el.getAttribute('content') : null;
}

// Универсальный обработчик toggle favorite для кнопок с классом .favorite-btn или .bookmark-btn
async function toggleFavoriteRequest(articleId) {
    const url = `/favorite/toggle/${articleId}`; // ожидаем, что такой маршрут есть
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
            // если нет result — покажем сообщение в консоль и небольшое уведомление
            console.warn("Не удалось получить статус добавления/удаления избранного", result);
            // можно показать toast/alert: например:
            // alert("Не удалось обновить избранное. Проверьте консоль.");
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
            // открываем popup и одновременно показываем prompt для копирования
            window.open(telegram, "_blank", "width=600,height=400");
            // prompt для копирования (удобно на десктопе)
            setTimeout(() => {
                // Не блокирует, просто помогаем пользователю
                prompt("Скопируйте ссылку для шаринга:", url);
            }, 200);
        }
    });
}

// --- Инициализация после загрузки DOM ---
document.addEventListener("DOMContentLoaded", function () {
    try {
        initFavoriteButtons();
        initShareButtons();
        console.log("main.js: handlers initialized");
    } catch (err) {
        console.error("main.js init error", err);
    }
});


// Обработчик для краткой выжимки
document.getElementById('generateSummary').addEventListener('click', async function() {
    const btn = this;
    const loader = btn.querySelector('.summary-loader');
    const text = btn.querySelector('span');

    // Показываем загрузку
    btn.disabled = true;
    loader.style.display = 'inline-block';
    text.textContent = 'Генерируем...';

    try {
        const response = await fetch('/api/news-summary', {
            method: 'GET',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        const result = await response.json();

        if (result.success) {
            showSummaryModal(result.data);
        } else {
            alert('Ошибка: ' + (result.error || 'Не удалось создать выжимку'));
        }
    } catch (error) {
        console.error('Ошибка при получении выжимки:', error);
        alert('Не удалось создать выжимку. Попробуйте позже.');
    } finally {
        // Скрываем загрузку
        btn.disabled = false;
        loader.style.display = 'none';
        text.textContent = 'Краткая выжимка';
    }
});

// "Настройки источников сохранены!" сама исчезает и закрывается по кнопке
document.addEventListener("DOMContentLoaded", function() {
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
});
