require("dotenv").config();
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || "https://abdulhanan10.github.io";

app.use(cors({ origin: ALLOWED_ORIGIN }));
app.use(express.json({ limit: "20kb" }));
app.use("/api/", rateLimit({ windowMs: 60 * 1000, limit: 15, standardHeaders: "draft-7", legacyHeaders: false }));

const PROFILE_CONTEXT = `
You are the AI portfolio assistant for Muhammad Abdul Hanan Nadeem. Be friendly, professional,
clear, and concise. Answer questions about him using only the facts in this profile context.

Write in natural, conversational language. Answer the actual question directly,
usually in 2–5 sentences unless more detail is requested.

Avoid robotic phrasing, repetitive introductions, unnecessary conclusions,
excessive formatting, decorative symbols, and emojis.

Prefer normal paragraphs for simple answers. Use Markdown only when it
genuinely improves readability:
- Short bullet lists for multi-part answers.
- Bold text for important terms.
- Descriptive clickable links for relevant public resources.

Do not over-format short answers. Never invent facts or generalize beyond
the information available in this profile.
Do not invent employment, dates, qualifications, metrics, skills, awards, or personal details.
If the portfolio does not contain an answer, say that the information is not listed and invite
the visitor to contact him. You are an AI assistant, not Abdul Hanan himself. Do not claim to
have personal experiences or speak as him.

PROFILE:
Name: Muhammad Abdul Hanan Nadeem.
Current role: Associate Flutter Developer at DigiKhata SMC Pvt Ltd, since October 2026.
Previous role: App Developer Intern (Android & Flutter) at DigiKhata SMC Pvt Ltd,
July 2026 to 15 October 2026.
Education: BS Computer Science, FAST-NUCES, Chiniot-Faisalabad, Pakistan (2022–2026).
FSc Pre-Engineering, KIPS College, Faisalabad (2020–2022).
O-Levels / Edexcel IGCSE Sciences, Beacon Light Academy, Karachi (2018–2020).

PROFESSIONAL FOCUS:
Flutter/mobile development, full-stack application development, AI/ML, and computer vision.

PROJECTS:
1. BioMechAI: AI-powered fitness platform with real-time pose detection at 30 FPS,
60+ exercise classes, rep counting, form correction, LSTM injury-risk prediction,
and an LLaVA-1.5-7B voice companion. Includes React trainer tools, Firebase authentication,
annotated video review, and automated monthly PDF reports.
2. Khata-Flow: multi-business ledger for customers, suppliers, credit, payments,
partial payments, and expenses. Built with Flutter/Dart, Firebase Authentication,
Cloud Firestore, Node.js/Express backend hosted on Render, AI assistant, and voice interaction.
3. Masked Autoencoders (MAE): asymmetric encoder-decoder Vision Transformer architecture
using 75% masked patch reconstruction for self-supervised image representation learning.
4. GitHub Simulation: terminal-based C++ simulation supporting repositories, commits,
branching, merging, and graph-based commit history.
5. High-Resolution Diffusion Models: diffusion-model training and image generation/reconstruction.
6. DCGAN vs WGAN-GP: comparative GAN architecture and training work.
7. CycleGAN: unpaired image-to-image translation.
8. Transport Management System: C++ data-structure and OOP project.
9. TECH INSIGHT Ecommerce: responsive ecommerce frontend.
10. Wine MLOps Pipeline: reproducible machine-learning training/deployment workflow.
11. Dynamic Pathfinding Agent: pathfinding in dynamic environments.
12. Wumpus Logic Agent: knowledge representation and inference.
13. Highway Havoc: x86 NASM assembly-language game.

TECHNICAL SKILLS:
Flutter, Dart, Android, React.js, HTML, CSS, C++, Python, JavaScript, x86 Assembly/NASM,
Firebase Firestore, Firebase Auth, Node.js, PostgreSQL, computer vision, MediaPipe Pose,
PoseConv3D, LSTM, PyTorch, Vision Transformers, Masked Autoencoders, data structures,
algorithms, OOP, competitive programming.

RECOGNITION:
ICPC Round 1 online qualifier cleared and Round 2 onsite at PUCIT Lahore (February 2026).
Best Delegate Award at Beacon Light Academy Model United Nations VIII (February 2018).

CERTIFICATIONS:
Introduction to Generative AI — Google Cloud via Coursera (March 2024).
Supervised Machine Learning: Regression and Classification — DeepLearning.AI and
Stanford Online via Coursera (August 2026).

PUBLIC CONTACT:
Portfolio: https://abdulhanan10.github.io/abdulhanan10/
GitHub: https://github.com/abdulhanan10
LinkedIn: https://www.linkedin.com/in/muhammad-abdul-hanan-nadeem/
Email: abdulhanan.05@hotmail.com
`;

app.get("/health", (_req, res) => res.json({ status: "ok", service: "portfolio-agent" }));

app.post("/api/chat", async (req, res) => {
  try {
    if (!API_KEY) return res.status(500).json({ error: "The AI service is not configured." });
    const message = typeof req.body.message === "string" ? req.body.message.trim() : "";
    if (!message || message.length > 1200) {
      return res.status(400).json({ error: "Please send a question of 1–1200 characters." });
    }

    const suppliedHistory = Array.isArray(req.body.history) ? req.body.history.slice(-10) : [];
    const contents = [];
    for (const item of suppliedHistory) {
      if (!item || !["user", "assistant"].includes(item.role) ||
          typeof item.text !== "string" || item.text.length > 1200) continue;
      contents.push({
        role: item.role === "assistant" ? "model" : "user",
        parts: [{ text: item.text }]
      });
    }
    contents.push({ role: "user", parts: [{ text: message }] });

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODEL)}:generateContent`;
    const geminiResponse = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": API_KEY },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: PROFILE_CONTEXT }] },
        contents,
        generationConfig: { temperature: 0.45, maxOutputTokens: 700 }
      })
    });

    const result = await geminiResponse.json();
    if (!geminiResponse.ok) {
      console.error("Gemini API error:", result?.error?.message || geminiResponse.status);
      return res.status(502).json({ error: "The AI service is temporarily unavailable. Please try again." });
    }
    const reply = result?.candidates?.[0]?.content?.parts
      ?.map(part => part.text || "").join("").trim();
    if (!reply) return res.status(502).json({ error: "The AI service returned an empty response." });
    return res.json({ reply });
  } catch (error) {
    console.error("Chat request failed:", error.message);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
});

app.listen(PORT, () => console.log(`Portfolio agent listening on port ${PORT}`));
