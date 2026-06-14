"""
FastAPI + MongoDB (Beanie ODM) backend for SmartEdu

Includes:
- Full domain models:
  users: Institution, ClassGroup, User, Cart, CartItem
  lectures: Course, Lecture, Quiz, Question, Option, etc.
  marketplace: ProductCategory, Product, Redemption, PointTransaction
- JWT authentication:
  POST /api/auth/register/
  POST /api/auth/login/
  POST /api/auth/refresh/
  GET  /api/auth/me/
  PATCH /api/auth/profile/
  GET  /api/auth/wallet/

Run:
    uvicorn main:app --reload --port 8000
"""

import os
import json
import random
import bcrypt
from datetime import datetime, date, timedelta
from typing import Optional, List
from pathlib import Path
from dotenv import load_dotenv

from beanie import Document, Link, init_beanie, PydanticObjectId as ObjectId
from fastapi import (
    Depends,
    FastAPI,
    HTTPException,
    status,
    APIRouter,
    Query,
    Request,
    UploadFile,
    File,
    Form,
)
from fastapi.staticfiles import StaticFiles
import shutil
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, HttpUrl, Field


# Try to find .env in fastapiBackend or parent/backend directory
BASE_DIR = Path(__file__).resolve().parent
if (BASE_DIR / ".env").exists():
    load_dotenv(BASE_DIR / ".env")
elif (BASE_DIR.parent / "backend" / ".env").exists():
    load_dotenv(BASE_DIR.parent / "backend" / ".env")
else:
    load_dotenv()

# Import Blockchain configuration and functions
from blockchain import (
    w3,
    EDU_TOKEN_ADDR,
    MARKET_ADDR,
    ADMIN_PVT_KEY,
    ADMIN_ADDR,
    ensure_checksum,
    get_token_contract,
    get_market_contract,
    award_tokens,
    execute_purchase,
    get_balance,
    AwardRequest,
    PurchaseRequest,
)

# -------------------------------------------------
# DB CONFIG
# -------------------------------------------------

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "smartedu_db")

# JWT CONFIG
SECRET_KEY = os.getenv("SECRET_KEY", "change-this-secret-in-prod")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60
REFRESH_TOKEN_EXPIRE_DAYS = 7

# Hardhat test wallets — acc0 and acc1 already used, start from index 2
HARDHAT_WALLETS = [
    {"address": "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266", "private_key": "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"},
    {"address": "0x70997970c51812dc3a010c7d01b50e0d17dc79c8", "private_key": "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d"},
    {"address": "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc", "private_key": "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a"},
    {"address": "0x90f79bf6eb2c4f870365e785982e1f101e93b906", "private_key": "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6"},
    {"address": "0x15d34aaf54267db7d7c367839aaf71a00a2c6a65", "private_key": "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a"},
    {"address": "0x9965507d1a55bcc2695c58ba16fb37d819b0a4dc", "private_key": "0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba"},
    {"address": "0x976ea74026e726554db657fa54763abd0c3a0aa9", "private_key": "0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e"},
    {"address": "0x14dc79964da2c08b23698b3d3cc7ca32193d9955", "private_key": "0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356"},
    {"address": "0x23618e81e3f5cdf7f54c3d65f7fbc0abf5b21e8f", "private_key": "0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97"},
    {"address": "0xa0ee7a142d267c1f36714e4a8f75612f20a79720", "private_key": "0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6"},
    {"address": "0xbcd4042de499d14e55001ccbb24a551f3b954096", "private_key": "0xf214f2b2cd398c806f84e317254e0f0b801d0643303237d97a22a48e01628897"},
    {"address": "0x71be63f3384f5fb98995898a86b02fb2426c5788", "private_key": "0x701b615bbdfb9de65240bc28bd21bbc0d996645a3dd57e7b12bc2bdf6f192c82"},
    {"address": "0xfabb0ac9d68b0b445fb7357272ff202c5651694a", "private_key": "0xa267530f49f8280200edf313ee7af6b827f2a8bce2897751d06a843f644967b1"},
    {"address": "0x1cbd3b2770909d4e10f157cabc84c7264073c9ec", "private_key": "0x47c99abed3324a2707c28affff1267e45918ec8c3f20b8aa892e8b065d2942dd"},
    {"address": "0xdf3e18d64bc6a983f673ab319ccae4f1a57c7097", "private_key": "0xc526ee95bf44d8fc405a158bb884d9d1238d99f0612e9f33d006bb0789009aaa"},
    {"address": "0xcd3b766ccdd6ae721141f452c550ca635964ce71", "private_key": "0x8166f546bab6da521a8369cab06c5d2b9e46670292d85c875ee9ec20e84ffb61"},
    {"address": "0x2546bcd3c84621e976d8185a91a922ae77ecec30", "private_key": "0xea6c44ac03bff858b476bba40716402b03e41b8e97e276d1baec7c37d42484a0"},
    {"address": "0xbda5747bfd65f08deb54cb465eb87d40e51b197e", "private_key": "0x689af8efa8c651a91ad287602527f3af2fe9f6501a7ac4b061667b5a93e037fd"},
    {"address": "0xdd2fd4581271e230360230f9337d5c0430bf44c0", "private_key": "0xde9be858da4a475276426320d5e9262ecfc3ba460bfac56360bfa6c4c28b4ee0"},
    {"address": "0x8626f6940e2eb28930efb4cef49b2d1f2c9c1199", "private_key": "0xdf57089febbacf7ba0bc227dafbffa9fc08a93fdc68e1e42411a14efcf23656e"},
]
HARDHAT_WALLETS_START_INDEX = 2  # acc0 and acc1 already assigned manually

bearer_scheme = HTTPBearer(auto_error=True)


# -------------------------------------------------
# USERS DOMAIN
# -------------------------------------------------

class Institution(Document):
    name: str
    code: str = Field(..., description="Short unique code used for joining, e.g. GRIET2025")
    address: Optional[str] = ""

    logo: Optional[str] = None          # store URL/path
    banner_image: Optional[str] = None  # store URL/path
    website: Optional[HttpUrl] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None

    institution_type: Optional[str] = Field(
        default=None,
        description="school | college | university | training",
    )

    description: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "institutions"


