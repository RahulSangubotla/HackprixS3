# Gurukul
### AI-first immersive VR education — where Gemini knows every student's weak spots and the platform adapts around them in real time.

---

## The Problem

Modern classrooms are failing to keep students engaged:

- **Visualisation gap** — Subjects like chemistry and biology require 3D intuition (molecular structures, cell anatomy, reaction mechanisms), but are taught on flat 2D screens. Smart boards help, but they don't solve the core problem.
- **Attention problem** — Traditional instruction struggles to hold student attention. Passive learning leads to poor retention.
- **No personalisation** — Every student learns at the same pace with the same material, regardless of individual strengths or gaps.
- **No incentive loop** — There is little motivation for students to engage with the material beyond exam pressure.

---

## Our Solution

Gurukul is a phone-first VR education platform with **AI at its core**. Gemini Flash 2.5 doesn't just generate content — it continuously models each student's understanding and closes their individual knowledge gaps automatically.

### Core Features

| Feature | Description |
|---|---|
| **AI Adaptive Student Profiling** | Every answer a student gives updates a per-subject, per-topic skill profile in MongoDB via Exponential Moving Average blending. The system tracks `{subject, topic, score, test_count}` and gets more accurate with every session |
| **AI-Generated Diagnostic Quizzes** | Gemini Flash 2.5 generates 10 fresh questions per session with carefully engineered `option_signals` — wrong answers expose *specific* misconceptions, not just "incorrect". No two sessions are the same |
| **AI Chatbot** | In-app Gemini-powered chatbot for instant doubt resolution with voice input and text-to-speech output |
| **VR Classrooms & Labs** | Immersive A-Frame WebVR environments for chemistry and biology — visualise 3D molecules, cell structures, and lab simulations directly in a phone browser |
| **Multiplayer VR Kahoot** | Real-time quiz game inside a VR theatre — robot avatars, live leaderboard, Socket.IO — profiles are updated automatically at the end of every game |
| **VR Social Lounges** | Students can hang out in shared virtual lounges, reinforcing the social and immersive dimension of the platform |
| **Reward Marketplace** | Students earn points for quiz performance and VR engagement, redeemable in a marketplace for study materials and rewards |

---

## How the AI Works — Deep Dive

AI isn't a feature bolted on — it is the platform's backbone.

### 1. Diagnostic Quiz Generation
On every game start, Gurukul calls `gemini-2.5-flash` with a structured prompt that demands:
- 10 questions spanning ≥ 6 distinct topics across chemistry **and** biology
- A `subject` tag (`"chemistry"` | `"biology"`) on every question
- 4 `option_signals` per question — each carrying a `{topic, delta}` pair
  - Correct answer: `delta +7 to +10` → confirms mastery
  - Wrong answers: `delta -3 to -8` → each pinpoints a *specific* misconception

This means wrong answers are not wasted — they actively diagnose *what* the student misunderstands.

### 2. Adaptive Student Profile
After every game, `compute_profiles()` aggregates each player's answer history into `{(subject, topic): avg_delta}` and writes to MongoDB as:
```json
{ "subject": "biology", "topic": "mitosis stages", "score": 6.4, "test_count": 3 }
```
Updates use **Exponential Moving Average** (α = 0.25):
```
new_score = 0.25 × session_delta + 0.75 × existing_score
```
This means a single bad session can't destroy a strong profile, and genuine improvement is reflected gradually.

### 3. Cross-Session Topic Canonicalisation
Gemini doesn't always name the same topic identically. `resolve_topics()` makes a second Gemini call that maps new topic strings to existing profile keys — but **only within the same subject** — preventing false merges like `chemistry|diffusion` → `biology|osmosis`.

### 4. AI Chatbot
A persistent in-app Gemini chatbot handles student doubts in real time with voice input (Web Speech API) and text-to-speech output — no need to leave the platform to search for answers.

---

## How It Fits the Track

**Track: Gen AI and ML**

Gurukul is built around Generative AI and machine learning as first-class citizens, not add-ons:

1. **Generative content at runtime** — Gemini Flash 2.5 generates a completely fresh set of 10 diagnostic quiz questions on every session, ensuring no two rounds are identical and content always matches the curriculum.
2. **ML-driven student modelling** — Every answer feeds a per-student, per-topic skill model updated via Exponential Moving Average. This is an online learning algorithm that continuously refines its estimate of a student's mastery without requiring retraining or manual intervention.
3. **LLM-powered deduplication** — A second Gemini call canonicalises topic labels across sessions, acting as a lightweight semantic matching layer to prevent profile fragmentation — a practical application of LLM reasoning beyond content generation.
4. **Conversational AI for doubt resolution** — The in-app Gemini chatbot provides context-aware, subject-specific answers in real time, reducing the dependency on a teacher being physically present.

Every AI call serves a concrete educational purpose: generate, assess, deduplicate, or explain. The result is a platform that gets measurably smarter about each student the more they use it.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)               │
│  Subjects · Quiz Room · Marketplace · Lounge · Chatbot  │
└───────────────────┬─────────────────────────────────────┘
                    │ REST (JWT)
┌───────────────────▼─────────────────────────────────────┐
│              FastAPI Backend  (:8000)                    │
│  Auth · Courses · Quizzes · Marketplace                  │
│  MongoDB (Beanie ODM)                                    │
└───────────────────┬─────────────────────────────────────┘
                    │
          ┌─────────┴──────────────────────┐
          │         VR Kahoot Server (:8080)│
          │  FastAPI + Socket.IO + A-Frame  │
          │  Gemini question gen            │
          │  Adaptive profile → MongoDB     │
          └─────────────────────────────────┘
```

---

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Framer Motion, A-Frame 1.4, Capacitor (Android)
- **Backend**: Python 3, FastAPI, Beanie ODM, Motor (async MongoDB), python-jose (JWT)
- **VR Kahoot**: FastAPI, python-socketio, A-Frame, Networked-AFrame, EasyRTC, WebXR
- **AI**: Google Gemini Flash 2.5 (`google-genai`) — quiz generation, profile deduplication, chatbot
- **Database**: MongoDB

---

## Challenges & How We Overcame Them

### 1. Adaptive profiling without over-fitting to a single bad session
Averaging raw scores per topic meant one bad round could trash a student's profile. We solved this with **Exponential Moving Average** (α = 0.25) — recent results influence the profile but don't overwrite it.

### 2. Topic key drift across Gemini sessions
Gemini generates slightly different topic strings each run (`"covalent bonding"` vs `"covalent bonds"`). We added a second Gemini call (`resolve_topics`) that deduplicates new topics against existing profile keys before merging — scoped by subject to prevent cross-domain false merges (e.g. `"chemistry|diffusion"` won't collapse into `"biology|osmosis"`).

### 3. Accessible VR on low-end hardware
High-fidelity VR is expensive. We used **A-Frame WebVR** — it runs in any modern mobile browser with a cardboard headset. No app install, no dedicated hardware required.

### 4. Real-time multiplayer avatars in VR
Synchronising player positions and animations across clients required combining **Networked-AFrame** for scene state and **EasyRTC** for WebRTC peer connections, with a lightweight Node.js signalling server.
