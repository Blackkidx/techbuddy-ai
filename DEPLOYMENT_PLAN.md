# 🚀 TechBuddy Deployment Plan

> แผนการ Deploy TechBuddy ให้ใช้งานได้จริง

---

## 📊 Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Mobile App    │────▶│  Backend API    │────▶│   PostgreSQL    │
│  (Expo Build)   │     │   (Railway)     │     │   (Railway)     │
└─────────────────┘     └────────┬────────┘     └─────────────────┘
                                 │
                                 ▼
                        ┌─────────────────┐
                        │   ML Service    │
                        │ (Hugging Face)  │
                        └─────────────────┘
```

---

## 🎯 Deployment Options (แนะนำ)

| Service | Platform | ราคา | หมายเหตุ |
|---------|----------|------|----------|
| Backend | **Railway** | Free tier (500 hrs/month) | ง่าย, รองรับ Node.js |
| Database | **Railway PostgreSQL** | Included | อยู่ใน Railway |
| ML Service | **Hugging Face Spaces** | Free | เหมาะกับ ML models |
| Mobile | **Expo EAS Build** | Free (30 builds/month) | สร้าง APK/IPA |

---

## 📋 Step-by-Step Deployment

---

## Phase 1: Database (PostgreSQL)

### Option A: Railway (แนะนำ)

1. ไปที่ [railway.app](https://railway.app)
2. Login ด้วย GitHub
3. **New Project** → **Add PostgreSQL**
4. Copy **DATABASE_URL** จาก Variables tab

```
postgresql://postgres:xxx@xxx.railway.app:5432/railway
```

### Option B: Supabase (ฟรี)

1. ไปที่ [supabase.com](https://supabase.com)
2. สร้าง Project ใหม่
3. ไปที่ **Settings** → **Database** → Copy connection string

---

## Phase 2: Backend API (Node.js)

### Deploy บน Railway

1. **สร้าง Project ใหม่บน Railway**
   ```
   New Project → Deploy from GitHub repo → เลือก techbuddy-ai
   ```

2. **ตั้งค่า Root Directory**
   ```
   Settings → Root Directory → backend
   ```

3. **เพิ่ม Environment Variables**
   ```env
   DATABASE_URL=postgresql://...  (จาก Phase 1)
   JWT_SECRET=your-super-secret-key-here
   PORT=3000
   NODE_ENV=production
   ML_SERVICE_URL=https://your-ml-service.hf.space
   ```

4. **เพิ่ม Start Command**
   ```
   Settings → Start Command → npm start
   ```

5. **เพิ่ม Build Command**
   ```
   npm install && npx prisma generate && npx prisma migrate deploy
   ```

6. **Deploy!**
   - Railway จะให้ URL: `https://techbuddy-backend-xxx.railway.app`

### ไฟล์ที่ต้องแก้ไข

**backend/package.json** - เพิ่ม start script:
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

---

## Phase 3: ML Service (Python)

### Option A: Hugging Face Spaces (แนะนำ - ฟรี)

