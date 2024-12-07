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
        document.getElementById('page-title').textContent = userName; // Устанавливаем имя пользователя
    } else {
        document.getElementById('logout-button').style.display = 'none';
        document.getElementById('page-title').textContent = ""; // Очищаем заголовок
    }

    if (page === 'main' && terminalsList.length === 0) {
        loadTerminals();
    }
}

// Вход в систему
async function performLogin() {
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
        userName = result.name || "Пользователь"; // Извлекаем имя пользователя

        if (rememberMe) {
            localStorage.setItem("rememberedLogin", login);
            localStorage.setItem("rememberedPassword", password);
        } else {
            localStorage.removeItem("rememberedLogin");
            localStorage.removeItem("rememberedPassword");
        }

        document.getElementById("token").value = globalToken;
        document.getElementById("terminals-token").value = globalToken;

        document.querySelector("nav button[onclick=\"switchPage('login')\"]").style.display = "none"; // Убираем кнопку Login
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

// Остальные функции остаются без изменений
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
        document.getElementById('page-title').textContent = userName; // Устанавливаем имя пользователя
    } else {
        document.getElementById('logout-button').style.display = 'none';
        document.getElementById('page-title').textContent = ""; // Очищаем заголовок
    }

    if (page === 'main' && terminalsList.length === 0) {
        loadTerminals();
    }
}

// Вход в систему
async function performLogin() {
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
        userName = result.name || "Пользователь"; // Извлекаем имя пользователя

        if (rememberMe) {
            localStorage.setItem("rememberedLogin", login);
            localStorage.setItem("rememberedPassword", password);
        } else {
            localStorage.removeItem("rememberedLogin");
            localStorage.removeItem("rememberedPassword");
        }

        document.getElementById("token").value = globalToken;
        document.getElementById("terminals-token").value = globalToken;

        document.querySelector("nav button[onclick=\"switchPage('login')\"]").style.display = "none"; // Убираем кнопку Login
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

// Остальные функции остаются без изменений
