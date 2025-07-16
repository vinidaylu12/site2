const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 8080;

const IMAGES_FILE = path.join(__dirname, "images.json");
const CHAT_FILE = path.join(__dirname, "chat.json");
const USERS_FILE = path.join(__dirname, "users.json");

// Middleware para servir arquivos estáticos e processar JSON
app.use(express.static(path.join(__dirname)));
app.use(express.json());
app.use("/scripts", express.static(path.join(__dirname, "../../scripts")));

// -----------------------
// FUNÇÕES AUXILIARES PARA IMAGENS
// -----------------------

const readImages = () => {
    if (!fs.existsSync(IMAGES_FILE)) {
        fs.writeFileSync(IMAGES_FILE, JSON.stringify([]), "utf-8");
    }
    const data = fs.readFileSync(IMAGES_FILE, "utf-8");
    return JSON.parse(data);
};

const saveImages = (images) => {
    fs.writeFileSync(IMAGES_FILE, JSON.stringify(images, null, 2), "utf-8");
};

// -----------------------
// ROTAS PARA IMAGENS
// -----------------------

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "news.html"));
});

app.get("/images", (req, res) => {
    res.json(readImages());
});

app.post("/save-image", (req, res) => {
    const { url, title, caption } = req.body;
    if (!url || !title || !caption) {
        return res.status(400).send("Todos os campos são obrigatórios.");
    }

    const images = readImages();
    const newImage = { id: Date.now(), url, title, caption };
    images.push(newImage);
    saveImages(images);

    res.status(201).json(newImage);
});

app.delete("/delete-image/:id", (req, res) => {
    const id = parseInt(req.params.id);
    let images = readImages();
    const imageIndex = images.findIndex(img => img.id === id);

    if (imageIndex === -1) {
        return res.status(404).send("Imagem não encontrada.");
    }

    images.splice(imageIndex, 1);
    saveImages(images);

    res.send("Imagem removida com sucesso.");
});

// --- CURTIDAS ---
const CURTIDAS_FILE = path.join(__dirname, "curtidas.json");

const readCurtidas = () => {
    if (!fs.existsSync(CURTIDAS_FILE)) {
        fs.writeFileSync(CURTIDAS_FILE, JSON.stringify({}), "utf-8");
    }
    const data = fs.readFileSync(CURTIDAS_FILE, "utf-8");
    return JSON.parse(data);
};

const saveCurtidas = (curtidas) => {
    fs.writeFileSync(CURTIDAS_FILE, JSON.stringify(curtidas, null, 2), "utf-8");
};

// Retorna as curtidas de todas as notícias
app.get("/curtidas", (req, res) => {
    res.json(readCurtidas());
});

// Incrementa curtida de uma notícia
app.post("/curtir/:id", (req, res) => {
    const id = req.params.id;
    const curtidas = readCurtidas();
    curtidas[id] = (curtidas[id] || 0) + 1;
    saveCurtidas(curtidas);
    res.json({ likes: curtidas[id] });
});



// -----------------------
// ROTAS DO CHAT
// -----------------------

const readChat = () => {
    if (!fs.existsSync(CHAT_FILE)) {
        const defaultChat = { adm: [], coordenacao: [], gremio: [] };
        fs.writeFileSync(CHAT_FILE, JSON.stringify(defaultChat, null, 2), "utf-8");
        return defaultChat;
    }

    try {
        const data = fs.readFileSync(CHAT_FILE, "utf-8");
        if (!data) return { adm: [], coordenacao: [], gremio: [] };
        return JSON.parse(data);
    } catch (err) {
        console.error("Erro ao ler chat.json:", err);
        const defaultChat = { adm: [], coordenacao: [], gremio: [] };
        fs.writeFileSync(CHAT_FILE, JSON.stringify(defaultChat, null, 2), "utf-8");
        return defaultChat;
    }
};

const saveChat = (chat) => {
    fs.writeFileSync(CHAT_FILE, JSON.stringify(chat, null, 2), "utf-8");
};

app.get("/messages/:channel", (req, res) => {
    const { channel } = req.params;
    const chat = readChat();
    if (!(channel in chat)) {
        return res.status(404).send("Canal não encontrado");
    }
    res.json(chat[channel]);
});

app.post("/messages/:channel", (req, res) => {
    const { channel } = req.params;
    const { username, text } = req.body;

    if (!username || !text) {
        return res.status(400).send("username e text são obrigatórios");
    }

    const chat = readChat();
    if (!(channel in chat)) {
        chat[channel] = [];
    }

    chat[channel].push({ username, text });
    saveChat(chat);
    res.status(201).send("Mensagem salva");
});

app.delete("/messages/:channel/:index", (req, res) => {
    const { channel, index } = req.params;
    const idx = parseInt(index);

    const chat = readChat();
    if (!(channel in chat) || isNaN(idx) || idx < 0 || idx >= chat[channel].length) {
        return res.status(404).send("Mensagem não encontrada");
    }

    chat[channel].splice(idx, 1);
    saveChat(chat);
    res.send("Mensagem excluída");
});

// -----------------------
// ROTAS DE USUÁRIOS
// -----------------------

const readUsers = () => {
    if (!fs.existsSync(USERS_FILE)) {
        fs.writeFileSync(USERS_FILE, JSON.stringify([]), "utf-8");
    }
    const data = fs.readFileSync(USERS_FILE, "utf-8");
    return JSON.parse(data);
};

const saveUsers = (users) => {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
};

// Cadastro
app.post("/register", (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: "Campos obrigatórios" });

    const users = readUsers();
    const exists = users.find(u => u.username === username);
    if (exists) return res.status(409).json({ message: "Usuário já existe" });

    users.push({ username, password });
    saveUsers(users);

    res.status(201).json({ message: "Usuário cadastrado com sucesso" });
});

// Login
app.post("/login", (req, res) => {
    const { username, password } = req.body;
    const users = readUsers();
    const user = users.find(u => u.username === username && u.password === password);

    if (user || (username === "admin" && password === "admin")) {
        return res.status(200).json({ message: "Login bem-sucedido" });
    } else {
        return res.status(401).json({ message: "Credenciais inválidas" });
    }
});

// -----------------------
// INICIAR SERVIDOR
// -----------------------

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});

app.on("error", (err) => {
    console.error("Erro ao iniciar o servidor:", err);
});
