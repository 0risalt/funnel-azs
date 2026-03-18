FROM node:18-alpine

WORKDIR /app

# Копируем package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci --only=production

# Копируем все файлы проекта
COPY . .

# Создаем папку для базы данных
RUN mkdir -p /app/data

# Указываем порт
EXPOSE 5000

# Запускаем сервер
CMD ["node", "backend/server.js"]