# Sahayak Backend

This backend is built using **FastAPI** and serves as the API for the **Sahayak** web application. It provides government scheme information, eligibility checking, search, filtering, and state-wise scheme data.

## 🚀 Live Application

**Frontend:** https://sahayak-beryl.vercel.app/

---

## 🛠️ Tech Stack

- FastAPI
- Python
- Uvicorn
- Pydantic

---

## ⚙️ Setup

```bash
cd sahayak-backend

python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

pip install -r requirements.txt

uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 📌 API Endpoints

### Health Check

```
GET /api/health
```

Returns the backend status.

---

### Get All Schemes

```
GET /api/schemes
```

Returns all available government schemes.

---

### Get Scheme by ID

```
GET /api/schemes/{scheme_id}
```

Returns details of a specific scheme.

---

### Get States

```
GET /api/states
```

Returns the list of supported states.

---

### Search Schemes

```
GET /api/schemes/search?q=query&state=stateName
```

Search government schemes by keyword and optional state.

---

### Filter Schemes

```
GET /api/schemes/filter?category=central&state=stateName
```

Filter schemes based on category and state.

---

### Check Eligibility

```
POST /api/eligibility
```

Checks user eligibility for government schemes based on the provided details.

---

## 📁 Project Structure

```
sahayak-backend/
│── main.py
│── requirements.txt
│── api/
│── models/
│── services/
│── data/
└── README.md
```

---

## 👨‍💻 Developed For

**Sahayak** – An AI-powered platform that helps users discover government schemes and check their eligibility through an intelligent and user-friendly interface.
