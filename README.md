# YouPipe — Видеоплатформа

Веб-платформа для хостинга видеоконтента, реализованная на стеке Django и React. Проект включает систему авторизации, загрузку видео и чат в реальном времени.

## Технологический стек
* **Backend:** Django, Django REST Framework, JWT (аутентификация).
* **Frontend:** React JS, React Router.
* **Database:** PostgreSQL (хостинг Neon.tech).
* **Deployment:** Render.

## Документация API

Для доступа к защищенным методам необходимо передать JWT-токен в заголовке запроса: `Authorization: Bearer <token>`.

| Метод | Эндпоинт | Описание | [Auth] |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register/` | Регистрация пользователя | - |
| `POST` | `/api/auth/login/` | Получение access/refresh токенов | - |
| `GET` | `/api/videos/` | Список всех видео | - |
| `POST` | `/api/videos/` | Загрузка нового видео | Да |
| `GET` | `/api/chat/` | История сообщений чата | Да |
| `POST` | `/api/chat/` | Отправка сообщения | Да |

## Развертывание локально

### Требования
* Python 3.x
* Node.js & npm

### Установка

1. **Клонирование:**
   ```bash
   git clone [https://github.com/artemlenskih/youpipe.git](https://github.com/artemlenskih/youpipe.git)
   cd youpipe
   ```

2. **Backend:**
   ```bash
   cd backend
   pip install -r requirements.txt
   python manage.py migrate
   python manage.py runserver
   ```
3. **Frontend:**
    ```bash
    cd frontend
    npm install
    npm start
    ```