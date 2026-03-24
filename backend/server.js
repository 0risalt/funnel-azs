const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const { promisify } = require('util');

const app = express();
app.use(cors());
app.use(express.json());

// Раздача статических файлов (фронтенд)
app.use(express.static(path.join(__dirname, '..')));

// Обработка корневого маршрута
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// ========== НАСТРОЙКА БАЗЫ ДАННЫХ ==========
const dbPath = process.env.NODE_ENV === 'production'
    ? '/app/data/database.db'
    : './backend/database.db';

const db = new sqlite3.Database(dbPath);

// Преобразование методов SQLite в промисы
const dbAll = promisify(db.all.bind(db));
const dbGet = promisify(db.get.bind(db));
const dbRun = promisify(db.run.bind(db));

// ========== КЭШИРОВАНИЕ ==========
const cache = {
    fuels: { data: null, timestamp: 0 },
    products: { data: null, timestamp: 0 },
    bonus: { data: null, timestamp: 0 }
};
const CACHE_TTL = 60000; // 60 секунд

function isCacheValid(key) {
    return cache[key] && cache[key].data &&
        (Date.now() - cache[key].timestamp) < CACHE_TTL;
}

function invalidateCache(...keys) {
    keys.forEach(key => {
        if (cache[key]) {
            cache[key].data = null;
            cache[key].timestamp = 0;
            console.log(`🗑️ Кэш инвалидирован: ${key}`);
        }
    });
}

async function getCachedOrFresh(key, fetcher) {
    if (isCacheValid(key)) {
        console.log(`📦 Кэш: ${key}`);
        return cache[key].data;
    }
    console.log(`🔄 Обновление кэша: ${key}`);
    const fresh = await fetcher();
    cache[key] = { data: fresh, timestamp: Date.now() };
    return fresh;
}

// ========== ИНИЦИАЛИЗАЦИЯ БАЗЫ ДАННЫХ ==========
async function initializeDatabase() {
    try {
        await dbRun(`CREATE TABLE IF NOT EXISTS fuels (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            price TEXT NOT NULL,
            image TEXT NOT NULL
        )`);

        await dbRun(`CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            image TEXT NOT NULL
        )`);

        await dbRun(`CREATE TABLE IF NOT EXISTS bonuses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT DEFAULT 'default',
            amount REAL DEFAULT 32.50
        )`);

        const bonusCount = await dbGet("SELECT COUNT(*) as count FROM bonuses");
        if (bonusCount.count === 0) {
            await dbRun("INSERT INTO bonuses (user_id, amount) VALUES (?, ?)", ['default', 32.50]);
            console.log('✅ Бонусы добавлены в базу');
        } else {
            console.log('✅ Бонусы уже существуют');
        }

        const fuelCount = await dbGet("SELECT COUNT(*) as count FROM fuels");
        if (fuelCount.count === 0) {
            const fuels = [
                ['АИ-92', '52.5', 'images/AI92.png'],
                ['АИ-95', '58.0', 'images/AI95.png'],
                ['АИ-100', '68.5', 'images/AI100.png'],
                ['ДТ', '60.0', 'images/DT.png']
            ];
            for (const fuel of fuels) {
                await dbRun("INSERT INTO fuels (name, price, image) VALUES (?, ?, ?)", fuel);
            }
            console.log('✅ Начальные данные топлива добавлены');
        }

        const productCount = await dbGet("SELECT COUNT(*) as count FROM products");
        if (productCount.count === 0) {
            const products = [
                ['моторное масло', 'images/MotorOil.png'],
                ['тормозная жидкость', 'images/BrakeFluid.png'],
                ['незамерзающая жидкость', 'images/Antifreeze.png']
            ];
            for (const product of products) {
                await dbRun("INSERT INTO products (name, image) VALUES (?, ?)", product);
            }
            console.log('✅ Начальные данные товаров добавлены');
        }
    } catch (err) {
        console.error('❌ Ошибка инициализации БД:', err);
    }
}

initializeDatabase();

// ========== API ENDPOINTS ==========

// Получить все топливо (с кэшированием и логом)
app.get('/api/fuels', async (req, res) => {
    console.log('🔔 ПОЛУЧЕН ЗАПРОС /api/fuels');
    try {
        const fuels = await getCachedOrFresh('fuels', () => dbAll("SELECT * FROM fuels"));
        res.json(fuels);
    } catch (err) {
        console.error('❌ Ошибка получения топлива:', err);
        res.status(500).json({ error: err.message });
    }
});

