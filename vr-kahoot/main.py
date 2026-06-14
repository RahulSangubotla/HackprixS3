import os
import json
import random
import asyncio
from datetime import datetime, timezone

import socketio
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
import motor.motor_asyncio
from google import genai
from google.genai import types as genai_types

load_dotenv()

# --- CONFIG ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME", "newdb")
EMA_ALPHA = 0.25  # weight given to the newest test result

# --- GEMINI ---
gemini_client = genai.Client(api_key=GEMINI_API_KEY)

# --- MONGODB ---
mongo_client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URI)
db = mongo_client[DB_NAME]
db_collection = db["user_profiles"]

# ---------------------------------------------------------------------------
# FALLBACK QUESTIONS (used if Gemini is unavailable)
# Each option_signal describes what choosing that option reveals about the
# student: correct → large positive delta; distractors → specific negative
# deltas that name the misconception being exposed.
# ---------------------------------------------------------------------------
FALLBACK_QUESTIONS = [
    {
        "q": "Which equation correctly balances the combustion of methane?",
        "options": [
            "CH4 + 2O2 -> CO2 + 2H2O",
            "CH4 + O2 -> CO2 + H2O",
            "2CH4 + O2 -> 2CO2 + H2O",
            "CH4 + 3O2 -> CO2 + 2H2O"
        ],
        "correct": 0,
        "subject": "chemistry",
        "topic": "balancing chemical equations",
        "option_signals": [
            {"topic": "balancing chemical equations", "delta": 9},
            {"topic": "balancing chemical equations", "delta": -6},
            {"topic": "stoichiometry", "delta": -5},
            {"topic": "balancing chemical equations", "delta": -7}
        ]
    },
    {
        "q": "During which phase of mitosis do chromosomes align along the cell's equatorial plane?",
        "options": ["Prophase", "Metaphase", "Anaphase", "Telophase"],
        "correct": 1,
        "subject": "biology",
        "topic": "mitosis",
        "option_signals": [
            {"topic": "mitosis stages", "delta": -5},
            {"topic": "mitosis stages", "delta": 9},
            {"topic": "mitosis stages", "delta": -6},
            {"topic": "mitosis stages", "delta": -4}
        ]
    },
    {
        "q": "What type of bond forms when two non-metal atoms share electrons?",
        "options": ["Ionic bond", "Covalent bond", "Metallic bond", "Hydrogen bond"],
        "correct": 1,
        "subject": "chemistry",
        "topic": "chemical bonding",
        "option_signals": [
            {"topic": "ionic bonding", "delta": -6},
            {"topic": "covalent bonding", "delta": 9},
            {"topic": "metallic bonding", "delta": -5},
            {"topic": "intermolecular forces", "delta": -4}
        ]
    },
    {
        "q": "What are the reactants in photosynthesis?",
        "options": ["O2 and glucose", "CO2 and H2O", "CO2 and O2", "Glucose and H2O"],
        "correct": 1,
        "subject": "biology",
        "topic": "photosynthesis",
        "option_signals": [
            {"topic": "photosynthesis", "delta": -7},
            {"topic": "photosynthesis", "delta": 9},
            {"topic": "cellular respiration", "delta": -5},
            {"topic": "photosynthesis", "delta": -4}
        ]
    },
    {
        "q": "Elements in the same group of the periodic table share which property?",
        "options": [
            "Same atomic mass",
            "Same number of valence electrons",
            "Same atomic number",
            "Same number of neutrons"
        ],
        "correct": 1,
        "subject": "chemistry",
        "topic": "periodic table",
        "option_signals": [
            {"topic": "atomic mass", "delta": -5},
            {"topic": "periodic table", "delta": 9},
            {"topic": "atomic number", "delta": -6},
            {"topic": "nuclear structure", "delta": -5}
        ]
    },
    {
        "q": "Which nitrogenous base pairs with adenine (A) in DNA?",
        "options": ["Guanine (G)", "Cytosine (C)", "Thymine (T)", "Uracil (U)"],
        "correct": 2,
        "subject": "biology",
        "topic": "DNA structure",
        "option_signals": [
            {"topic": "DNA base pairing", "delta": -5},
            {"topic": "DNA base pairing", "delta": -6},
            {"topic": "DNA base pairing", "delta": 9},
            {"topic": "RNA structure", "delta": -7}
        ]
    },
    {
        "q": "A solution with a pH of 3 is best described as:",
        "options": ["Strongly basic", "Weakly basic", "Weakly acidic", "Strongly acidic"],
        "correct": 3,
        "subject": "chemistry",
        "topic": "acids and bases",
        "option_signals": [
            {"topic": "pH scale", "delta": -8},
            {"topic": "pH scale", "delta": -6},
            {"topic": "pH scale", "delta": -4},
            {"topic": "pH scale", "delta": 9}
        ]
    },
    {
        "q": "Where does the Krebs cycle take place in a eukaryotic cell?",
        "options": ["Cytoplasm", "Cell membrane", "Mitochondrial matrix", "Nucleus"],
        "correct": 2,
        "subject": "biology",
        "topic": "cellular respiration",
        "option_signals": [
            {"topic": "cellular respiration", "delta": -6},
            {"topic": "cell membrane function", "delta": -5},
            {"topic": "cellular respiration", "delta": 9},
            {"topic": "cellular respiration", "delta": -7}
        ]
    },
    {
        "q": "Why does water have an unusually high boiling point for its molecular mass?",
        "options": [
            "Strong covalent bonds within water molecules",
            "Hydrogen bonding between water molecules",
            "Water molecules are very small",
            "Ionic interactions in water"
        ],
        "correct": 1,
        "subject": "chemistry",
        "topic": "intermolecular forces",
        "option_signals": [
            {"topic": "intramolecular vs intermolecular forces", "delta": -7},
            {"topic": "intermolecular forces", "delta": 9},
            {"topic": "intermolecular forces", "delta": -5},
            {"topic": "ionic bonding", "delta": -6}
        ]
    },
    {
        "q": "Two heterozygous individuals (Aa x Aa) cross. What fraction of offspring will be homozygous recessive (aa)?",
        "options": ["1/4", "1/2", "3/4", "All offspring"],
        "correct": 0,
        "subject": "biology",
        "topic": "Mendelian genetics",
        "option_signals": [
            {"topic": "Mendelian genetics", "delta": 9},
            {"topic": "Mendelian genetics", "delta": -5},
            {"topic": "dominant vs recessive traits", "delta": -6},
            {"topic": "Mendelian genetics", "delta": -8}
        ]
    }
]

