# 💻 Local Development Setup & Engineering Workflows

## 1. Prerequisites & System Requirements

Before running **NeuronOps** locally, ensure your system meets the following software requirements:

* **Operating System**: Windows 10/11 (WSL2 recommended), Ubuntu 22.04 LTS+, or macOS Sonoma+.
* **Python**: Python `3.11.x` or `3.12.x`.
* **Node.js**: Node.js `v20.x` or higher (`npm` `v10.x`).
* **Docker**: Docker Desktop or Docker Engine `v24.x` with `docker-compose`.
* **Git**: Git `v2.40+`.

---

## 2. Windows Local Setup Guide (PowerShell)

```powershell
# 1. Clone repository
git clone https://github.com/your-org/ai-cluster.git
cd ai-cluster

# 2. Start PostgreSQL container
docker-compose up -d db

# 3. Create & activate Python virtual environment
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1

# 4. Install backend dependencies
pip install -r requirements.txt

# 5. Execute database migrations & seed initial data
python manage.py migrate
python seed_data.py

# 6. Run background worker processes in separate terminals
# Terminal 1: Telemetry Generator
python telemetry_generator.py

# Terminal 2: Deterministic Processor Engine
python processor.py

# Terminal 3: Django API Server
python manage.py runserver 0.0.0.0:8000

# 7. Setup & Run Next.js Frontend
cd ..\frontend
npm install
npm run dev
```

---

## 3. Linux / macOS Local Setup Guide (Bash)

```bash
# 1. Clone repository & enter workspace
git clone https://github.com/your-org/ai-cluster.git
cd ai-cluster

# 2. Start PostgreSQL
docker-compose up -d db

# 3. Create virtual environment
cd backend
python3 -m venv venv
source venv/bin/activate

# 4. Install dependencies & migrate DB
pip install -r requirements.txt
python manage.py migrate
python seed_data.py

# 5. Launch processes
python telemetry_generator.py &
python processor.py &
python manage.py runserver 0.0.0.0:8000 &

# 6. Launch frontend
cd ../frontend
npm install
npm run dev
```

---

## 4. Seeding Test Data & Resetting State

If you need to reset the cluster to a fresh state during development:

```bash
cd backend
python manage.py flush --no-input
python manage.py migrate
python seed_data.py
```
