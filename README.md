<div align="center">

# 🔗 StackConnect

### Find your missing teammate, faster.

A real-time hackathon matchmaking platform — built for **Track 7: Collaboration & Networking** — that connects builders based on tech stack, GitHub activity, and what they're looking for in a teammate.

[**🚀 Live App**](https://buildathon-2-0-actual.vercel.app) · [**⚙️ API**](https://buildathon-2-0-actual.onrender.com)

</div>

---

## 💡 The Problem

Finding the right teammate during a hackathon — a backend dev hunting for a designer, an ML engineer needing a frontend partner — is mostly luck: shouting into a Discord channel and hoping someone with the right skills replies in time.

**StackConnect** turns that into a structured discovery flow: build a profile, get ranked matches based on shared/complementary skills, swipe, connect, and chat — all in real time.

---

## ✨ Features

- **Three ways to build a profile** — type skills manually, upload a resume (OCR + Gemini extraction), or import directly from a GitHub username (repo language analysis + Gemini)
- **Find teammates without knowing what to search for** — don't know the exact skills your project needs? Describe it in plain English ("a real-time chat app with AI-generated summaries") and Gemini infers the relevant tech stack, which you can then use to instantly search and rank candidate teammates
- **Ranked discovery feed** — profiles are scored and sorted by skill overlap with what you're looking for, not just shown in random order
- **Smart skill matching** — typo tolerance (Levenshtein distance) and category-based expansion, so searching "React" also surfaces relevant Vue/Angular/Next.js builders
- **Swipe-to-connect** — send a request, get accepted, and you're matched
- **Real-time chat** — Socket.io powered, room-based per connection, persisted to MongoDB
- **Pending requests inbox** — see who's swiped on you before you decide
- **Peer ratings** — rate collaborators after connecting
- **JWT authentication** — signup/login with hashed passwords

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS, React Router, Lucide Icons |
| Backend | Node.js, Express 5, Socket.io |
| Database | MongoDB (Mongoose) |
| Auth | JWT + bcrypt |
| AI | Google Gemini (`gemini-2.5-flash`) for skill extraction |
| OCR | `pdf-parse` (text PDFs) + `tesseract.js` (scanned/image fallback) |
| External API | GitHub REST API (repo + language data) |
| Deployment | Vercel (frontend) · Render (backend) |

---

## 📁 Project Structure

```
Buildathon-2.0---Actual/
├── backend_final/
│   └── backend/
│       ├── config/
│       │   ├── db.js              # MongoDB connection
│       │   └── gemini.js          # Gemini client (lazy-init, model configurable)
│       ├── models/
│       │   ├── User.js            # Profile + auth + swipe/match state
│       │   ├── Connection.js      # Swipe/match requests
│       │   └── Message.js         # Chat messages
│       ├── controllers/
│       │   ├── authController.js
│       │   ├── profileController.js   # Discovery, swipe, ranked matching
│       │   └── skillController.js     # Manual / resume / GitHub extraction
│       ├── services/
│       │   ├── geminiService.js
│       │   ├── resumeService.js
│       │   └── githubService.js
│       ├── utils/
│       │   ├── skillCategories.js     # Skill grouping for relevance expansion
│       │   └── fuzzyMatch.js          # Typo-tolerant skill matching
│       ├── middleware/
│       │   ├── auth.js                # JWT verification
│       │   └── upload.js              # Multer config
│       ├── routes/
│       └── server.js                  # Express + Socket.io entrypoint
│
├── frontend_final/
│   └── frontend/
│       └── src/
│           ├── components/
│           │   ├── ProfileSetup.jsx       # 3-tab skill input UI
│           │   ├── MatchGrid.jsx          # Ranked discovery / swipe deck
│           │   ├── PendingRequests.jsx    # Incoming request inbox
│           │   ├── MyMatches.jsx          # Accepted connections list
│           │   ├── LiveChat.jsx           # Socket.io chat window
│           │   └── DeveloperProfile.jsx   # Profile detail view
│           ├── config/api.js
│           └── App.jsx
│
└── SEARCH_IMPROVEMENTS.md             # Notes on the ranked-matching algorithm
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A MongoDB connection string (Atlas or local)
- A [Gemini API key](https://aistudio.google.com/app/apikey)
- (Optional) A [GitHub personal access token](https://github.com/settings/tokens) — raises rate limit from 60 → 5000 req/hr

### 1. Clone

```bash
git clone https://github.com/KhSudhir2345/Buildathon-2.0---Actual.git
cd Buildathon-2.0---Actual
```

### 2. Backend

```bash
cd backend_final/backend
npm install
```

Create a `.env` file in this folder:

```env
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/stackconnect?retryWrites=true&w=majority
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash          # optional, this is the default
GITHUB_TOKEN=your_github_pat            # optional but recommended
JWT_SECRET=replace_with_a_long_random_string
JWT_EXPIRES_IN=7d
PORT=5000
```

Run it:
```bash
npm run dev
```

You should see `Server & WebSockets running on port 5000` and a MongoDB connected log.

### 3. Frontend

In a new terminal:

```bash
cd frontend_final/frontend
npm install
```

Create a `.env` file in this folder:

```env
VITE_API_URL=http://localhost:5000
```

Run it:
```bash
npm run dev
```

Open `http://localhost:5173` (Vite's default port).

---

## 🔌 API Reference

### Auth (`/api/auth`)
| Method | Route | Description |
|---|---|---|
| POST | `/signup` | Create account — `{ name, email, password, githubProfile?, bio?, skills?, lookingFor? }` |
| POST | `/login` | `{ email, password }` → returns JWT |
| GET | `/me` | Current user (requires `Authorization: Bearer <token>`) |

### Skill Extraction (`/api/skills`)
| Method | Route | Description |
|---|---|---|
| POST | `/manual` | `{ userId, skills: [...] }` — direct skill entry |
| POST | `/resume` | Multipart upload, field `resume` (PDF/PNG/JPG) → OCR → Gemini |
| POST | `/github` | `{ userId, username }` → GitHub repo scan → Gemini |
| POST | `/project-suggestions` | `{ description }` → Gemini-suggested skills for a project idea |
| GET | `/profile/:userId` | Fetch a profile |
| PUT | `/profile/:userId` | Update profile fields |
| DELETE | `/profile/:userId/skill` | Remove a single skill — `{ skill }` |

### Profiles & Discovery (`/api/profiles`) — all require auth
| Method | Route | Description |
|---|---|---|
| GET | `/discover` | Ranked feed of candidate profiles |
| POST | `/swipe` | `{ targetUserId, action: "liked" \| "passed" }` |
| GET | `/matches` | Mutual matches |
| PUT | `/me` | Update your own profile |
| POST | `/:userId/rate` | Rate a collaborator, `{ value: 1-5 }` |

### Connections (`/api/connections`) — all require auth
| Method | Route | Description |
|---|---|---|
| POST | `/request` | Send a connection request — `{ receiverId }` |
| GET | `/pending/:userId` | Incoming pending requests |
| PUT | `/accept/:connectionId` | Accept a request |
| PUT | `/reject/:connectionId` | Reject a request |
| GET | `/accepted/:userId` | All accepted matches |

### Messages (`/api/messages`) — auth required
| Method | Route | Description |
|---|---|---|
| GET | `/:connectionId` | Message history for an accepted connection |

---

## ⚡ Real-Time Chat (Socket.io)

| Event | Direction | Payload |
|---|---|---|
| `join_chat` | client → server | `connectionId` |
| `send_message` | client → server | `{ connectionId, senderId, content }` |
| `receive_message` | server → room | populated message object |

Messages are persisted to MongoDB on send, then broadcast only to sockets in that connection's room.

---

## 🧭 "I Don't Know What Skills I Need" — Project-Based Matching

Most teammate searches assume you already know the right keywords. StackConnect doesn't require that:

1. Type a plain-English project description into the **Project Description** tab on the discovery screen
2. `POST /api/skills/project-suggestions` sends it to Gemini, which infers 6–18 concrete, searchable skills (languages, frameworks, infra, AI/ML tools — whatever the project actually needs)
3. The suggested skills appear as toggleable chips — deselect anything irrelevant
4. Hitting **"Rank Developers by Selected Skills"** feeds your selection straight into `GET /api/profiles/discover?skills=...`, which expands each skill into its category (so "React" also pulls in Vue/Angular/Next.js builders), tolerates typos via fuzzy matching, and ranks every candidate by skill overlap, mutual fit, and rating
5. Swipe and connect from the same ranked results — no separate search step

This means a non-technical hackathon organizer, or a developer who only knows *what* they're building and not *which libraries* that implies, gets the same quality of matches as someone searching by exact tech stack.

## 🧠 Ranked Matching

Raw skill search is exact-match by default, which misses adjacent matches (searching "React" won't surface a Vue developer). Two layers fix this — see [`SEARCH_IMPROVEMENTS.md`](./SEARCH_IMPROVEMENTS.md) for full detail:

- **Skill categories** (`utils/skillCategories.js`) — groups related technologies (e.g. all frontend frameworks) so a search expands to relevant adjacent skills
- **Fuzzy matching** (`utils/fuzzyMatch.js`) — Levenshtein-distance based, tolerates typos like "reacct" → "react"

---

## 🗺️ Roadmap

- [ ] Phase 3 of search: similarity scoring informed by historical match outcomes
- [ ] OAuth "Login with GitHub" for private repo access
- [ ] Push notifications for new matches/messages
- [ ] Team formation (3+ person squads, not just 1:1 matches)

---

## 🛠️ Built With

MERN Stack · Socket.io · Tailwind CSS · Google Gemini

---

<div align="center">
Built for Buildathon 2.0 — Track 7: Collaboration & Networking
</div>
