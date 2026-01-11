from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
from bs4 import BeautifulSoup
import urllib3
from typing import List, Dict, Any

# Suppress SSL warnings
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

app = FastAPI(title="Samvidha Attendance API")

# Add CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the actual origin
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

def scrape_attendance_data(session):
    try:
        att_response = session.get(ATTENDANCE_URL, headers=HEADERS, verify=False)
        att_soup = BeautifulSoup(att_response.content, 'html.parser')
        
        att_tables = att_soup.find_all('table')
        
        student_info = {}
        course_attendance = []
        overall_course_avg = 0.0

        if len(att_tables) > 0:
            # Table 0: Student Info
            info_rows = att_tables[0].find_all('tr')
            for row in info_rows:
                cols = [c.text.strip() for c in row.find_all(['td', 'th'])]
                for i in range(0, len(cols), 2):
                    if i + 1 < len(cols):
                        key = cols[i].replace(':', '').strip()
                        val = cols[i+1].strip()
                        student_info[key] = val

        if len(att_tables) > 1:
            # Table 1: Course Attendance
            course_table = att_tables[1]
            rows = course_table.find_all('tr')
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

        return {
            "student_info": student_info,
            "course_attendance": course_attendance,
            "overall_course_avg": overall_course_avg
        }
    except Exception as e:
        print(f"Scraping error (attendance): {e}")
        return None

def scrape_biometric_data(session):
    try:
        bio_response = session.get(BIOMETRIC_URL, headers=HEADERS, verify=False)
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

@app.post("/api/attendance")
async def get_attendance(login_data: LoginRequest):
    payload = {
        'username': login_data.username,
        'password': login_data.password
    }
    
    with requests.Session() as session:
        login_response = session.post(LOGIN_URL, data=payload, headers=HEADERS, verify=False)
        
        if login_response.status_code != 200:
            raise HTTPException(status_code=401, detail="Login failed at Samvidha portal")
        
        # Check if login was actually successful (Samvidha often returns 200 even with bad creds)
        # We'll check by trying to fetch data
        attendance_data = scrape_attendance_data(session)
        if not attendance_data or not attendance_data.get("student_info"):
             raise HTTPException(status_code=401, detail="Invalid credentials or unable to fetch data")
        
        biometric_data = scrape_biometric_data(session)
        
        return {
            "success": True,
            "data": {
                **attendance_data,
                "biometric": biometric_data
            }
        }

@app.get("/")
async def root():
    return {"message": "Samvidha Attendance API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
