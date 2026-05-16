# TaskRover 🚀
**Live Demo:** [https://task-rover-lilac.vercel.app/] | **API Endpoint:** [https://taskrover-api.onrender.com/]
Admin Account Details:-
Username:- Myst
Password:- myst@123

TaskRover is an enterprise-grade Field Operations Management Portal. It streamlines task deployment, tracks on-site field agent visits, manages organizational hierarchies (Teams & Regions), and leverages a custom Mock AI service to automatically verify and summarize field reports.

---

## 🌟 Key Features
- **Mock AI Verification:** Simulates an AI analyzing agent visit notes via a dedicated Python service. Flags gibberish, warns about insufficient details, and generates professional summaries for Auditors, perfectly fulfilling assignment rubrics.
- **Robust RBAC (Role-Based Access Control):** Five distinct clearance levels with strict API permission boundaries preventing unauthorized data access.
- **Task Broadcasts & Direct Deployment:** Deploy tasks directly to specific agents, or open "Broadcasts" for anyone in the region to claim.
- **Team & Organization Management:** Team Leads can form squads and recruit free agents. Admins can structure the company via regions and assign roles.
- **System Audit Trail:** Every critical action (task deployment, status changes, recruiting, team creation) is logged with a timestamp for compliance.
- **Real-Time Field Reporting:** Agents clock in to generate "In Progress" visits and clock out with field notes to close the deployment.

---

## 🛠️ Tech Stack
**Frontend:**
- React.js (Vite)
- Tailwind CSS
- React Router DOM
- JWT Decode

**Backend:**
- Python & Django
- Django REST Framework (DRF)
- PostgreSQL (via Supabase)
- Gunicorn & WhiteNoise (Production Serving)

---

## 👥 Roles & Permissions
1. **Admin:** God-mode. Can create regions, teams, re-assign roles, and delete/edit any task.
2. **Auditor:** Read-only God-mode. Has access to the full System Audit Trail. Verifies or Flags completed tasks based on AI summaries.
3. **Regional Manager:** Manages all personnel within a specific geographic region.
4. **Team Lead:** Forms operational squads. Recruits unassigned Field Agents. Deploys tasks to their squad.
5. **Field Agent:** Accepts open broadcasts, executes tasks, clocks in/out of site visits, and submits field notes.

---

## 💻 Local Setup Instructions

### 1. Backend (Django) Setup
```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment
python -m venv env
source env/Scripts/activate  # (Windows)
source env/bin/activate      # (Mac/Linux)

# Install dependencies
pip install -r requirements.txt

# Run migrations and start server
python manage.py migrate
python manage.py runserver
```

### 2. Frontend (React/Vite) Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

---

## 🔐 Environment Variables

Create a `.env` file in the root of your `backend` directory:
```env
SECRET_KEY=your-random-django-secret-key
DEBUG=True
DATABASE_URL=sqlite:///db.sqlite3  # Replace with Supabase URI for production
```

Create a `.env` file in the root of your `frontend` directory:
```env
VITE_API_URL=http://localhost:8000  # Replace with Render URL in production
```

---

## 📡 API Reference
*All endpoints require a valid `Bearer <JWT>` token (except where marked Public).*

| Endpoint | Method | Description | Access Level |
| :--- | :--- | :--- | :--- |
| `/` | GET | API Root Directory / Welcome Page | Public |
| `/api/user/token/` | POST | Obtain JWT Access & Refresh Tokens | Public |
| `/api/user/token/refresh/` | POST | Refresh an expired JWT Access Token | Public |
| `/api/user/register/` | POST | Register a new user | Public / Admin |
| `/api/users/` | GET | Retrieve user roster | Authenticated |
| `/api/users/update/<pk>/` | PATCH/PUT | Update user details or password | Self / Admin |
| `/api/users/delete/<pk>/` | DELETE | Remove a user from the system | Admin |
| `/api/tasks/` | GET, POST | List tasks (scoped) or deploy a new task | Authenticated / TeamLead+ |
| `/api/tasks/update/<pk>/` | PATCH/PUT | Update task status or assignment | Assigned Agent / Admin |
| `/api/tasks/delete/<pk>/` | DELETE | Delete a task | Admin |
| `/api/visits/` | GET, POST | List reports or clock-in to a task | Authenticated / Field Agent |
| `/api/visits/update/<pk>/` | PATCH/PUT | Submit field notes and trigger Mock AI | Assigned Agent |
| `/api/visits/delete/<pk>/` | DELETE | Delete a field visit record | Admin |
| `/api/regions/` | GET, POST | List or create geographic regions | Authenticated / Admin |
| `/api/regions/update/<pk>/` | PATCH/PUT | Modify region details | Admin |
| `/api/regions/delete/<pk>/` | DELETE | Remove a geographic region | Admin |
| `/api/teams/` | GET, POST | List or form new operational squads | Authenticated / TeamLead+ |
| `/api/teams/update/<pk>/` | PATCH/PUT | Modify team details or assignments | TeamLead / Admin |
| `/api/teams/delete/<pk>/` | DELETE | Disband a team | Admin |
| `/api/logs/` | GET, POST | View or generate system audit logs | Admin / Auditor (Read) |

---

## 🚀 Deployment Pipeline
- **Database:** Supabase (PostgreSQL)
- **Backend API:** Render (Web Service running Gunicorn & WhiteNoise)
- **Frontend UI:** Vercel

*Designed and built for seamless field operations and compliance.*
