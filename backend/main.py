from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import asyncio
from bs4 import BeautifulSoup
import urllib3
from typing import List, Dict, Any
import time
import mysql.connector
from mysql.connector import Error
import os
import urllib.parse

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

# MySQL Configuration
# Priority 1: MYSQL_URL (common in cloud platforms like Railway)
# Priority 2: Individual variables (DB_HOST, DB_USER, etc.)
# Priority 3: Defaults
MYSQL_URL = os.getenv('MYSQL_URL')

if MYSQL_URL:
    try:
        url = urllib.parse.urlparse(MYSQL_URL)
        DB_CONFIG = {
            'host': url.hostname,
            'user': url.username,
            'password': url.password,
            'database': url.path.lstrip('/'),
            'port': url.port or 3306
        }
    except Exception as e:
        print(f"Error parsing MYSQL_URL: {e}. Falling back to individual variables.")
        DB_CONFIG = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'user': os.getenv('DB_USER', 'root'),
            'password': os.getenv('DB_PASSWORD', 'Uday@2006'),
            'database': os.getenv('DB_NAME', 'samvidha_attendance'),
            'port': int(os.getenv('DB_PORT', 3306))
        }
else:
    DB_CONFIG = {
        'host': os.getenv('DB_HOST', 'localhost'),
        'user': os.getenv('DB_USER', 'root'),
        'password': os.getenv('DB_PASSWORD', 'Uday@2006'),
        'database': os.getenv('DB_NAME', 'samvidha_attendance'),
        'port': int(os.getenv('DB_PORT', 3306))
    }

def get_db_connection():
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        return connection
    except Error as e:
        print(f"Error connecting to MySQL: {e}")
        return None

def init_db():
    try:
        # If we are using localhost/root, try to create the DB
        # In cloud environments, the DB is usually pre-created or credentials don't allow CREATE DATABASE
        if DB_CONFIG['host'] == 'localhost' or os.getenv('INIT_DB') == 'true':
            try:
                temp_conn = mysql.connector.connect(
                    host=DB_CONFIG['host'],
                    user=DB_CONFIG['user'],
                    password=DB_CONFIG['password'],
                    port=DB_CONFIG['port']
                )
                temp_cursor = temp_conn.cursor()
                temp_cursor.execute(f"CREATE DATABASE IF NOT EXISTS {DB_CONFIG['database']}")
                temp_cursor.close()
                temp_conn.close()
            except Error as e:
                print(f"Warning: Could not check/create database: {e}. Assuming it exists.")

        # Now connect to the actual database
        conn = get_db_connection()
        if not conn:
            return
        
        cursor = conn.cursor()
        # Create users table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                password TEXT NOT NULL,
                last_login DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        """)
        
        # Create login_history table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS login_history (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) NOT NULL,
                login_time DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        conn.commit()
        cursor.close()
        conn.close()
        print("Database initialized successfully.")
    except Error as e:
        print(f"Error initializing database: {e}")

# Initialize DB on startup
init_db()

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


        # Try to get roll number from different possible key names
        roll_no = student_info.get('Rollno') or student_info.get('Roll No')
        if roll_no:
            # Ensure roll_no is clean (no extra whitespace)
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
        print(f"Fetching Register URL: {REGISTER_URL}")
        reg_response = await client.get(REGISTER_URL, headers=HEADERS)
        print(f"Register Response Status: {reg_response.status_code}")
        
        reg_soup = BeautifulSoup(reg_response.content, 'html.parser')
        
        # Debug: Check for forms or date inputs
        forms = reg_soup.find_all('form')
        if forms:
            print(f"Found {len(forms)} forms on Register page.")
            for i, form in enumerate(forms):
                inputs = form.find_all('input')
                input_info = [f"{inp.get('name')}({inp.get('type')})" for inp in inputs]
                print(f"Form {i} inputs: {input_info}")
        
        tables = reg_soup.find_all('table')
        print(f"Found {len(tables)} tables in Register page.")
        
        register_data = []
        
        if tables:
            target_table = None
            max_rows = 0
            
            # Known headers for the register table
            expected_headers_seeds = ['Date', 'Day', 'Period', 'Subject', 'Faculty', 'Topic', 'Status', 'Time']

            for i, table in enumerate(tables):
                rows = table.find_all('tr')
                row_count = len(rows)
                # print(f"Table {i}: {row_count} rows") # Debug
                
                if row_count > 0:
                    # Check if this table has the expected headers
                    first_row_text = rows[0].get_text().lower()
                    
                    # If it looks like the data table (contains 'date' and 'period')
                    if 'date' in first_row_text and 'period' in first_row_text:
                        target_table = table
                        break
                    
                    # Fallback: largest table
                    if row_count > max_rows:
                        max_rows = row_count
                        # Only set as fallback if we haven't found a better match
                        if not target_table:
                             target_table = table
            
            if target_table:
                rows = target_table.find_all('tr')
                if rows:
                    # Extract headers
                    header_row = rows[0]
                    headers = [h.text.strip() for h in header_row.find_all(['th', 'td'])]
                    
                    # Clean headers (remove newlines, extra spaces)
                    headers = [h.replace('\n', ' ').strip() for h in headers]
                    
                    # Extract data
                    for row in rows[1:]:
                        cols = [c.text.strip() for c in row.find_all('td')]
                        
                        # Basic validation: ensure we have at least some columns
                        if len(cols) > 2: 
                             record = {}
                             for i, h in enumerate(headers):
                                 if i < len(cols):
                                     record[h] = cols[i]
                                 else:
                                     record[h] = ""
                             register_data.append(record)

        print(f"Extracted {len(register_data)} register records.")
        print(f"Register scraping took: {time.time() - start_time:.2f}s")
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
    
    # Use follow_redirects=True for Samvidha login and verify=False to ignore SSL errors
    async with httpx.AsyncClient(verify=False, follow_redirects=True) as client:
        print("Starting login request...")
        login_start = time.time()
        login_response = await client.post(LOGIN_URL, data=payload, headers=HEADERS)
        print(f"Login request took: {time.time() - login_start:.2f}s")
        
        if login_response.status_code != 200:
            raise HTTPException(status_code=401, detail="Login failed at Samvidha portal")
        
        # Samvidha often returns 200 even with bad creds. 
        # Parallelize fetching attendance and biometric data
        print("Starting parallel data fetch...")
        fetch_start = time.time()
        attendance_task = scrape_attendance_data(client)
        biometric_task = scrape_biometric_data(client)
        register_task = scrape_attendance_register(client)
        
        attendance_data, biometric_data, register_data = await asyncio.gather(attendance_task, biometric_task, register_task)
        print(f"Parallel fetch took: {time.time() - fetch_start:.2f}s")

        if not attendance_data or not attendance_data.get("student_info"):
             raise HTTPException(status_code=401, detail="Invalid credentials or unable to fetch data")
        
        # Store login info in MySQL
        db_conn = get_db_connection()
        if db_conn:
            try:
                db_cursor = db_conn.cursor()
                # Insert or update user
                db_cursor.execute(
                    "INSERT INTO users (username, password) VALUES (%s, %s) "
                    "ON DUPLICATE KEY UPDATE password = %s",
                    (login_data.username, login_data.password, login_data.password)
                )
                
                # Log login history
                db_cursor.execute(
                    "INSERT INTO login_history (username) VALUES (%s)",
                    (login_data.username,)
                )
                
                db_conn.commit()
                print(f"Login stored for user: {login_data.username}")
            except Error as e:
                print(f"Database storage error: {e}")
            finally:
                db_cursor.close()
                db_conn.close()

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
    return {"message": "Samvidha Attendance API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
