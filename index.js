const express = require("express");
const axios = require("axios");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));

// Логирование всех запросов
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

// Главная страница
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Авторизация
app.get("/api/login", async (req, res) => {
    const { login, password } = req.query;

    if (!login || !password) {
        return res.status(400).json({ message: "Логин и пароль обязательны" });
    }

    const url = `https://api.vendista.ru:99/token?login=${encodeURIComponent(login)}&password=${encodeURIComponent(password)}`;

    try {
        const response = await axios.get(url);
        res.json(response.data);
    } catch (error) {
        console.error("Ошибка авторизации:", error.message);
        res.status(error.response?.status || 500).json({ message: "Ошибка авторизации", error: error.message });
    }
});

// Получение данных
app.get("/api/data", async (req, res) => {
    const { token, id, DateFrom, DateTo, ItemsOnPage, PageNumber, OrderDesc } = req.query;

    if (!token) {
        return res.status(401).json({ message: "Токен обязателен" });
    }

    const baseUrl = "https://api.vendista.ru:99/terminals";
    const terminalId = id || "";
    const url = `${baseUrl}/${terminalId}/commands`;

    try {
        const response = await axios.get(url, {
            params: { token, id, DateFrom, DateTo, ItemsOnPage, PageNumber, OrderDesc }
        });
        res.json(response.data);
    } catch (error) {
        console.error("Ошибка запроса к API:", error.message);
        res.status(500).json({ message: "Ошибка получения данных", error: error.message });
    }
});

// Список терминалов
app.get("/api/terminals", async (req, res) => {
    const { token } = req.query;

    if (!token) {
        return res.status(401).json({ message: "Токен обязателен" });
    }

    const url = "https://api.vendista.ru:99/terminals";

    try {
        const response = await axios.get(url, { params: req.query });
        res.json(response.data);
    } catch (error) {
        console.error("Ошибка запроса к API терминалов:", error.message);
        res.status(500).json({ message: "Ошибка получения данных о терминалах", error: error.message });
    }
});

// Обработка неизвестных маршрутов
app.use((req, res) => {
    res.status(404).json({ message: "Маршрут не найден" });
});

// Глобальный обработчик ошибок
app.use((err, req, res, next) => {
    console.error("Необработанная ошибка:", err);
    res.status(500).json({ message: "Внутренняя ошибка сервера" });
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});
