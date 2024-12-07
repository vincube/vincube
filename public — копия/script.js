let currentData = [];
let currentPage = 1;
let totalPages = 1;
let terminalsList = [];
let sortOrder = {}; // Для управления сортировкой

function switchPage(page) {
    document.getElementById('main-page').style.display = page === 'main' ? 'block' : 'none';
    document.getElementById('terminals-page').style.display = page === 'terminals' ? 'block' : 'none';

    if (page === 'main' && terminalsList.length === 0) {
        loadTerminals();
    }
}

async function loadTerminals() {
    const token = document.getElementById("token").value;
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
    const input = document.getElementById("terminal_id").value.toLowerCase();
    const suggestions = terminalsList.filter(terminal =>
        terminal.id.toString().startsWith(input)
    );
    displaySuggestions(suggestions);
}

function displaySuggestions(suggestions) {
    const suggestionsBox = document.getElementById("terminal-suggestions");
    suggestionsBox.innerHTML = "";

    if (suggestions.length === 0) {
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
    if (!sortOrder[column]) return "⬍";
    return sortOrder[column] === "asc" ? "⬆" : "⬇";
}

async function fetchData(page = 1) {
    const params = new URLSearchParams();
    const token = document.getElementById("token").value;
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
    const token = document.getElementById("terminals-token").value;
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
            <td>${item.id}</            </td>
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

// Инициализация при загрузке страницы
window.onload = () => {
    loadTerminals();
};

