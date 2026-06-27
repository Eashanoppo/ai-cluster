# Project Execution Guide

## This guide details how to run both the backend (Django) and frontend (Next.js) parts of the **AI Cluster** project.

## 🛠️ Prerequisites

Ensure you have the following installed on your system:

- **Python** (version 3.10 or higher)
- **Node.js** (version 18 or higher) and **npm**
- **Docker & Docker Compose** (Optional: only if running PostgreSQL database or full stack in containers)

---

## 🔑 Environment Configuration

Before running the backend, you must configure the environment variables:

1. Navigate to the `backend` directory.
2. Copy the `.env.example` file to create a `.env` file:
   ```bash
   cp .env.example .env
   ```
3. Generate a secure Django secret key using:
   ```bash
   python -c "import secrets; print(secrets.token_urlsafe(50))"
   ```
4. Open the `.env` file and set the generated key to `SECRET_KEY`.

---

## 🐍 Backend Setup (Local)

The backend consists of three main processes that run in parallel:

1. **API Web Server** (`manage.py runserver`)
2. **Telemetry Generator** (`telemetry_generator.py`) - Simulates GPU telemetry/metrics.
3. **Deterministic Processor** (`processor.py`) - Processes telemetry and handles alert/eviction logic.

### 🐧 Linux (zsh / bash)

Open a terminal window and execute:

```bash
# Navigate to the backend directory
cd backend
# Create a Python virtual environment
python3 -m venv venv
# Activate the virtual environment
source venv/bin/activate
# Install dependencies
pip install -r requirements.txt
# Run database migrations (creates sqlite DB by default)
python manage.py migrate
# Seed the database with mock data and the default admin user
python seed_data.py
```

### 👤 Default Credentials
The seed script creates a default administrative user:
* **Username:** `admin`
* **Password:** `password123`


To run the three backend processes, you have two options:

#### Option A: Running in a Single Terminal Tab (Backgrounding)

Since these processes run indefinitely, running them with `&&` will execute them sequentially (meaning the second command won't start until you stop the first).
Instead, you can start them all concurrently in the background in a single terminal tab using the `&` operator:

```bash
# Start all three processes in the background
python manage.py runserver & python telemetry_generator.py & python processor.py &
```

_To stop all background processes later, simply run `kill %1 %2 %3` or close the terminal tab._

#### Option B: Running in Three Separate Terminal Tabs (Recommended for easy logs viewing)

Open three separate terminal tabs/windows, run `source venv/bin/activate` in each, and run:

- **Tab 1: API Server**
  ```bash
  python manage.py runserver
  ```
- **Tab 2: Telemetry Generator**
  ```bash
  python telemetry_generator.py
  ```
- **Tab 3: Processor**
  ```bash
  python processor.py
  ```

---

### 🪟 Windows (PowerShell)

Open a PowerShell window:

```powershell
# Navigate to the backend directory
cd backend
# Create a Python virtual environment
python -m venv venv
# Activate the virtual environment
.\venv\Scripts\Activate.ps1
# Install dependencies
pip install -r requirements.txt
# Run database migrations
python manage.py migrate
# Seed the database with mock data and the default admin user
python seed_data.py
```

### 👤 Default Credentials
The seed script creates a default administrative user:
* **Username:** `admin`
* **Password:** `password123`


To run the three required backend processes, open **three separate PowerShell windows** (remembering to run `.\venv\Scripts\Activate.ps1` in each):

- **Window 1: API Server**
  ```powershell
  python manage.py runserver
  ```
- **Window 2: Telemetry Generator**
  ```powershell
  python telemetry_generator.py
  ```
- **Window 3: Processor**
  ```powershell
  python processor.py
  ```

---

## 💻 Frontend Setup (Next.js)

The frontend is a Next.js web application. It runs the same way on both **Linux** and **Windows**.
Open a terminal/PowerShell window and run:

```bash
# Navigate to the frontend directory
cd frontend
# Install npm dependencies
npm install
# Start the Next.js development server
npm run dev
```

## The application will be running at [http://localhost:3000](http://localhost:3000).

## 🐳 Running with Docker Compose (Alternative)

If you want to run the entire stack (PostgreSQL + Backend + Processor + Telemetry Generator + Next.js Frontend) in Docker:

1. Make sure Docker is running on your system.
2. In the project root directory, run:
   ```bash
   docker-compose up --build
   ```
3. This will spin up:
   - **Postgres** on port `5432`
   - **Django API Server** on port `8000`
   - **Next.js Frontend** on port `3000`
   - **Telemetry Generator** and **Processor** background services
