const express = require("express");
const session = require("express-session");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_DIR = path.join(__dirname, "data");
const SITE_DATA_FILE = path.join(DATA_DIR, "site-data.json");
const MESSAGES_FILE = path.join(DATA_DIR, "messages.json");
const CONFIG_FILE = path.join(DATA_DIR, "config.json");
const UPLOAD_DIR = path.join(__dirname, "public", "uploads");

// Ensure upload & data directories exist
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// Helper functions for reading/writing JSON
function getSiteData() {
  if (!fs.existsSync(SITE_DATA_FILE)) return {};
  return JSON.parse(fs.readFileSync(SITE_DATA_FILE, "utf-8"));
}

function saveSiteData(data) {
  fs.writeFileSync(SITE_DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

function getMessages() {
  if (!fs.existsSync(MESSAGES_FILE)) return [];
  return JSON.parse(fs.readFileSync(MESSAGES_FILE, "utf-8"));
}

function saveMessages(messages) {
  fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2), "utf-8");
}

function getConfig() {
  if (!fs.existsSync(CONFIG_FILE)) {
    return { adminUser: "admin", adminPass: "admin123", sessionSecret: "bluemake-2026-secret" };
  }
  return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
}

function saveConfig(cfg) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2), "utf-8");
}

// Multer storage setup for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, "img-" + uniqueSuffix + ext);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max
});

// Middlewares
app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

const config = getConfig();
app.use(
  session({
    secret: config.sessionSecret || "bluemake-secret",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }, // 1 day
  })
);

// === BLUEMAKE SYNC / BM ROUTING ===
// When accessed via bm.pestkalink.pl or bm.domowyasystent.online -> serve the Bluemake Sync app at root
app.use((req, res, next) => {
  const host = (req.headers.host || "").toLowerCase();
  if (host.startsWith("bm.") || host.includes("bm.pestkalink.pl")) {
    if (req.path === "/" || req.path === "/index.html") {
      return res.sendFile(path.join(__dirname, "public", "sync", "index.html"));
    }
    const syncFilePath = path.join(__dirname, "public", "sync", req.path);
    if (fs.existsSync(syncFilePath) && fs.statSync(syncFilePath).isFile()) {
      return res.sendFile(syncFilePath);
    }
  }
  next();
});

// Also serve at /sync and /bm for any domain
app.use("/sync", express.static(path.join(__dirname, "public", "sync")));
app.use("/bm", express.static(path.join(__dirname, "public", "sync")));

// Serve static public files for main website
app.use(express.static(path.join(__dirname, "public")));

// Auth check middleware
function requireAuth(req, res, next) {
  if (req.session && req.session.isAdmin) {
    return next();
  }
  return res.status(401).json({ error: "Brak autoryzacji" });
}

// === PUBLIC API ===

// Get public site data
app.get("/api/data", (req, res) => {
  res.json(getSiteData());
});

// Submit contact form
app.post("/api/contact", upload.single("attachment"), (req, res) => {
  try {
    const { name, email, phone, company, service, message } = req.body;
    const attachmentUrl = req.file ? `/uploads/${req.file.filename}` : null;

    const newMessage = {
      id: "msg_" + Date.now(),
      createdAt: new Date().toISOString(),
      name: name || "Anonim",
      email: email || "",
      phone: phone || "",
      company: company || "",
      service: service || "Inne",
      message: message || "",
      attachment: attachmentUrl,
      isRead: false,
    };

    const messages = getMessages();
    messages.unshift(newMessage);
    saveMessages(messages);

    res.json({ success: true, message: "Zapytanie zostało pomyślnie wysłane!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Wystąpił błąd podczas zapisywania wiadomości." });
  }
});

// Admin login
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const cfg = getConfig();
  if (username === cfg.adminUser && password === cfg.adminPass) {
    req.session.isAdmin = true;
    return res.json({ success: true, username: cfg.adminUser });
  }
  return res.status(401).json({ error: "Nieprawidłowy login lub hasło" });
});

// Check auth status
app.get("/api/auth-status", (req, res) => {
  res.json({ isAdmin: !!(req.session && req.session.isAdmin) });
});

// Admin logout
app.post("/api/logout", (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// === PROTECTED ADMIN API ===

// Update site data
app.post("/api/admin/data", requireAuth, (req, res) => {
  try {
    saveSiteData(req.body);
    res.json({ success: true, message: "Dane zostały pomyślnie zapisane!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Błąd zapisu danych." });
  }
});

// Upload image endpoint
app.post("/api/admin/upload", requireAuth, upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Nie przesłano pliku" });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ success: true, url: fileUrl, filename: req.file.filename });
});

// Get all messages
app.get("/api/admin/messages", requireAuth, (req, res) => {
  res.json(getMessages());
});

// Mark message as read
app.post("/api/admin/messages/:id/read", requireAuth, (req, res) => {
  const messages = getMessages();
  const msg = messages.find((m) => m.id === req.params.id);
  if (msg) msg.isRead = true;
  saveMessages(messages);
  res.json({ success: true });
});

// Delete message
app.delete("/api/admin/messages/:id", requireAuth, (req, res) => {
  let messages = getMessages();
  messages = messages.filter((m) => m.id !== req.params.id);
  saveMessages(messages);
  res.json({ success: true });
});

// Change admin credentials
app.post("/api/admin/change-password", requireAuth, (req, res) => {
  const { currentPassword, newUsername, newPassword } = req.body;
  const cfg = getConfig();
  if (currentPassword !== cfg.adminPass) {
    return res.status(400).json({ error: "Aktualne hasło jest nieprawidłowe" });
  }
  if (newUsername) cfg.adminUser = newUsername;
  if (newPassword) cfg.adminPass = newPassword;
  saveConfig(cfg);
  res.json({ success: true, message: "Dane logowania zostały zmienione!" });
});

// Direct admin route
app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "admin", "index.html"));
});

// Start server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`=========================================`);
  console.log(`🚀 Bluemake Website & CMS is running!`);
  console.log(`🌍 Public Website: http://localhost:${PORT}`);
  console.log(`⚙️  Admin CMS:     http://localhost:${PORT}/admin`);
  console.log(`📱 Bluemake Sync:  http://localhost:${PORT}/sync (or bm.pestkalink.pl)`);
  console.log(`🔑 Default Login:  admin / admin123`);
  console.log(`=========================================`);
});
