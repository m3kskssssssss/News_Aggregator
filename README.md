# Агрегатор новостей

## Быстрый старт с Docker:

```bash
docker-compose up --build
```
Приложение будет доступно по адресу `http://localhost:5000`

**Требуется обязательная регистрация** — для полного доступа необходимо зарегистрироваться или войти в систему как администратор (логин: admin, пароль: password123).

## Скриншоты:

<img width="1898" height="919" alt="image" src="https://github.com/user-attachments/assets/7d74abc3-1c02-4772-9cf2-f93181c72943" />
<img width="1900" height="922" alt="image" src="https://github.com/user-attachments/assets/1e9ec8bb-c236-4cb0-b1f0-18e1fe34a3f2" />
<img width="1919" height="916" alt="image" src="https://github.com/user-attachments/assets/4e89dc9a-678d-4a2f-bd96-710b27f2fa66" />
<img width="1901" height="923" alt="image" src="https://github.com/user-attachments/assets/6957ee24-cc6c-4afa-8155-17730de65d8f" />
<img width="1919" height="924" alt="image" src="https://github.com/user-attachments/assets/6823ec1b-1041-4691-8423-7565a525413a" />
<img width="1916" height="918" alt="image" src="https://github.com/user-attachments/assets/b6a84497-36cb-454f-862b-738900c0d30c" />
<img width="422" height="817" alt="image" src="https://github.com/user-attachments/assets/ae9ab8d1-92bb-4b2c-a091-566cddcf4c05" />
<img width="420" height="818" alt="image" src="https://github.com/user-attachments/assets/26038b93-b6f9-4e26-afcc-940fc836be2b" />


## Архитектура:

```mermaid
graph TD
    A[Client] --> B[Flask Application]
    B --> C[PostgreSQL Database]
    B --> D[NewsAPI Integration]
    B --> E[RSS Feeds]
    F[Background Workers] --> B
    G[Authentication System] --> B
    
    subgraph "Core Components"
        H[User Management]
        I[News Fetcher]
        J[Summary Generator]
        K[Search Engine]
    end
    
    B --> H
    B --> I
    B --> J
    B --> K
```

## Основные функции:

### Интеллектуальная обработка новостей
- **Краткие изложения на основе ИИ** — автоматическое обобщение новостей с использованием алгоритма LSA
- **Фильтрация по темам** — интеллектуальная категоризация (политика, технологии, экономика, спорт, культура, наука)
- **Объединение нескольких источников** — NewsAPI + RSS-каналы крупных российских новостных изданий

### Персонализация пользователя
- ** Настраиваемые источники новостей ** - Выбираемые пользователем источники новостей
- **Персонализированная лента новостей ** - Контент, созданный искусственным интеллектом на основе предпочтений
- ** Система избранного ** - Добавляйте в закладки и сохраняйте важные статьи

### Расширенные функциональные возможности
- ** Поиск в реальном времени ** - Полнотекстовый поиск по всем статьям
- ** Автоматическое обновление ** - Обновление новостей каждые 2 часа
- **RESTful API ** - Конечные точки JSON для сводок новостей и данных

### Технические моменты
- **JWT-аутентификация** — защита пользовательских сессий
- **Фоновые рабочие процессы** — асинхронная обработка новостей
- **Адаптивный дизайн** — интерфейс, оптимизированный для мобильных устройств
- **Развертывание в Docker** — архитектура микросервисов в контейнерах

## Набор технологий
- **Бэкенд**: Flask, SQLAlchemy, PostgreSQL
- **Искусственный интеллект и машинное обучение**: NLTK, Sumy для обобщения текста
- **Фронтенд**: современный CSS3, ванильный JavaScript, адаптация для мобильных телефонов и планшетов
- **Инфраструктура**: Docker, Docker Compose
- **API**: NewsAPI, парсинг RSS
