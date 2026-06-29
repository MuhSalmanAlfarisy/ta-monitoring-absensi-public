from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool  # ❗ ADD: Connection pooling
from config import settings

# Ambil URL dari config.py (Saat ini isinya SQLite)
SQLALCHEMY_DATABASE_URL = settings.DATABASE_URL

# Debug SQL queries jika DEBUG mode aktif
echo_sql = settings.DEBUG

# Konfigurasi khusus jika menggunakan SQLite
connect_args = {}
pool_class = None
pool_size = 20
max_overflow = 40

if "sqlite" in SQLALCHEMY_DATABASE_URL:
    connect_args = {"check_same_thread": False}
    # SQLite tidak butuh connection pooling
else:
    # Untuk PostgreSQL/MySQL, gunakan connection pooling
    pool_class = QueuePool
    pool_size = 5
    max_overflow = 10

# Buat Engine dengan optimasi
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args=connect_args,
    echo=echo_sql,  # ❗ Tampilkan SQL query jika debug mode
    poolclass=pool_class,
    pool_size=pool_size,
    max_overflow=max_overflow,
    pool_pre_ping=True,  # ❗ Auto-reconnect jika connection drop
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency Injection untuk setiap Request
def get_db():
    """
    Dependency untuk mendapatkan database session
    Digunakan di semua endpoint FastAPI
    
    Contoh penggunaan:
    @router.get("/items")
    def read_items(db: Session = Depends(get_db)):
        return db.query(Item).all()
    """
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

# Fungsi untuk create tables
def create_tables():
    """
    Create semua tables berdasarkan models
    Dipanggil saat pertama kali aplikasi jalan
    """
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables created successfully")
        
        # Cek koneksi database
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print(f"✅ Database connection test: {result.fetchone()}")
            
    except Exception as e:
        print(f"❌ Error creating database tables: {e}")
        raise

# Fungsi untuk drop tables (development only)
def drop_tables():
    """
    Drop semua tables (HANYA untuk development/testing!)
    """
    if settings.ENV == "production":
        raise Exception("Drop tables tidak diizinkan di production!")
    
    Base.metadata.drop_all(bind=engine)
    print("⚠️  All tables dropped (development mode only)")