QUESTIONS = list(FALLBACK_QUESTIONS)

# --- GAME STATE ---
game_state = {
    "status": "waiting",
    "current_question_index": -1,
    "players": {},        # {sid: {name, score}}
    "answers": {},        # {sid: answer_index} for current question
    "answer_order": [],   # [sid, ...] ordered by submission time
    "player_answers": {}  # {sid: {q_index: answer_index}} full history
}

# ---------------------------------------------------------------------------
# GEMINI QUESTION GENERATION
# ---------------------------------------------------------------------------
GEMINI_PROMPT = """\
You are an educational assessment designer for 5th grade science.
Generate exactly 10 diagnostic quiz questions covering a mix of chemistry and biology topics appropriate for 10-11 year old children. Use clear vocabulary, concise sentences, and relatable real-world examples (animals, plants, the human body, everyday materials).

Return ONLY a valid JSON array — no markdown, no code fences, no extra text.
Each element must follow this exact structure (note: in this example the correct answer is at index 2 — vary the position across questions):
{
  "q": "question text",
  "options": ["wrong option A", "wrong option B", "correct option C", "wrong option D"],
  "correct": 2,
  "subject": "biology",
  "topic": "photosynthesis",
  "option_signals": [
    {"topic": "photosynthesis", "delta": -6},
    {"topic": "photosynthesis", "delta": -5},
    {"topic": "photosynthesis", "delta": 9},
    {"topic": "photosynthesis", "delta": -4}
  ]
}

Rules:
1. Cover at least 6 distinct topics across BOTH chemistry and biology.
2. The correct option always has delta between +7 and +10.
3. Each wrong option has a delta between -3 and -8.
4. Topics must be specific (e.g. "covalent bonding", not "chemistry").
5. CRITICAL: Every option_signal — both correct and wrong — must use the SAME topic string as the question's own "topic" field. Do NOT invent new topic names for wrong answers.
6. option_signals must have exactly 4 elements aligned to the 4 options — option_signals[i] corresponds to options[i].
7. "correct" is the 0-based index of the correct answer option.
8. CRITICAL: The correct answer must NOT always be at index 0. Distribute the correct answer across all four positions (0, 1, 2, 3) throughout the 10 questions. No single index should appear more than 4 times.
9. "subject" must be exactly "chemistry" or "biology" based on the question topic.
"""


