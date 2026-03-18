document.addEventListener('DOMContentLoaded', function () {
    const splashScreen = document.getElementById('splash-screen');
    const mainScreen = document.getElementById('main-screen');
    const adminScreen = document.getElementById('admin-screen');
    const adminLink = document.getElementById('admin-link');
    const logoutBtn = document.getElementById('logout-btn');
    const qrButton = document.getElementById('open-qr');
    const qrModal = document.getElementById('qr-modal');
    const closeModal = document.querySelector('.close-modal');

    const API_URL = 'http://localhost:5000/api';

    // ========== ФУНКЦИИ ДЛЯ БОНУСОВ ==========

    async function loadBonus() {
        try {
            const response = await fetch(`${API_URL}/bonus`);
            const data = await response.json();
            const bonusElement = document.getElementById('bonus-amount');
            if (bonusElement) {
                bonusElement.textContent = data.amount.toFixed(2);
            }
            return data.amount;
        } catch (error) {
            console.error('Ошибка загрузки бонусов:', error);
            return 0;
        }
    }

    // ========== ФУНКЦИИ ДЛЯ ТОВАРОВ ==========

    async function loadProducts() {
        try {
            const response = await fetch(`${API_URL}/products`);
            const products = await response.json();

            const rightColumn = document.querySelector('.right-column');
            if (!rightColumn) return;

            rightColumn.innerHTML = '';

            products.forEach(product => {
                const productDiv = document.createElement('div');
                productDiv.className = 'product-item';
                productDiv.innerHTML = `
                    <img src="${product.image}" alt="${product.name}">
                    <p>${product.name}</p>
                `;
                rightColumn.appendChild(productDiv);
            });

            console.log('✅ Товары загружены:', products);
        } catch (error) {
            console.error('Ошибка загрузки товаров:', error);
        }
    }

    async function loadFuels() {
        try {
            const response = await fetch(`${API_URL}/fuels`);
            const fuels = await response.json();
            console.log('✅ Цены на топливо:', fuels);
        } catch (error) {
            console.error('Ошибка загрузки топлива:', error);
        }
    }

    function loadMainScreenData() {
        loadProducts();
        loadFuels();
        loadBonus();
    }

    // ========== ЗАСТАВКА ==========

    setTimeout(function () {
        if (splashScreen) {
            splashScreen.style.opacity = '0';
            setTimeout(function () {
                splashScreen.style.display = 'none';
                if (mainScreen) {
                    mainScreen.style.display = 'block';
                    loadMainScreenData();
                    setTimeout(() => {
                        mainScreen.style.opacity = '1';
                    }, 10);
                }
            }, 500);
        }
    }, 3000);

    // ========== АВТОРИЗАЦИЯ АДМИНА ==========

    if (adminLink) {
        adminLink.addEventListener('click', async function (event) {
            event.preventDefault();

            // Показываем модальное окно для ввода пароля
            const password = await modal.showPrompt('Вход в админ-панель', 'Введите пароль администратора:');

            // Если пользователь нажал "Отмена" или не ввел пароль
            if (!password) {
                return;
            }

            try {
                const response = await fetch(`${API_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password })
                });

                const result = await response.json();

                if (result.success) {
                    // Показываем сообщение об успешном входе
                    await modal.showAlert('Успех', '✅ Добро пожаловать в админ-панель!');

                    // Плавный переход на админ-панель
                    mainScreen.style.opacity = '0';
                    setTimeout(function () {
                        mainScreen.style.display = 'none';
                        adminScreen.style.display = 'block';
                        setTimeout(() => {
                            adminScreen.style.opacity = '1';
                        }, 10);
                    }, 500);
                } else {
                    // Неверный пароль
                    await modal.showAlert('Ошибка', '❌ Неверный пароль!');
                }
            } catch (error) {
                // Ошибка подключения к серверу
                await modal.showAlert('Ошибка подключения', '❌ Не удалось подключиться к серверу. Убедитесь, что сервер запущен.');
                console.error(error);
            }
        });
    }

    // ========== ВЫХОД ИЗ АДМИНКИ ==========

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function (event) {
            event.preventDefault();

            // Спрашиваем подтверждение выхода
            const confirmed = await modal.showConfirm('Подтверждение', 'Вы действительно хотите выйти из админ-панели?');

            if (confirmed) {
                adminScreen.style.opacity = '0';
                setTimeout(function () {
                    adminScreen.style.display = 'none';
                    mainScreen.style.display = 'block';
                    loadMainScreenData(); // Перезагружаем данные
                    setTimeout(() => {
                        mainScreen.style.opacity = '1';
                    }, 10);

                    // Показываем сообщение о выходе
                    modal.showAlert('До свидания!', '👋 Вы вышли из админ-панели');
                }, 500);
            }
        });
    }

    // ========== QR-КОД МОДАЛЬНОЕ ОКНО ==========

    if (qrButton && qrModal && closeModal) {
        qrButton.addEventListener('click', function (event) {
            if (event) {
                event.preventDefault();
            }

            console.log('🖱️ Открытие QR-кода');

            if (qrModal) {
                qrModal.style.display = 'flex';
                document.body.style.overflow = 'hidden';
            }

            return false;
        });

        closeModal.addEventListener('click', function (event) {
            event.preventDefault();
            qrModal.style.display = 'none';
            document.body.style.overflow = 'auto';
        });

        window.addEventListener('click', function (event) {
            if (event.target === qrModal) {
                event.preventDefault();
                qrModal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape' && qrModal.style.display === 'flex') {
                event.preventDefault();
                qrModal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    }

    // ========== АДАПТАЦИЯ ЗАСТАВКИ ==========

    const splashImage = document.querySelector('.splash-image img');
    if (splashImage) {
        const setSplashHeight = () => {
            const screenHeight = window.innerHeight;
            const splashHeight = Math.floor(screenHeight * 0.55);
            const splashImageDiv = document.querySelector('.splash-image');
            if (splashImageDiv) {
                splashImageDiv.style.height = `${splashHeight}px`;
            }
        };
        setSplashHeight();
        window.addEventListener('resize', setSplashHeight);
    }
});