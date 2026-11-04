import os
import sys

# Ensure backend root is in Python path for clean module resolution
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from app import create_app

env = os.getenv("FLASK_ENV", "development")
app = create_app(env)

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