async def generate_questions():
    """Call Gemini Flash 2.5 to generate 10 diagnostic questions. Falls back to FALLBACK_QUESTIONS on any error."""
    try:
        response = await gemini_client.aio.models.generate_content(
            model="gemini-2.5-flash",
            contents=GEMINI_PROMPT,
        )
        text = response.text.strip()

        # Strip markdown code fences if the model wrapped the JSON
        if "```" in text:
            for part in text.split("```"):
                part = part.strip()
                if part.startswith("json"):
                    part = part[4:].strip()
                if part.startswith("["):
                    text = part
                    break

        questions = json.loads(text)

        if not isinstance(questions, list) or len(questions) < 5:
            raise ValueError(f"Expected list of >= 5 questions, got {len(questions)}")
        for q in questions:
            if not all(k in q for k in ("q", "options", "correct", "subject", "topic", "option_signals")):
                raise ValueError("Question missing required fields")
            if q["subject"] not in ("chemistry", "biology"):
                raise ValueError(f"Invalid subject '{q['subject']}': must be 'chemistry' or 'biology'")
            if len(q["options"]) != 4 or len(q["option_signals"]) != 4:
                raise ValueError("Question must have exactly 4 options and 4 option_signals")

        print(f"[Gemini] Generated {len(questions)} questions successfully.")
        return _shuffle_answers(questions)

    except Exception as exc:
        print(f"[Gemini] Question generation failed ({exc}). Using fallback questions.")
        return _shuffle_answers(list(FALLBACK_QUESTIONS))


def _shuffle_answers(questions):
    """Randomly rotate the correct answer to a different position for each question."""
    shuffled = []
    for q in questions:
        options = list(q["options"])
        signals = list(q["option_signals"])
        correct_idx = q["correct"]

        # Build paired list, shuffle, unpack
        paired = list(zip(options, signals))
        random.shuffle(paired)
        new_options, new_signals = zip(*paired)

        # Find where the correct answer ended up after shuffle
        new_correct = new_options.index(options[correct_idx])

        shuffled.append({
            **q,
            "options": list(new_options),
            "option_signals": list(new_signals),
            "correct": new_correct,
        })

    correct_dist = [q["correct"] for q in shuffled]
    print(f"[Shuffle] Correct answer positions: {correct_dist}")
    return shuffled


# ---------------------------------------------------------------------------
# PROFILE COMPUTATION
# ---------------------------------------------------------------------------

def compute_profiles():
    """
    Compute the average topic delta for each player based on their answers
    this session.  Returns {sid: {(subject, topic): avg_delta}}.
    Always keys results by the question's own subject+topic fields so they
    reliably match existing profile entries across sessions.
    """
    profiles = {}
    for sid, answers in game_state["player_answers"].items():
        topic_raw = {}  # {(subject, topic): [deltas]}
        for q_idx, ans_idx in answers.items():
            if q_idx < len(QUESTIONS):
                # Always use the question's canonical subject+topic as the key,
                # regardless of what the option_signal says.
                subject = QUESTIONS[q_idx]["subject"]
                topic = QUESTIONS[q_idx]["topic"]
                delta = QUESTIONS[q_idx]["option_signals"][ans_idx]["delta"]
                topic_raw.setdefault((subject, topic), []).append(delta)
        profiles[sid] = {
            key: sum(deltas) / len(deltas)
            for key, deltas in topic_raw.items()
        }
    return profiles


