import asyncio
import os
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

async def verify_mongodb():
    load_dotenv()
    
    mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    db_name = os.getenv("DB_NAME", "Samvidha_Attendance_db")
    
    print(f"Connecting to MongoDB at {mongo_uri}...")
    client = AsyncIOMotorClient(mongo_uri, serverSelectionTimeoutMS=5000)
    db = client[db_name]
    
    try:
        # Check connection
        await client.server_info()
        print("Successfully connected to MongoDB!")
        
        test_user = "test_roll_history_123"
        test_pass = "secure_password_history_123"
        
        # 1. Test 'users' collection
        print(f"Testing 'users' collection with user: {test_user}")
        users_collection = db["users"]
        await users_collection.update_one(
            {"username": test_user},
            {"$set": {"password": test_pass, "updated_at": datetime.now()}},
            upsert=True
        )
        
        saved_user = await users_collection.find_one({"username": test_user})
        if saved_user and saved_user["password"] == test_pass:
            print("Verification SUCCESS: Credentials correctly saved in 'users'!")
        else:
            print("Verification FAILED: Credentials not found in 'users'.")
            return

        # 2. Test 'login_history' collection
        print(f"Testing 'login_history' collection for user: {test_user}")
        history_collection = db["login_history"]
        await history_collection.insert_one({
            "username": test_user,
            "login_time": datetime.now()
        })
        
        latest_history = await history_collection.find_one({"username": test_user}, sort=[("login_time", -1)])
        if latest_history:
            print(f"Verification SUCCESS: Login recorded in 'login_history' at {latest_history['login_time']}!")
        else:
            print("Verification FAILED: Login history not recorded.")
            
    except Exception as e:
        print(f"Error during verification: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    asyncio.run(verify_mongodb())
