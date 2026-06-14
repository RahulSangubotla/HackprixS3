// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract EduToken is ERC20, Ownable {
    constructor(address initialOwner) ERC20("EduToken", "EDU") Ownable(initialOwner) {
        // Mint initial supply to the owner (your backend)
        _mint(initialOwner, 1000000 * 10**decimals());
    }

    // Function for your Django backend to award points
    function awardStudent(address student, uint256 amount) public onlyOwner {
        _mint(student, amount * 10**decimals());
    }
}