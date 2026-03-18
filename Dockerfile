FROM node:18-alpine

WORKDIR /app

# Копируем package.json и устанавливаем зависимости
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Копируем весь код проекта
COPY . .

# Создаём папку для базы данных
RUN mkdir -p /app/data

# Устанавливаем serve глобально для раздачи статических файлов
RUN npm install -g serve

# Открываем порты (5000 для API, 3000 для фронтенда)
EXPOSE 5000 3000

# Запускаем и бэкенд, и фронтенд
CMD sh -c "node backend/server.js & serve -s . -l 3000"