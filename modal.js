// Класс для работы с кастомными модальными окнами
class CustomModal {
    constructor() {
        this.createModalStructure();
    }

    // Создаем структуру модального окна
    createModalStructure() {
        // Создаем оверлей
        this.overlay = document.createElement('div');
        this.overlay.className = 'modal-overlay';

        // Создаем контейнер модального окна
        this.modal = document.createElement('div');
        this.modal.className = 'custom-modal';

        // Заголовок
        this.title = document.createElement('h3');
        this.title.className = 'modal-title';

        // Сообщение
        this.message = document.createElement('div');
        this.message.className = 'modal-message';

        // Поле ввода
        this.input = document.createElement('input');
        this.input.type = 'text';
        this.input.className = 'modal-input';
        this.input.placeholder = 'Введите значение...';

        // Контейнер для кнопок
        this.buttonsContainer = document.createElement('div');
        this.buttonsContainer.className = 'modal-buttons';

        // Собираем структуру
        this.modal.appendChild(this.title);
        this.modal.appendChild(this.message);
        // input будет добавляться отдельно в showPrompt
        this.modal.appendChild(this.buttonsContainer);
        this.overlay.appendChild(this.modal);

        // Добавляем на страницу
        document.body.appendChild(this.overlay);
    }

    // Метод для показа сообщения (аналог alert)
    showAlert(title, message) {
        return new Promise((resolve) => {
            this.title.textContent = title;
            this.message.textContent = message;

            // Убираем input, если был
            if (this.input.parentNode) {
                this.input.remove();
            }

            // Очищаем кнопки
            this.buttonsContainer.innerHTML = '';

            // Создаем кнопку OK
            const okBtn = document.createElement('button');
            okBtn.className = 'modal-btn confirm';
            okBtn.textContent = 'OK';
            okBtn.onclick = () => {
                this.hide();
                resolve();
            };

            // Добавляем обработчик Enter для всего окна
            const enterHandler = (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.hide();
                    resolve();
                    document.removeEventListener('keydown', enterHandler);
                }
            };

            document.addEventListener('keydown', enterHandler);

            // Удаляем обработчик при закрытии другими способами
            const cleanup = () => {
                document.removeEventListener('keydown', enterHandler);
            };

            // Переопределяем onclick с cleanup
            okBtn.onclick = () => {
                cleanup();
                this.hide();
                resolve();
            };

            this.buttonsContainer.appendChild(okBtn);
            this.show();

            // Фокус на кнопку OK для Enter
            setTimeout(() => okBtn.focus(), 100);
        });
    }

    // Метод для подтверждения (аналог confirm)
    showConfirm(title, message) {
        return new Promise((resolve) => {
            this.title.textContent = title;
            this.message.textContent = message;

            // Убираем input, если был
            if (this.input.parentNode) {
                this.input.remove();
            }

            // Очищаем кнопки
            this.buttonsContainer.innerHTML = '';

            // Кнопка Да
            const yesBtn = document.createElement('button');
            yesBtn.className = 'modal-btn confirm';
            yesBtn.textContent = 'Да';

            // Кнопка Нет
            const noBtn = document.createElement('button');
            noBtn.className = 'modal-btn cancel';
            noBtn.textContent = 'Нет';

            // Обработчик Enter
            const enterHandler = (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.hide();
                    resolve(true);
                    document.removeEventListener('keydown', enterHandler);
                }
            };

            // Обработчик Escape
            const escapeHandler = (e) => {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    this.hide();
                    resolve(false);
                    document.removeEventListener('keydown', escapeHandler);
                    document.removeEventListener('keydown', enterHandler);
                }
            };

            document.addEventListener('keydown', enterHandler);
            document.addEventListener('keydown', escapeHandler);

            // Удаляем обработчики при клике
            const cleanup = () => {
                document.removeEventListener('keydown', enterHandler);
                document.removeEventListener('keydown', escapeHandler);
            };

            yesBtn.onclick = () => {
                cleanup();
                this.hide();
                resolve(true);
            };

            noBtn.onclick = () => {
                cleanup();
                this.hide();
                resolve(false);
            };

            this.buttonsContainer.appendChild(yesBtn);
            this.buttonsContainer.appendChild(noBtn);
            this.show();

            // Фокус на кнопку Да для Enter
            setTimeout(() => yesBtn.focus(), 100);
        });
    }

    // Метод для ввода данных (аналог prompt) - ИСПРАВЛЕННАЯ ВЕРСИЯ
    showPrompt(title, message, defaultValue = '') {
        return new Promise((resolve) => {
            this.title.textContent = title;
            this.message.textContent = message;

            // Добавляем input, если его нет
            if (!this.input.parentNode) {
                this.modal.insertBefore(this.input, this.buttonsContainer);
            }

            // Устанавливаем значение
            this.input.value = defaultValue;

            // Очищаем кнопки
            this.buttonsContainer.innerHTML = '';

            // Кнопка OK
            const okBtn = document.createElement('button');
            okBtn.className = 'modal-btn confirm';
            okBtn.textContent = 'OK';

            // Кнопка Отмена
            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'modal-btn cancel';
            cancelBtn.textContent = 'Отмена';

            // ========== ОБРАБОТЧИК ENTER ==========
            const enterHandler = (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault(); // Предотвращаем отправку формы
                    e.stopPropagation(); // Останавливаем всплытие
                    console.log('Enter нажат, подтверждение ввода');

                    const value = this.input.value;
                    this.hide();
                    resolve(value);

                    // Удаляем обработчики
                    document.removeEventListener('keydown', enterHandler);
                    document.removeEventListener('keydown', escapeHandler);
                }
            };

            // ========== ОБРАБОТЧИК ESCAPE ==========
            const escapeHandler = (e) => {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    console.log('Escape нажат, отмена ввода');

                    this.hide();
                    resolve(null);

                    // Удаляем обработчики
                    document.removeEventListener('keydown', enterHandler);
                    document.removeEventListener('keydown', escapeHandler);
                }
            };

            // Добавляем глобальные обработчики клавиш
            document.addEventListener('keydown', enterHandler);
            document.addEventListener('keydown', escapeHandler);

            // Обработчик для поля ввода (дублируем для надежности)
            this.input.onkeypress = (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Enter нажат в поле ввода');

                    const value = this.input.value;
                    this.hide();
                    resolve(value);

                    // Удаляем глобальные обработчики
                    document.removeEventListener('keydown', enterHandler);
                    document.removeEventListener('keydown', escapeHandler);
                }
            };

            // Удаляем обработчики при клике на кнопки
            const cleanup = () => {
                document.removeEventListener('keydown', enterHandler);
                document.removeEventListener('keydown', escapeHandler);
                this.input.onkeypress = null;
            };

            okBtn.onclick = () => {
                cleanup();
                const value = this.input.value;
                this.hide();
                resolve(value);
            };

            cancelBtn.onclick = () => {
                cleanup();
                this.hide();
                resolve(null);
            };

            this.buttonsContainer.appendChild(okBtn);
            this.buttonsContainer.appendChild(cancelBtn);
            this.show();

            // Фокус на поле ввода
            setTimeout(() => {
                this.input.focus();
                this.input.select(); // Выделяем текст по умолчанию
            }, 150);
        });
    }

    // Показать модальное окно
    show() {
        this.overlay.style.display = 'flex';
    }

    // Скрыть модальное окно
    hide() {
        this.overlay.style.display = 'none';
    }
}

// Создаем глобальный экземпляр
window.modal = new CustomModal();