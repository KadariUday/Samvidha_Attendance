# Database Configuration (MongoDB)

This project uses MongoDB to store user credentials and login history for local reference.

## 🗄️ Collections

### 1. `users`
Stores student credentials captured upon successful login to the Samvidha portal.
- **Fields**: `username` (Roll No), `password` (Plain text), `updated_at` (Timestamp).

### 2. `login_history`
Records a log of every successful login event.
- **Fields**: `username`, `login_time` (Timestamp).

## ⚙️ Setup & Configuration

### 1. Environment Variables
Create a `.env` file in the `backend` directory with the following variables:
```env
MONGO_URI=your_mongodb_connection_string
DB_NAME=Samvidha_Attendance_db
```

### 2. Whitelisting (Atlas Users)
If using MongoDB Atlas, ensure you:
1. Go to **Network Access**.
2. Add your current IP or `0.0.0.0/0` (Allow all) to the whitelist.

## 🛠️ Diagnostics
You can verify your database connection at any time by running:
```bash
python backend/test_mongodb.py
```

> [!WARNING]
> **Security Note**: Passwords are saved in plain text within the `users` collection as per current project requirements. Ensure your database is properly secured.
