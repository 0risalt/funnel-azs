const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Определяем путь к БД в зависимости от окружения
const dbPath = process.env.NODE_ENV === 'production'
    ? '/app/data/database.db'   // внутри Docker
    : './backend/database.db';   // локально

const db = new sqlite3.Database(dbPath);

// Создаем таблицы и добавляем начальные данные
db.serialize(() => {
    // Таблица для топлива
    db.run(`CREATE TABLE IF NOT EXISTS fuels (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        price TEXT NOT NULL,
        image TEXT NOT NULL
    )`);

    // Таблица для товаров
    db.run(`CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        image TEXT NOT NULL
    )`);

    // Таблица для бонусов
    db.run(`CREATE TABLE IF NOT EXISTS bonuses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT DEFAULT 'default',
        amount REAL DEFAULT 32.50
    )`);

    // Проверяем, есть ли запись о бонусах
    db.get("SELECT COUNT(*) as count FROM bonuses", (err, row) => {
        if (err) {
            console.error('❌ Ошибка проверки бонусов:', err);
            return;
        }

        if (row.count === 0) {
            // Добавляем начальный бонус
            db.run("INSERT INTO bonuses (user_id, amount) VALUES (?, ?)",
                ['default', 32.50],
                function (err) {
                    if (err) {
                        console.error('❌ Ошибка добавления бонусов:', err);
                    } else {
                        console.log('✅ Бонусы добавлены в базу');
                    }
                });
        } else {
            console.log('✅ Бонусы уже существуют в базе');
        }
    });

    // Проверяем, есть ли данные в таблице fuels
    db.get("SELECT COUNT(*) as count FROM fuels", (err, row) => {
        if (err) {
            console.error('❌ Ошибка проверки топлива:', err);
            return;
        }

        if (row.count === 0) {
            // Добавляем начальные данные по топливу
            const fuels = [
                ['АИ-92', '52.5', 'images/AI92.png'],
                ['АИ-95', '58.0', 'images/AI95.png'],
                ['АИ-100', '68.5', 'images/AI100.png'],
                ['ДТ', '60.0', 'images/DT.png']
            ];

            const stmt = db.prepare("INSERT INTO fuels (name, price, image) VALUES (?, ?, ?)");
            fuels.forEach(fuel => stmt.run(fuel));
            stmt.finalize();
            console.log('✅ Начальные данные топлива добавлены');
        }
    });

    // Проверяем, есть ли данные в таблице products
    db.get("SELECT COUNT(*) as count FROM products", (err, row) => {
        if (err) {
            console.error('❌ Ошибка проверки товаров:', err);
            return;
        }

        if (row.count === 0) {
            // Добавляем начальные данные по товарам
            const products = [
                ['моторное масло', 'images/MotorOil.png'],
                ['тормозная жидкость', 'images/BrakeFluid.png'],
                ['незамерзающая жидкость', 'images/Antifreeze.png']
            ];

            const stmt = db.prepare("INSERT INTO products (name, image) VALUES (?, ?)");
            products.forEach(product => stmt.run(product));
            stmt.finalize();
            console.log('✅ Начальные данные товаров добавлены');
        }
    });
});

// ========== API ENDPOINTS ==========

