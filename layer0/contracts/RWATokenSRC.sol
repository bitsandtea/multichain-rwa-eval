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
        uint256 locationScore;
        uint256 highestBid;
        uint256 highestBidTimestamp;
        uint256 lastBid;
        uint256 lastBidTimestamp;
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
        uint256 locationScoreValue,
        address riskScoreUpdaterAddress
    ) ERC20(name, symbol) Ownable() {
        _mint(msg.sender, TOTAL_SUPPLY);
        riskScoreUpdater = riskScoreUpdaterAddress;
        rwaData = RWAData({
            description: description,
            physicalAddress: physicalAddressValue,
            valuation: valuationValue,
            valuationDate: block.timestamp,
            squareMeters: squareMetersValue,
            riskScore: riskScoreValue,
            locationScore: locationScoreValue,
            highestBid: 0,
            highestBidTimestamp: 0,
            lastBid: 0,
            lastBidTimestamp: 0
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

    function updateLocationScore(uint256 newLocationScore) public onlyOwner {
        rwaData.locationScore = newLocationScore;
    }

    function updateHighestBid(uint256 newHighestBid) public onlyOwner {
        rwaData.highestBid = newHighestBid;
        rwaData.highestBidTimestamp = block.timestamp;
    }

    function updateLastBid(uint256 newLastBid) public onlyOwner {
        rwaData.lastBid = newLastBid;
        rwaData.lastBidTimestamp = block.timestamp;
    }
}
