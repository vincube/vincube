let currentData = [];
let currentPage = 1;
let totalPages = 1;
let terminalsList = [];
let sortOrder = {}; // Для управления сортировкой
let globalToken = ""; // Глобальный токен для авторизации
let userName = ""; // Имя пользователя для отображения в заголовке

// Переключение между страницами
function switchPage(page) {
    document.getElementById('main-page').style.display = page === 'main' ? 'block' : 'none';
    document.getElementById('terminals-page').style.display = page === 'terminals' ? 'block' : 'none';
    document.getElementById('login-page').style.display = page === 'login' ? 'block' : 'none';

    const navButtons = document.querySelectorAll("nav button");
    navButtons.forEach(btn => {
        if (page === 'login') {
            btn.style.display = 'none'; // Убираем кнопки при открытии страницы Login
        } else {
            btn.style.display = 'inline-block'; // Показываем кнопки на остальных страницах
        }
    });

    if (page !== 'login') {
        document.getElementById('logout-button').style.display = 'inline-block';
        document.getElementById('page-title').textContent = userName || "Просмотр данных API";
    } else {
        document.getElementById('logout-button').style.display = 'none';
        document.getElementById('page-title').textContent = "Вход в личный кабинет";
    }

    if (page === 'main' && terminalsList.length === 0) {
        loadTerminals();
    }
}

// Вход в систему
async function performLogin(event) {
    event.preventDefault(); // Предотвращаем отправку формы

    const login = document.getElementById("login-username").value;
    const password = document.getElementById("login-password").value;
    const rememberMe = document.getElementById("remember-me").checked;

    if (!login || !password) {
        document.getElementById("login-result").textContent = "Пожалуйста, заполните оба поля.";
        return;
    }

    const url = `/api/login?login=${encodeURIComponent(login)}&password=${encodeURIComponent(password)}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error("Неверный логин или пароль.");
        }

        const result = await response.json();
        globalToken = result.token;
        userName = result.name || "Пользователь";

        if (rememberMe) {
            localStorage.setItem("rememberedLogin", login);
            localStorage.setItem("rememberedPassword", password);
        } else {
            localStorage.removeItem("rememberedLogin");
            localStorage.removeItem("rememberedPassword");
        }

        document.getElementById("token").value = globalToken;
        document.getElementById("terminals-token").value = globalToken;

        switchPage("main");
    } catch (error) {
        document.getElementById("login-result").textContent = error.message;
    }
}

// Выход из системы
function logout() {
    globalToken = "";
    userName = "";
    localStorage.removeItem("rememberedLogin");
    localStorage.removeItem("rememberedPassword");
    document.getElementById("token").value = "";
    document.getElementById("terminals-token").value = "";
    document.getElementById("login-password").value = ""; // Очищаем поле пароля
    switchPage("login");
}

// Автозаполнение при загрузке
window.onload = () => {
    const savedLogin = localStorage.getItem("rememberedLogin");
    const savedPassword = localStorage.getItem("rememberedPassword");

    if (savedLogin && savedPassword) {
        document.getElementById("login-username").value = savedLogin;
        document.getElementById("login-password").value = savedPassword;
        document.getElementById("remember-me").checked = true;
    }

    switchPage("login");
};

// Остальные функции для таблиц, фильтров, сортировки остаются без изменений


// Остальные функции остаются без изменений


async function loadTerminals() {
    const token = globalToken;
    if (!token) {
        console.warn("Токен отсутствует. Невозможно загрузить терминалы.");
        return;
    }

    const url = `/api/terminals?token=${token}&ItemsOnPage=1000`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Ошибка: ${response.status}`);
        }

        const data = await response.json();

        terminalsList = data.items.map(item => ({
            id: item.id,
            online: item.last24_hours_online === 100,
            last_online_time: item.last_online_time,
        }));
    } catch (error) {
        console.error("Ошибка загрузки терминалов:", error);
    }
}

function filterTerminals() {
    if (!terminalsList || terminalsList.length === 0) {
        console.warn("Список терминалов пуст. Попробуйте снова.");
        return;
    }

    const input = document.getElementById("terminal_id").value.toLowerCase();
    const suggestions = terminalsList.filter(terminal =>
        terminal.id.toString().startsWith(input)
    );
    displaySuggestions(suggestions);
}

