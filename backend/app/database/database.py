from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from contextlib import contextmanager
import os

# Database file - use /app/data in Docker (volume mount) or backend folder locally
DATA_DIR = os.environ.get("DATA_DIR", os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
os.makedirs(DATA_DIR, exist_ok=True)
DATABASE_PATH = os.path.join(DATA_DIR, "aniways.db")
DATABASE_URL = f"sqlite:///{DATABASE_PATH}"

engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False},  # Required for SQLite
    pool_pre_ping=True,  # Verify connections before use
    echo=False,  # Set to True for SQL debugging
)

# Enable SQLite optimizations
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    # Enable foreign key constraints
    cursor.execute("PRAGMA foreign_keys=ON")
    # Use WAL mode for better concurrent read performance
    cursor.execute("PRAGMA journal_mode=WAL")
    # Sync less often for better write performance (still safe with WAL)
    cursor.execute("PRAGMA synchronous=NORMAL")
    # Increase cache size (negative = KB, positive = pages)
    cursor.execute("PRAGMA cache_size=-64000")  # 64MB cache
    # Store temp tables in memory
    cursor.execute("PRAGMA temp_store=MEMORY")
    cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency for getting database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@contextmanager
def get_db_context():
    """Context manager for database session (for use outside of FastAPI)"""
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
