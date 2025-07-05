// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {OApp, Origin, MessagingFee} from "@layerzerolabs/oapp-evm/contracts/oapp/OApp.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// LEGACY CONTRACT - Use RWAToken.sol for new deployments
contract RWATokenDST is OApp, ERC20 {
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
        uint256 highestBidChain;    // Chain ID where highest bid was placed
        uint256 lastBid;
        uint256 lastBidTimestamp;
    }

    RWAData public rwaData;
    address public riskScoreUpdater;

    uint256 public constant TOTAL_SUPPLY = 1_000_000 * 10 ** 18;

    // This contract is on Amoy, its peer is on Base Sepolia.
    uint32 public constant PEER_EID = 40245; // Base Sepolia (corrected EID)
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
    ) OApp(_endpoint, _owner) ERC20(name, symbol) {
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
            highestBidChain: 0,
            lastBid: 0,
            lastBidTimestamp: 0
        });
    }

    function updateValuation(uint256 newValuation) public {
        rwaData.valuation = newValuation;
        rwaData.valuationDate = block.timestamp;
    }

    function updateRiskScore(uint256 newRiskScore) public {
        require(newRiskScore <= 100, "Score cannot exceed 100");
        rwaData.riskScore = newRiskScore;
    }

    function updateLocationScore(uint256 newLocationScore) public {
        require(newLocationScore <= 100, "Score cannot exceed 100");
        rwaData.locationScore = newLocationScore;
    }

    function _lzSend(bytes memory _message) internal {
        require(peer != address(0), "Peer not set");

        MessagingFee memory fee =_quote(PEER_EID, _message, bytes(""), false);
        _lzSend(PEER_EID, _message, bytes(""), fee, payable(msg.sender));
    }

    function bid() public payable {
        rwaData.lastBid = msg.value;
        rwaData.lastBidTimestamp = block.timestamp;

        if (msg.value > rwaData.highestBid) {
            rwaData.highestBid = msg.value;
            rwaData.highestBidTimestamp = block.timestamp;
            rwaData.highestBidChain = block.chainid;
        }

        bytes memory message = abi.encode(
            "updateBids",
            rwaData.lastBid,
            rwaData.lastBidTimestamp,
            rwaData.highestBid,
            rwaData.highestBidTimestamp,
            rwaData.highestBidChain
        );
        _lzSend(message);
    }

    function updateBids(
        uint256 newLastBid,
        uint256 newLastBidTimestamp,
        uint256 newHighestBid,
        uint256 newHighestBidTimestamp,
        uint256 newHighestBidChain
    ) internal {
        rwaData.lastBid = newLastBid;
        rwaData.lastBidTimestamp = newLastBidTimestamp;
        rwaData.highestBid = newHighestBid;
        rwaData.highestBidTimestamp = newHighestBidTimestamp;
        rwaData.highestBidChain = newHighestBidChain;
    }

    function _lzReceive(
        Origin calldata _origin,
        bytes32,
        bytes calldata _message,
        address,
        bytes calldata
    ) internal override {
        require(peers[_origin.srcEid] == _origin.sender, "OApp: peer not set");
        (string memory functionSig, ) = abi.decode(_message, (string, bytes));

        if (
            keccak256(bytes(functionSig)) ==
            keccak256(bytes("updateValuation"))
        ) {
            (, uint256 value) = abi.decode(_message, (string, uint256));
            // Only update local data, don't send cross-chain message back
            rwaData.valuation = value;
            rwaData.valuationDate = block.timestamp;
        } else if (
            keccak256(bytes(functionSig)) ==
            keccak256(bytes("updateRiskScore"))
        ) {
            (, uint256 value) = abi.decode(_message, (string, uint256));
            require(value <= 100, "Score cannot exceed 100");
            // Only update local data, don't send cross-chain message back
            rwaData.riskScore = value;
        } else if (
            keccak256(bytes(functionSig)) ==
            keccak256(bytes("updateLocationScore"))
        ) {
            (, uint256 value) = abi.decode(_message, (string, uint256));
            require(value <= 100, "Score cannot exceed 100");
            // Only update local data, don't send cross-chain message back
            rwaData.locationScore = value;
        } else if (
            keccak256(bytes(functionSig)) == keccak256(bytes("updateBids"))
        ) {
            (, uint256 p1, uint256 p2, uint256 p3, uint256 p4, uint256 p5) = abi.decode(
                _message,
                (string, uint256, uint256, uint256, uint256, uint256)
            );
            // Only update local data, don't send cross-chain message back
            rwaData.lastBid = p1;
            rwaData.lastBidTimestamp = p2;
            rwaData.highestBid = p3;
            rwaData.highestBidTimestamp = p4;
            rwaData.highestBidChain = p5;
        }
    }
}
