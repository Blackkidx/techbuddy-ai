# 🤖 TechBuddy - AI-Powered Multilingual Communication Assistant

> ระบบช่วยสื่อสารอัจฉริยะสำหรับ Intern ญี่ปุ่น-ไทย พร้อมระบบสอนภาษาไทย

![Status](https://img.shields.io/badge/Status-Development%20Complete-brightgreen)
![Week](https://img.shields.io/badge/Progress-Week%208%2F8-blue)
![Next](https://img.shields.io/badge/Next%20Step-Deployment-orange)

---

## 📋 Project Status

| สัปดาห์ | งาน | สถานะ |
|---------|-----|--------|
| Week 1-2 | Research & Data Gathering | ✅ เสร็จสิ้น |
| Week 3-4 | Initial Model Development | ✅ เสร็จสิ้น |
| Week 5-6 | Testing & Optimization | ✅ เสร็จสิ้น |
| Week 7-8 | UI/UX & Integration | ✅ เสร็จสิ้น |
| **Next** | **Deployment** | 🚀 รอดำเนินการ |

---

## 🎯 Features

### 💬 Real-time Chat System
- ระบบแชท 1-to-1 แบบ Real-time ด้วย Socket.IO
- ระบบเพื่อน (Friend Request, Accept, Reject)
- สถานะออนไลน์/ออฟไลน์
- Typing Indicator

### 🤖 AI & ML Capabilities
- **Automatic Translation**: EN ↔ JP ↔ TH พร้อมรักษาคำศัพท์เทคนิค
- **Intent Classification**: จำแนกประเภทข้อความ (request, question, update, problem)
- **Named Entity Recognition (NER)**: ดึงคำศัพท์เทคนิคอย่างแม่นยำ
- **Tone Detection**: ตรวจจับโทนข้อความ (polite, casual, urgent)

### 📚 Thai Language Tutor
- คำศัพท์รายวัน (Daily Word)
- หมวดหมู่คำศัพท์ (Categories)
- เสียงออกเสียงภาษาไทย (TTS)
- ระบบบันทึกคำศัพท์ส่วนตัว (My Dictionary)

### 📊 Feedback System
- ระบบ Feedback Loop สำหรับปรับปรุง AI
- รองรับหลายภาษา (TH, EN, JA)

---

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js + Express.js
- **Database**: PostgreSQL + Prisma ORM
- **Real-time**: Socket.IO
- **Authentication**: JWT

### Frontend (Mobile)
- **Framework**: React Native + Expo
- **Navigation**: React Navigation
- **State**: Context API
- **UI**: Custom Components + Animations

### ML Service
- **Framework**: Python + Flask
- **Models**: 
  - BERT + CRF (NER)
  - DistilBERT (Intent Classification)
  - MarianMT (Translation)
- **Libraries**: PyTorch, Transformers (HuggingFace)

---

## 📁 Project Structure

```
TechBuddy/
├── backend/              # Node.js API Server
│   ├── controllers/      # Business logic
│   ├── routes/           # API endpoints
│   ├── prisma/           # Database schema & migrations
│   ├── src/socket/       # Socket.IO handlers
│   └── services/         # External services (AI, TTS)
│
├── mobile/               # React Native App
│   ├── src/
│   │   ├── screens/      # App screens
│   │   ├── components/   # Reusable components
│   │   ├── contexts/     # Auth & Socket contexts
│   │   ├── services/     # API & Socket services
│   │   └── theme/        # Design system
│   └── assets/           # Images & icons
│
├── ml-service/           # Python ML Service
│   ├── app.py            # Flask API
│   ├── model/            # Trained models
│   └── requirements.txt  # Dependencies
│
└── public/               # Static files
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.9+
- PostgreSQL
- Expo CLI

### Backend Setup
```bash
cd backend
npm install
npx prisma migrate dev
npm run dev
```

### Mobile Setup
```bash
cd mobile
npm install
npx expo start
```

### ML Service Setup
```bash
cd ml-service
pip install -r requirements.txt
python app.py
```

---

## 📱 Screenshots

> *Coming soon after deployment*

---

## 👤 Author

**Thanatan Budsri**

- 📧 Project: AI Communication Assistant (TechBuddy)
- 📅 Duration: 8 weeks (October - December 2024)
- 🏢 Internship Project

---

## 📄 License

This project is for educational purposes as part of an internship program.

---

## 🎉 Acknowledgments

- Supervisors and mentors for guidance
- HuggingFace for pre-trained models
- React Native & Expo community