class UserRole:
    STUDENT = "student"
    TEACHER = "teacher"
    ADMIN = "admin"


class ClassGroup(Document):
    institution: Link[Institution]
    name: str
    grade: Optional[str] = ""

    section: Optional[str] = None
    academic_year: Optional[str] = None
    room_number: Optional[str] = None
    avatar_theme: Optional[str] = None
    class_teacher_name: Optional[str] = None
    description: Optional[str] = None

    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "class_groups"


class User(Document):
    """
    User with password hash for auth + profile fields.
    """
    username: str
    email: Optional[EmailStr] = None

    role: str = Field(default=UserRole.STUDENT)
    institution: Optional[Link[Institution]] = None
    class_group: Optional[Link[ClassGroup]] = None

    wallet_address: Optional[str] = Field(
        default=None,
        description="Blockchain wallet address (0x...)",
    )
    private_key: Optional[str] = Field(
        default=None,
        description="Private key for the wallet. Keep this secret!",
    )

    # Profile fields
    mobile_number: Optional[str] = None
    profile_image: Optional[str] = None  # store URL/path
    gender: Optional[str] = None
    date_of_birth: Optional[date] = None
    bio: Optional[str] = None

    # Gamification
    xp: int = Field(default=0, description="Experience Points")
    streak: int = Field(default=0, description="Daily login streak")

    # Auth
    hashed_password: str
    is_active: bool = True

    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "users"


# -------------------------------------------------
# LECTURES DOMAIN
# -------------------------------------------------

class Course(Document):
    title: str
    description: Optional[str] = ""

    teacher: Optional[Link[User]] = None

    institution: Optional[Link[Institution]] = None
    class_group: Optional[Link[ClassGroup]] = None

    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "courses"


class LectureVisibility:
    PUBLIC = "public"
    INSTITUTION = "institution"
    CLASS = "class"


class DeliveryType:
    VIDEO = "video"
    VR = "vr"
    AR = "ar"
    HYBRID = "hybrid"


class Lecture(Document):
    course: Link[Course]

    title: str
    description: Optional[str] = ""

    teacher: Optional[Link[User]] = None

    visibility: str = Field(default=LectureVisibility.PUBLIC)
    institution: Optional[Link[Institution]] = None
    class_group: Optional[Link[ClassGroup]] = None

    delivery_type: str = Field(default=DeliveryType.VIDEO)

    video_url: Optional[HttpUrl] = None
    resource_link: Optional[HttpUrl] = None

    vr_scene_id: Optional[str] = None
    ar_experience_id: Optional[str] = None

    scheduled_at: Optional[datetime] = None
    duration_minutes: Optional[int] = None

    is_live: bool = False
    is_active: bool = True

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "lectures"


class Quiz(Document):
    lecture: Link[Lecture]
    title: str
    description: Optional[str] = ""

    time_limit_seconds: Optional[int] = None
    is_active: bool = True
    shuffle_questions: bool = False

    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "quizzes"


class QuestionType:
    MCQ_SINGLE = "mcq_single"
    MCQ_MULTIPLE = "mcq_multiple"
    TRUE_FALSE = "true_false"
    SHORT_TEXT = "short_text"


class Question(Document):
    quiz: Link[Quiz]
    text: str
    question_type: str = Field(default=QuestionType.MCQ_SINGLE)
    marks: float = 1.0
    order: int = 0

    class Settings:
        name = "questions"


class Option(Document):
    question: Link[Question]
    text: str
    is_correct: bool = False

    class Settings:
        name = "options"


class QuizSubmission(Document):
    quiz: Link[Quiz]
    student: Link[User]

    started_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None

    score: float = 0.0
    max_score: float = 0.0

    points_awarded: int = 0
    points_tx_hash: Optional[str] = None

    class Settings:
        name = "quiz_submissions"


class SubmissionAnswer(Document):
    submission: Link[QuizSubmission]
    question: Link[Question]

    selected_option_ids: List[ObjectId] = Field(
        default_factory=list,
        description="List of Option IDs selected (for MCQ).",
    )

    text_answer: Optional[str] = ""

    is_correct: bool = False
    marks_obtained: float = 0.0

    class Settings:
        name = "submission_answers"


class LectureAttendance(Document):
    lecture: Link[Lecture]
    student: Link[User]

    joined_at: datetime = Field(default_factory=datetime.utcnow)
    left_at: Optional[datetime] = None

    total_duration_seconds: int = 0

    points_awarded: int = 0
    points_tx_hash: Optional[str] = None

    class Settings:
        name = "lecture_attendance"


class ResourceType:
    NOTE = "note"
    PDF = "pdf"
    EBOOK = "ebook"
    SLIDES = "slides"
    ASSIGNMENT = "assignment"
    LINK = "link"
    OTHER = "other"


class LearningResource(Document):
    course: Optional[Link[Course]] = None
    lecture: Optional[Link[Lecture]] = None

    title: str
    description: Optional[str] = ""

    resource_type: str = Field(default=ResourceType.PDF)

    file_path: Optional[str] = Field(
        default=None,
        description="Path/URL to uploaded file (PDF, notes, etc.)",
    )
    external_url: Optional[HttpUrl] = None

    is_public: bool = True
    order: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "learning_resources"


# -------------------------------------------------
# MARKETPLACE DOMAIN
# -------------------------------------------------

class ProductCategory(Document):
    name: str
    slug: str
    description: Optional[str] = ""
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "product_categories"


class ProductType:
    EBOOK = "ebook"
    PDF = "pdf"
    COURSE = "course"
    MOCK_TEST = "mock_test"
    VOUCHER = "voucher"
    PHYSICAL = "physical"
    OTHER = "other"


