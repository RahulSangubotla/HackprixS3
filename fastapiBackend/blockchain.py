import os
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from web3 import Web3
from dotenv import load_dotenv

# Try to find .env in fastapiBackend or parent/backend directory
BASE_DIR = Path(__file__).resolve().parent
if (BASE_DIR / ".env").exists():
    load_dotenv(BASE_DIR / ".env")
elif (BASE_DIR.parent / "backend" / ".env").exists():
    load_dotenv(BASE_DIR.parent / "backend" / ".env")
else:
    load_dotenv()

# Initialize Web3 Connection
w3 = Web3(Web3.HTTPProvider(os.getenv('RPC_URL', 'http://127.0.0.1:8545')))

# Deployed Smart Contract Addresses
EDU_TOKEN_ADDR = Web3.to_checksum_address(os.getenv('EDU_TOKEN_ADDRESS', '0x5FbDB2315678afecb367f032d93F642f64180aa3'))
MARKET_ADDR = Web3.to_checksum_address(os.getenv('MARKETPLACE_ADDRESS', '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512'))

# Admin Credentials
ADMIN_PVT_KEY = os.getenv('ADMIN_PRIVATE_KEY', '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80')
try:
    ADMIN_ADDR = w3.eth.account.from_key(ADMIN_PVT_KEY).address
except Exception:
    ADMIN_ADDR = None

# --- UTILS ---

def ensure_checksum(address: str) -> Optional[str]:
    """Helper to convert any address to checksum format to prevent Web3 errors."""
    if not address:
        return None
    try:
        return Web3.to_checksum_address(address.strip())
    except ValueError:
        return None

# --- CONTRACT ABIS (embedded to avoid filesystem dependency) ---