1. ไปที่ [huggingface.co/spaces](https://huggingface.co/spaces)
2. **Create new Space** → เลือก **Docker** หรือ **Gradio**
3. Upload ไฟล์จาก `ml-service/`

**สร้างไฟล์ใหม่สำหรับ HuggingFace:**

```python
# app.py สำหรับ Hugging Face Spaces
import gradio as gr
from transformers import pipeline

# Load models
intent_classifier = pipeline("text-classification", model="./model/techbuddy_intent_final")

def analyze(text):
    result = intent_classifier(text)
    return result

demo = gr.Interface(fn=analyze, inputs="text", outputs="json")
demo.launch()
```

4. **Upload Models** - ใช้ Git LFS
   ```bash
   git lfs install
   git lfs track "*.bin"
   git lfs track "*.safetensors"
   ```

### Option B: Railway (ถ้าต้องการ Flask API)

1. สร้าง Service ใหม่บน Railway
2. Root Directory → `ml-service`
3. ต้องใช้ plan ที่มี RAM มากกว่า (Hobby $5/month)

---

## Phase 4: Mobile App (React Native)

### สร้าง APK ด้วย Expo EAS

1. **ติดตั้ง EAS CLI**
   ```bash
   npm install -g eas-cli
   ```

2. **Login Expo**
   ```bash
   eas login
   ```

3. **Configure EAS**
   ```bash
   cd mobile
   eas build:configure
   ```

4. **แก้ไข app.json**
   ```json
   {
     "expo": {
       "name": "TechBuddy",
       "slug": "techbuddy",
       "version": "1.0.0",
       "android": {
         "package": "com.yourname.techbuddy"
       },
       "ios": {
         "bundleIdentifier": "com.yourname.techbuddy"
       }
     }
   }
   ```

5. **แก้ไข API URL**

   **mobile/src/config/config.js**
   ```javascript
   export const API_URL = 'https://techbuddy-backend-xxx.railway.app';
   export const SOCKET_URL = 'https://techbuddy-backend-xxx.railway.app';
   ```

6. **Build APK (Android)**
   ```bash
   eas build --platform android --profile preview
   ```
   
   หรือ Build แบบ Local:
   ```bash
   eas build --platform android --profile preview --local
   ```

7. **Build IPA (iOS)** - ต้องมี Apple Developer Account
   ```bash
   eas build --platform ios --profile preview
   ```

8. **Download & Install**
   - ไปที่ [expo.dev](https://expo.dev) → Your builds
   - Download APK/IPA
   - ติดตั้งบนมือถือ

---

## 🔧 Configuration Files ที่ต้องสร้าง

### 1. eas.json (สำหรับ Expo Build)

```json
{
  "cli": {
    "version": ">= 3.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

### 2. Procfile (สำหรับ Railway Backend)

```
web: npm start
```

### 3. railway.json (Backend)

```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "restartPolicyType": "ON_FAILURE"
  }
}
```

---

## 📱 Testing Checklist

### Backend
- [ ] API `/api/health` returns 200
- [ ] Database connection works
- [ ] JWT authentication works
- [ ] Socket.IO connection works

### ML Service
- [ ] `/analyze` endpoint works
- [ ] Translation works
- [ ] Intent classification works

### Mobile App
- [ ] Login/Register works
- [ ] Chat sends/receives messages
- [ ] Real-time updates work
- [ ] Thai Tutor loads words

---

## 💰 Cost Summary (Free Tier)

| Service | Plan | Cost |
|---------|------|------|
| Railway (Backend + DB) | Free | $0 (500 hrs/month) |
| Hugging Face Spaces | Free | $0 |
| Expo EAS Build | Free | $0 (30 builds/month) |
| **Total** | | **$0/month** |

### ถ้าต้องการ Scale Up

| Service | Plan | Cost |
|---------|------|------|
| Railway | Hobby | $5/month |
| Hugging Face | Pro | $9/month |
| Expo | Production | $99/year |

---

## 🚨 Important Notes

1. **ML Models**: ไฟล์ model ใหญ่ต้อง upload แยกหรือใช้ Git LFS
2. **Environment Variables**: อย่าเปิดเผย secrets บน GitHub
3. **CORS**: ตั้งค่า CORS ใน Backend ให้รองรับ Mobile
4. **SSL**: Railway ให้ HTTPS ฟรี

---

## 📞 Support

หากมีปัญหาในการ Deploy:
- Railway Docs: https://docs.railway.app
- Expo Docs: https://docs.expo.dev
- Hugging Face Docs: https://huggingface.co/docs

---

## ⏱️ Estimated Timeline

| Task | Duration |
|------|----------|
| Setup Database | 30 นาที |
| Deploy Backend | 1-2 ชั่วโมง |
| Deploy ML Service | 2-3 ชั่วโมง |
| Build Mobile APK | 30-60 นาที |
| Testing | 1-2 ชั่วโมง |
| **Total** | **~1 วัน** |

---

🎉 **เมื่อ Deploy เสร็จ แอพก็พร้อมใช้งานจริง!**
