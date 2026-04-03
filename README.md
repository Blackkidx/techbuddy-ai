# 🤖 TechBuddy — AI-Powered Multilingual Communication Assistant

> ระบบสื่อสารอัจฉริยะสำหรับ Intern ญี่ปุ่น-ไทย พร้อม Workspace, Real-time Chat, AI Translation และระบบสอนภาษาไทย  
> Developed as a Cooperative Education Project at **Hokkaido Information University** 🇯🇵

<div align="center">

![Status](https://img.shields.io/badge/Status-Deployed-brightgreen)
![Backend](https://img.shields.io/badge/Backend-Render-46E3B7?logo=render)
![ML](https://img.shields.io/badge/ML%20Service-HuggingFace%20Spaces-FFD21E?logo=huggingface)
![Mobile](https://img.shields.io/badge/Mobile-React%20Native%20%2B%20Expo-61DAFB?logo=react)
![License](https://img.shields.io/badge/License-MIT-blue)

**[🚀 Live Backend](https://techbuddy-ai.onrender.com/health)** • **[🤗 ML Service](https://blackkidx-techbuddy-ml.hf.space)** • **[📦 GitHub](https://github.com/Blackkidx/techbuddy-ai)**

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Architecture](#-architecture)
- [Technology Stack](#-technology-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [API Reference](#-api-reference)
- [Deployment](#-deployment)
- [Author](#-author)

---

## 🎯 Overview

TechBuddy เป็นแอปพลิเคชันมือถือ (React Native) ที่ออกแบบมาเพื่อช่วยให้ Intern ชาวไทยสื่อสารกับเพื่อนร่วมงานชาวญี่ปุ่นได้อย่างราบรื่น โดยมีระบบ AI แปลภาษา, จำแนกความตั้งใจ (Intent), ดึงคำศัพท์เทคนิค (NER) และระบบสอนภาษาไทยสำหรับผู้มาใหม่

**Core Problems Solved:**
- 🌐 ภาษาที่แตกต่างกันระหว่าง Intern ไทย-ญี่ปุ่น
- 💬 การสื่อสารเรื่องเทคนิค (คำศัพท์เทคโนโลยีที่ต้องแปลอย่างแม่นยำ)
- 📚 การเรียนรู้ภาษาไทยสำหรับ Intern ต่างชาติ

---

## ✨ Features

### 💬 Real-time Chat & Workspace System
- **1-to-1 Direct Message** — แชทส่วนตัวแบบ Real-time ด้วย Socket.IO
- **Workspace / Servers** — ระบบ workspace คล้าย Discord สร้าง server ส่วนกลางสำหรับทีม
- **Channels** — แชทแบบ group ภายใน workspace แยกตามหัวข้อ
- **Invite System** — ระบบ invite code สำหรับเชิญสมาชิกเข้า server
- **Media Attachments** — แนบรูปภาพ/ไฟล์ใน chat ผ่าน Supabase Storage
- **Typing Indicator & Read Receipts** — สถานะพิมพ์และอ่านข้อความ
- **Online Status** — แสดงสถานะออนไลน์/ออฟไลน์แบบ Real-time

### 🤖 AI & ML Pipeline
- **Automatic Translation (EN ↔ JA)** — ใช้ Facebook M2M100 (418M parameters) พร้อม MarianMT fallback
- **Technical Term Protection** — ป้องกันคำเทคนิค (React, PostgreSQL, API ฯลฯ) จากการถูกแปลผิด
- **Intent Classification** — จำแนก 4 ประเภท: `Problem`, `Question`, `Request`, `Update`
- **NER (Named Entity Recognition)** — ดึงคำศัพท์เทคนิคทั้งภาษาอังกฤษ (BERT+CRF) และญี่ปุ่น (Pattern-based, 150+ terms)
- **Smart Intent Detection** — ข้ามข้อความ casual (hi, thanks) ไม่ส่งเข้า model โดยไม่จำเป็น
- **RAG Service** — Retrieval-Augmented Generation สำหรับค้นหา glossary
- **LLM Integration (Groq)** — AI explanations และ context-aware responses

### 📚 Thai Language Tutor
- **Daily Word** — คำศัพท์ภาษาไทยประจำวัน
- **Categories** — หมวดหมู่คำศัพท์ (อาหาร, เทคโนโลยี, การทำงาน)
- **Word Detail** — คำอธิบายละเอียดพร้อมตัวอย่างประโยค
- **Audio Pronunciation (TTS)** — เสียงออกเสียงภาษาไทย
- **My Dictionary** — บันทึกคำศัพท์ส่วนตัว
- **Spaced Repetition** — ระบบทบทวนคำศัพท์อัจฉริยะ

### 👤 User System
- **Auth** — Register/Login ด้วย Supabase Auth + JWT
- **Profile & Edit Profile** — แก้ไขโปรไฟล์และรูปภาพ
- **Friend System** — ส่ง/รับ/ปฏิเสธคำขอเป็นเพื่อน
- **Feedback System** — ส่ง Feedback ให้ทีม AI ปรับปรุง

---

## 🏗️ Architecture

```
┌────────────────────────────────────────────────────────────┐
│                    Mobile App (Expo)                        │
│              React Native + Socket.IO Client                │
└───────────────────┬────────────────────────────────────────┘
                    │ HTTP + WebSocket
                    ▼
┌────────────────────────────────────────────────────────────┐
│              Backend API (Render)                           │
│         Node.js + Express + Socket.IO Server                │
│  Routes: Auth / Chat / Friends / ThaiTutor / Feedback       │
└────────┬───────────────────────────┬───────────────────────┘
         │ HTTP (analyze, predict)   │ Supabase Client
         ▼                           ▼
┌────────────────────┐  ┌───────────────────────────────────┐
│  ML Service        │  │         Supabase (Cloud)           │
│  HuggingFace Space │  │  PostgreSQL │ Auth │ Storage       │
│                    │  └───────────────────────────────────┘
│  ┌──────────────┐  │
│  │ Intent Model │  │  Models hosted on HuggingFace Hub:
│  │ (DistilBERT) │  │  • Blackkidx/techbuddy-intent-model
│  ├──────────────┤  │  • Blackkidx/techbuddy-ner-model
│  │ NER Model    │  │
│  │ (BERT + CRF) │  │
│  ├──────────────┤  │
│  │ Translation  │  │
│  │ (M2M100)     │  │
│  ├──────────────┤  │
│  │ RAG Service  │  │
│  ├──────────────┤  │
│  │ LLM (Groq)   │  │
│  └──────────────┘  │
└────────────────────┘
```

---

## 🛠️ Technology Stack

### Mobile (React Native)
| เทคโนโลยี | การใช้งาน |
|---|---|
| React Native + Expo | Mobile framework |
| Expo Router | File-based navigation |
| Socket.IO Client | Real-time messaging |
| Supabase JS | Auth + Storage |
| Context API | State management (Auth, Socket, Settings, Theme, Translation) |
| Custom Theme System | Design tokens: colors, typography, spacing, shadows |

### Backend (Node.js)
| เทคโนโลยี | การใช้งาน |
|---|---|
| Express.js | REST API framework |
| Socket.IO | Real-time WebSocket server |
| Supabase (PostgreSQL) | Database |
| Supabase Auth | Authentication |
| JWT | Token validation |
| Multer | File upload handling |
| Render | Cloud deployment |

### ML Service (Python)
| เทคโนโลยี | การใช้งาน |
|---|---|
| Flask + Gunicorn | Production WSGI server |
| PyTorch | Deep learning framework |
| HuggingFace Transformers | Pre-trained models |
| facebook/m2m100_418M | Multilingual translation |
| DistilBERT (fine-tuned) | Intent classification |
| BERT + CRF (custom) | Named entity recognition |
| Groq API | LLM inference |
| FAISS | Vector similarity search (RAG) |
| Sentence Transformers | Text embeddings (RAG) |
| HuggingFace Spaces + Docker | Cloud deployment |

---

## 📁 Project Structure

```
TechBuddy/
├── backend/                    # Node.js API Server (→ Render)
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── chatController.js
│   │   ├── feedbackController.js
│   │   └── thaiTutor.controller.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── chat.js
│   │   ├── friends.js          # Friend request system
│   │   ├── users.js
│   │   ├── feedback.js
│   │   └── thaiTutor.routes.js
│   ├── src/socket/             # Socket.IO event handlers
│   ├── services/
│   │   └── mlService.js        # ML Service integration
│   ├── server.js               # Entry point
│   └── render.yaml             # Render deployment config
│
├── mobile/                     # React Native + Expo App
│   └── src/
│       ├── screens/            # 24 screens
│       │   ├── ChatScreen.js
│       │   ├── ServerListScreen.js     # Workspace list
│       │   ├── ChannelChatScreen.js    # Group channel chat
│       │   ├── FriendListScreen.js
│       │   ├── DailyWordScreen.js
│       │   ├── MyDictionaryScreen.js
│       │   └── ...
│       ├── components/         # Reusable UI components
│       │   ├── AIAnalysisView.js   # AI result display
│       │   ├── AttachmentBubble.js # Media message bubble
│       │   ├── DailyWordCard.js
│       │   └── ...
│       ├── contexts/           # React Contexts
│       │   ├── AuthContext.js
│       │   ├── SocketContext.js
│       │   ├── SettingsContext.js
│       │   ├── ThemeContext.js
│       │   └── TranslationContext.js
│       ├── services/
│       │   ├── api.js           # Axios instance + interceptors
│       │   ├── socket.service.js
│       │   ├── channelService.js   # Supabase channel operations
│       │   ├── serverService.js    # Workspace management
│       │   └── ...
│       ├── config/
│       │   └── config.js       # API endpoints, colors, sizes
│       └── theme/              # Design system
│           ├── colors.js
│           ├── typography.js
│           ├── spacing.js
│           └── shadows.js
│
├── ml-service/                 # Python ML Service
│   ├── app.py                  # Flask API (Intent + NER + Translation)
│   ├── ner_pipeline.py         # Custom BERT+CRF pipeline
│   ├── bert_crf_model.py       # CRF layer implementation
│   ├── rag_service.py          # RAG with FAISS
│   ├── llm_service.py          # Groq LLM integration
│   ├── glossary.json           # Technical glossary (EN/JA/TH)
│   └── requirements.txt
│
├── hf-space-temp/              # HuggingFace Spaces deployment
│   ├── Dockerfile              # Production Docker image
│   └── ...                     # (clone of ml-service for HF)
│
└── supabase/
    └── migrations/             # Database migrations
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.11+
- Expo CLI (`npm install -g expo-cli`)
- Supabase account
- HuggingFace account (for ML models)

### 1. Clone Repository
```bash
git clone https://github.com/Blackkidx/techbuddy-ai.git
cd techbuddy-ai
```

### 2. Backend Setup
```bash
cd backend
cp .env.example .env
# Fill in your Supabase credentials in .env
npm install
npm run dev
```

### 3. Mobile App Setup
```bash
cd mobile
npm install
npx expo start
```

### 4. ML Service Setup (Local)
```bash
cd ml-service
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

### Environment Variables

**`backend/.env`**
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ML_SERVICE_URL=https://blackkidx-techbuddy-ml.hf.space
PORT=3000
NODE_ENV=development
```

**`ml-service/.env`**
```env
GROQ_API_KEY=your-groq-api-key
```

---

## 📡 API Reference

### Backend (https://techbuddy-ai.onrender.com)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Service health check |
| GET | `/api/health` | Detailed health + ML status |
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login + get JWT token |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/chat/friends` | List chat friends |
| GET | `/api/chat/messages/:id` | Get message history |
| POST | `/api/chat/send` | Send message |
| GET | `/api/friends/list` | Get friend list |
| POST | `/api/friends/add` | Send friend request |
| GET | `/api/thai-tutor/daily-word` | Get word of the day |
| GET | `/api/thai-tutor/categories` | Get word categories |

### ML Service (https://blackkidx-techbuddy-ml.hf.space)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Service info |
| GET | `/health` | Model status (intent/NER/translation) |
| POST | `/analyze` | Full AI pipeline: intent + NER + translation |

**Example `/analyze` request:**
```json
{
  "text": "The PostgreSQL connection is failing with timeout error",
  "target_lang": "ja"
}
```

**Response:**
```json
{
  "success": true,
  "intent": "Problem",
  "confidence": 0.94,
  "translation": "PostgreSQL接続がタイムアウトエラーで失敗しています",
  "technicalTerms": [
    { "term": "PostgreSQL", "score": 1.0 },
    { "term": "connection", "score": 1.0 },
    { "term": "error", "score": 1.0 }
  ],
  "sourceLanguage": "en",
  "targetLanguage": "ja"
}
```

---

## 🌐 Deployment

| Service | Platform | URL |
|---|---|---|
| **Backend API** | Render (Free) | https://techbuddy-ai.onrender.com |
| **ML Service** | HuggingFace Spaces (Docker) | https://blackkidx-techbuddy-ml.hf.space |
| **Database** | Supabase (Cloud PostgreSQL) | Managed |
| **File Storage** | Supabase Storage | Managed |
| **ML Models** | HuggingFace Hub | Blackkidx/techbuddy-intent-model, Blackkidx/techbuddy-ner-model |

---

## 👤 Author

**Thanatan Budsri**

- 🏫 Cooperative Education at **Hokkaido Information University**, Japan 🇯🇵
- 📅 Duration: October – December 2025 (8 weeks)
- 💼 Project Type: Internship / Cooperative Education
- 🐙 GitHub: [@Blackkidx](https://github.com/Blackkidx)
- 📦 Repository: [techbuddy-ai](https://github.com/Blackkidx/techbuddy-ai)

---

## 🎉 Acknowledgments

- **Hokkaido Information University** — Supervisors and mentors for guidance
- **HuggingFace** — Pre-trained models and hosting (Spaces)
- **Supabase** — Backend-as-a-Service (Database, Auth, Storage)
- **Render** — Backend cloud deployment
- **Groq** — Fast LLM inference API
- **Facebook Research** — M2M100 multilingual translation model
- **React Native & Expo** community

---

## 📄 License

This project is developed as part of a Cooperative Education (สหกิจศึกษา) program.  
MIT License — see [LICENSE](LICENSE) for details.
