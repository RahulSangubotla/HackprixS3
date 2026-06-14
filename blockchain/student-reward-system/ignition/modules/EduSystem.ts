import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("EduSystem", (m) => {
  // Use the first account as the owner/admin
  const owner = m.getAccount(0);

  // 1. Deploy EduToken
  const eduToken = m.contract("EduToken", [owner]);

  // 2. Deploy Marketplace and link it to the Token
  const marketplace = m.contract("Marketplace", [eduToken]);

  return { eduToken, marketplace };
});