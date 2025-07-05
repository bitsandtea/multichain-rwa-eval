// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {OApp, Origin, MessagingFee} from "@layerzerolabs/oapp-evm/contracts/oapp/OApp.sol";
import {OAppOptionsType3} from "@layerzerolabs/oapp-evm/contracts/oapp/libs/OAppOptionsType3.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract RWAToken is ERC20, OApp {
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

    uint256 public constant TOTAL_SUPPLY = 1_000_000 * 10 ** 18;

    // Placeholders for LayerZero
    uint32 public constant DST_EID = 80002; // Polygon Amoy
    address public peer;

    constructor(
        string memory name,
        string memory symbol,
        string memory description,
        string memory physicalAddressValue,
        uint256 valuationValue,
        uint256 squareMetersValue,
        uint256 riskScoreValue,
        uint256 locationScoreValue,
        address riskScoreUpdaterAddress,
        address _endpoint,
        address _owner
    ) ERC20(name, symbol) OApp(_endpoint, _owner) {
        require(riskScoreValue <= 100, "Score cannot exceed 100");
        require(locationScoreValue <= 100, "Score cannot exceed 100");
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

    function setPeer(address _peer) public onlyOwner {
        peer = _peer;
    }

    function _lzSend(bytes memory _message) internal {
        require(peer != address(0), "Peer not set");

        MessagingFee memory fee =_quote(DST_EID, _message, bytes(""), false);
        _lzSend(DST_EID, _message, bytes(""), fee, payable(msg.sender));
    }

    function updateValuation(uint256 newValuation) public onlyOwner {
        rwaData.valuation = newValuation;
        rwaData.valuationDate = block.timestamp;
        bytes memory message = abi.encode("updateValuation", newValuation);
        _lzSend(message);
    }

    function updateRiskScore(uint256 newRiskScore) public {
        require(
            msg.sender == riskScoreUpdater,
            "Only risk score updater can call this function"
        );
        require(newRiskScore <= 100, "Score cannot exceed 100");
        rwaData.riskScore = newRiskScore;
        bytes memory message = abi.encode("updateRiskScore", newRiskScore);
        _lzSend(message);
    }

    function updateLocationScore(uint256 newLocationScore) public onlyOwner {
        require(newLocationScore <= 100, "Score cannot exceed 100");
        rwaData.locationScore = newLocationScore;
        bytes memory message = abi.encode("updateLocationScore", newLocationScore);
        _lzSend(message);
    }

    function updateHighestBid(uint256 newHighestBid) public onlyOwner {
        rwaData.highestBid = newHighestBid;
        rwaData.highestBidTimestamp = block.timestamp;
        bytes memory message = abi.encode("updateHighestBid", newHighestBid);
        _lzSend(message);
    }

    function updateLastBid(uint256 newLastBid) public onlyOwner {
        rwaData.lastBid = newLastBid;
        rwaData.lastBidTimestamp = block.timestamp;
        bytes memory message = abi.encode("updateLastBid", newLastBid);
        _lzSend(message);
    }

    function bid() public payable {
        rwaData.lastBid = msg.value;
        rwaData.lastBidTimestamp = block.timestamp;

        if (msg.value > rwaData.highestBid) {
            rwaData.highestBid = msg.value;
            rwaData.highestBidTimestamp = block.timestamp;
        }

        bytes memory message = abi.encode(
            "updateBids",
            rwaData.lastBid,
            rwaData.lastBidTimestamp,
            rwaData.highestBid,
            rwaData.highestBidTimestamp
        );
        _lzSend(message);
    }

    function updateBids(
        uint256 newLastBid,
        uint256 newLastBidTimestamp,
        uint256 newHighestBid,
        uint256 newHighestBidTimestamp
    ) public {
        rwaData.lastBid = newLastBid;
        rwaData.lastBidTimestamp = newLastBidTimestamp;
        rwaData.highestBid = newHighestBid;
        rwaData.highestBidTimestamp = newHighestBidTimestamp;
    }

    function _lzReceive(
        Origin calldata,
        bytes32,
        bytes calldata _message,
        address,
        bytes calldata
    ) internal override {
        (
            string memory functionSig,
            uint256 p1,
            uint256 p2,
            uint256 p3,
            uint256 p4
        ) = abi.decode(
                _message,
                (string, uint256, uint256, uint256, uint256)
            );

        if (keccak256(bytes(functionSig)) == keccak256(bytes("updateBids"))) {
            updateBids(p1, p2, p3, p4);
        }
    }
} 