# 🏟️ StadiumGPT — Smart Stadium & Tournament Operations AI

Built for **PromptWars Challenge 4** by Google for Developers

## 🔗 Live Demo
👉 [Live App](https://smart-stadium-ai.vercel.app)

## 🎯 Chosen Vertical
Smart Stadium Operations — Fan Assistance, Crowd Management, Navigation & Accessibility

## 💡 What it does
StadiumGPT is a GenAI-powered assistant for FIFA World Cup 2026 that helps:

- 🗺️ **Navigation** — Real-time gate and facility directions
- 👥 **Crowd Management** — Live density monitoring with smart diversion
- 🚨 **Emergency Response** — Instant protocols for fire, medical, lost child
- ♿ **Accessibility** — Wheelchair routes, elevator info, audio assistance
- 🌍 **Multilingual** — Responds in user's language
- 🌱 **Sustainability** — Eco routing, zero-plastic zones, solar transit info

## 🛠️ How it works
1. Fan types a question in the chat
2. Request is sanitized and sent to backend
3. Groq AI (Llama 3.3 70B) generates context-aware response
4. Live crowd levels influence routing recommendations
5. Emergency keywords trigger instant safety protocols

## 🏗️ Architecture
- **Frontend:** React + TypeScript + Tailwind CSS + Vite
- **Backend:** Node.js + Express + TypeScript
- **AI:** Groq API (Llama 3.3 70B)
- **Security:** Helmet, CORS, Rate limiting, Input sanitization
- **Testing:** 23 unit tests covering sanitization, routing, emergency detection

## 🧪 Running Tests
```bash
npx tsx apps/backend/src/test.ts
```

## 🚀 Local Setup
```bash
npm run install-all
npm run dev
```

Frontend: http://localhost:5173
Backend: http://localhost:5000

## ⚙️ Environment Variables