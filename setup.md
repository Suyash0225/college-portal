# Assignment Management — Setup Guide

## Prerequisites
- Python 3.10+ (already installed ✓)
- Node.js 18+ — Download from https://nodejs.org

---

## 1. Backend Setup

```bash
cd backend
pip install -r requirements.txt
python app.py
```

Backend runs on **http://localhost:5000**

Default admin credentials:
- Username: `admin`
- Password: `admin123`

---

## 2. Frontend Setup

Open a **second terminal**:

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on **http://localhost:5173**

---

## Project Structure

```
NewProject/
├── backend/
│   ├── app.py              ← Flask entry point
│   ├── models.py           ← SQLAlchemy models
│   ├── requirements.txt
│   └── routes/
│       ├── auth.py         ← POST /api/auth/login, logout, me
│       ├── teachers.py     ← CRUD /api/teachers/
│       ├── subjects.py     ← CRUD /api/subjects/
│       ├── assignments.py  ← CRUD /api/assignments/
│       └── resources.py    ← CRUD /api/resources/
└── frontend/
    └── src/
        ├── App.jsx
        ├── api/client.js   ← Axios API helpers
        ├── context/        ← Auth state
        ├── pages/
        │   ├── HomePage.jsx       ← Public view (assignments + resources)
        │   ├── LoginPage.jsx      ← Admin login
        │   └── admin/             ← Protected CRUD pages
        └── components/
            ├── admin/             ← Sidebar + AdminLayout
            └── shared/            ← Modal, ConfirmDialog, etc.
```

---

## API Endpoints

| Method | Endpoint | Auth |
|--------|----------|------|
| POST | /api/auth/login | No |
| POST | /api/auth/logout | No |
| GET | /api/teachers/ | No |
| POST/PUT/DELETE | /api/teachers/ | Admin |
| GET | /api/subjects/ | No |
| POST/PUT/DELETE | /api/subjects/ | Admin |
| GET | /api/assignments/ | No |
| POST/PUT/DELETE | /api/assignments/ | Admin |
| GET | /api/resources/ | No |
| POST/PUT/DELETE | /api/resources/ | Admin |