function displaySuggestions(suggestions) {
    const suggestionsBox = document.getElementById("terminal-suggestions");
    suggestionsBox.innerHTML = "";

    if (!suggestions || suggestions.length === 0) {
        suggestionsBox.style.display = "none";
        return;
    }

    suggestions.forEach(terminal => {
        const listItem = document.createElement("li");
        listItem.textContent = terminal.id;
        listItem.onclick = () => selectTerminal(terminal.id);
        listItem.style.color = terminal.online ? "green" : "red";
        suggestionsBox.appendChild(listItem);
    });

    suggestionsBox.style.display = "block";
}

function showAllTerminals() {
    displaySuggestions(terminalsList);
}

function selectTerminal(terminal) {
    document.getElementById("terminal_id").value = terminal;
    document.getElementById("terminal-suggestions").style.display = "none";
}

async function fetchData(page = 1) {
    const params = new URLSearchParams();
    const token = globalToken;
    if (!token) {
        document.getElementById("data-table").innerHTML = "<p>Пожалуйста, войдите в систему, чтобы использовать токен.</p>";
        return;
    }

    params.append("token", token);

    const terminalId = document.getElementById("terminal_id").value;
    if (terminalId) params.append("id", terminalId);

    const dateFrom = document.getElementById("date_from").value;
    if (dateFrom) params.append("DateFrom", new Date(dateFrom).toISOString());

    const dateTo = document.getElementById("date_to").value;
    if (dateTo) params.append("DateTo", new Date(dateTo).toISOString());

    const itemsOnPage = document.getElementById("items_on_page").value || 10;
    params.append("ItemsOnPage", itemsOnPage);
    params.append("PageNumber", page);

    params.append("OrderDesc", "true");

    const filterText = document.getElementById("filter_text").value.toLowerCase();

    const url = `/api/data?${params.toString()}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Ошибка: ${response.status}`);
        }

        const data = await response.json();

        currentData = data.items.filter(item =>
            Object.values(item).some(value =>
                value && value.toString().toLowerCase().includes(filterText)
            )
        );

        currentPage = page;
        totalPages = Math.ceil(data.items_count / itemsOnPage);
        displayData(currentData);
        updatePagination();
    } catch (error) {
        console.error("Ошибка запроса:", error);
        document.getElementById("data-table").innerHTML = `<p>${error.message}</p>`;
    }
}

async function fetchTerminalsData(page = 1) {
    const params = new URLSearchParams();
    const token = globalToken;
    if (!token) {
        document.getElementById("terminals-table").innerHTML = "<p>Пожалуйста, войдите в систему, чтобы использовать токен.</p>";
        return;
    }

    params.append("token", token);

    const itemsOnPage = document.getElementById("terminals-items-on-page").value || 10;
    params.append("ItemsOnPage", itemsOnPage);
    params.append("PageNumber", page);

    const url = `/api/terminals?${params.toString()}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Ошибка: ${response.status}`);
        }

        const data = await response.json();

        const sortedData = data.items.sort((a, b) => {
            if (b.last24_hours_online === 100 && a.last24_hours_online !== 100) return 1;
            if (a.last24_hours_online === 100 && b.last24_hours_online !== 100) return -1;
            return new Date(b.last_online_time) - new Date(a.last_online_time);
        });

        currentData = sortedData;
        currentPage = page;
        totalPages = Math.ceil(data.items_count / itemsOnPage);
        displayTerminalsData(currentData);
        updateTerminalsPagination();
    } catch (error) {
        console.error("Ошибка запроса к терминалам:", error);
        document.getElementById("terminals-table").innerHTML = `<p>${error.message}</p>`;
    }
}

