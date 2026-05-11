const express = require("express");
const cors = require("cors");
const path = require("path");
const { createServer } = require("http");
const { Server } = require("socket.io");

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const adminRoutes = require("./routes/adminRoutes");

const cartRoutes = require("./routes/cartRoutes");
const orderRoutes = require("./routes/orderRoutes");
const mpesaRoutes = require("./routes/mpesaRoutes");
const chatbotController = require("./controllers/chatbotController");
const app = express();
const httpServer = createServer(app);

// SOCKET.IO SETUP
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:5173", "https://skins-wybb.onrender.com"],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("⚡ Client connected:", socket.id);

  // future: cart sync, order updates, etc.
  socket.on("cartUpdated", (data) => {
    io.emit("cartChanged", data);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// make io available in controllers
app.set("io", io);

// initialize chatbot controller
chatbotController(io);

const logger = require("./middlewares/logger");

app.use(logger);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors());

// ROUTES
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/admin", adminRoutes);

app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/mpesa", mpesaRoutes);

// HEALTH CHECK
app.get("/", (req, res) => {
  res.send("🚀 API is running...");
});

// 404 HANDLER
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use((err, req, res, next) => {
  console.error("❌ Server error:", err.stack);

  const status = err.statusCode || 500;
  const message = err.message || "Internal server error";

  res.status(status).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
