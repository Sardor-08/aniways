from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from contextlib import contextmanager
import os

# Neon provides a PostgreSQL DATABASE_URL in deployed environments.
# Keep SQLite only as an explicit local fallback for offline development.
DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    DATA_DIR = os.environ.get("DATA_DIR", os.path.dirname(os.path.dirname(os.path.dirname(__file__))))
    os.makedirs(DATA_DIR, exist_ok=True)
    DATABASE_PATH = os.path.join(DATA_DIR, "anilo.db")
    DATABASE_URL = f"sqlite:///{DATABASE_PATH}"

engine_kwargs = {"pool_pre_ping": True, "echo": False}
if DATABASE_URL.startswith("sqlite"):
    engine_kwargs["connect_args"] = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, **engine_kwargs)

# SQLite-only optimizations. PostgreSQL handles these concerns itself.
if DATABASE_URL.startswith("sqlite"):
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA synchronous=NORMAL")
        cursor.execute("PRAGMA cache_size=-64000")
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
