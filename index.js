const express = require('express');
const { createClient } = require('redis');

const app = express();
const PORT = process.env.PORT || 3000;
const APP_MESSAGE = process.env.APP_MESSAGE || 'Количество посещений:';
const SERVICE_NAME = process.env.SERVICE_NAME || 'unknown';

// Имя 'redis-server' — это имя сервиса из back.docker-compose.yml
const client = createClient({
    url: process.env.REDIS_URL || 'redis://redis-server:6379',
});

client.on('error', (err) => console.log('Redis Client Error', err));

// Главная страница: увеличивает счётчик
app.get('/', async (req, res) => {
    try {
        const visits = await client.incr('visits');
        res.send(`${APP_MESSAGE} ${visits}`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Ошибка при обращении к Redis');
    }
});

// Сброс счётчика
app.get('/reset', async (req, res) => {
    try {
        await client.set('visits', 0);
        res.send('Счётчик сброшен');
    } catch (err) {
        res.status(500).send('Ошибка при сбросе');
    }
});

// Задание 2: статистика в JSON
app.get('/stats', async (req, res) => {
    try {
        const raw = await client.get('visits');
        res.json({
            visits: parseInt(raw ?? '0', 10),
            serverTime: new Date().toISOString(),
            service: SERVICE_NAME,
        });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка при обращении к Redis' });
    }
});

// Сначала подключаемся к Redis, потом запускаем HTTP-сервер
async function start() {
    await client.connect();
    app.listen(PORT, () => {
        console.log(`Сервер запущен на порту ${PORT}`);
    });
}

start();