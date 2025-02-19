from app import app, db, User
import openpyxl
from datetime import datetime
import os

def view_users():
    print("\n=== User Table ===")
    print("ID | Email | Role | IP Address | Last Login | Created At")
    print("-" * 80)
    
    with app.app_context():
        users = User.query.all()
        for user in users:
            last_login = user.last_login.strftime('%Y-%m-%d %H:%M:%S') if user.last_login else 'Never'
            created_at = user.created_at.strftime('%Y-%m-%d %H:%M:%S')
            print(f"{user.id} | {user.email} | {user.role} | {user.ip_address or 'Not set'} | {last_login} | {created_at}")

def view_attendance():
    print("\n=== Attendance Records ===")
    print("Username | Department | Year | Timestamp")
    print("-" * 80)
    
    if not os.path.exists('attendance_data.xlsx'):
        print("No attendance records found (Excel file does not exist)")
        return
        
    try:
        workbook = openpyxl.load_workbook('attendance_data.xlsx')
        sheet = workbook.active
        
        # Skip header row
        rows = list(sheet.iter_rows(min_row=2, values_only=True))
        
        if not rows:
            print("No attendance records found (Excel file is empty)")
            return
            
        for row in rows:
            print(f"{row[0]} | {row[1]} | {row[2]} | {row[3]}")
            
    except Exception as e:
        print(f"Error reading attendance records: {str(e)}")

if __name__ == '__main__':
    print("ATTENDMAX Database Viewer")
    print("=" * 80)
    
    view_users()
    view_attendance()
