FROM node:22-alpine

WORKDIR /app

# Устанавливаем зависимости для сборки нативных модулей (argon2) и работы Prisma
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    libc6-compat

# Сначала копируем только файлы зависимостей для кеширования слоя
COPY package*.json ./

# Устанавливаем все зависимости
RUN npm ci

# Копируем исходный код проекта
COPY . .

# Генерируем клиент Prisma перед сборкой Next.js
RUN npx prisma generate

# Собираем production-билд проекта
RUN npm run build

# Указываем порт, который слушает контейнер
EXPOSE 3000

# Запускаем приложение
CMD ["npm", "start"]