async def resolve_topics(existing_topics: list[str], new_topics: list[str]) -> dict[str, str]:
    """
    Use Gemini to map each new "subject|topic" compound string to an existing one
    if they are semantically equivalent within the same subject, or keep it as-is
    if genuinely different.  Returns {new_compound: canonical_compound} for all new_topics.
    """
    # Nothing to resolve if there are no existing topics or no new topics
    if not existing_topics or not new_topics:
        return {t: t for t in new_topics}

    # Topics that already exactly match don't need resolution
    exact = {t for t in new_topics if t in existing_topics}
    to_resolve = [t for t in new_topics if t not in exact]
    if not to_resolve:
        return {t: t for t in new_topics}

    prompt = f"""\
You are a topic deduplication assistant for an educational assessment system.
Topics are represented as "subject|topic" compound strings where subject is "chemistry" or "biology".

Existing profile topics (already in the database):
{json.dumps(existing_topics, indent=2)}

New topics from the latest quiz session:
{json.dumps(to_resolve, indent=2)}

For each new topic, decide:
- If it is semantically equivalent or a near-duplicate of an existing topic WITH THE SAME subject prefix, map it to the EXACT existing topic string.
- If it is genuinely a different topic, or has a different subject, map it to itself (keep as-is).

Return ONLY a valid JSON object mapping each new topic string to its canonical form. No markdown, no explanation.
Example: {{"biology|food chains": "biology|food chains", "biology|trophic levels": "biology|food chains", "chemistry|mixtures and solutions": "chemistry|mixtures"}}
"""
    try:
        response = await gemini_client.aio.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )
        text = response.text.strip()
        if "```" in text:
            for part in text.split("```"):
                part = part.strip()
                if part.startswith("json"):
                    part = part[4:].strip()
                if part.startswith("{"):
                    text = part
                    break
        mapping = json.loads(text)
        # Build full mapping including exact matches
        result = {t: t for t in exact}
        for t in to_resolve:
            result[t] = mapping.get(t, t).strip()
        print(f"[Gemini] Topic resolution: {result}")
        return result
    except Exception as exc:
        print(f"[Gemini] Topic resolution failed ({exc}), using raw topics.")
        return {t: t for t in new_topics}


async def save_profiles(profiles):
    """
    Blend each player's new session deltas into their existing MongoDB profile
    using EMA (alpha=0.25) then upsert by username.
    """
    for sid, subject_topic_deltas in profiles.items():
        if sid not in game_state["players"]:
            continue

        username = game_state["players"][sid]["name"]

        # Load existing profile from MongoDB, keyed by "subject|topic" compound strings
        existing_doc = await db_collection.find_one({"username": username})
        existing_profile = {}
        if existing_doc:
            for entry in existing_doc.get("profile", []):
                subject = entry.get("subject", "").strip().lower()
                topic = entry["topic"].strip().lower()
                key = f"{subject}|{topic}" if subject else topic
                existing_profile[key] = {
                    "subject": subject,
                    "score": entry["score"],
                    "test_count": entry["test_count"]
                }

        # Build compound "subject|topic" keys, normalizing to lowercase
        normalized_deltas = {
            f"{subj.strip().lower()}|{t.strip().lower()}": delta
            for (subj, t), delta in subject_topic_deltas.items()
        }

        # Use Gemini to resolve any near-duplicate topics against the existing profile
        topic_mapping = await resolve_topics(
            existing_topics=list(existing_profile.keys()),
            new_topics=list(normalized_deltas.keys())
        )

        # Merge: EMA for known topics, direct assignment for new ones
        merged = dict(existing_profile)
        for raw_key, raw_delta in normalized_deltas.items():
            key = topic_mapping.get(raw_key, raw_key)
            if key in merged:
                blended = EMA_ALPHA * raw_delta + (1 - EMA_ALPHA) * merged[key]["score"]
                merged[key] = {
                    "subject": merged[key]["subject"],
                    "score": round(max(-10.0, min(10.0, blended)), 2),
                    "test_count": merged[key]["test_count"] + 1
                }
            else:
                parts = key.split("|", 1)
                merged[key] = {
                    "subject": parts[0] if len(parts) == 2 else "",
                    "score": round(max(-10.0, min(10.0, raw_delta)), 2),
                    "test_count": 1
                }

        profile_list = [
            {
                "subject": v["subject"],
                "topic": k.split("|", 1)[1] if "|" in k else k,
                "score": v["score"],
                "test_count": v["test_count"]
            }
            for k, v in merged.items()
        ]

        await db_collection.update_one(
            {"username": username},
            {"$set": {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "profile": profile_list
            }},
            upsert=True
        )
        print(f"[MongoDB] Profile saved for '{username}' ({len(profile_list)} topics).")


# ---------------------------------------------------------------------------
# FASTAPI + SOCKET.IO SETUP
# API routes must be registered BEFORE the static-files mount so they take
# precedence over the catch-all "/" mount.
# ---------------------------------------------------------------------------
fastapi_app = FastAPI()
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')


@fastapi_app.on_event("startup")
async def startup_event():
    global QUESTIONS
    QUESTIONS = await generate_questions()
    print(f"[Startup] {len(QUESTIONS)} questions loaded and ready.")


