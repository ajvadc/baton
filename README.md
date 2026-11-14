# Baton 🏷️
### Knowledge handover that shows its evidence

> **Turns scattered project activity into a reviewed, role-appropriate handover when a team member leaves.**

[![Next.js](https://img.shields.io/badge/Frontend-Next.js%20%7C%20React%20%7C%20TailwindCSS-000000?style=for-the-badge&logo=nextdotjs)](https://nextjs.org)
[![FastAPI](https://img.shields.io/badge/Backend-Python%20%7C%20FastAPI-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com)
[![Docker](https://img.shields.io/badge/Deployment-Docker%20%7C%20Docker--Compose-2496ED?style=for-the-badge&logo=docker)](https://docker.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-amber.svg?style=for-the-badge)](LICENSE)

---

## 👥 The Team
- **Ajvad Cheniyath** – *Backend, AI extraction and evidence pipeline*
- **Aksada R** – *Frontend, review interface and UX*
- **D. Monic Prasanna** – *Permissions, research and documentation*

---

## 💡 The Problem
When people leave a team, the reasoning leaves with them. This impacts **student clubs**, **volunteer communities**, and **workplace project teams**.
- **Decision reasoning**: Why an option was chosen, and which alternatives were rejected.
- **Unfinished work**: Half-done tasks, open PRs lacking rollback scripts, and promises made verbally.
- **Hidden dependencies**: Personal trial accounts, vendor renewals, and undocumented API keys.
- **Recurring problems**: Known failure patterns, workarounds, and who to ask.

Documents exist, but the context that makes them usable is scattered across **chats, repositories, meeting notes, and task boards**.

---

## 🚀 The Solution: Baton
Baton connects authorised sources, rebuilds the current project state, and gives the incoming person an evidence-backed handover they can trust and act on.

```
+---------------------------------------------------------------------------------------+
|                                  THE BATON PIPELINE                                   |
+-------------+      +---------------+      +-------------+      +----------+      +----+---------------+
| 01. CONNECT | ---> | 02. RECONSTRUCT| ---> | 03. VERIFY  | ---> |04. REVIEW| ---> | 05. HANDOVER &     |
|             |      |               |      | & QUESTIONS |      |   GATE   |      |     RECEIPT        |
| - Docs/ADRs |      | - Structured  |      | - Citations |      | - Edits  |      | - Role Views       |
| - Chat Logs |      |   Claims      |      | - 4 Statuses|      | - Reject |      | - 5-Day Plan       |
| - Task CSV  |      | - Chronology  |      | - Leaver    |      | - Version|      | - Digital Sign-off |
| - Git Repos |      | - 5-Day Plan  |      |   Q&A Form  |      | - Signoff|      | - Audit Trail      |
+-------------+      +---------------+      +-------------+      +----------+      +--------------------+
```

### 1. Evidence First
Every claim links back to the exact chunk and span that supports it (ADR lines, commit SHAs, Slack timestamps, task rows).

### 2. Uncertainty Visible (The 4 Evidence Statuses)
- 🟢 **Verified**: Backed by an authoritative source or multiple agreeing sources.
- 🔵 **Inferred**: Drawn by the AI model; requires a human check.
- 🟡 **Conflicting**: Sources disagree. **All versions are shown, none chosen** (e.g. Task board assigns Person A; team chat assigns Person B).
- 🔴 **Missing**: Expected information not found in activity. Flagged rather than hallucinated.

### 3. Gaps Become Questions
Missing facts and conflicting claims automatically turn into actionable questions for the departing member to answer before they leave.

### 4. Review Gate (Human in Control)
Nothing is shared with the successor until a reviewer (Tech Lead / Manager) checks, edits, or approves the handover package.

### 5. Role-Based Views & Redaction
Permissions are enforced *before* generation and retrieval, so restricted text never reaches an unauthorized reader:
| View | Included | Hidden / Redacted |
|---|---|---|
| **Successor** | Full project state, decisions, risks, Day 1-5 tactical plan | Secrets, credentials, personal messages, HR content |
| **Teammate** | Tasks, owners, dependencies in their own area | Other areas' decisions and contacts |
| **Manager** | Risk, ownership, and open-decision executive summary | Raw chat and code excerpts |
| **Observer** | Read-only status and project milestones timeline | Anything marked confidential or unverified |

### 6. Digital Receipt of Handover
The incoming person reviews their onboarding plan, checks off items, signs their name digitally, and logs a tamper-evident acknowledgement timestamp into the audit trail.

---

## 🎯 Demo Scenario: Student Club Events App
Baton includes a complete built-in synthetic scenario:
- **Scenario**: A student club's Events App loses its Backend Lead (Alex Rivera) before the annual college fest.
- **Built-in Sources**:
  1. `architecture_decision_record.md` (ADR 01: Firebase Auth chosen, ADR 02: Redis lock)
  2. `meeting_notes.md` (Engineering syncs: Auth confirmed, payment gateway renewal debate)
  3. `slack_backend_channel_export.json` (Slack #backend-dev chat history)
  4. `sprint_task_board.csv` (Task EV-101 through EV-106)
  5. `git_commits.json` (Commits & open PR #42 for distributed seat locking)
- **Interactive Triggers**: Click **"⚡ Load Demo: Events App"** in the top navigation bar to test the full 5-stage pipeline in 1 second!

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 14+ (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons
- **Backend**: Python 3.11+, FastAPI, Uvicorn, Pydantic v2
- **Database**: Zero-dependency SQLite engine (portable, instant start, zero DLL locking issues)
- **AI Engine**: Google Gemini API integration with structured JSON schema output + smart deterministic fallback engine for offline/instant evaluation
- **Security & Audit**: Regex secret & PII masking, role-based access filtering, tamper-evident audit logs

---

## ⚡ Quick Start

### Option A: One-Click Launch (Windows)
Double-click `start.bat` or run:
```powershell
.\start.ps1
```
This boots both the FastAPI backend (`http://localhost:8000`) and the Next.js frontend (`http://localhost:3000`).

---

### Option B: Manual Setup

#### 1. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start backend server
uvicorn app.main:app --reload --port 8000
```
API Documentation will be live at: [http://localhost:8000/docs](http://localhost:8000/docs)

#### 2. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

### Option C: Docker Compose
```bash
docker compose up --build
```
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8000`

---

## 🌐 Environment Variables

Create `.env` inside `backend/`:
```env
PORT=8000
HOST=0.0.0.0
# Optional: Set Gemini API Key for live AI extraction (built-in fallback works without key)
GEMINI_API_KEY=
GEMINI_MODEL=gemini-1.5-flash

# Optional: GitHub token for higher rate limits on public repositories
GITHUB_TOKEN=
```

---

## 📡 API Endpoints Overview

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/demo/load-events-app` | Instantly seeds the Events App demo scenario |
| `POST` | `/api/projects` | Creates a new handover project |
| `GET` | `/api/projects` | Lists all handover projects |
| `POST` | `/api/projects/{id}/sources/upload` | Ingests docs, CSV, or chat with automated secret redaction |
| `POST` | `/api/projects/{id}/sources/github` | Imports public GitHub commits and open PRs |
| `POST` | `/api/projects/{id}/reconstruct` | Triggers AI claim extraction, citations, and status evaluation |
| `GET` | `/api/projects/{id}/claims` | Retrieves extracted claims with source citations |
| `GET` | `/api/projects/{id}/questions` | Retrieves generated leaver questions for gaps & conflicts |
| `POST` | `/api/questions/{id}/answer` | Leaver submits clarification to resolve conflict/gap |
| `POST` | `/api/projects/{id}/review/batch` | Reviewer batch accepts, rejects, or edits claims |
| `POST` | `/api/projects/{id}/review/approve-handover` | Reviewer approves handover package (clears Review Gate) |
| `GET` | `/api/projects/{id}/handover` | Role-filtered handover package (`?role=Successor\|Teammate\|Manager\|Observer`) |
| `POST` | `/api/projects/{id}/handover/acknowledge` | Successor submits digital signature of receipt |
| `GET` | `/api/projects/{id}/audit` | Retrieves complete tamper-evident audit history |

---

## 🚢 Deployment Guide

### Deploying Frontend to Vercel
1. Push your repository to GitHub.
2. Import project on [Vercel](https://vercel.com).
3. Set Root Directory to `frontend`.
4. Set Environment Variable: `NEXT_PUBLIC_API_URL=https://your-backend-domain.com`.
5. Deploy!

### Deploying Backend to Render / Railway / Cloud Run
1. Connect repository.
2. Set Root Directory to `backend`.
3. Set Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
4. Add environment variables: `PORT=8000`.
5. Deploy!

---

## 📜 License
This project is open-source under the MIT License.
