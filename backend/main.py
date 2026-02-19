from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from contextlib import asynccontextmanager
import httpx
import asyncio
from bs4 import BeautifulSoup
import urllib3
from typing import List, Dict, Any
import time
import os
import sys
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime
from dotenv import load_dotenv
import certifi

# Force UTF-8 output to avoid UnicodeEncodeError on Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# Load environment variables - search multiple locations
for candidate in [
    os.path.join(os.getcwd(), '.env'),
    os.path.join(os.path.dirname(os.getcwd()), '.env'),
    os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '.env'),
]:
    if os.path.exists(candidate):
        load_dotenv(candidate)
        print(f"Loaded .env from: {candidate}")
        break
else:
    load_dotenv()
    print("Loaded .env from default location")

# Suppress SSL warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# MongoDB Configuration
MONGO_URI = os.getenv("MONGO_URI", "mongodb+srv://kadariudaycl_db_user:yUFCCZwwzWMRip4v@cluster0.dve9vkg.mongodb.net/?appName=Cluster0")
DB_NAME = os.getenv("DB_NAME", "samvidha_db")

# MongoDB globals
client_db = None
db = None
collection_users = None
collection_history = None

async def init_mongo():
    """Initialize MongoDB connection. Returns True on success."""
    global client_db, db, collection_users, collection_history
    try:
        print(f"Connecting to MongoDB database: {DB_NAME} ...")
        client_db = AsyncIOMotorClient(
            MONGO_URI,
            serverSelectionTimeoutMS=10000,
            connectTimeoutMS=10000,
            tlsCAFile=certifi.where()
        )
        await client_db.admin.command('ping')
        db = client_db[DB_NAME]
        collection_users = db["users"]
        collection_history = db["login_history"]
        print(f"[SUCCESS] Connected to MongoDB: {DB_NAME}")
        return True
    except Exception as e:
        print(f"[ERROR] MongoDB connection failed: {e}")
        print(">>> IMPORTANT: Make sure your IP is whitelisted in MongoDB Atlas (Network Access)")
        print(f">>> DB Name: {DB_NAME}, URI prefix: {MONGO_URI[:40]}...")
        return False


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage startup and shutdown lifecycle."""
    await init_mongo()
    yield
    if client_db:
        client_db.close()
        print("MongoDB connection closed.")

app = FastAPI(title="Samvidha Attendance API", lifespan=lifespan)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LoginRequest(BaseModel):
    username: str
    password: str

LOGIN_URL = "https://samvidha.iare.ac.in/pages/login/checkUser.php"
ATTENDANCE_URL = "https://samvidha.iare.ac.in/home?action=stud_att_STD"
BIOMETRIC_URL = "https://samvidha.iare.ac.in/home?action=std_bio"

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
}

async def scrape_attendance_data(client: httpx.AsyncClient):
    try:
        start_time = time.time()
        att_response = await client.get(ATTENDANCE_URL, headers=HEADERS)
        att_soup = BeautifulSoup(att_response.content, 'html.parser')
        
        att_tables = att_soup.find_all('table')
        
        student_info = {}
        course_attendance = []
        overall_course_avg = 0.0

        if len(att_tables) > 0:
            info_rows = att_tables[0].find_all('tr')
            for row in info_rows:
                cols = [c.text.strip() for c in row.find_all(['td', 'th'])]
                for i in range(0, len(cols), 2):
                    if i + 1 < len(cols):
                        key = cols[i].replace(':', '').strip()
                        val = cols[i+1].strip()
                        student_info[key] = val

        if len(att_tables) > 1:
            course_table = att_tables[1]
            rows = course_table.find_all('tr')
            if rows:
                header = [h.text.strip() for h in rows[0].find_all(['th', 'td'])]
                attendance_values = []
                for row in rows[1:]:
                    cols = [c.text.strip() for c in row.find_all('td')]
                    if len(cols) >= 8:
                        course_data = dict(zip(header, cols))
                        course_attendance.append(course_data)
                        try:
                            percentage = float(cols[7])
                            attendance_values.append(percentage)
                        except (ValueError, IndexError):
                            pass
                
                if attendance_values:
                    overall_course_avg = round(sum(attendance_values) / len(attendance_values), 2)

        roll_no = student_info.get('Rollno') or student_info.get('Roll No')
        if roll_no:
            roll_no = roll_no.strip()
            student_info['profile_image'] = f"https://iare-data.s3.ap-south-1.amazonaws.com/uploads/STUDENTS/{roll_no}/{roll_no}.jpg"
        else:
            student_info['profile_image'] = None

        print(f"Attendance scraping took: {time.time() - start_time:.2f}s")
        return {
            "student_info": student_info,
            "course_attendance": course_attendance,
            "overall_course_avg": overall_course_avg
        }
    except Exception as e:
        print(f"Scraping error (attendance): {e}")
        return None

async def scrape_biometric_data(client: httpx.AsyncClient):
    try:
        start_time = time.time()
        bio_response = await client.get(BIOMETRIC_URL, headers=HEADERS)
        bio_soup = BeautifulSoup(bio_response.content, 'html.parser')
        
        bio_table = bio_soup.find('table')
        if bio_table:
            rows = bio_table.find_all('tr')[1:]
            raw_count = 0
            total_present = 0
            
            for row in rows:
                cols = row.find_all('td')
                if len(cols) > 1:
                    raw_count += 1
                    if "Present" in row.get_text():
                        total_present += 1
            
            adjusted_total = raw_count - 1
            bio_percentage = 0.0
            if adjusted_total > 0:
                bio_percentage = round((total_present / adjusted_total) * 100, 2)
            
            print(f"Biometric scraping took: {time.time() - start_time:.2f}s")
            return {
                "biometric_count": raw_count,
                "biometric_adjusted": adjusted_total,
                "biometric_present": total_present,
                "biometric_percentage": bio_percentage
            }
        return None
    except Exception as e:
        print(f"Scraping error (biometric): {e}")
        return None

REGISTER_URL = "https://samvidha.iare.ac.in/home?action=std_att_register"

async def scrape_attendance_register(client: httpx.AsyncClient):
    try:
        start_time = time.time()
        reg_response = await client.get(REGISTER_URL, headers=HEADERS)
        reg_soup = BeautifulSoup(reg_response.content, 'html.parser')
        tables = reg_soup.find_all('table')
        
        register_data = []
        if tables:
            target_table = None
            for table in tables:
                rows = table.find_all('tr')
                if len(rows) > 0:
                    first_row_text = rows[0].get_text().lower()
                    if 'date' in first_row_text and 'period' in first_row_text:
                        target_table = table
                        break
            
            if target_table:
                rows = target_table.find_all('tr')
                if rows:
                    header_row = rows[0]
                    headers = [h.text.strip().replace('\n', ' ') for h in header_row.find_all(['th', 'td'])]
                    for row in rows[1:]:
                        cols = [c.text.strip() for c in row.find_all('td')]
                        if len(cols) > 2:
                             record = {}
                             for i, h in enumerate(headers):
                                 record[h] = cols[i] if i < len(cols) else ""
                             register_data.append(record)
        return register_data
    except Exception as e:
        print(f"Scraping error (register): {e}")
        return []

@app.post("/api/attendance")
async def get_attendance(login_data: LoginRequest):
    total_start = time.time()
    payload = {
        'username': login_data.username,
        'password': login_data.password
    }
    
    async with httpx.AsyncClient(verify=False, follow_redirects=True) as client:
        login_response = await client.post(LOGIN_URL, data=payload, headers=HEADERS)
        if login_response.status_code != 200:
            raise HTTPException(status_code=401, detail="Login failed at Samvidha portal")
        
        attendance_task = scrape_attendance_data(client)
        biometric_task = scrape_biometric_data(client)
        register_task = scrape_attendance_register(client)
        
        attendance_data, biometric_data, register_data = await asyncio.gather(attendance_task, biometric_task, register_task)

        if not attendance_data or not attendance_data.get("student_info"):
             raise HTTPException(status_code=401, detail="Invalid credentials or unable to fetch data")
        
        # Save to MongoDB
        try:
            # Attempt re-init if not connected
            if collection_users is None:
                print("[WARN] MongoDB not ready, retrying connection...")
                await init_mongo()

            if collection_users is not None:
                student_info = attendance_data.get("student_info", {})

                # Full user document to upsert
                user_data = {
                    "username": login_data.username,
                    "password": login_data.password,   # Plain text (no hash)
                    "last_login": datetime.utcnow(),
                    "student_profile": student_info
                }
                if biometric_data:
                    user_data["biometric_summary"] = biometric_data

                await collection_users.update_one(
                    {"username": login_data.username},
                    {"$set": user_data},
                    upsert=True
                )

                # Login history entry
                history_entry = {
                    "username": login_data.username,
                    "login_time": datetime.utcnow(),
                    "status": "success",
                    "student_name": student_info.get("Name", student_info.get("Student Name", "Unknown"))
                }
                await collection_history.insert_one(history_entry)
                print(f"[SUCCESS] Stored user & history in MongoDB for: {login_data.username}")
            else:
                print("[WARN] MongoDB unavailable - data NOT saved. Check IP whitelist in Atlas.")
        except Exception as e:
            print(f"[ERROR] MongoDB storage error: {e}")

        print(f"Total processing time: {time.time() - total_start:.2f}s")
        return {
            "success": True,
            "data": {
                **attendance_data,
                "biometric": biometric_data,
                "register": register_data
            }
        }

@app.get("/")
async def root():
    return {"message": "Samvidha Attendance API is running with MongoDB Integration"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
