import mysql.connector
from mysql.connector import Error

db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': '',
    'database': 'samvidha_attendance'
}

try:
    connection = mysql.connector.connect(
        host=db_config['host'],
        user=db_config['user'],
        password=db_config['password']
    )
    if connection.is_connected():
        cursor = connection.cursor()
        cursor.execute("SHOW DATABASES")
        databases = [db[0] for db in cursor.fetchall()]
        print(f"Databases: {databases}")
        
        if db_config['database'] in databases:
            cursor.execute(f"USE {db_config['database']}")
            cursor.execute("SHOW TABLES")
            tables = [table[0] for table in cursor.fetchall()]
            print(f"Tables in {db_config['database']}: {tables}")
        else:
            print(f"Database {db_config['database']} NOT found.")
            
        cursor.close()
        connection.close()
except Error as e:
    print(f"Error: {e}")
