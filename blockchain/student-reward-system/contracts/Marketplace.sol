// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./EduToken.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Marketplace is Ownable {
    EduToken public token;

    constructor(address _tokenAddress) Ownable(msg.sender) {
        token = EduToken(_tokenAddress);
    }

    /**
     * @dev Admin-mediated purchase. Admin calls this to process a student's buy.
     * This moves tokens from 'student' to 'Marketplace' contract.
     */
    function processPurchase(address student, uint256 cost) public onlyOwner {
        // This requires the student to have 'approved' this contract address first
        // We multiply cost by 10**18 to match EduToken decimals
        token.transferFrom(student, address(this), cost * 10**18);
    }
}