import json
import os
import time
from datetime import datetime
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
from bs4 import BeautifulSoup

# History Data File
# Use absolute path to ensure checking same file location
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
HISTORY_FILE = os.path.join(BASE_DIR, "history.json")

def load_history():
    if os.path.exists(HISTORY_FILE):
        try:
            with open(HISTORY_FILE, "r") as f:
                return json.load(f)
        except:
            return []
    return []

def save_history(data):
    with open(HISTORY_FILE, "w") as f:
        json.dump(data, f, indent=4)

async def update_history_daily():
    print("Background task started: Daily History Update at 11:00 PM")
    while True:
        try:
            now = datetime.now()
            # Target time: 23:00 (11 PM)
            if now.hour == 23 and now.minute == 0:
                print("Triggering daily history update...")
                # To get data, we need to login and scrape. 
                # Since we don't have user credentials here, we'll store a "system snapshot" or 
                # wait for a user to login to trigger it?
                # Actually, without user credentials, we can't scrape specific user data.
                # However, the user request implies this runs on the server.
                # LIMITATION: We need a username/password to scrape. 
                # WORKAROUND for this specific request: 
                # We will check if we have any recently cached credentials or just skip if no user is active.
                # But for now, let's assume valid credentials are passed or we just log that it ran.
                
                # REAL IMPLEMENTATION NOTE: In a real app, you'd store encrypted credentials or use a session.
                # Here, we will just log the attempts. 
                # BUT, the user wants "store data... start from now".
                # If the app is running locally for one user, we might be able to grab the last used credentials?
                # For safety/simplicity in this demo, I will SKIP the actual scraping inside this background loop
                # UNLESS we have a global way to know WHO to scrape for.
                #
                # ALTERNATIVE: The user might mean "update when I look at it" OR 
                # "server runs for ME specifically".
                # Let's assume single-user mode for this "Project". 
                # I will add a global variable to cache the last logged-in user credentials for this purpose.
                pass
            
            # Sleep for 60 seconds to check minute again
            await asyncio.sleep(60)
        except Exception as e:
            print(f"Error in background task: {e}")
            await asyncio.sleep(60)

# Global storage for last user (Single User Mode assumption for this specific request)
latest_credentials = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    task = asyncio.create_task(update_history_daily())
    yield
    # Shutdown
    task.cancel()

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
REGISTER_URL = "https://samvidha.iare.ac.in/home?action=std_att_register"

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

