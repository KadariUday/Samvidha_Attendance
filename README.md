# Samvidha Attendance Web Dashboard

A premium, full-stack web application to track and visualize attendance from the IARE Samvidha portal. Featuring a FastAPI backend and a React + Vite dashboard with glassmorphic aesthetics.

## 🚀 Features

- **Automated Scraping**: Real-time extraction of course attendance and biometric data.
- **Smart Metrics**: Calculations for overall course average and adjusted biometric percentages.
- **Modern Dashboard**: A high-fidelity, responsive UI built with React and Tailwind CSS.
- **Micro-interactions**: Smooth animations using Framer Motion and Lucide icons.

## 📂 Project Structure

- `/backend`: FastAPI server handling authentication and scraping logic.
- `/frontend`: React + Vite application for the user interface.

## 🔧 Getting Started

### 1. Backend Setup
Navigate to the `backend` directory:
```bash
cd backend
pip install -r requirements.txt
python main.py
```
*The API will be available at `http://localhost:8000`*

### 2. Frontend Setup
Navigate to the `frontend` directory:
```bash
cd frontend
npm install
npm run dev
```
*The dashboard will be available at `http://localhost:5173`*

## 🛠️ Tech Stack

- **Backend**: FastAPI, BeautifulSoup4, Requests
- **Frontend**: React, Vite, Tailwind CSS, Framer Motion, Lucide React

## ⚠️ Disclaimer

This tool is for educational purposes only. Use it responsibly and ensure you comply with your institution's policies regarding automated access to their portals.

---
*Created by Kadari Uday*