@fastapi_app.get("/api/profile/{username}")
async def get_profile(username: str):
    doc = await db_collection.find_one({"username": username}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail=f"No profile found for '{username}'")
    return JSONResponse(content=doc)


fastapi_app.mount("/", StaticFiles(directory="static", html=True), name="static")
app = socketio.ASGIApp(sio, other_asgi_app=fastapi_app)


# ---------------------------------------------------------------------------
# GAME LOGIC
# ---------------------------------------------------------------------------

async def start_question_timer(question_index):
    for i in range(15, 0, -1):
        if game_state["current_question_index"] != question_index:
            return
        await sio.emit('timer_update', i)
        await asyncio.sleep(1)
        active_players = len(game_state["players"])
        if active_players > 0 and len(game_state["answers"]) == active_players:
            break

    if game_state["current_question_index"] == question_index:
        await calculate_scores()


async def calculate_scores():
    if game_state["status"] == "result":
        return

    game_state["status"] = "result"
    idx = game_state["current_question_index"]
    correct_opt = QUESTIONS[idx]["correct"]

    # Speed scoring: 1st correct = 100 pts, 2nd = 90 pts, … minimum 10 pts
    base_score = 100
    for rank, sid in enumerate(game_state["answer_order"]):
        if sid in game_state["players"]:
            if game_state["answers"].get(sid) == correct_opt:
                points = max(10, base_score - (rank * 10))
                game_state["players"][sid]["score"] += points

    await sio.emit('show_results', {
        "correct_option": correct_opt,
        "players": game_state["players"]
    })
    await sio.emit('player_list_update', game_state["players"])

    # After the last question compute and persist all player profiles
    if idx == len(QUESTIONS) - 1:
        profiles = compute_profiles()
        await save_profiles(profiles)
        await sio.emit('profiles_saved', {})
        print("[Game] All player profiles saved to MongoDB.")


# ---------------------------------------------------------------------------
# SOCKET.IO EVENTS
# ---------------------------------------------------------------------------

@sio.event
async def connect(sid, environ):
    print(f"[Socket] Connected: {sid}")


@sio.event
async def join_game(sid, data):
    game_state["players"][sid] = {
        "name": data.get("name", "Guest"),
        "score": 0
    }
    print(f"[Game] Player joined: {data.get('name', 'Guest')}")
    await sio.emit('player_list_update', game_state["players"])


@sio.event
async def submit_answer(sid, answer_index):
    if game_state["status"] == "question" and sid not in game_state["answers"]:
        game_state["answers"][sid] = answer_index
        game_state["answer_order"].append(sid)
        q_idx = game_state["current_question_index"]
        game_state["player_answers"].setdefault(sid, {})[q_idx] = answer_index
        print(f"[Game] Player {sid} answered Q{q_idx} with option {answer_index}.")


@sio.event
async def host_next_question(sid):
    game_state["current_question_index"] += 1
    idx = game_state["current_question_index"]

    if idx < len(QUESTIONS):
        game_state["status"] = "question"
        game_state["answers"] = {}
        game_state["answer_order"] = []

        await sio.emit('show_question', {
            "q": QUESTIONS[idx]["q"],
            "options": QUESTIONS[idx]["options"]
        })
        asyncio.create_task(start_question_timer(idx))
    else:
        await sio.emit('game_over', game_state["players"])


@sio.event
async def host_reset_game(sid):
    # Notify host that generation is starting before doing anything slow
    await sio.emit('questions_loading', {})

    game_state["current_question_index"] = -1
    game_state["status"] = "waiting"
    game_state["answers"] = {}
    game_state["answer_order"] = []
    game_state["player_answers"] = {}

    for pid in game_state["players"]:
        game_state["players"][pid]["score"] = 0

    global QUESTIONS
    QUESTIONS = await generate_questions()

    await sio.emit('questions_ready', {"count": len(QUESTIONS)})
    await sio.emit('player_list_update', game_state["players"])
    print("[Game] Game reset. Ready for new round.")


@sio.event
async def disconnect(sid):
    if sid in game_state["players"]:
        del game_state["players"][sid]
        await sio.emit('player_list_update', game_state["players"])


@sio.event
async def webrtc_signal(sid, data):
    target = data.get('to')
    if target and target in game_state["players"]:
        await sio.emit('webrtc_signal', data, to=target)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080, ssl_keyfile="key.pem", ssl_certfile="cert.pem")