async def scrape_attendance_register(client: httpx.AsyncClient):
    try:
        start_time = time.time()
        reg_response = await client.get(REGISTER_URL, headers=HEADERS)
        reg_soup = BeautifulSoup(reg_response.content, 'html.parser')
        
        all_tables = reg_soup.find_all('table')
        print(f"DEBUG: Found {len(all_tables)} tables on register page")
        
        reg_table = None
        for i, table in enumerate(all_tables):
            rows = table.find_all('tr')
            if not rows: continue
            
            # Check if this table looks like the register (has 'Subject' and many columns)
            header_text = rows[0].get_text()
            print(f"DEBUG: Table {i} first row text: {header_text[:100]}...")
            
            if 'Subject' in header_text:
                reg_table = table
                print(f"DEBUG: Selected Table {i} based on 'Subject' keyword")
                break
        
        # Fallback: find the table with the most columns
        if not reg_table and all_tables:
            reg_table = max(all_tables, key=lambda t: len(t.find_all('tr')[0].find_all(['td', 'th'])) if t.find_all('tr') else 0)
            print("DEBUG: Using fallback: Table with most columns")

        register_data = []
        if reg_table:
            rows = reg_table.find_all('tr')
            header_row = None
            for row in rows:
                if 'Subject' in row.get_text():
                    header_row = row
                    break
            
            if not header_row and rows:
                header_row = rows[0]

            if header_row:
                raw_header = [h.text.strip() for h in header_row.find_all(['th', 'td'])]
                
                # Transform headers: Filter 'Date' and rename '01-Dec' to 'Dec 2' (shifted 1 day forward)
                header = []
                for h in raw_header:
                    if h == 'Date':
                        continue
                    # Check if it matches DD-MMM format
                    try:
                        pts = h.split('-')
                        if len(pts) == 2 and pts[0].isdigit():
                            day = int(pts[0]) + 1 # Shift forward by 1 day
                            month = pts[1]
                            header.append(f"{month} {day}")
                        else:
                            header.append(h)
                    except:
                        header.append(h)

                print(f"DEBUG: Scraped Header ({len(header)} cols): {header}")
                
                start_idx = rows.index(header_row) + 1
                for i, row in enumerate(rows[start_idx:]):
                    cols = [c.get_text(separator=" ").strip().replace('\n', ' ') for c in row.find_all(['td', 'th'])]
                    if len(cols) > 0:
                        # Extract only columns that aren't the 'Date' column (index 2 usually)
                        # More robust: use index of 'Date' in raw_header
                        date_idx = raw_header.index('Date') if 'Date' in raw_header else -1
                        if date_idx != -1:
                            target_cols = [v for j, v in enumerate(cols) if j != date_idx]
                        else:
                            target_cols = cols

                        if len(target_cols) < len(header):
                            target_cols = target_cols + [""] * (len(header) - len(target_cols))
                        elif len(target_cols) > len(header):
                            target_cols = target_cols[:len(header)]
                        
                        entry = dict(zip(header, target_cols))
                        register_data.append(entry)
                    else:
                        print(f"DEBUG: Row {i} has 0 columns")
                
                print(f"DEBUG: Scraped {len(register_data)} rows")
            
            if len(register_data) == 0:
                with open("debug_register.html", "w", encoding="utf-8") as f:
                    f.write(reg_soup.prettify())
                print("DEBUG: Saved register page HTML to debug_register.html for inspection")
            
            print(f"Register scraping took: {time.time() - start_time:.2f}s")
            return register_data
        
        print("DEBUG: No suitable table found for register")
        return []
    except Exception as e:
        print(f"Scraping error (register): {e}")
        return []


@app.post("/api/attendance")
async def get_attendance(login_data: LoginRequest):
    total_start = time.time()
    
    # Store credentials for background task (Simple cache)
    global latest_credentials
    latest_credentials = {
        'username': login_data.username,
        'password': login_data.password
    }

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
        
        attendance_data, biometric_data, register_data = await asyncio.gather(
            attendance_task, 
            biometric_task,
            register_task
        )

        # Check for daily update trigger conditions (e.g. if we want to manually trigger or just rely on bg)
        # For now, let's just make sure we capture it if it's 11 PM? 
        # No, let the background task handle it using cached credentials.

        if not attendance_data or not attendance_data.get("student_info"):
             raise HTTPException(status_code=401, detail="Invalid credentials or unable to fetch data")
        
        # AUTO-SAVE HISTORY for "Start from Now" requirement
        # Every time we fetch data, we update today's history entry.
        try:
            history = load_history()
            # Determine "Today" based on 6:00 AM cutoff
            from datetime import timedelta
            now = datetime.now()
            if now.hour < 6:
                today_date = now - timedelta(days=1)
            else:
                today_date = now

            yesterday_date = today_date - timedelta(days=1)
                
            today_str = today_date.strftime("%Y-%m-%d")
            yesterday_str = yesterday_date.strftime("%Y-%m-%d")
            
            # Safe access for biometric data
            bio_val = 0
            if biometric_data and isinstance(biometric_data, dict):
                bio_val = biometric_data.get("biometric_percentage", 0)

            # Check if yesterday already exists
            has_yesterday = any(x["date"] == yesterday_str for x in history)
            if not has_yesterday:
                y_entry = {
                    "date": yesterday_str,
                    "overall": attendance_data.get("overall_course_avg", 0),
                    "biometric": bio_val
                }
                history.append(y_entry)

            # Check if today already exists
            existing_idx = next((i for i, x in enumerate(history) if x["date"] == today_str), -1)

            entry = {
                "date": today_str,
                "overall": attendance_data.get("overall_course_avg", 0),
                "biometric": bio_val
            }
            
            if existing_idx >= 0:
                history[existing_idx] = entry
            else:
                history.append(entry)
                
            history.sort(key=lambda x: x["date"])
            save_history(history)
            print(f"DEBUG: Auto-saved history for {today_str}: {entry}")
        except Exception as e:
            print(f"Error auto-saving history: {e}")

        print(f"Total processing time: {time.time() - total_start:.2f}s")
        response_payload = {
            "success": True,
            "data": {
                **attendance_data,
                "biometric": biometric_data,
                "register": register_data
            }
        }
        print(f"DEBUG: Returning keys: {list(response_payload['data'].keys())}")
        return response_payload

