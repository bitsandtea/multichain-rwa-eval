// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract RWAToken is ERC20, Ownable {
    struct RWAData {
        string description;
        string physicalAddress;
        uint256 valuation;
        uint256 valuationDate;
        uint256 squareMeters;
        uint256 riskScore;
    }

    RWAData public rwaData;
    address public riskScoreUpdater;

    uint256 public constant TOTAL_SUPPLY = 1_000_000 * 10**18;

    constructor(
        string memory name,
        string memory symbol,
        string memory description,
        string memory physicalAddressValue,
        uint256 valuationValue,
        uint256 squareMetersValue,
        uint256 riskScoreValue,
        address riskScoreUpdaterAddress
    ) ERC20(name, symbol) Ownable(msg.sender) {
        _mint(msg.sender, TOTAL_SUPPLY);
        riskScoreUpdater = riskScoreUpdaterAddress;
        rwaData = RWAData({
            description: description,
            physicalAddress: physicalAddressValue,
            valuation: valuationValue,
            valuationDate: block.timestamp,
            squareMeters: squareMetersValue,
            riskScore: riskScoreValue
        });
    }

    function updateValuation(uint256 newValuation) public onlyOwner {
        rwaData.valuation = newValuation;
        rwaData.valuationDate = block.timestamp;
    }

    function updateRiskScore(uint256 newRiskScore) public {
        require(msg.sender == riskScoreUpdater, "Only risk score updater can call this function");
        rwaData.riskScore = newRiskScore;
    }
}
