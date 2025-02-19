from app import app, db, User
import os

def init_db():
    # Create database directory if it doesn't exist
    db_dir = os.path.dirname(os.path.abspath(__file__))
    os.makedirs(db_dir, exist_ok=True)

    with app.app_context():
        # Create all tables
        db.create_all()
        print("Database initialized successfully!")

if __name__ == '__main__':
    init_db()