// Получить все товары (с кэшированием)
app.get('/api/products', async (req, res) => {
    console.log('🔔 ПОЛУЧЕН ЗАПРОС /api/products');
    try {
        const products = await getCachedOrFresh('products', () => dbAll("SELECT * FROM products"));
        res.json(products);
    } catch (err) {
        console.error('❌ Ошибка получения товаров:', err);
        res.status(500).json({ error: err.message });
    }
});

// Получить бонусы (с кэшированием)
app.get('/api/bonus', async (req, res) => {
    console.log('🔔 ПОЛУЧЕН ЗАПРОС /api/bonus');
    try {
        const bonus = await getCachedOrFresh('bonus', async () => {
            const row = await dbGet("SELECT amount FROM bonuses WHERE user_id = 'default'");
            return row || { amount: 32.50 };
        });
        res.json(bonus);
    } catch (err) {
        console.error('❌ Ошибка получения бонусов:', err);
        res.status(500).json({ error: err.message });
    }
});

// Получить одно топливо по ID
app.get('/api/fuels/:id', async (req, res) => {
    console.log(`🔔 ПОЛУЧЕН ЗАПРОС /api/fuels/${req.params.id}`);
    const id = req.params.id;
    try {
        const fuel = await dbGet("SELECT * FROM fuels WHERE id = ?", [id]);
        if (!fuel) {
            return res.status(404).json({ error: 'Топливо не найдено' });
        }
        res.json(fuel);
    } catch (err) {
        console.error('❌ Ошибка получения топлива:', err);
        res.status(500).json({ error: err.message });
    }
});

// Добавить топливо (с инвалидацией кэша)
app.post('/api/fuels', async (req, res) => {
    console.log('🔔 ПОЛУЧЕН ЗАПРОС POST /api/fuels');
    console.log('📦 Тело запроса:', req.body);
    const { name, price, image } = req.body;
    if (!name || !price) {
        return res.status(400).json({ error: 'Name and price are required' });
    }
    try {
        await dbRun(
            "INSERT INTO fuels (name, price, image) VALUES (?, ?, ?)",
            [name, price, image || 'images/default.png']
        );
        invalidateCache('fuels');
        res.json({ message: 'Fuel added successfully' });
    } catch (err) {
        console.error('❌ Ошибка добавления топлива:', err);
        res.status(500).json({ error: err.message });
    }
});

// Обновить топливо (с инвалидацией кэша)
app.put('/api/fuels/:id', async (req, res) => {
    console.log(`🔔 ПОЛУЧЕН ЗАПРОС PUT /api/fuels/${req.params.id}`);
    const id = req.params.id;
    const { name, price, image } = req.body;
    try {
        const result = await dbRun(
            "UPDATE fuels SET name = ?, price = ?, image = ? WHERE id = ?",
            [name, price, image, id]
        );
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Топливо не найдено' });
        }
        invalidateCache('fuels');
        res.json({ message: 'Топливо обновлено' });
    } catch (err) {
        console.error('❌ Ошибка обновления топлива:', err);
        res.status(500).json({ error: err.message });
    }
});

// Удалить топливо (с инвалидацией кэша)
app.delete('/api/fuels/:id', async (req, res) => {
    console.log(`🔔 ПОЛУЧЕН ЗАПРОС DELETE /api/fuels/${req.params.id}`);
    const id = req.params.id;
    try {
        const result = await dbRun("DELETE FROM fuels WHERE id = ?", id);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Fuel not found' });
        }
        invalidateCache('fuels');
        res.json({ message: 'Fuel deleted successfully' });
    } catch (err) {
        console.error('❌ Ошибка удаления топлива:', err);
        res.status(500).json({ error: err.message });
    }
});

// Получить все товары для админки
app.get('/api/admin/products', async (req, res) => {
    console.log('🔔 ПОЛУЧЕН ЗАПРОС /api/admin/products');
    try {
        const products = await dbAll("SELECT * FROM products");
        res.json(products);
    } catch (err) {
        console.error('❌ Ошибка получения товаров:', err);
        res.status(500).json({ error: err.message });
    }
});