EDU_TOKEN_ABI = [{"inputs":[{"internalType":"address","name":"initialOwner","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"allowance","type":"uint256"},{"internalType":"uint256","name":"needed","type":"uint256"}],"name":"ERC20InsufficientAllowance","type":"error"},{"inputs":[{"internalType":"address","name":"sender","type":"address"},{"internalType":"uint256","name":"balance","type":"uint256"},{"internalType":"uint256","name":"needed","type":"uint256"}],"name":"ERC20InsufficientBalance","type":"error"},{"inputs":[{"internalType":"address","name":"approver","type":"address"}],"name":"ERC20InvalidApprover","type":"error"},{"inputs":[{"internalType":"address","name":"receiver","type":"address"}],"name":"ERC20InvalidReceiver","type":"error"},{"inputs":[{"internalType":"address","name":"sender","type":"address"}],"name":"ERC20InvalidSender","type":"error"},{"inputs":[{"internalType":"address","name":"spender","type":"address"}],"name":"ERC20InvalidSpender","type":"error"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"OwnableInvalidOwner","type":"error"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"OwnableUnauthorizedAccount","type":"error"},{"anonymous":False,"inputs":[{"indexed":True,"internalType":"address","name":"owner","type":"address"},{"indexed":True,"internalType":"address","name":"spender","type":"address"},{"indexed":False,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":False,"inputs":[{"indexed":True,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":True,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"anonymous":False,"inputs":[{"indexed":True,"internalType":"address","name":"from","type":"address"},{"indexed":True,"internalType":"address","name":"to","type":"address"},{"indexed":False,"internalType":"uint256","name":"value","type":"uint256"}],"name":"Transfer","type":"event"},{"inputs":[{"internalType":"address","name":"owner","type":"address"},{"internalType":"address","name":"spender","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"student","type":"address"},{"internalType":"uint256","name":"amount","type":"uint256"}],"name":"awardStudent","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"from","type":"address"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"value","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"}]

MARKETPLACE_ABI = [{"inputs":[{"internalType":"address","name":"_tokenAddress","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[{"internalType":"address","name":"owner","type":"address"}],"name":"OwnableInvalidOwner","type":"error"},{"inputs":[{"internalType":"address","name":"account","type":"address"}],"name":"OwnableUnauthorizedAccount","type":"error"},{"anonymous":False,"inputs":[{"indexed":True,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":True,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"student","type":"address"},{"internalType":"uint256","name":"cost","type":"uint256"}],"name":"processPurchase","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"renounceOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"token","outputs":[{"internalType":"contract EduToken","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"}]

# --- CONTRACT LOADERS ---

def get_token_abi():
    return EDU_TOKEN_ABI

def get_token_contract():
    return w3.eth.contract(address=EDU_TOKEN_ADDR, abi=EDU_TOKEN_ABI)

def get_market_abi():
    return MARKETPLACE_ABI

def get_market_contract():
    return w3.eth.contract(address=MARKET_ADDR, abi=MARKETPLACE_ABI)

# --- SCHEMAS ---

class AwardRequest(BaseModel):
    wallet_address: str = Field(..., description="Student wallet address (0x...)")
    amount: int = Field(..., description="Amount of EduTokens to award")

class PurchaseRequest(BaseModel):
    wallet_address: str = Field(..., description="Student wallet address (0x...)")
    cost: int = Field(..., description="Cost of the item in EduTokens")

class ApproveRequest(BaseModel):
    student_private_key: str = Field(..., description="Private key of the student wallet signing the approval")
    amount: int = Field(..., description="Amount of EduTokens to approve for marketplace contract (in standard units)")

from fastapi import FastAPI, APIRouter, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware

# --- ROUTER ---

router = APIRouter(prefix="/blockchain", tags=["blockchain"])

# --- STANDALONE FASTAPI APP ---

app = FastAPI(
    title="SmartEdu Blockchain Service",
    description="Independent Microservice for SmartEdu Blockchain Functionality",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    """Welcome endpoint for the standalone service."""
    return {
        "service": "SmartEdu Blockchain Service",
        "status": "online",
        "documentation": "/docs"
    }

@router.get("/config")
def get_config():
    """Retrieve current deployed smart contract addresses, Admin address, and active RPC URL."""
    return {
        "edu_token_address": EDU_TOKEN_ADDR,
        "marketplace_address": MARKET_ADDR,
        "admin_address": ADMIN_ADDR,
        "rpc_url": w3.provider.endpoint_uri if hasattr(w3.provider, 'endpoint_uri') else None
    }

@router.get("/abis")
def get_abis():
    """Retrieve ABIs for the EduToken and Marketplace contracts."""
    try:
        return {
            "edu_token_abi": get_token_abi(),
            "marketplace_abi": get_market_abi()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load contract ABIs: {str(e)}")

@router.get("/balance/{wallet_address}")
def get_balance(wallet_address: str):
    """Retrieve live EduToken balance of a specific student wallet from the blockchain."""
    checksum_addr = ensure_checksum(wallet_address)
    if not checksum_addr:
        raise HTTPException(status_code=400, detail="Invalid wallet address format.")
    
    try:
        contract = get_token_contract()
        balance_wei = contract.functions.balanceOf(checksum_addr).call()
        balance_edu = balance_wei / 10**18
        return {
            "wallet_address": checksum_addr,
            "balance_wei": str(balance_wei),
            "balance_edu": balance_edu
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch balance: {str(e)}")

@router.post("/award")
def award_tokens(data: AwardRequest):
    """Award EduTokens to a student (Admin transaction, pays gas)."""
    checksum_addr = ensure_checksum(data.wallet_address)
    if not checksum_addr:
        raise HTTPException(status_code=400, detail="Invalid student wallet address.")

    if not ADMIN_PVT_KEY:
        raise HTTPException(status_code=500, detail="Admin private key is not configured.")

    try:
        contract = get_token_contract()
        # In EduToken.sol, awardStudent internally mints (amount * 10**decimals).
        # Therefore, we pass the raw amount directly without multiplying by 10**18.
        tx = contract.functions.awardStudent(checksum_addr, data.amount).build_transaction({
            'from': ADMIN_ADDR,
            'nonce': w3.eth.get_transaction_count(ADMIN_ADDR),
            'gas': 150000,
            'gasPrice': w3.eth.gas_price
        })
        signed_tx = w3.eth.account.sign_transaction(tx, ADMIN_PVT_KEY)
        tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
        return {
            "status": "success",
            "message": f"Awarded {data.amount} EDU to {checksum_addr}",
            "tx_hash": tx_hash.hex()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Blockchain execution failed: {str(e)}")

@router.post("/purchase")
def execute_purchase(data: PurchaseRequest):
    """Execute marketplace purchase (Admin transaction, transfers approved tokens from student)."""
    checksum_addr = ensure_checksum(data.wallet_address)
    if not checksum_addr:
        raise HTTPException(status_code=400, detail="Invalid student wallet address.")

    if not ADMIN_PVT_KEY:
        raise HTTPException(status_code=500, detail="Admin private key is not configured.")

    try:
        market = get_market_contract()
        # Marketplace.sol's processPurchase accepts raw cost and multiplies by 10**18.
        tx = market.functions.processPurchase(checksum_addr, data.cost).build_transaction({
            'from': ADMIN_ADDR,
            'nonce': w3.eth.get_transaction_count(ADMIN_ADDR),
            'gas': 200000,
            'gasPrice': w3.eth.gas_price
        })
        signed_tx = w3.eth.account.sign_transaction(tx, ADMIN_PVT_KEY)
        tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
        return {
            "status": "success",
            "message": f"Successfully processed purchase of {data.cost} EDU for {checksum_addr}",
            "tx_hash": tx_hash.hex()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Blockchain purchase execution failed: {str(e)}")

@router.post("/approve-marketplace")
def approve_marketplace(data: ApproveRequest):
    """Sign and submit transaction from student to approve Marketplace to spend EduTokens."""
    try:
        student_account = w3.eth.account.from_key(data.student_private_key)
        student_address = student_account.address
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid private key format.")

    try:
        token = get_token_contract()
        approve_amount_wei = data.amount * 10**18
        
        tx = token.functions.approve(MARKET_ADDR, approve_amount_wei).build_transaction({
            'from': student_address,
            'nonce': w3.eth.get_transaction_count(student_address),
            'gas': 100000,
            'gasPrice': w3.eth.gas_price
        })
        signed_tx = w3.eth.account.sign_transaction(tx, data.student_private_key)
        tx_hash = w3.eth.send_raw_transaction(signed_tx.raw_transaction)
        return {
            "status": "success",
            "message": f"Marketplace approved to spend {data.amount} EDU from {student_address}",
            "tx_hash": tx_hash.hex()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Approve transaction failed: {str(e)}")

# Include router after all its routes are defined
app.include_router(router)
