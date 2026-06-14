import os
import asyncio
from pathlib import Path
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

# Load environment variables
BASE_DIR = Path(__file__).resolve().parent
if (BASE_DIR / ".env").exists():
    load_dotenv(BASE_DIR / ".env")
elif (BASE_DIR.parent / "backend" / ".env").exists():
    load_dotenv(BASE_DIR.parent / "backend" / ".env")
else:
    load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "smartedu_db")

# Monkey-patch AsyncIOMotorClient to support append_metadata (compatibility with Beanie 2.1.0)
if not hasattr(AsyncIOMotorClient, 'append_metadata'):
    AsyncIOMotorClient.append_metadata = lambda *args, **kwargs: None

from main import ProductCategory, Product, Institution, ClassGroup, User

async def seed():
    print("Connecting to MongoDB...")
    client = AsyncIOMotorClient(MONGO_URI)
    db = client[DB_NAME]
    
    # Initialize Beanie
    await init_beanie(
        database=db,
        document_models=[
            ProductCategory,
            Product,
            Institution,
            ClassGroup,
            User,
        ]
    )
    
    print("Seeding database...")
    
    # 1. Seed Institution
    inst = await Institution.find_one(Institution.code == "GRIET2025")
    if not inst:
        inst = Institution(
            name="Gokaraju Rangaraju Institute of Engineering and Technology",
            code="GRIET2025",
            address="Bachupally, Hyderabad, India",
            institution_type="college"
        )
        await inst.insert()
        print(f"Created Institution: {inst.name}")
    else:
        print(f"Institution already exists: {inst.name}")
        
    # 2. Seed Category
    cat = await ProductCategory.find_one(ProductCategory.slug == "e-book")
    if not cat:
        cat = ProductCategory(
            name="E Book",
            slug="e-book",
            description="Electronic textbooks and educational reference books.",
            is_active=True
        )
        await cat.insert()
        print(f"Created Category: {cat.name}")
    else:
        print(f"Category already exists: {cat.name}")
        
    # 3. Seed Product
    prod = await Product.find_one(Product.name == "Grey's Anatomy")
    if not prod:
        prod = Product(
            category=cat,
            name="Grey's Anatomy",
            description=(
                "Gray's Anatomy is a foundational medical textbook that maps the human body with "
                "ruthless precision. Bone by bone, nerve by nerve, vessel by vessel—it lays out "
                "structure, relations, and function like a meticulous blueprint of life. "
                "No metaphors, no romance: just anatomy in its raw, unavoidable truth. "
                "It's the book that teaches doctors where everything is, before they're trusted to touch it. "
                "Dense, exacting, and unapologetically serious—the body, told as it actually is."
            ),
            product_type="ebook",
            points_price=30,
            stock=50,
            is_digital=True,
            digital_file_path="marketplace/digital_products/C-9_Review-1_final.pdf",
            external_url="https://github.com/",
            thumbnail="marketplace/product_thumbnails/Screenshot_2026-01-05_144508.png",
            is_active=True,
            featured=True
        )
        await prod.insert()
        print(f"Created Product: {prod.name}")
    else:
        print(f"Product already exists: {prod.name}")
        
    print("Database seeding completed successfully!")

if __name__ == "__main__":
    asyncio.run(seed())
