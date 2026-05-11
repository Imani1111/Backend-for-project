const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

const chatSessions = new Map();

function chatbotController(io) {
  const chatNamespace = io.of("/chatbot");

  chatNamespace.on("connection", (socket) => {
    console.log("🤖 Chatbot client connected:", socket.id);
    const chat = model.startChat({
      history: [],
      generationConfig: {
        maxOutputTokens: 1024,
      },
    });
    chatSessions.set(socket.id, chat);

    socket.on("userMessage", async (message) => {
      try {
        const chatSession = chatSessions.get(socket.id);
        if (!chatSession) {
          socket.emit("botStream", "Session expired. Please reload.");
          socket.emit("botEnd");
          return;
        }

        socket.emit("botStart");

        const result = await chatSession.sendMessageStream(message);

        let fullText = "";
        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          if (chunkText) {
            fullText += chunkText;
            socket.emit("botStream", chunkText);
          }
        }

        socket.emit("botEnd");
        console.log("✅ Bot response sent:", fullText.substring(0, 80) + "...");
      } catch (err) {
        console.error("❌ Gemini error:", err);
        socket.emit(
          "botStream",
          "Sorry, I encountered an error. Please try again.",
        );
        socket.emit("botEnd");
      }
    });

    socket.on("disconnect", () => {
      console.log("🤖 Chatbot client disconnected:", socket.id);
      chatSessions.delete(socket.id);
    });
  });

  return chatNamespace;
}

module.exports = chatbotController;
