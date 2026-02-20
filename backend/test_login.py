import requests

url = "http://localhost:8000/api/attendance"
payload = {"username": "testuser", "password": "testpassword"}
try:
    response = requests.post(url, json=payload)
    print(response.status_code)
    print(response.json())
except Exception as e:
    print(e)