@app.get("/api/history")
async def get_history():
    return {"history": load_history()}

@app.get("/")
async def root():
    return {"message": "Samvidha Attendance API is running"}

# Background task implementation for caching/scraping
async def perform_scheduled_scrape():
    global latest_credentials
    if not latest_credentials:
        print("Skipping scheduled scrape: No active user credentials.")
        return

    print("Executing scheduled scrape for stored user...")
    try:
        async with httpx.AsyncClient(verify=False, follow_redirects=True) as client:
            login_response = await client.post(LOGIN_URL, data=latest_credentials, headers=HEADERS)
            if login_response.status_code == 200:
                 attendance_task = scrape_attendance_data(client)
                 biometric_task = scrape_biometric_data(client)
                 att_data, bio_data = await asyncio.gather(attendance_task, biometric_task)
                 
                 if att_data and bio_data:
                     history = load_history()
                     # Determine "Today" based on 6:00 AM cutoff
                     from datetime import timedelta
                     now = datetime.now()
                     if now.hour < 6:
                         today_date = now - timedelta(days=1)
                     else:
                         today_date = now

                     yesterday_date = today_date - timedelta(days=1)
                         
                     today_str = today_date.strftime("%Y-%m-%d")
                     yesterday_str = yesterday_date.strftime("%Y-%m-%d")
                     
                     overall_val = att_data.get("overall_course_avg", 0)
                     bio_val = bio_data.get("biometric_percentage", 0)
                     
                     # Check if yesterday already exists
                     has_yesterday = any(x["date"] == yesterday_str for x in history)
                     if not has_yesterday:
                         y_entry = {
                             "date": yesterday_str,
                             "overall": overall_val,
                             "biometric": bio_val
                         }
                         history.append(y_entry)

                     # Check if today already exists
                     existing_idx = next((i for i, x in enumerate(history) if x["date"] == today_str), -1)
                     
                     entry = {
                         "date": today_str,
                         "overall": overall_val,
                         "biometric": bio_val
                     }
                     
                     if existing_idx >= 0:
                         history[existing_idx] = entry
                     else:
                         history.append(entry)
                    
                     history.sort(key=lambda x: x["date"])
                     save_history(history)
                     print(f"Updated history for {today_str}: {entry}")
    except Exception as e:
        print(f"Scheduled scrape failed: {e}")

# Update the background loop to call the actual scraper
async def update_history_daily():
    print("Background task started: Daily History Update at 11:00 PM")
    while True:
        try:
            now = datetime.now()
            # Check for 23:00 (11 PM)
            if now.hour == 23 and now.minute == 0:
                await perform_scheduled_scrape()
                # Sleep enough to avoid repeated execution in the same minute
                await asyncio.sleep(65) 
            else:
                await asyncio.sleep(50)
        except asyncio.CancelledError:
            break
        except Exception as e:
            print(f"Error in background task: {e}")
            await asyncio.sleep(60)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)