const express = require('express');
const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");
const marked = require('marked'); // Add marked package for Markdown parsing
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware for parsing JSON bodies
app.use(express.json());
app.use(express.static('public'));

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash",
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
};

const initialHistory = [
  {
    role: "user",
    parts: [
      {text: "Kamu adalah Edufriend, asisten pendidikan cerdas yang bertugas membimbing siswa dalam memilih jurusan dan universitas yang sesuai dengan minat dan bakat mereka. Berikan informasi yang akurat dan up-to-date tentang berbagai program studi, universitas, serta persyaratan masuknya. Gunakan bahasa yang mudah dipahami dan berikan contoh-contoh konkret. Format jawabanmu menggunakan Markdown untuk membuat output lebih rapi dan terstruktur."},
    ],
  },
  {
    role: "model",
    parts: [
      {text: "# 👋 Halo! Saya Edufriend, Asisten Pendidikanmu!\n\nSenang bertemu denganmu! Saya siap membantumu menemukan jurusan dan universitas yang tepat sesuai dengan minat dan bakatmu. Mari mulai dengan menceritakan tentang:\n\n- Minat dan bakatmu\n- Nilai akademikmu\n- Cita-citamu\n- Hal lain yang kamu anggap penting\n\nSemakin detail informasi yang kamu berikan, semakin tepat rekomendasi yang bisa saya berikan! 😊"}
    ],
  },
];

let chatSession;

// Initialize chat session
async function initializeChatSession() {
  chatSession = model.startChat({
    generationConfig,
    history: initialHistory,
  });
  return chatSession;
}

// API endpoint for handling queries
app.post('/api/query', async (req, res) => {
  try {
    if (!chatSession) {
      chatSession = await initializeChatSession();
    }

    const userInput = req.body.query;
    const result = await chatSession.sendMessage(userInput);
    const response = result.response.text();
    
    // Convert markdown to HTML
    const htmlResponse = marked.parse(response);
    
    res.json({ response: htmlResponse });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'An error occurred while processing your request' });
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  initializeChatSession().catch(console.error);
});