import os

class Config:
    """Base configuration."""
    SECRET_KEY = os.getenv("SECRET_KEY", "smart-assistant-secret-key-change-in-prod")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Database URL configuration
    # By default, use MySQL. Format: mysql+pymysql://<username>:<password>@<host>:<port>/<database>
    raw_db_url = os.getenv("DATABASE_URL")
    
    if raw_db_url:
        # Standardize dialect for SQLAlchemy if plain mysql:// is supplied
        if raw_db_url.startswith("mysql://"):
            SQLALCHEMY_DATABASE_URI = raw_db_url.replace("mysql://", "mysql+pymysql://", 1)
        else:
            SQLALCHEMY_DATABASE_URI = raw_db_url
    else:
        # Default fallback: SQLite for local execution without a running MySQL instance
        # When running in Docker/K8s, DATABASE_URL is injected pointing to MySQL
        mysql_user = os.getenv("MYSQL_USER", "assistant_user")
        mysql_pwd = os.getenv("MYSQL_PASSWORD", "assistant_pass")
        mysql_host = os.getenv("MYSQL_HOST", "localhost")
        mysql_port = os.getenv("MYSQL_PORT", "3306")
        mysql_db = os.getenv("MYSQL_DATABASE", "smart_health_db")
        
        if os.getenv("FORCE_MYSQL", "false").lower() == "true":
            SQLALCHEMY_DATABASE_URI = f"mysql+pymysql://{mysql_user}:{mysql_pwd}@{mysql_host}:{mysql_port}/{mysql_db}"
        else:
            # Safe local fallback to SQLite if MySQL host is not configured
            base_dir = os.path.abspath(os.path.dirname(__file__))
            backend_dir = os.path.dirname(base_dir)
            sqlite_path = os.path.join(backend_dir, "database.db")
            SQLALCHEMY_DATABASE_URI = f"sqlite:///{sqlite_path}"


class DevelopmentConfig(Config):
    DEBUG = True


class TestingConfig(Config):
    TESTING = True
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"


class ProductionConfig(Config):
    DEBUG = False
    TESTING = False
    # Ensure production strictly uses MySQL via DATABASE_URL
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL",
        "mysql+pymysql://assistant_user:assistant_pass@mysql:3306/smart_health_db"
    )


config_by_name = {
    "development": DevelopmentConfig,
    "testing": TestingConfig,
    "production": ProductionConfig,
    "default": DevelopmentConfig
}