// Добавить товар (с инвалидацией кэша)
app.post('/api/products', async (req, res) => {
    console.log('🔔 ПОЛУЧЕН ЗАПРОС POST /api/products');
    const { name, image } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Название товара обязательно' });
    }
    try {
        await dbRun(
            "INSERT INTO products (name, image) VALUES (?, ?)",
            [name, image || 'images/default.png']
        );
        invalidateCache('products');
        res.json({ message: 'Товар добавлен' });
    } catch (err) {
        console.error('❌ Ошибка добавления товара:', err);
        res.status(500).json({ error: err.message });
    }
});

// Обновить товар (с инвалидацией кэша)
app.put('/api/products/:id', async (req, res) => {
    console.log(`🔔 ПОЛУЧЕН ЗАПРОС PUT /api/products/${req.params.id}`);
    const id = req.params.id;
    const { name, image } = req.body;
    try {
        const result = await dbRun(
            "UPDATE products SET name = ?, image = ? WHERE id = ?",
            [name, image, id]
        );
        invalidateCache('products');
        res.json({ message: 'Товар обновлен' });
    } catch (err) {
        console.error('❌ Ошибка обновления товара:', err);
        res.status(500).json({ error: err.message });
    }
});

// Удалить товар (с инвалидацией кэша)
app.delete('/api/products/:id', async (req, res) => {
    console.log(`🔔 ПОЛУЧЕН ЗАПРОС DELETE /api/products/${req.params.id}`);
    const id = req.params.id;
    try {
        await dbRun("DELETE FROM products WHERE id = ?", id);
        invalidateCache('products');
        res.json({ message: 'Товар удален' });
    } catch (err) {
        console.error('❌ Ошибка удаления товара:', err);
        res.status(500).json({ error: err.message });
    }
});

// Логин
app.post('/api/login', (req, res) => {
    console.log('🔔 ПОЛУЧЕН ЗАПРОС POST /api/login');
    const { password } = req.body;
    if (password === 'admin') {
        res.json({ success: true, message: 'Login successful' });
    } else {
        res.status(401).json({ success: false, message: 'Invalid password' });
    }
});

// Обновить бонусы (с инвалидацией кэша)
app.post('/api/bonus/update', async (req, res) => {
    console.log('🔔 ПОЛУЧЕН ЗАПРОС POST /api/bonus/update');
    const { change } = req.body;
    if (change === undefined) {
        return res.status(400).json({ error: 'Не указана сумма изменения' });
    }
    try {
        const row = await dbGet("SELECT amount FROM bonuses WHERE user_id = 'default'");
        const newAmount = row ? Number(row.amount) + Number(change) : change;

        if (!row) {
            await dbRun(
                "INSERT INTO bonuses (user_id, amount) VALUES (?, ?)",
                ['default', newAmount]
            );
        } else {
            await dbRun(
                "UPDATE bonuses SET amount = ? WHERE user_id = 'default'",
                [newAmount]
            );
        }

        invalidateCache('bonus');
        res.json({ amount: newAmount, message: 'Бонусы обновлены' });
    } catch (err) {
        console.error('❌ Ошибка обновления бонусов:', err);
        res.status(500).json({ error: err.message });
    }
});

// Установить бонусы (с инвалидацией кэша)
app.post('/api/bonus/set', async (req, res) => {
    console.log('🔔 ПОЛУЧЕН ЗАПРОС POST /api/bonus/set');
    const { amount } = req.body;
    if (amount === undefined) {
        return res.status(400).json({ error: 'Не указана сумма' });
    }
    try {
        await dbRun(
            "UPDATE bonuses SET amount = ? WHERE user_id = 'default'",
            [amount]
        );
        invalidateCache('bonus');
        res.json({ amount: amount, message: 'Бонусы установлены' });
    } catch (err) {
        console.error('❌ Ошибка установки бонусов:', err);
        res.status(500).json({ error: err.message });
    }
});

// ========== ЗАПУСК СЕРВЕРА ==========
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`\n🚀 Сервер запущен на http://localhost:${PORT}`);
    console.log(`📁 База данных: backend/database.db`);
    console.log(`⚡ Кэширование включено (TTL: ${CACHE_TTL / 1000} сек)`);
    console.log(`🔄 Асинхронная обработка запросов активирована\n`);
    console.log('📌 Доступные эндпоинты:');
    console.log('   GET  /api/bonus     - получить бонусы');
    console.log('   POST /api/bonus/update - обновить бонусы');
    console.log('   POST /api/bonus/set - установить бонусы');
    console.log('   GET  /api/fuels     - получить топливо');
    console.log('   GET  /api/products  - получить товары\n');
});