class Product(Document):
    category: Optional[Link[ProductCategory]] = None

    name: str
    description: Optional[str] = ""

    product_type: str = Field(default=ProductType.EBOOK)

    points_price: int = Field(..., ge=0)
    stock: Optional[int] = Field(
        default=None,
        description="None = unlimited (digital)",
    )

    is_digital: bool = True

    digital_file_path: Optional[str] = None
    external_url: Optional[HttpUrl] = None

    thumbnail: Optional[str] = None

    metadata: Optional[dict] = None

    is_active: bool = True
    featured: bool = False

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "products"

    @property
    def is_unlimited(self) -> bool:
        return self.stock is None


class RedemptionStatus:
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class Redemption(Document):
    user: Link[User]
    product: Link[Product]

    quantity: int = 1
    points_spent: int

    status: str = Field(default=RedemptionStatus.PENDING)
    tx_hash: Optional[str] = None

    delivery_email: Optional[EmailStr] = None
    delivery_notes: Optional[str] = None

    shipping_address: Optional[str] = None
    contact_phone: Optional[str] = None

    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "redemptions"


class TxType:
    EARN = "earn"
    SPEND = "spend"
    ADJUST = "adjust"


class TxSource:
    QUIZ = "quiz"
    ATTENDANCE = "attendance"
    REDEMPTION = "redemption"
    MANUAL = "manual"
    OTHER = "other"


class PointTransaction(Document):
    user: Link[User]

    tx_type: str  # "earn" | "spend" | "adjust"
    source: str = Field(default=TxSource.OTHER)

    amount: int = Field(..., ge=0)
    description: Optional[str] = None

    on_chain_tx_hash: Optional[str] = None

    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "point_transactions"


class CartItem(BaseModel):
    product: Link[Product]
    quantity: int = 1


class Cart(Document):
    user: Link[User]
    items: List[CartItem] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "carts"


# -------------------------------------------------
# AUTH HELPERS
# -------------------------------------------------

def hash_password(password: str) -> str:
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')


def verify_password(plain: str, hashed: str) -> bool:
    plain_bytes = plain.encode('utf-8')
    hashed_bytes = hashed.encode('utf-8')
    try:
        return bcrypt.checkpw(plain_bytes, hashed_bytes)
    except Exception:
        return False


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


async def get_user_from_token(token: str, expected_type: str) -> User:
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        token_type = payload.get("type")
        if token_type != expected_type:
            raise credentials_exc
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exc
    except JWTError:
        raise credentials_exc

    user = await User.get(user_id)
    if user is None or not user.is_active:
        raise credentials_exc
    return user


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> User:
    token = credentials.credentials
    return await get_user_from_token(token, expected_type="access")


# -------------------------------------------------
# Pydantic Schemas for Auth & CRUD
# -------------------------------------------------

class UserCreate(BaseModel):
    username: str
    email: Optional[EmailStr] = None
    password: str
    role: Optional[str] = UserRole.STUDENT
    institution: Optional[str] = None
    class_group: Optional[str] = None
    mobile_number: Optional[str] = None


class UserOut(BaseModel):
    id: str
    username: str
    email: Optional[EmailStr] = None
    role: str
    wallet_address: Optional[str] = None
    private_key: Optional[str] = None
    mobile_number: Optional[str] = None
    profile_image: Optional[str] = None
    gender: Optional[str] = None
    date_of_birth: Optional[date] = None
    xp: int = 0
    streak: int = 0
    bio: Optional[str] = None
    institution_name: Optional[str] = None
    class_group_name: Optional[str] = None

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenPair(BaseModel):
    access: str
    refresh: str


class TokenRefreshRequest(BaseModel):
    refresh: str


class InstitutionCreate(BaseModel):
    name: str
    code: str
    address: Optional[str] = None


class CourseCreate(BaseModel):
    title: str
    description: Optional[str] = None
    teacher_id: Optional[str] = None


class UserProfileUpdate(BaseModel):
    bio: Optional[str] = None
    mobile_number: Optional[str] = None
    gender: Optional[str] = None
    date_of_birth: Optional[date] = None
    wallet_address: Optional[str] = None
    private_key: Optional[str] = None


class RewardTimeRequest(BaseModel):
    duration: int


class SubmitScoreRequest(BaseModel):
    subject: str
    score: int


class BuyItemRequest(BaseModel):
    item_id: str


class AddToCartRequest(BaseModel):
    product_id: str
    quantity: int = 1


class RemoveFromCartRequest(BaseModel):
    cart_item_id: str


class ChatMessage(BaseModel):
    sender: str
    text: str


class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []


# Helper to convert User to UserOut resolving relations
async def make_user_out(user: User, request: Optional[Request] = None) -> UserOut:
    inst_name = None
    cg_name = None
    if user.institution:
        inst = await user.institution.fetch()
        if inst:
            inst_name = inst.name
    if user.class_group:
        cg = await user.class_group.fetch()
        if cg:
            cg_name = cg.name

    profile_image_url = user.profile_image
    print(f"[make_user_out] raw profile_image from DB: {repr(profile_image_url)}", flush=True)
    if profile_image_url and not profile_image_url.startswith("http"):
        if request:
            profile_image_url = f"{request.base_url}{profile_image_url}"
        else:
            profile_image_url = f"http://127.0.0.1:8000/{profile_image_url}"
        print(f"[make_user_out] converted to local URL: {profile_image_url}", flush=True)

    return UserOut(
        id=str(user.id),
        username=user.username,
        email=user.email,
        role=user.role,
        wallet_address=user.wallet_address,
        private_key=user.private_key,
        mobile_number=user.mobile_number,
        profile_image=profile_image_url,
        gender=user.gender,
        date_of_birth=user.date_of_birth,
        xp=user.xp,
        streak=user.streak,
        bio=user.bio,
        institution_name=inst_name,
        class_group_name=cg_name,
    )


# -------------------------------------------------
# APIRouter Prefix Setup (replacing Django's structure)
# -------------------------------------------------

api_router = APIRouter(prefix="/api")

# -------------------------------------------------
# AUTH ENDPOINTS
# -------------------------------------------------

