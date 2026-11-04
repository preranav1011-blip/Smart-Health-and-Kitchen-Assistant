# Smart Health & Kitchen Assistant

A modern, production-ready full-stack web application that helps users manage kitchen inventory and medicine stock in one place. It tracks expiry dates, monitors low stock, recommends recipes based on available kitchen ingredients, visualizes inventory health charts, and automates alert dispatches.

## 🌐 Live Demo & Deployment

- **Application:** [https://smart-health-and-kitchen-assistant-1mfq.onrender.com](https://smart-health-and-kitchen-assistant-1mfq.onrender.com)

---

## 🚀 Key Features

### 🔐 User Authentication & Security
- User registration and authentication with secure password hashing (`scrypt`/`pbkdf2`)
- Per-user data isolation for kitchen items, medicines, and notifications
- Dual support for legacy endpoints and modern RESTful `/api/auth` routes

### 🥦 Kitchen Inventory Management
- Full CRUD: Add, update, view, and delete kitchen items
- Real-time search and category filtering (Produce, Dairy, Bakery, Pantry, etc.)
- Expiry tracking with color-coded alerts and low-stock detection

### 💊 Medicine Cabinet Tracker
- Full CRUD: Track prescriptions, dosages, brand names, quantities, and expiration dates
- Configurable low-stock thresholds with urgent restock warnings
- Search and location tagging

### 🍲 Smart Recipe Recommendation Engine *(Beyond CRUD Feature)*
- Intelligently analyzes ingredients currently in your kitchen inventory
- Calculates **Match Percentage** and identifies **Matched vs. Missing Ingredients**
- Highlights recipes that are *"Ready to Cook"* with 100% kitchen coverage

### 🔔 Expiry Alerts & Dispatch Service *(Beyond CRUD Feature)*
- Identifies critical items: expired, expiring soon (&le; 3 days), and critically low stock
- REST endpoint for alert dispatches via simulated email/push notifications
- Dynamic notification center with real-time badges

### 📊 Interactive Dashboard & Analytics *(Beyond CRUD Feature)*
- Chart.js integration displaying **Inventory Breakdown** (Food vs. Medicines)
- Visual **Expiry Health** status (Fresh, Expiring Soon, Expired)
- Real-time summary counters for critical low stock and urgent items

---

## 🛠️ Technology Stack

- **Backend:** Python 3.10+, Flask 3.1, Flask-SQLAlchemy, Flask-CORS, PyMySQL, Gunicorn
- **Database:** MySQL 8.0 (with automatic SQLite fallback for local test execution)
- **Frontend:** HTML5, CSS3, JavaScript (ES6+), Chart.js
- **Testing:** Pytest (16 automated unit and API integration tests)
- **DevOps & Containers:** Docker, Docker Compose, Jenkins Declarative Pipeline, Kubernetes (K8s)

---

## 🏗️ Project Architecture

```
Smart Health and Kitchen Assistant/
├── backend/
│   ├── app/
│   │   ├── __init__.py           # Application factory (create_app)
│   │   ├── config.py             # Development, Testing, Production configurations
│   │   ├── extensions.py         # SQLAlchemy and CORS extensions
│   │   ├── models/               # SQLAlchemy Models
│   │   │   ├── user.py           # User model with secure hashing
│   │   │   ├── item.py           # KitchenItem model
│   │   │   ├── medicine.py       # Medicine model
│   │   │   └── recipe.py         # Recipe model with ingredient matching
│   │   ├── schemas/
│   │   │   └── validators.py     # Input payload validation logic
│   │   ├── services/             # Business logic layer
│   │   │   ├── auth_service.py
│   │   │   ├── item_service.py
│   │   │   ├── medicine_service.py
│   │   │   ├── recipe_service.py
│   │   │   ├── notification_service.py
│   │   │   └── dashboard_service.py
│   │   └── routes/               # Flask Blueprints (RESTful + Legacy)
│   │       ├── auth_routes.py
│   │       ├── item_routes.py
│   │       ├── medicine_routes.py
│   │       ├── recipe_routes.py
│   │       ├── notification_routes.py
│   │       └── dashboard_routes.py
│   ├── tests/                    # Pytest test suite
│   │   ├── conftest.py           # Test fixtures & isolated in-memory DB
│   │   ├── test_auth.py
│   │   ├── test_items.py
│   │   ├── test_medicines.py
│   │   └── test_features.py      # Recipes, alerts, and dashboard tests
│   ├── app.py                    # WSGI entry point
│   ├── Dockerfile                # Production container definition
│   └── requirements.txt
├── frontend/
│   ├── css/                      # Stylesheets
│   ├── javascript/               # Dynamic scripts (recipes.js, notif.js, etc.)
│   └── *.html                    # Frontend views (home, recipes, notif, etc.)
├── docker-compose.yml             # Multi-container stack (App + MySQL + Nginx)
├── Jenkinsfile                    # CI/CD pipeline (Test, Build, Push, Deploy)
├── k8s/                           # Kubernetes manifests
│   ├── namespace.yaml
│   ├── configmap.yaml
│   ├── secret.yaml
│   ├── mysql-pv-pvc.yaml
│   ├── mysql-deployment.yaml
│   ├── mysql-service.yaml
│   ├── backend-deployment.yaml
│   ├── backend-service.yaml
│   └── ingress.yaml
├── .gitignore
└── README.md
```

---

## 📡 RESTful API Reference

| Method | Endpoint | Description | Status Codes |
|---|---|---|---|
| `POST` | `/api/auth/signup` | Register a new user | `201`, `400`, `409` |
| `POST` | `/api/auth/login` | Authenticate user credentials | `200`, `400`, `401` |
| `GET` | `/api/items?user_id=1` | Get kitchen items (optional `search`, `category`) | `200`, `400` |
| `POST` | `/api/items` | Add a new kitchen item | `201`, `400` |
| `GET` | `/api/items/<id>` | Retrieve single kitchen item | `200`, `404` |
| `PUT` | `/api/items/<id>` | Update kitchen item | `200`, `400`, `404` |
| `DELETE` | `/api/items/<id>` | Delete kitchen item | `200`, `404` |
| `GET` | `/api/medicines?user_id=1`| Get medicine items (optional `search`) | `200`, `400` |
| `POST` | `/api/medicines` | Add a new medicine item | `201`, `400` |
| `PUT` | `/api/medicines/<id>` | Update medicine item | `200`, `400`, `404` |
| `DELETE` | `/api/medicines/<id>` | Delete medicine item | `200`, `404` |
| `GET` | `/api/recipes` | List recipes (optional `category` filter) | `200` |
| `GET` | `/api/recipes/recommendations?user_id=1` | Get recipe recommendations matched to pantry | `200`, `400` |
| `GET` | `/api/notifications/alerts?user_id=1` | Retrieve expired, expiring soon, and low stock items | `200`, `400` |
| `POST` | `/api/notifications/dispatch` | Trigger email or push notification summary | `200`, `400`, `404` |
| `GET` | `/api/dashboard/summary?user_id=1` | Retrieve dashboard stats and chart data | `200`, `400` |

*Note: Legacy endpoints (`/items`, `/add-item`, `/signup`, `/login`, etc.) remain fully functional for complete backward compatibility.*

---

## 🧪 Running the Pytest Test Suite

Run all automated unit and integration tests:

```bash
# From repository root
cd backend
pytest tests/ -v
```

All 16 tests cover user registration, authentication, input validation, CRUD operations, recipe matching logic, expiry notification detection, and dashboard analytics.

---

## 🐳 Running with Docker & Docker Compose

Launch the complete multi-container stack (Backend API + MySQL 8.0 + Frontend Nginx web server):

```bash
docker compose up -d --build
```

- **Frontend:** [http://localhost](http://localhost)
- **Backend API:** [http://localhost:5000](http://localhost:5000)
- **MySQL Database:** `localhost:3306`

To shut down:
```bash
docker compose down
```

---

## ☸️ Kubernetes Deployment

Deploy to your Kubernetes cluster:

```bash
# 1. Create namespace
kubectl apply -f k8s/namespace.yaml

# 2. Apply config and secrets
kubectl apply -f k8s/configmap.yaml -n smart-health
kubectl apply -f k8s/secret.yaml -n smart-health

# 3. Deploy MySQL storage and database
kubectl apply -f k8s/mysql-pv-pvc.yaml -n smart-health
kubectl apply -f k8s/mysql-deployment.yaml -n smart-health
kubectl apply -f k8s/mysql-service.yaml -n smart-health

# 4. Deploy Backend API & Ingress
kubectl apply -f k8s/backend-deployment.yaml -n smart-health
kubectl apply -f k8s/backend-service.yaml -n smart-health
kubectl apply -f k8s/ingress.yaml -n smart-health

# 5. Check rollout status
kubectl rollout status deployment/backend-deployment -n smart-health
```

---

## 🔄 Jenkins CI/CD Pipeline

The included [**`Jenkinsfile`**](Jenkinsfile) automates the entire CI/CD lifecycle:
1. **Checkout Code:** Pulls latest branch changes.
2. **Run Pytest Suite:** Installs dependencies and executes tests, publishing a JUnit test report.
3. **Docker Build:** Packages the backend into a versioned image (`${BUILD_NUMBER}` and `latest`).
4. **Docker Push:** Authenticates and pushes images to Docker Hub or private container registry.
5. **Kubernetes Deploy:** Applies manifests, triggers a rolling update, and monitors rollout status.

---

## 👩‍💻 Author

Developed with ❤️ by **Prerana**.
