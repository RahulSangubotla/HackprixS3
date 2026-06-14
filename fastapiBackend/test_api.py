import time
import requests

BASE_URL = "http://127.0.0.1:8000"

def run_api_tests():
    # Hardhat pre-funded Account #1 for testing
    student_address = "0xbcd4042de499d14e55001ccbb24a551f3b954096"
    student_pvt_key = "0xf214f2b2cd398c806f84e317254e0f0b801d0643303237d97a22a48e01628897"

    print("=== STARTING FASTAPI BLOCKCHAIN STANDALONE SERVICE TESTS ===\n")

    # 1. Test Config Endpoint
    print("[1] Fetching Blockchain Configuration...")
    try:
        r = requests.get(f"{BASE_URL}/blockchain/config")
        r.raise_for_status()
        config = r.json()
        print(f"✅ Success! Config Response:\n{config}\n")
    except Exception as e:
        print(f"❌ Failed to fetch config: {e}\n")
        print("Please make sure the FastAPI server is running on http://127.0.0.1:8000")
        return

    # 2. Test ABIs Endpoint
    print("[2] Fetching Smart Contract ABIs...")
    try:
        r = requests.get(f"{BASE_URL}/blockchain/abis")
        r.raise_for_status()
        abis = r.json()
        print(f"✅ Success! Token ABI length: {len(abis.get('edu_token_abi', []))}, Market ABI length: {len(abis.get('marketplace_abi', []))}\n")
    except Exception as e:
        print(f"❌ Failed to fetch ABIs: {e}\n")

    # 3. Check Initial Balance
    print("[3] Fetching Initial Balance...")
    try:
        r = requests.get(f"{BASE_URL}/blockchain/balance/{student_address}")
        r.raise_for_status()
        initial_balance = r.json().get('balance_edu', 0)
        print(f"Student Wallet Address: {student_address}")
        print(f"Initial Balance: {initial_balance} EDU\n")
    except Exception as e:
        print(f"❌ Failed to fetch initial balance: {e}\n")
        return

    # 4. Award 200 Tokens (Admin action)
    award_amount = 200
    print(f"[4] Awarding {award_amount} EDU Tokens (Admin action)...")
    try:
        payload = {
            "wallet_address": student_address,
            "amount": award_amount
        }
        r = requests.post(f"{BASE_URL}/blockchain/award", json=payload)
        r.raise_for_status()
        res = r.json()
        print(f"✅ Success! Message: {res.get('message')}")
        print(f"Transaction Hash: {res.get('tx_hash')}\n")
    except Exception as e:
        print(f"❌ Failed to award tokens: {e}\n")
        return

    # Wait a second for transaction confirmation
    time.sleep(1)

    # 5. Check Balance after Award
    print("[5] Fetching Balance after Award...")
    try:
        r = requests.get(f"{BASE_URL}/blockchain/balance/{student_address}")
        r.raise_for_status()
        balance_after_award = r.json().get('balance_edu', 0)
        print(f"New Balance: {balance_after_award} EDU\n")
    except Exception as e:
        print(f"❌ Failed to fetch balance: {e}\n")

    # 6. Approve Marketplace (Student signs)
    approve_amount = 100
    print(f"[6] Signing and Sending Marketplace Approval for {approve_amount} EDU...")
    try:
        payload = {
            "student_private_key": student_pvt_key,
            "amount": approve_amount
        }
        r = requests.post(f"{BASE_URL}/blockchain/approve-marketplace", json=payload)
        r.raise_for_status()
        res = r.json()
        print(f"✅ Success! Message: {res.get('message')}")
        print(f"Transaction Hash: {res.get('tx_hash')}\n")
    except Exception as e:
        print(f"❌ Failed to approve marketplace: {e}\n")
        return

    time.sleep(1)

    # 7. Process Marketplace Purchase (Admin pulls approved tokens)
    purchase_cost = 100
    print(f"[7] Processing Marketplace Purchase of {purchase_cost} EDU...")
    try:
        payload = {
            "wallet_address": student_address,
            "cost": purchase_cost
        }
        r = requests.post(f"{BASE_URL}/blockchain/purchase", json=payload)
        r.raise_for_status()
        res = r.json()
        print(f"✅ Success! Message: {res.get('message')}")
        print(f"Transaction Hash: {res.get('tx_hash')}\n")
    except Exception as e:
        print(f"❌ Failed to process purchase: {e}\n")
        return

    time.sleep(1)

    # 8. Check Final Balance
    print("[8] Fetching Final Balance...")
    try:
        r = requests.get(f"{BASE_URL}/blockchain/balance/{student_address}")
        r.raise_for_status()
        final_balance = r.json().get('balance_edu', 0)
        print(f"Final Balance: {final_balance} EDU\n")
    except Exception as e:
        print(f"❌ Failed to fetch final balance: {e}\n")

    print("=== FASTAPI BLOCKCHAIN STANDALONE SERVICE TESTS COMPLETE ===")

if __name__ == "__main__":
    run_api_tests()