// Получить все топливо
app.get('/api/fuels', (req, res) => {
    db.all("SELECT * FROM fuels", [], (err, rows) => {
        if (err) {
            console.error('❌ Ошибка получения топлива:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Получить все товары
app.get('/api/products', (req, res) => {
    db.all("SELECT * FROM products", [], (err, rows) => {
        if (err) {
            console.error('❌ Ошибка получения товаров:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Добавить топливо (для админки)
app.post('/api/fuels', (req, res) => {
    const { name, price, image } = req.body;

    if (!name || !price) {
        res.status(400).json({ error: 'Name and price are required' });
        return;
    }

    db.run(
        "INSERT INTO fuels (name, price, image) VALUES (?, ?, ?)",
        [name, price, image || 'images/default.png'],
        function (err) {
            if (err) {
                console.error('❌ Ошибка добавления топлива:', err);
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ id: this.lastID, message: 'Fuel added successfully' });
        }
    );
});

// Удалить топливо (для админки)
app.delete('/api/fuels/:id', (req, res) => {
    const id = req.params.id;

    db.run("DELETE FROM fuels WHERE id = ?", id, function (err) {
        if (err) {
            console.error('❌ Ошибка удаления топлива:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        if (this.changes === 0) {
            res.status(404).json({ error: 'Fuel not found' });
            return;
        }
        res.json({ message: 'Fuel deleted successfully' });
    });
});

// Логин (простая проверка)
app.post('/api/login', (req, res) => {
    const { password } = req.body;

    if (password === 'admin') {
        res.json({ success: true, message: 'Login successful' });
    } else {
        res.status(401).json({ success: false, message: 'Invalid password' });
    }
});

// ========== НОВЫЕ API ДЛЯ АДМИНКИ ==========

// Получить одно топливо по ID
app.get('/api/fuels/:id', (req, res) => {
    const id = req.params.id;

    db.get("SELECT * FROM fuels WHERE id = ?", [id], (err, row) => {
        if (err) {
            console.error('❌ Ошибка получения топлива:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        if (!row) {
            res.status(404).json({ error: 'Топливо не найдено' });
            return;
        }
        res.json(row);
    });
});

// Обновить топливо
app.put('/api/fuels/:id', (req, res) => {
    const id = req.params.id;
    const { name, price, image } = req.body;

    db.run(
        "UPDATE fuels SET name = ?, price = ?, image = ? WHERE id = ?",
        [name, price, image, id],
        function (err) {
            if (err) {
                console.error('❌ Ошибка обновления топлива:', err);
                res.status(500).json({ error: err.message });
                return;
            }
            if (this.changes === 0) {
                res.status(404).json({ error: 'Топливо не найдено' });
                return;
            }
            res.json({ message: 'Топливо обновлено' });
        }
    );
});

// Получить все товары для админки
app.get('/api/admin/products', (req, res) => {
    db.all("SELECT * FROM products", [], (err, rows) => {
        if (err) {
            console.error('❌ Ошибка получения товаров:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        res.json(rows);
    });
});

// Добавить товар
app.post('/api/products', (req, res) => {
    const { name, image } = req.body;

    if (!name) {
        res.status(400).json({ error: 'Название товара обязательно' });
        return;
    }

    db.run(
        "INSERT INTO products (name, image) VALUES (?, ?)",
        [name, image || 'images/default.png'],
        function (err) {
            if (err) {
                console.error('❌ Ошибка добавления товара:', err);
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ id: this.lastID, message: 'Товар добавлен' });
        }
    );
});

// Обновить товар
app.put('/api/products/:id', (req, res) => {
    const id = req.params.id;
    const { name, image } = req.body;

    db.run(
        "UPDATE products SET name = ?, image = ? WHERE id = ?",
        [name, image, id],
        function (err) {
            if (err) {
                console.error('❌ Ошибка обновления товара:', err);
                res.status(500).json({ error: err.message });
                return;
            }
            res.json({ message: 'Товар обновлен' });
        }
    );
});

// Удалить товар
app.delete('/api/products/:id', (req, res) => {
    const id = req.params.id;

    db.run("DELETE FROM products WHERE id = ?", id, function (err) {
        if (err) {
            console.error('❌ Ошибка удаления товара:', err);
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ message: 'Товар удален' });
    });
});

// ========== API ДЛЯ БОНУСОВ ==========

// Получить текущий баланс бонусов
app.get('/api/bonus', (req, res) => {
    db.get("SELECT amount FROM bonuses WHERE user_id = 'default'", (err, row) => {
        if (err) {
            console.error('❌ Ошибка получения бонусов:', err);
            res.status(500).json({ error: err.message });
            return;
        }

        if (!row) {
            // Если нет записи, создаем
            db.run("INSERT INTO bonuses (user_id, amount) VALUES (?, ?)",
                ['default', 32.50],
                function (err) {
                    if (err) {
                        res.status(500).json({ error: err.message });
                        return;
                    }
                    res.json({ amount: 32.50 });
                });
        } else {
            res.json({ amount: row.amount });
        }
    });
});

// Обновить бонусы (прибавить или вычесть)
app.post('/api/bonus/update', (req, res) => {
    console.log('📥 Получен запрос на обновление бонусов');
    console.log('📦 Тело запроса:', req.body);

    const { change } = req.body;

    if (change === undefined) {
        console.log('❌ Ошибка: change не указан');
        res.status(400).json({ error: 'Не указана сумма изменения' });
        return;
    }

    db.get("SELECT amount FROM bonuses WHERE user_id = 'default'", (err, row) => {
        if (err) {
            console.error('❌ Ошибка БД:', err);
            res.status(500).json({ error: err.message });
            return;
        }

        if (!row) {
            // Если нет записи, создаем
            db.run("INSERT INTO bonuses (user_id, amount) VALUES (?, ?)",
                ['default', change],
                function (err) {
                    if (err) {
                        res.status(500).json({ error: err.message });
                        return;
                    }
                    console.log('✅ Создана новая запись бонусов:', change);
                    res.json({ amount: change, message: 'Бонусы созданы' });
                });
        } else {
            console.log('💰 Текущий баланс:', row.amount);
            console.log('📊 Изменение:', change);

            const newAmount = Number(row.amount) + Number(change);
            console.log('✨ Новый баланс:', newAmount);

            db.run(
                "UPDATE bonuses SET amount = ? WHERE user_id = 'default'",
                [newAmount],
                function (err) {
                    if (err) {
                        console.error('❌ Ошибка обновления БД:', err);
                        res.status(500).json({ error: err.message });
                        return;
                    }

                    console.log('✅ Бонусы обновлены в БД');
                    res.json({ amount: newAmount, message: 'Бонусы обновлены' });
                }
            );
        }
    });
});

// Установить новое значение бонусов
app.post('/api/bonus/set', (req, res) => {
    console.log('📥 Получен запрос на установку бонусов');
    console.log('📦 Тело запроса:', req.body);

    const { amount } = req.body;

    if (amount === undefined) {
        console.log('❌ Ошибка: amount не указан');
        res.status(400).json({ error: 'Не указана сумма' });
        return;
    }

    db.run(
        "UPDATE bonuses SET amount = ? WHERE user_id = 'default'",
        [amount],
        function (err) {
            if (err) {
                console.error('❌ Ошибка обновления БД:', err);
                res.status(500).json({ error: err.message });
                return;
            }

            console.log('✅ Бонусы установлены в БД:', amount);
            res.json({ amount: amount, message: 'Бонусы установлены' });
        }
    );
});

// Запуск сервера
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`\n🚀 Сервер запущен на http://localhost:${PORT}`);
    console.log(`📁 База данных: backend/database.db`);
    console.log('\n📌 Доступные эндпоинты:');
    console.log('   GET  /api/bonus     - получить бонусы');
    console.log('   POST /api/bonus/update - обновить бонусы');
    console.log('   POST /api/bonus/set - установить бонусы');
    console.log('   GET  /api/fuels     - получить топливо');
    console.log('   GET  /api/products  - получить товары\n');
});