# Samvidha Attendance (Project Documentation)

A premium, full-stack web application designed to track and visualize student attendance from the IARE Samvidha portal. This tool provides a high-fidelity dashboard with real-time scraping capabilities and deep analytics.

## 🚀 Key Features

### 1. Real-time Attendance Scraping
- Automatically logs into the Samvidha portal to fetch the latest data.
- Scrapes **Course Attendance Breakdown**, **Biometric History**, and **Attendance Register**.
- Optimized for speed with asynchronous concurrent scraping.

### 2. Smart Analytics (Bunk Board)
- **Target Analysis**: Allows students to set a target attendance percentage (e.g., 75%).
- **Interactive Planning**: Calculates exactly how many classes can be safely skipped or how many must be attended to reach the target.
- **Biometric Goal**: Predicts how many more days are needed to maintain biometric compliance.

### 3. Glassmorphic Dashboard
- **Glassmorphic UI**: High-end translucent interface with ambient background shapes.
- **3D Transitions**: Smooth page rotations and spring-based animations using Framer Motion.
- **Sorting & Filtering**: Dynamic sorting of attendance data (Highest/Lowest first).

---

## 🏗️ Architecture

### Backend (FastAPI)
The backend acts as a proxy and scraper engine.
- **FastAPI**: Handles API requests and authentication.
- **Httpx (Async)**: Manages network requests to the Samvidha portal.
- **BeautifulSoup4**: Parses HTML data into structured JSON.
- **Environment Driven**: Uses `.env` for secure configuration (API URLs, etc.).

### Frontend (React + Vite)
The frontend provides the user experience and visualization.
- **React 18**: Component-based architecture.
- **Tailwind CSS**: Utility-first styling for the glassmorphic theme.
- **Framer Motion**: Powering all 3D rotations and micro-animations.
- **Lucide Icons**: Consistent, clean iconography.

---

## 🔧 Technical Setup

### Prerequisites
- Python 3.8+
- Node.js 16+

### 1. Backend Installation
```bash
cd backend
pip install -r requirements.txt
python main.py
```

### 2. Frontend Installation
```bash
cd frontend
npm install
npm run dev
```

## 📜 Project Structure
- `backend/main.py`: Core server and scraping logic.
- `frontend/src/App.jsx`: Main UI and state management.


---
*Maintained by Kadari Uday*