@api_router.post("/auth/register/", response_model=UserOut, status_code=201)
async def register_user(data: UserCreate, request: Request):
    print(f"[AUTH] Registration attempt: username='{data.username}', email='{data.email}'", flush=True)
    existing = await User.find_one(User.username == data.username)
    if existing:
        print(f"[AUTH] Registration failed: Username '{data.username}' already exists", flush=True)
        raise HTTPException(status_code=400, detail="Username already exists")

    if data.email:
        existing_email = await User.find_one(User.email == data.email)
        if existing_email:
            print(f"[AUTH] Registration failed: Email '{data.email}' already exists", flush=True)
            raise HTTPException(status_code=400, detail="Email already exists")

    inst_link = None
    if data.institution:
        inst = await Institution.get(data.institution)
        if inst:
            inst_link = inst
            print(f"[AUTH] Found institution association: {inst.name}", flush=True)

    cg_link = None
    if data.class_group:
        cg = await ClassGroup.get(data.class_group)
        if cg:
            cg_link = cg
            print(f"[AUTH] Found class group association: {cg.name}", flush=True)

    # Auto-assign next available Hardhat wallet sequentially
    assigned_wallet_address = None
    assigned_private_key = None
    users_with_wallet = await User.find(User.wallet_address != None).count()
    wallet_index = HARDHAT_WALLETS_START_INDEX + users_with_wallet
    if wallet_index < len(HARDHAT_WALLETS):
        assigned_wallet_address = HARDHAT_WALLETS[wallet_index]["address"]
        assigned_private_key = HARDHAT_WALLETS[wallet_index]["private_key"]
        print(f"[AUTH] Assigning Hardhat wallet index {wallet_index}: {assigned_wallet_address}", flush=True)
    else:
        print(f"[AUTH] Warning: No Hardhat wallets left to assign (index {wallet_index})", flush=True)

    user = User(
        username=data.username,
        email=data.email,
        role=data.role or UserRole.STUDENT,
        hashed_password=hash_password(data.password),
        institution=inst_link,
        class_group=cg_link,
        mobile_number=data.mobile_number,
        wallet_address=assigned_wallet_address,
        private_key=assigned_private_key,
    )
    await user.insert()
    print(f"[AUTH] User registered successfully: {user.username} (ID: {user.id})", flush=True)
    return await make_user_out(user, request)


@api_router.post("/auth/login/", response_model=TokenPair)
async def login_user(payload: LoginRequest):
    print(f"[AUTH] Login attempt for username/email: '{payload.username}'", flush=True)
    user = await User.find_one(
        {"$or": [{"username": payload.username}, {"email": payload.username}]}
    )
    if not user:
        print(f"[AUTH] Login failed: No user found for username/email '{payload.username}'", flush=True)
        raise HTTPException(status_code=401, detail="Invalid username or password")

    if not verify_password(payload.password, user.hashed_password):
        print(f"[AUTH] Login failed: Password mismatch for user '{user.username}'", flush=True)
        raise HTTPException(status_code=401, detail="Invalid username or password")

    print(f"[AUTH] Login successful for user: '{user.username}' (ID: {user.id})", flush=True)
    claims = {"sub": str(user.id), "username": user.username}
    access = create_access_token(claims)
    refresh = create_refresh_token(claims)
    print(f"[AUTH] Issued TokenPair for user '{user.username}'", flush=True)
    return TokenPair(access=access, refresh=refresh)


@api_router.post("/auth/refresh/", response_model=dict)
async def refresh_access_token(data: TokenRefreshRequest):
    user = await get_user_from_token(data.refresh, expected_type="refresh")
    claims = {"sub": str(user.id), "username": user.username}
    access = create_access_token(claims)
    return {"access": access}


@api_router.get("/auth/me/", response_model=UserOut)
async def get_me(request: Request, current_user: User = Depends(get_current_user)):
    return await make_user_out(current_user, request)


@api_router.patch("/auth/profile/", response_model=UserOut)
async def update_profile(
    request: Request,
    current_user: User = Depends(get_current_user)
):
    try:
        content_type = request.headers.get("content-type", "")
        print(f"\n[PROFILE UPDATE] ====== START ======", flush=True)
        print(f"[PROFILE UPDATE] User: {current_user.username} ({current_user.email})", flush=True)
        print(f"[PROFILE UPDATE] Content-Type: {content_type}", flush=True)

        bio = None
        mobile_number = None
        gender = None
        date_of_birth = None
        wallet_address = None
        private_key = None
        profile_image_file = None
        profile_image_url = None

        if "multipart/form-data" in content_type:
            form = await request.form()
            print(f"[PROFILE UPDATE] Path: multipart/form-data", flush=True)
            print(f"[PROFILE UPDATE] Form data keys: {list(form.keys())}", flush=True)
            bio = form.get("bio")
            mobile_number = form.get("mobile_number")
            gender = form.get("gender")

            dob_str = form.get("date_of_birth")
            if dob_str:
                try:
                    date_of_birth = date.fromisoformat(dob_str)
                except ValueError:
                    pass

            wallet_address = form.get("wallet_address")
            private_key = form.get("private_key")

            file_upload = form.get("profile_image")
            if file_upload:
                print(f"[PROFILE UPDATE] Found profile_image field. Type: {type(file_upload)}", flush=True)
                if hasattr(file_upload, "file") and hasattr(file_upload, "filename"):
                    profile_image_file = file_upload
                    print(f"[PROFILE UPDATE] File upload detected: {file_upload.filename}", flush=True)
                else:
                    print(f"[PROFILE UPDATE] profile_image is not a file, value: {file_upload}", flush=True)
            else:
                print(f"[PROFILE UPDATE] No profile_image field in form", flush=True)
        else:
            print(f"[PROFILE UPDATE] Path: JSON body", flush=True)
            try:
                data = await request.json()
            except Exception as json_err:
                print(f"[PROFILE UPDATE] ERROR: Failed to parse JSON body: {json_err}", flush=True)
                raise HTTPException(status_code=400, detail="Invalid request body")

            print(f"[PROFILE UPDATE] JSON keys received: {list(data.keys())}", flush=True)
            print(f"[PROFILE UPDATE] profile_image in JSON: {data.get('profile_image')}", flush=True)

            bio = data.get("bio")
            mobile_number = data.get("mobile_number")
            gender = data.get("gender")

            dob_str = data.get("date_of_birth")
            if dob_str:
                try:
                    date_of_birth = date.fromisoformat(dob_str)
                except ValueError:
                    pass

            wallet_address = data.get("wallet_address")
            private_key = data.get("private_key")
            profile_image_url = data.get("profile_image")
            print(f"[PROFILE UPDATE] profile_image_url extracted: {profile_image_url}", flush=True)

        if bio is not None:
            current_user.bio = bio
        if mobile_number is not None:
            current_user.mobile_number = mobile_number
        if gender is not None:
            current_user.gender = gender
        if date_of_birth is not None:
            current_user.date_of_birth = date_of_birth
        if wallet_address is not None:
            current_user.wallet_address = wallet_address.strip()
        if private_key is not None:
            current_user.private_key = private_key.strip()

        if profile_image_url:
            current_user.profile_image = profile_image_url
            print(f"[PROFILE UPDATE] Cloudinary URL stored: {profile_image_url}", flush=True)
        else:
            print(f"[PROFILE UPDATE] No profile_image_url to store (value was: {repr(profile_image_url)})", flush=True)

        if profile_image_file:
            print(f"[PROFILE UPDATE] Saving local file: {profile_image_file.filename}", flush=True)
            os.makedirs("media/profile_images", exist_ok=True)
            file_ext = Path(profile_image_file.filename).suffix
            filename = f"user_{current_user.username}_{int(datetime.utcnow().timestamp())}{file_ext}"
            filepath = os.path.join("media/profile_images", filename)

            with open(filepath, "wb") as buffer:
                shutil.copyfileobj(profile_image_file.file, buffer)

            current_user.profile_image = f"media/profile_images/{filename}"
            print(f"[PROFILE UPDATE] Local file saved to: {current_user.profile_image}", flush=True)

        print(f"[PROFILE UPDATE] Saving user to DB. profile_image = {current_user.profile_image}", flush=True)
        await current_user.save()
        print(f"[PROFILE UPDATE] DB save successful", flush=True)
        result = await make_user_out(current_user, request)
        print(f"[PROFILE UPDATE] Response profile_image: {result.profile_image}", flush=True)
        print(f"[PROFILE UPDATE] ====== END ======\n", flush=True)
        return result
    except Exception as e:
        import traceback
        raise HTTPException(status_code=500, detail=traceback.format_exc())



