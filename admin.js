// Админ-панель функциональность

document.addEventListener('DOMContentLoaded', function () {
    const API_URL = 'http://localhost:5000/api';

    // Элементы админ-панели
    const viewBtn = document.querySelector('.view-btn');
    const addBtn = document.querySelector('.add-btn');
    const editBtn = document.querySelector('.edit-btn');
    const deleteBtn = document.querySelector('.delete-btn');

    // Создаем контейнер для основного контента
    const adminContent = document.querySelector('.admin-content');
    if (!adminContent) return;

    // Очищаем и создаем новую структуру
    adminContent.innerHTML = '';

    // Создаем левую панель с кнопками
    const leftPanel = document.createElement('div');
    leftPanel.style.cssText = `
        width: 450px;
        display: flex;
        flex-direction: column;
        gap: 15px;
        position: fixed;
        left: 50px;
        top: 20px;
    `;

    // Создаем правую панель для таблицы и бонусов
    const rightPanel = document.createElement('div');
    rightPanel.style.cssText = `
        width: calc(100% - 550px);
        margin-left: 520px;
        padding: 20px;
        display: flex;
        flex-direction: column;
        gap: 30px;
    `;

    // Создаем кнопки админ-панели
    const buttons = [
        { text: 'ПРОСМОТР', class: 'view-btn', color: '#4CAF50' },
        { text: 'ДОБАВЛЕНИЕ', class: 'add-btn', color: '#2196F3' },
        { text: 'ИЗМЕНЕНИЕ', class: 'edit-btn', color: '#FF9800' },
        { text: 'УДАЛЕНИЕ', class: 'delete-btn', color: '#F44336' }
    ];

    buttons.forEach(btn => {
        const button = document.createElement('button');
        button.className = `admin-btn ${btn.class}`;
        button.style.cssText = `
            width: 100%;
            height: 70px;
            background-color: #D9D9D9;
            border: none;
            border-radius: 5px;
            color: #000000;
            font-family: 'Inter Extra Bold', sans-serif;
            font-size: 20px;
            cursor: pointer;
            position: relative;
            overflow: hidden;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        `;

        button.innerHTML = `
            <span class="btn-text" style="position: relative; z-index: 1;">${btn.text}</span>
            <div class="btn-hover-effect" style="position: absolute; top: 0; left: -100%; width: 100%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent); transition: left 0.5s ease;"></div>
        `;

        button.addEventListener('mouseenter', () => {
            button.style.backgroundColor = btn.color;
            button.style.color = 'white';
        });

        button.addEventListener('mouseleave', () => {
            button.style.backgroundColor = '#D9D9D9';
            button.style.color = '#000000';
        });

        leftPanel.appendChild(button);
    });

    // Кнопка выхода
    const logoutBtn = document.createElement('button');
    logoutBtn.id = 'logout-btn';
    logoutBtn.style.cssText = `
        width: 100%;
        height: 70px;
        background-color: #249AE3;
        border: none;
        border-radius: 5px;
        color: white;
        font-family: 'Inter Extra Bold', sans-serif;
        font-size: 20px;
        cursor: pointer;
        position: relative;
        overflow: hidden;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 6px rgba(36, 154, 227, 0.3);
        margin-top: 30px;
    `;

    logoutBtn.innerHTML = `
        <span class="btn-text" style="position: relative; z-index: 1;">ВЫХОД</span>
        <div class="btn-hover-effect" style="position: absolute; top: 0; left: -100%; width: 100%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent); transition: left 0.5s ease;"></div>
    `;

    logoutBtn.addEventListener('click', async function () {
        const confirmed = await modal.showConfirm('Подтверждение', 'Вы действительно хотите выйти из админ-панели?');

        if (confirmed) {
            const adminScreen = document.getElementById('admin-screen');
            const mainScreen = document.getElementById('main-screen');

            adminScreen.style.opacity = '0';
            setTimeout(function () {
                adminScreen.style.display = 'none';
                mainScreen.style.display = 'block';
                setTimeout(() => {
                    mainScreen.style.opacity = '1';
                }, 10);

                modal.showAlert('До свидания!', '👋 Вы вышли из админ-панели');
            }, 500);
        }
    });

    leftPanel.appendChild(logoutBtn);

    // Контейнер для результатов (таблицы)
    const resultContainer = document.createElement('div');
    resultContainer.id = 'admin-result';
    resultContainer.style.cssText = `
        background: rgba(255,255,255,0.1);
        border-radius: 10px;
        color: white;
        width: 100%;
        min-height: 200px;
        max-height: 350px;
        overflow-y: auto;
        border: 1px solid #444;
    `;

    // Контейнер для бонусов
    const bonusContainer = document.createElement('div');
    bonusContainer.id = 'bonus-section';
    bonusContainer.style.cssText = `
        background: rgba(36, 154, 227, 0.1);
        border-radius: 10px;
        padding: 20px;
        border: 1px solid #249AE3;
        width: 100%;
    `;

    bonusContainer.innerHTML = `
        <h3 style="color: #249AE3; margin-bottom: 15px; text-align: center; font-size: 20px;">🎯 УПРАВЛЕНИЕ БОНУСАМИ</h3>
        <div style="display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
            <button id="bonus-view" style="padding: 10px 15px; background: #4CAF50; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px; min-width: 120px;">ПРОВЕРИТЬ</button>
            <button id="bonus-add" style="padding: 10px 15px; background: #2196F3; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px; min-width: 120px;">+ ДОБАВИТЬ</button>
            <button id="bonus-subtract" style="padding: 10px 15px; background: #FF9800; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px; min-width: 120px;">- СПИСАТЬ</button>
            <button id="bonus-set" style="padding: 10px 15px; background: #9C27B0; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px; min-width: 120px;">УСТАНОВИТЬ</button>
        </div>
        <div id="bonus-status" style="margin-top: 15px; text-align: center; font-size: 16px; color: white; background: rgba(0,0,0,0.3); padding: 10px; border-radius: 5px;"></div>
    `;

    rightPanel.appendChild(resultContainer);
    rightPanel.appendChild(bonusContainer);

    adminContent.appendChild(leftPanel);
    adminContent.appendChild(rightPanel);

    // Функция для отображения результатов
    window.showAdminResult = function (data, title) {
        let html = `<h3 style="color: #249AE3; margin: 15px; font-size: 18px;">${title}</h3>`;

        if (Array.isArray(data)) {
            if (data.length === 0) {
                html += '<p style="text-align: center; color: #999; padding: 20px;">Нет данных</p>';
            } else {
                html += '<div style="overflow-x: auto;">';
                html += '<table style="width: 100%; border-collapse: collapse; font-size: 13px;">';
                html += '<tr style="background: #249AE3; color: white;">';
                Object.keys(data[0]).forEach(key => {
                    html += `<th style="padding: 8px; text-align: left;">${key}</th>`;
                });
                html += '</tr>';

                data.forEach((item, index) => {
                    const bgColor = index % 2 === 0 ? 'rgba(255,255,255,0.05)' : 'transparent';
                    html += `<tr style="background: ${bgColor};">`;
                    Object.values(item).forEach(val => {
                        html += `<td style="padding: 8px; border-bottom: 1px solid #333;">${val}</td>`;
                    });
                    html += '</tr>';
                });
                html += '</table>';
                html += '</div>';
            }
        } else {
            html += '<pre style="background: #1a1a1a; padding: 15px; border-radius: 5px; overflow-x: auto; font-size: 13px;">' +
                JSON.stringify(data, null, 2) + '</pre>';
        }

        resultContainer.innerHTML = html;
    };

    // ========== ФУНКЦИИ ВАЛИДАЦИИ ==========

    function validateFuelName(name) {
        if (!name || name.trim() === '') {
            modal.showAlert('Ошибка', '❌ Название топлива не может быть пустым');
            return false;
        }
        if (name.length < 2) {
            modal.showAlert('Ошибка', '❌ Название топлива должно содержать минимум 2 символа');
            return false;
        }
        if (name.length > 50) {
            modal.showAlert('Ошибка', '❌ Название топлива слишком длинное (максимум 50 символов)');
            return false;
        }
        return true;
    }

    function validatePrice(price) {
        if (!price || price.trim() === '') {
            modal.showAlert('Ошибка', '❌ Цена не может быть пустой');
            return false;
        }

        price = price.replace(',', '.');

        if (isNaN(price) || price === '') {
            modal.showAlert('Ошибка', '❌ Цена должна быть числом');
            return false;
        }

        const numPrice = parseFloat(price);
        if (numPrice <= 0) {
            modal.showAlert('Ошибка', '❌ Цена должна быть больше 0');
            return false;
        }
        if (numPrice > 1000) {
            modal.showAlert('Ошибка', '❌ Цена не может быть больше 1000');
            return false;
        }

        return true;
    }

    function validateProductName(name) {
        if (!name || name.trim() === '') {
            modal.showAlert('Ошибка', '❌ Название товара не может быть пустым');
            return false;
        }
        if (name.length < 2) {
            modal.showAlert('Ошибка', '❌ Название товара должно содержать минимум 2 символа');
            return false;
        }
        if (name.length > 50) {
            modal.showAlert('Ошибка', '❌ Название товара слишком длинное (максимум 50 символов)');
            return false;
        }
        return true;
    }

    function validateId(id, type = 'запись') {
        if (!id || id.trim() === '') {
            modal.showAlert('Ошибка', `❌ ID ${type} не может быть пустым`);
            return false;
        }
        if (isNaN(id)) {
            modal.showAlert('Ошибка', `❌ ID должен быть числом`);
            return false;
        }
        const numId = parseInt(id);
        if (numId <= 0) {
            modal.showAlert('Ошибка', `❌ ID должен быть положительным числом`);
            return false;
        }
        return true;
    }

    function validateBonusAmount(amount, action) {
        if (!amount || amount.trim() === '') {
            modal.showAlert('Ошибка', `❌ Сумма для ${action} не может быть пустой`);
            return false;
        }

        amount = amount.replace(',', '.');

        if (isNaN(amount)) {
            modal.showAlert('Ошибка', `❌ Сумма должна быть числом`);
            return false;
        }

        const numAmount = parseFloat(amount);
        if (numAmount < 0) {
            modal.showAlert('Ошибка', `❌ Сумма не может быть отрицательной`);
            return false;
        }
        if (numAmount > 1000000) {
            modal.showAlert('Ошибка', `❌ Сумма слишком большая (максимум 1 000 000)`);
            return false;
        }

        return true;
    }

    // ========== ФУНКЦИЯ ДЛЯ СОЗДАНИЯ МОДАЛЬНОГО ОКНА ВЫБОРА ==========

    async function showChoiceModal(title, message) {
        return new Promise((resolve) => {
            // Создаем оверлей
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay';
            overlay.style.display = 'flex';

            // Создаем модальное окно
            const modal = document.createElement('div');
            modal.className = 'custom-modal';
            modal.style.maxWidth = '400px';

            // Заголовок
            const modalTitle = document.createElement('h3');
            modalTitle.className = 'modal-title';
            modalTitle.textContent = title;

            // Сообщение
            const modalMessage = document.createElement('div');
            modalMessage.className = 'modal-message';
            modalMessage.textContent = message;

            // Контейнер для кнопок
            const buttonsContainer = document.createElement('div');
            buttonsContainer.style.cssText = `
                display: flex;
                gap: 20px;
                justify-content: center;
                margin-top: 20px;
            `;

            // Кнопка "Топливо"
            const fuelBtn = document.createElement('button');
            fuelBtn.className = 'modal-btn confirm';
            fuelBtn.style.cssText = `
                padding: 12px 30px;
                background: #4CAF50;
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 16px;
                font-family: 'Inter Extra Bold', sans-serif;
                cursor: pointer;
                min-width: 120px;
            `;
            fuelBtn.textContent = 'Топливо';
            fuelBtn.onclick = () => {
                document.body.removeChild(overlay);
                resolve(true);
            };

            // Кнопка "Товары"
            const productBtn = document.createElement('button');
            productBtn.className = 'modal-btn neutral';
            productBtn.style.cssText = `
                padding: 12px 30px;
                background: #249AE3;
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 16px;
                font-family: 'Inter Extra Bold', sans-serif;
                cursor: pointer;
                min-width: 120px;
            `;
            productBtn.textContent = 'Товары';
            productBtn.onclick = () => {
                document.body.removeChild(overlay);
                resolve(false);
            };

            buttonsContainer.appendChild(fuelBtn);
            buttonsContainer.appendChild(productBtn);

            modal.appendChild(modalTitle);
            modal.appendChild(modalMessage);
            modal.appendChild(buttonsContainer);
            overlay.appendChild(modal);

            document.body.appendChild(overlay);
        });
    }

    // ========== ОБРАБОТЧИКИ КНОПОК ==========

    // ПРОСМОТР
    document.querySelector('.view-btn')?.addEventListener('click', async () => {
        try {
            const choice = await showChoiceModal('Просмотр', 'Выберите категорию для просмотра:');

            if (choice) {
                const response = await fetch(`${API_URL}/fuels`);
                const fuels = await response.json();
                showAdminResult(fuels, '📊 ТОПЛИВО');
            } else {
                const response = await fetch(`${API_URL}/products`);
                const products = await response.json();
                showAdminResult(products, '📦 ТОВАРЫ');
            }
        } catch (error) {
            await modal.showAlert('Ошибка', 'Ошибка загрузки: ' + error.message);
        }
    });

    // ДОБАВЛЕНИЕ
    document.querySelector('.add-btn')?.addEventListener('click', async () => {
        const choice = await showChoiceModal('Добавление', 'Что вы хотите добавить?');

        if (choice) {
            // Добавление топлива
            const name = await modal.showPrompt('Добавление топлива', 'Введите название топлива (например, АИ-98):');
            if (!name) return;
            if (!validateFuelName(name)) return;

            const price = await modal.showPrompt('Добавление топлива', 'Введите цену:');
            if (!price) return;
            if (!validatePrice(price)) return;

            const image = await modal.showPrompt('Добавление топлива', 'Введите путь к картинке:', 'images/default.png');

            try {
                const response = await fetch(`${API_URL}/fuels`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: name.trim(),
                        price: price.replace(',', '.'),
                        image: image || 'images/default.png'
                    })
                });

                const result = await response.json();

                if (response.ok) {
                    await modal.showAlert('Успех', '✅ Топливо успешно добавлено!');
                    showAdminResult(result, '✅ ТОПЛИВО ДОБАВЛЕНО');

                    const fuelsResponse = await fetch(`${API_URL}/fuels`);
                    const fuels = await fuelsResponse.json();
                    showAdminResult(fuels, '📊 ТОПЛИВО (обновлено)');
                } else {
                    await modal.showAlert('Ошибка', '❌ Ошибка: ' + (result.error || 'Неизвестная ошибка'));
                }
            } catch (error) {
                await modal.showAlert('Ошибка', 'Ошибка: ' + error.message);
            }
        } else {
            // Добавление товара
            const name = await modal.showPrompt('Добавление товара', 'Введите название товара:');
            if (!name) return;
            if (!validateProductName(name)) return;

            const image = await modal.showPrompt('Добавление товара', 'Введите путь к картинке:', 'images/default.png');

            try {
                const response = await fetch(`${API_URL}/products`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: name.trim(),
                        image: image || 'images/default.png'
                    })
                });

                const result = await response.json();

                if (response.ok) {
                    await modal.showAlert('Успех', '✅ Товар успешно добавлен!');
                    showAdminResult(result, '✅ ТОВАР ДОБАВЛЕН');

                    const productsResponse = await fetch(`${API_URL}/products`);
                    const products = await productsResponse.json();
                    showAdminResult(products, '📦 ТОВАРЫ (обновлено)');
                } else {
                    await modal.showAlert('Ошибка', '❌ Ошибка: ' + (result.error || 'Неизвестная ошибка'));
                }
            } catch (error) {
                await modal.showAlert('Ошибка', 'Ошибка: ' + error.message);
            }
        }
    });

    // ИЗМЕНЕНИЕ
    document.querySelector('.edit-btn')?.addEventListener('click', async () => {
        const choice = await showChoiceModal('Изменение', 'Что вы хотите изменить?');

        if (choice) {
            // Изменение топлива
            const id = await modal.showPrompt('Изменение топлива', 'Введите ID топлива для изменения:');
            if (!id) return;
            if (!validateId(id, 'топлива')) return;

            try {
                const getResponse = await fetch(`${API_URL}/fuels/${id}`);

                if (!getResponse.ok) {
                    await modal.showAlert('Ошибка', '❌ Топливо с таким ID не найдено');
                    return;
                }

                const current = await getResponse.json();

                const name = await modal.showPrompt('Изменение топлива', 'Новое название (Enter - оставить)', current.name);
                if (name && !validateFuelName(name)) return;

                const price = await modal.showPrompt('Изменение топлива', 'Новая цена (Enter - оставить)', current.price);
                if (price && !validatePrice(price)) return;

                const image = await modal.showPrompt('Изменение топлива', 'Новый путь к картинке (Enter - оставить)', current.image);

                const response = await fetch(`${API_URL}/fuels/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: name?.trim() || current.name,
                        price: price ? price.replace(',', '.') : current.price,
                        image: image || current.image
                    })
                });

                const result = await response.json();

                if (response.ok) {
                    await modal.showAlert('Успех', '✏️ Топливо успешно изменено!');
                    showAdminResult(result, '✏️ ТОПЛИВО ИЗМЕНЕНО');

                    const fuelsResponse = await fetch(`${API_URL}/fuels`);
                    const fuels = await fuelsResponse.json();
                    showAdminResult(fuels, '📊 ТОПЛИВО (обновлено)');
                } else {
                    await modal.showAlert('Ошибка', '❌ Ошибка: ' + (result.error || 'Неизвестная ошибка'));
                }
            } catch (error) {
                await modal.showAlert('Ошибка', 'Ошибка: ' + error.message);
            }
        } else {
            // Изменение товара
            const id = await modal.showPrompt('Изменение товара', 'Введите ID товара для изменения:');
            if (!id) return;
            if (!validateId(id, 'товара')) return;

            try {
                const getResponse = await fetch(`${API_URL}/products/${id}`);

                if (!getResponse.ok) {
                    await modal.showAlert('Ошибка', '❌ Товар с таким ID не найден');
                    return;
                }

                const current = await getResponse.json();

                const name = await modal.showPrompt('Изменение товара', 'Новое название (Enter - оставить)', current.name);
                if (name && !validateProductName(name)) return;

                const image = await modal.showPrompt('Изменение товара', 'Новый путь к картинке (Enter - оставить)', current.image);

                const response = await fetch(`${API_URL}/products/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: name?.trim() || current.name,
                        image: image || current.image
                    })
                });

                const result = await response.json();

                if (response.ok) {
                    await modal.showAlert('Успех', '✏️ Товар успешно изменен!');
                    showAdminResult(result, '✏️ ТОВАР ИЗМЕНЕН');

                    const productsResponse = await fetch(`${API_URL}/products`);
                    const products = await productsResponse.json();
                    showAdminResult(products, '📦 ТОВАРЫ (обновлено)');
                } else {
                    await modal.showAlert('Ошибка', '❌ Ошибка: ' + (result.error || 'Неизвестная ошибка'));
                }
            } catch (error) {
                await modal.showAlert('Ошибка', 'Ошибка: ' + error.message);
            }
        }
    });

    // УДАЛЕНИЕ
    document.querySelector('.delete-btn')?.addEventListener('click', async () => {
        const choice = await showChoiceModal('Удаление', 'Что вы хотите удалить?');

        if (choice) {
            // Удаление топлива
            const id = await modal.showPrompt('Удаление топлива', 'Введите ID топлива для удаления:');
            if (!id) return;
            if (!validateId(id, 'топлива')) return;

            const confirmed = await modal.showConfirm('Подтверждение', `⚠️ Точно удалить топливо с ID ${id}?`);
            if (!confirmed) return;

            try {
                const response = await fetch(`${API_URL}/fuels/${id}`, {
                    method: 'DELETE'
                });

                if (!response.ok) {
                    const error = await response.json();
                    await modal.showAlert('Ошибка', '❌ ' + (error.error || 'Ошибка при удалении'));
                    return;
                }

                const result = await response.json();
                await modal.showAlert('Успех', '🗑️ Топливо успешно удалено!');
                showAdminResult(result, '🗑️ ТОПЛИВО УДАЛЕНО');

                const fuelsResponse = await fetch(`${API_URL}/fuels`);
                const fuels = await fuelsResponse.json();
                showAdminResult(fuels, '📊 ТОПЛИВО (обновлено)');
            } catch (error) {
                await modal.showAlert('Ошибка', 'Ошибка: ' + error.message);
            }
        } else {
            // Удаление товара
            const id = await modal.showPrompt('Удаление товара', 'Введите ID товара для удаления:');
            if (!id) return;
            if (!validateId(id, 'товара')) return;

            const confirmed = await modal.showConfirm('Подтверждение', `⚠️ Точно удалить товар с ID ${id}?`);
            if (!confirmed) return;

            try {
                const response = await fetch(`${API_URL}/products/${id}`, {
                    method: 'DELETE'
                });

                if (!response.ok) {
                    const error = await response.json();
                    await modal.showAlert('Ошибка', '❌ ' + (error.error || 'Ошибка при удалении'));
                    return;
                }

                const result = await response.json();
                await modal.showAlert('Успех', '🗑️ Товар успешно удалено!');
                showAdminResult(result, '🗑️ ТОВАР УДАЛЕН');

                const productsResponse = await fetch(`${API_URL}/products`);
                const products = await productsResponse.json();
                showAdminResult(products, '📦 ТОВАРЫ (обновлено)');
            } catch (error) {
                await modal.showAlert('Ошибка', 'Ошибка: ' + error.message);
            }
        }
    });

    // ========== ОБРАБОТЧИКИ ДЛЯ БОНУСОВ ==========

    document.getElementById('bonus-view')?.addEventListener('click', async () => {
        try {
            const response = await fetch('http://localhost:5000/api/bonus');
            const data = await response.json();
            document.getElementById('bonus-status').innerHTML = `💰 Баланс: <strong>${data.amount.toFixed(2)}</strong>`;
        } catch (error) {
            await modal.showAlert('Ошибка', 'Ошибка: ' + error.message);
        }
    });

    document.getElementById('bonus-add')?.addEventListener('click', async () => {
        const amount = await modal.showPrompt('Добавление бонусов', 'Сколько бонусов добавить?');
        if (!amount) return;
        if (!validateBonusAmount(amount, 'добавления')) return;

        try {
            const response = await fetch('http://localhost:5000/api/bonus/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ change: parseFloat(amount.replace(',', '.')) })
            });

            const data = await response.json();

            if (response.ok) {
                await modal.showAlert('Успех', `✅ Добавлено ${amount} бонусов. Новый баланс: ${data.amount.toFixed(2)}`);
                document.getElementById('bonus-status').innerHTML = `✅ Добавлено. Новый баланс: ${data.amount.toFixed(2)}`;

                const bonusElement = document.getElementById('bonus-amount');
                if (bonusElement) bonusElement.textContent = data.amount.toFixed(2);
            } else {
                await modal.showAlert('Ошибка', '❌ Ошибка: ' + (data.error || 'Неизвестная ошибка'));
            }
        } catch (error) {
            await modal.showAlert('Ошибка', 'Ошибка: ' + error.message);
        }
    });

    document.getElementById('bonus-subtract')?.addEventListener('click', async () => {
        const amount = await modal.showPrompt('Списание бонусов', 'Сколько бонусов списать?');
        if (!amount) return;
        if (!validateBonusAmount(amount, 'списания')) return;

        try {
            const response = await fetch('http://localhost:5000/api/bonus/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ change: -parseFloat(amount.replace(',', '.')) })
            });

            const data = await response.json();

            if (response.ok) {
                await modal.showAlert('Успех', `✅ Списано ${amount} бонусов. Новый баланс: ${data.amount.toFixed(2)}`);
                document.getElementById('bonus-status').innerHTML = `✅ Списано. Новый баланс: ${data.amount.toFixed(2)}`;

                const bonusElement = document.getElementById('bonus-amount');
                if (bonusElement) bonusElement.textContent = data.amount.toFixed(2);
            } else {
                await modal.showAlert('Ошибка', '❌ Ошибка: ' + (data.error || 'Неизвестная ошибка'));
            }
        } catch (error) {
            await modal.showAlert('Ошибка', 'Ошибка: ' + error.message);
        }
    });

    document.getElementById('bonus-set')?.addEventListener('click', async () => {
        const amount = await modal.showPrompt('Установка бонусов', 'Установить новое значение бонусов:');
        if (!amount) return;
        if (!validateBonusAmount(amount, 'установки')) return;

        try {
            const response = await fetch('http://localhost:5000/api/bonus/set', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount: parseFloat(amount.replace(',', '.')) })
            });

            const data = await response.json();

            if (response.ok) {
                await modal.showAlert('Успех', `✅ Баланс установлен: ${data.amount.toFixed(2)}`);
                document.getElementById('bonus-status').innerHTML = `✅ Установлено: ${data.amount.toFixed(2)}`;

                const bonusElement = document.getElementById('bonus-amount');
                if (bonusElement) bonusElement.textContent = data.amount.toFixed(2);
            } else {
                await modal.showAlert('Ошибка', '❌ Ошибка: ' + (data.error || 'Неизвестная ошибка'));
            }
        } catch (error) {
            await modal.showAlert('Ошибка', 'Ошибка: ' + error.message);
        }
    });
});