function displayData(items) {
    if (!items || items.length === 0) {
        document.getElementById("data-table").innerHTML = "<p>Нет данных для отображения</p>";
        return;
    }

    let table = `<table>
        <thead>
            <tr>
                <th onclick="sortTable('terminal_id')">ID Терминала <span>${getSortArrow('terminal_id')}</span></th>
                <th onclick="sortTable('str_parameter1')">Параметр 1 <span>${getSortArrow('str_parameter1')}</span></th>
                <th onclick="sortTable('state_name')">Статус <span>${getSortArrow('state_name')}</span></th>
                <th onclick="sortTable('time_created', true)">Дата создания <span>${getSortArrow('time_created')}</span></th>
                <th onclick="sortTable('time_delivered', true)">Дата доставки <span>${getSortArrow('time_delivered')}</span></th>
            </tr>
        </thead>
        <tbody>`;
    items.forEach(item => {
        table += `<tr>
            <td>${item.terminal_id}</td>
            <td>${item.str_parameter1}</td>
            <td>${item.state_name}</td>
            <td>${item.time_created}</td>
            <td>${item.time_delivered}</td>
        </tr>`;
    });
    table += "</tbody></table>";
    document.getElementById("data-table").innerHTML = table;
}

function displayTerminalsData(items) {
    if (!items || items.length === 0) {
        document.getElementById("terminals-table").innerHTML = "<p>Нет данных для отображения</p>";
        return;
    }

    let table = `<table>
        <thead>
            <tr>
                <th onclick="sortTable('id', false, true)">ID <span>${getSortArrow('id')}</span></th>
                <th onclick="sortTable('last24_hours_online', false, true)">Статус <span>${getSortArrow('last24_hours_online')}</span></th>
                <th onclick="sortTable('last_online_time', true, true)">Последний онлайн <span>${getSortArrow('last_online_time')}</span></th>
            </tr>
        </thead>
        <tbody>`;
    items.forEach(item => {
        const rowColor = item.last24_hours_online === 100 ? 'background-color: #d4edda;' : 'background-color: #f8d7da;';
        table += `<tr style="${rowColor}">
            <td>${item.id}</td>
            <td>${item.last24_hours_online === 100 ? 'В сети' : 'Не в сети'}</td>
            <td>${item.last_online_time}</td>
        </tr>`;
    });
    table += "</tbody></table>";
    document.getElementById("terminals-table").innerHTML = table;
}

function updatePagination() {
    const pagination = document.getElementById("pagination");
    pagination.innerHTML = "";

    if (currentPage > 1) {
        pagination.innerHTML += `<button onclick="fetchData(${currentPage - 1})">Назад</button>`;
    }
    pagination.innerHTML += `<span>Страница ${currentPage} из ${totalPages}</span>`;
    if (currentPage < totalPages) {
        pagination.innerHTML += `<button onclick="fetchData(${currentPage + 1})">Вперед</button>`;
    }
}

function updateTerminalsPagination() {
    const pagination = document.getElementById("terminals-pagination");
    pagination.innerHTML = "";

    if (currentPage > 1) {
        pagination.innerHTML += `<button onclick="fetchTerminalsData(${currentPage - 1})">Назад</button>`;
    }
    pagination.innerHTML += `<span>Страница ${currentPage} из ${totalPages}</span>`;
    if (currentPage < totalPages) {
        pagination.innerHTML += `<button onclick="fetchTerminalsData(${currentPage + 1})">Вперед</button>`;
    }
}

function sortTable(column, isDateColumn = false, isTerminalsPage = false) {
    const order = sortOrder[column] === "asc" ? "desc" : "asc";
    sortOrder[column] = order;

    const data = isTerminalsPage ? currentData : currentData;

    data.sort((a, b) => {
        const valA = isDateColumn ? new Date(a[column]) : a[column];
        const valB = isDateColumn ? new Date(b[column]) : b[column];
        if (valA > valB) return order === "asc" ? 1 : -1;
        if (valA < valB) return order === "asc" ? -1 : 1;
        return 0;
    });

    if (isTerminalsPage) {
        displayTerminalsData(data);
    } else {
        displayData(data);
    }
}

function getSortArrow(column) {
    if (!sortOrder[column]) return "⬍"; // Символ по умолчанию
    return sortOrder[column] === "asc" ? "⬆" : "⬇"; // Возрастание или убывание
}

// Инициализация при загрузке страницы
window.onload = () => {
    const savedLogin = localStorage.getItem("rememberedLogin");
    const savedPassword = localStorage.getItem("rememberedPassword");

    if (savedLogin && savedPassword) {

        document.getElementById("login-username").value = savedLogin;
        document.getElementById("login-password").value = savedPassword;
        document.getElementById("remember-me").checked = true;
    }

    switchPage("login");
};