@api_router.get("/auth/wallet/")
async def get_wallet_info_endpoint(current_user: User = Depends(get_current_user)):
    if not current_user.wallet_address:
        return {"address": None, "balance": 0, "symbol": "EDU"}

    try:
        balance_data = get_balance(current_user.wallet_address)
        return {
            "address": current_user.wallet_address,
            "balance": balance_data.get("balance_edu", 0),
            "symbol": "EDU"
        }
    except Exception as e:
        return {
            "address": current_user.wallet_address,
            "balance": 0,
            "symbol": "EDU",
            "error": str(e)
        }


@api_router.get("/users/institutions/{code}/")
@api_router.get("/auth/institutions/{code}/")
async def get_institution_by_code(code: str):
    inst = await Institution.find_one(Institution.code == code)
    if not inst:
        raise HTTPException(status_code=404, detail="Institution not found")
    return inst


# -------------------------------------------------
# INSTITUTIONS & COURSES ENDPOINTS
# -------------------------------------------------

@api_router.post("/institutions", response_model=Institution)
async def create_institution(data: InstitutionCreate):
    existing = await Institution.find_one(Institution.code == data.code)
    if existing:
        raise HTTPException(status_code=400, detail="Institution code already exists")

    inst = Institution(
        name=data.name,
        code=data.code,
        address=data.address or "",
    )
    await inst.insert()
    return inst


@api_router.get("/institutions", response_model=List[Institution])
async def list_institutions():
    return await Institution.find_all().to_list()


@api_router.post("/courses", response_model=Course)
async def create_course(data: CourseCreate, current_user: User = Depends(get_current_user)):
    teacher = None
    if data.teacher_id:
        teacher = await User.get(data.teacher_id)
        if not teacher:
            raise HTTPException(status_code=404, detail="Teacher not found")
    else:
        teacher = current_user

    course = Course(
        title=data.title,
        description=data.description or "",
        teacher=teacher,
    )
    await course.insert()
    return course


@api_router.get("/courses", response_model=List[Course])
async def list_courses():
    return await Course.find_all().to_list()


# -------------------------------------------------
# LECTURES / GAMIFICATION / AI ENDPOINTS
# -------------------------------------------------

@api_router.post("/lectures/reward-time/")
async def reward_time_endpoint(
    data: RewardTimeRequest,
    current_user: User = Depends(get_current_user)
):
    duration_seconds = data.duration
    if duration_seconds <= 15:
        return {"message": "Session too short.", "xp_awarded": 0, "tokens_awarded": 0}

    reward_duration = min(duration_seconds, 3600)
    tokens_to_award = (reward_duration // 60) * 5
    xp_to_award = (reward_duration // 60) * 50

    current_user.xp += xp_to_award
    await current_user.save()

    tx_hash = None
    blockchain_error = None

    if not current_user.wallet_address:
        return {
            "message": f"Earned {xp_to_award} XP! Add a wallet to earn EDU tokens.",
            "xp_awarded": xp_to_award,
            "tokens_awarded": 0
        }

    if tokens_to_award > 0:
        try:
            req = AwardRequest(wallet_address=current_user.wallet_address, amount=tokens_to_award)
            res = award_tokens(req)
            tx_hash = res.get("tx_hash")
        except Exception as e:
            blockchain_error = str(e)
            return {
                "message": f"Earned {xp_to_award} XP! Token transfer pending: {blockchain_error}",
                "xp_awarded": xp_to_award,
                "tokens_awarded": 0,
                "error": blockchain_error
            }

    return {
        "message": f"You earned {xp_to_award} XP and {tokens_to_award} EDU!",
        "xp_awarded": xp_to_award,
        "tokens_awarded": tokens_to_award,
        "tx_hash": tx_hash,
    }


@api_router.post("/lectures/quiz/{quiz_id}/complete/")
async def complete_quiz_endpoint(
    quiz_id: str,
    current_user: User = Depends(get_current_user)
):
    reward_points = 50
    quiz = await Quiz.get(quiz_id)
    # If quiz doesn't exist, create a dummy or just use ID for demo compatibility
    submission = QuizSubmission(
        quiz=Link(Quiz.get_settings().name, quiz_id),
        student=current_user,
        score=100.0,
        max_score=100.0,
        points_awarded=reward_points
    )
    await submission.insert()

    tx_hash = None
    error = None

    if current_user.wallet_address:
        try:
            req = AwardRequest(wallet_address=current_user.wallet_address, amount=reward_points)
            res = award_tokens(req)
            tx_hash = res.get("tx_hash")
            submission.points_tx_hash = tx_hash
            await submission.save()

            return {
                "message": f"Successfully awarded {reward_points} EDU tokens!",
                "tx_hash": tx_hash,
                "db_id": str(submission.id)
            }
        except Exception as e:
            error = str(e)
            raise HTTPException(status_code=500, detail=f"Blockchain failed: {error}")

    return {"message": "Quiz saved, but no wallet linked to award tokens.", "db_id": str(submission.id)}


@api_router.post("/chat/")
async def chat_bot_endpoint(
    data: ChatRequest,
    current_user: User = Depends(get_current_user)
):
    try:
        from google import genai
        from google.genai import types

        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="API Key not configured")

        client = genai.Client(api_key=api_key)

        chat_history = []
        for msg in data.history:
            role = "user" if msg.sender == "user" else "model"
            chat_history.append(types.Content(
                role=role,
                parts=[types.Part.from_text(text=msg.text)]
            ))

        chat = client.chats.create(
            model="gemini-2.5-flash",
            config=types.GenerateContentConfig(
                temperature=0.7,
                max_output_tokens=2048,
                system_instruction=(
                    "You are a helpful and patient educational support bot. "
                    "Your goal is to help students understand concepts by guiding them "
                    "rather than just giving direct answers. Keep responses concise and encouraging."
                )
            ),
            history=chat_history
        )

        response = chat.send_message(data.message)
        return {"response": response.text}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/scholar-observations/")
async def get_scholar_observations(current_user: User = Depends(get_current_user)):
    import logging
    # Grab Uvicorn's default logger
    logger = logging.getLogger("uvicorn.error")

    try:
        import httpx
        import json
        from google import genai
        from google.genai import types

        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="GEMINI_API_KEY not configured")

        profile_data = {}
        try:
            async with httpx.AsyncClient(verify=False, timeout=10.0) as client:
                resp = await client.get(
                    f"https://15.206.205.126:8080/api/profile/{current_user.username}"
                )
                
                # Print the status code to the terminal immediately
                print(f"[OBSERVATIONS] Response Status: {resp.status_code}", flush=True)
                
                if resp.status_code == 200:
                    profile_data = resp.json()
                    
                    # Force print the data to the terminal
                    print(f"[OBSERVATIONS] Profile Data: {profile_data}", flush=True)
                    
                    # Also log it formally
                    logger.info(f"Profile Data fetched for {current_user.username}: {profile_data}")
                else:
                    print(f"[OBSERVATIONS] Failed to fetch profile. Status: {resp.status_code}", flush=True)
                    logger.warning(f"Failed to fetch profile for {current_user.username}. Status: {resp.status_code}")
                    
        except Exception as http_err:
            # Print exactly why the request failed (timeout, connection refused, etc.)
            print(f"[OBSERVATIONS] HTTPX Error: {str(http_err)}", flush=True)
            logger.error(f"HTTPX Error fetching profile: {str(http_err)}")

        profile_summary = json.dumps(profile_data, indent=2) if profile_data else f"Username: {current_user.username}, XP: {current_user.xp}"

        prompt = f"""You are an academic advisor AI. Based on the student profile data below, generate 3 to 5 concise, insightful, and accurate observations on the various weaknesses and strengths in various subjects and topics.

Return ONLY a valid JSON array of about 3 to 5 strings. No markdown, no explanation, just the array.

Student profile:
{profile_summary}

Format: ["observation 1", "observation 2", "observation 3", "observation 4", "observation 5"]"""

        genai_client = genai.Client(api_key=api_key)
        response = genai_client.models.generate_content(
            model="gemini-2.5-flash", # Updated to a valid model version
            contents=prompt,
            config=types.GenerateContentConfig(temperature=0.7, max_output_tokens=1024)
        )

        import re
        text = response.text.strip()
        match = re.search(r'\[.*?\]', text, re.DOTALL)
        if match:
            observations = json.loads(match.group())
            observations = [str(o) for o in observations[:5]]
        else:
            observations = [text[:300]]

        return {"observations": observations}

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc() # Prints the stack trace if Gemini or something else fails
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/lectures/multi-quiz/generate/{subject}/")
async def generate_quiz_ai(
    subject: str,
    current_user: User = Depends(get_current_user)
):
    try:
        from google import genai
        from google.genai import types

        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="API Key not configured")

        client = genai.Client(api_key=api_key)

        prompt = f"""Generate 5 multiple-choice quiz questions about {subject}.
        Format requirements:
        - Return ONLY a JSON list of objects.
        - Each object must have: "q" (string), "options" (list of 4 strings), "correct" (int 0-3).
        - Difficulty: Undergraduate level."""

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.8,
            )
        )

        questions = json.loads(response.text)

        for item in questions:
            options = item['options']
            correct_answer = options[item['correct']]
            random.shuffle(options)
            item['correct'] = options.index(correct_answer)

        return {
            "subject": subject,
            "questions": questions
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate questions: {str(e)}")


@api_router.post("/lectures/multi-quiz/submit-score/")
async def submit_multiplayer_score(
    data: SubmitScoreRequest,
    current_user: User = Depends(get_current_user)
):
    current_user.xp += int(data.score)
    await current_user.save()

    return {
        "message": f"Quiz complete! {data.score} XP added to your profile.",
        "total_xp": current_user.xp
    }


# -------------------------------------------------
# MARKETPLACE ENDPOINTS
# -------------------------------------------------

@api_router.post("/marketplace/buy/")
async def buy_item_endpoint(
    data: BuyItemRequest,
    current_user: User = Depends(get_current_user)
):
    if not current_user.wallet_address:
        raise HTTPException(status_code=400, detail="Invalid or missing wallet address")

    item_cost = 100
    try:
        balance_data = get_balance(current_user.wallet_address)
        current_balance = balance_data.get("balance_edu", 0)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to check blockchain balance: {str(e)}")

    if current_balance < item_cost:
        raise HTTPException(status_code=400, detail="Insufficient EDU balance")

    try:
        req = PurchaseRequest(wallet_address=current_user.wallet_address, cost=item_cost)
        res = execute_purchase(req)
        tx_hash = res.get("tx_hash")
        return {
            "message": "Item purchased successfully!",
            "tx_hash": tx_hash
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Purchase failed: {str(e)}")


@api_router.get("/marketplace/categories/", response_model=List[ProductCategory])
async def list_categories_endpoint():
    return await ProductCategory.find(ProductCategory.is_active == True).to_list()


def _serialize_product(p: Product) -> dict:
    return {
        "id": str(p.id),
        "name": p.name,
        "description": p.description or "",
        "product_type": p.product_type,
        "points_price": p.points_price,
        "stock": p.stock,
        "is_digital": p.is_digital,
        "digital_file_path": p.digital_file_path,
        "external_url": str(p.external_url) if p.external_url else None,
        "thumbnail": p.thumbnail,
        "metadata": p.metadata,
        "is_active": p.is_active,
        "featured": p.featured,
        "created_at": p.created_at.isoformat(),
        "updated_at": p.updated_at.isoformat(),
    }


@api_router.get("/marketplace/products/")
async def list_products_endpoint(
    search: Optional[str] = Query(None),
    ordering: Optional[str] = Query(None)
):
    query = Product.is_active == True
    if search:
        search_filter = {
            "$or": [
                {"name": {"$regex": search, "$options": "i"}},
                {"description": {"$regex": search, "$options": "i"}}
            ]
        }
        products = await Product.find(query, search_filter).to_list()
    else:
        products = await Product.find(query).to_list()

    if ordering:
        reverse = ordering.startswith("-")
        field = ordering.lstrip("-")

        def get_sort_key(p: Product):
            val = getattr(p, field, None)
            return val if val is not None else ""

        products.sort(key=get_sort_key, reverse=reverse)

    return [_serialize_product(p) for p in products]


@api_router.get("/marketplace/products/{product_id}/")
async def get_product_detail_endpoint(product_id: str):
    product = await Product.get(product_id)
    if not product or not product.is_active:
        raise HTTPException(status_code=404, detail="Product not found")
    return _serialize_product(product)


def _link_id(link_or_doc) -> str:
    """Extract string ID from a Beanie Link reference or Document without fetching."""
    # Already a fetched document
    if hasattr(link_or_doc, 'id') and not hasattr(link_or_doc, 'ref'):
        return str(link_or_doc.id)
    # Beanie Link with DBRef
    try:
        return str(link_or_doc.ref.id)
    except AttributeError:
        pass
    try:
        return str(link_or_doc.to_ref().id)
    except Exception:
        pass
    return ""


@api_router.get("/marketplace/cart/")
async def get_cart_endpoint(current_user: User = Depends(get_current_user)):
    cart = await Cart.find_one(Cart.user.id == current_user.id)
    if not cart:
        cart = Cart(user=current_user, items=[])
        await cart.insert()

    serialized_items = []
    total_cart_points = 0

    for item in cart.items:
        try:
            product_id_str = _link_id(item.product)
            product = await Product.get(product_id_str) if product_id_str else None
            if product:
                total_points = item.quantity * product.points_price
                total_cart_points += total_points
                serialized_items.append({
                    "id": str(product.id),
                    "product": _serialize_product(product),
                    "quantity": item.quantity,
                    "total_points": total_points
                })
        except Exception:
            pass

    return {
        "id": str(cart.id),
        "user": str(current_user.id),
        "items": serialized_items,
        "total_cart_points": total_cart_points,
        "created_at": cart.created_at
    }


@api_router.post("/marketplace/cart/add/")
async def add_to_cart_endpoint(
    data: AddToCartRequest,
    current_user: User = Depends(get_current_user)
):
    product = await Product.get(data.product_id)
    if not product or not product.is_active:
        raise HTTPException(status_code=404, detail="Product not found")

    cart = await Cart.find_one(Cart.user.id == current_user.id)
    if not cart:
        cart = Cart(user=current_user, items=[])
        await cart.insert()

    existing_item = None
    for item in cart.items:
        if _link_id(item.product) == data.product_id:
            existing_item = item
            break

    if existing_item:
        existing_item.quantity += data.quantity
    else:
        cart.items.append(CartItem(product=product, quantity=data.quantity))

    target_quantity = existing_item.quantity if existing_item else data.quantity
    if product.stock is not None and target_quantity > product.stock:
        raise HTTPException(status_code=400, detail="Not enough stock")

    await cart.save()
    return await get_cart_endpoint(current_user)


@api_router.post("/marketplace/cart/remove/")
async def remove_from_cart_endpoint(
    data: RemoveFromCartRequest,
    current_user: User = Depends(get_current_user)
):
    cart = await Cart.find_one(Cart.user.id == current_user.id)
    if not cart:
        raise HTTPException(status_code=404, detail="Cart not found")

    cart.items = [item for item in cart.items if _link_id(item.product) != data.cart_item_id]
    await cart.save()
    return await get_cart_endpoint(current_user)


@api_router.post("/marketplace/cart/clear/")
async def clear_cart_endpoint(current_user: User = Depends(get_current_user)):
    cart = await Cart.find_one(Cart.user.id == current_user.id)
    if cart:
        cart.items = []
        await cart.save()
    return await get_cart_endpoint(current_user)


@api_router.post("/marketplace/cart/redeem/")
async def redeem_cart_endpoint(current_user: User = Depends(get_current_user)):
    db_address = current_user.wallet_address
    db_pvt_key = current_user.private_key

    if not db_address or not db_pvt_key:
        raise HTTPException(status_code=400, detail="Wallet configuration incomplete.")

    try:
        from web3 import Web3
        student_address = Web3.to_checksum_address(db_address)
        market_address = Web3.to_checksum_address(MARKET_ADDR)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid Address: {str(e)}")

    cart = await Cart.find_one(Cart.user.id == current_user.id)
    if not cart or not cart.items:
        raise HTTPException(status_code=400, detail="Your cart is empty.")

    total_points_cost = 0
    resolved_items = []

    for item in cart.items:
        if isinstance(item.product, Product):
            product = item.product
        else:
            pid = _link_id(item.product)
            product = await Product.get(pid) if pid else None
        if not product:
            raise HTTPException(status_code=404, detail="One or more products no longer exist.")
        total_points_cost += product.points_price * item.quantity
        resolved_items.append((product, item.quantity))

    amount_in_wei = int(total_points_cost * 10**18)

    try:
        balance_data = get_balance(student_address)
        current_balance = balance_data.get("balance_edu", 0)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to check blockchain balance: {str(e)}")

    if current_balance < total_points_cost:
        raise HTTPException(status_code=400, detail=f"Insufficient balance. Need {total_points_cost} EDU.")

    try:
        # --- Step A: Approval (Student Signs) ---
        token_contract = get_token_contract()
        allowance = token_contract.functions.allowance(student_address, market_address).call()

        if allowance < amount_in_wei:
            approve_tx = token_contract.functions.approve(
                market_address, amount_in_wei
            ).build_transaction({
                'from': student_address,
                'nonce': w3.eth.get_transaction_count(student_address),
                'gas': 100000,
                'gasPrice': w3.eth.gas_price
            })

            signed_approve = w3.eth.account.sign_transaction(approve_tx, db_pvt_key)
            tx_app_hash = w3.eth.send_raw_transaction(signed_approve.raw_transaction)
            w3.eth.wait_for_transaction_receipt(tx_app_hash)

        # --- Step B: Purchase Execution ---
        req = PurchaseRequest(wallet_address=student_address, cost=total_points_cost)
        res = execute_purchase(req)
        tx_hash = res.get("tx_hash")

        # --- Step C: DB Inventory and Logs ---
        for product, quantity in resolved_items:
            if product.stock is not None:
                if product.stock < quantity:
                    raise HTTPException(status_code=400, detail=f"Insufficient stock for {product.name}")
                product.stock -= quantity
                await product.save()

            redemption = Redemption(
                user=current_user,
                product=product,
                quantity=quantity,
                points_spent=product.points_price * quantity,
                status="completed",
                tx_hash=tx_hash,
                delivery_email=current_user.email
            )
            await redemption.insert()

        pt = PointTransaction(
            user=current_user,
            tx_type="spend",
            source="redemption",
            amount=total_points_cost,
            description=f"Marketplace purchase: {len(resolved_items)} items",
            on_chain_tx_hash=tx_hash
        )
        await pt.insert()

        cart.items = []
        await cart.save()

        return {"message": "Redemption successful!", "tx_hash": tx_hash}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/marketplace/redemption/history/")
async def redemption_history_endpoint(current_user: User = Depends(get_current_user)):
    redemptions = await Redemption.find(Redemption.user.id == current_user.id).sort("-created_at").to_list()
    serialized = []
    for r in redemptions:
        if isinstance(r.product, Product):
            prod = r.product
        else:
            pid = _link_id(r.product)
            prod = await Product.get(pid) if pid else None
        serialized.append({
            "id": str(r.id),
            "user": str(current_user.id),
            "user_username": current_user.username,
            "product": str(prod.id) if prod else None,
            "product_name": prod.name if prod else "Unknown Product",
            "quantity": r.quantity,
            "points_spent": r.points_spent,
            "status": r.status,
            "tx_hash": r.tx_hash,
            "delivery_email": r.delivery_email,
            "delivery_notes": r.delivery_notes,
            "shipping_address": r.shipping_address,
            "contact_phone": r.contact_phone,
            "created_at": r.created_at,
            "updated_at": r.updated_at
        })
    return serialized


# -------------------------------------------------
# FASTAPI APP INITIALIZATION & MAIN MOUNT
# -------------------------------------------------

app = FastAPI(title="SmartEdu FastAPI + MongoDB")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    print(f"--> [FETCH] Received request: {request.method} {request.url.path}", flush=True)
    start_time = datetime.utcnow()
    try:
        response = await call_next(request)
        duration = (datetime.utcnow() - start_time).total_seconds()
        print(f"<-- [FETCH] Sent response: {request.method} {request.url.path} - Status: {response.status_code} - Duration: {duration:.3f}s", flush=True)
        return response
    except Exception as e:
        duration = (datetime.utcnow() - start_time).total_seconds()
        print(f"[ERR] [FETCH] Request failed: {request.method} {request.url.path} - Error: {str(e)} - Duration: {duration:.3f}s", flush=True)
        raise



# Mount blockchain standalone routes
from blockchain import router as blockchain_router
app.include_router(blockchain_router)

# Mount all main REST API endpoints under /api
app.include_router(api_router)

# Mount all media files
os.makedirs("media/profile_images", exist_ok=True)
app.mount("/media", StaticFiles(directory="media"), name="media")


@app.on_event("startup")
async def app_init():
    # Monkey-patch AsyncIOMotorClient to support append_metadata (compatibility with Beanie 2.1.0)
    from motor.motor_asyncio import AsyncIOMotorClient
    if not hasattr(AsyncIOMotorClient, 'append_metadata'):
        AsyncIOMotorClient.append_metadata = lambda *args, **kwargs: None

    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]

    await init_beanie(
        database=db,
        document_models=[
            Institution,
            ClassGroup,
            User,
            Course,
            Lecture,
            Quiz,
            Question,
            Option,
            QuizSubmission,
            SubmissionAnswer,
            LectureAttendance,
            LearningResource,
            ProductCategory,
            Product,
            Redemption,
            PointTransaction,
            Cart,
        ],
    )