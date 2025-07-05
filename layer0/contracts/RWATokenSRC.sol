// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {OApp, Origin, MessagingFee} from "@layerzerolabs/oapp-evm/contracts/oapp/OApp.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// LEGACY CONTRACT - Use RWAToken.sol for new deployments
contract RWATokenSRC is ERC20, OApp {
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
    uint256 public constant BASE_SEPOLIA_CHAIN_ID = 84532;

    // Placeholders for LayerZero
    uint32 public constant DST_EID = 40267; // Amoy
    address public peer;

    modifier onlyBaseSepolia() {
        require(block.chainid == BASE_SEPOLIA_CHAIN_ID, "Only callable from Base Sepolia");
        _;
    }

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
            highestBidChain: 0,
            lastBid: 0,
            lastBidTimestamp: 0
        });
    }

    // Unidirectional Updates (Base Sepolia → Other Chains)
    function updateValuation(uint256 newValuation) public onlyBaseSepolia {
        rwaData.valuation = newValuation;
        rwaData.valuationDate = block.timestamp;
        
        // Send cross-chain message to DST contract
        bytes memory message = abi.encode("updateValuation", newValuation);
        _lzSend(message);
    }

    function updateRiskScore(uint256 newRiskScore) public onlyBaseSepolia {
        require(newRiskScore <= 100, "Score cannot exceed 100");
        rwaData.riskScore = newRiskScore;
        
        // Send cross-chain message to DST contract
        bytes memory message = abi.encode("updateRiskScore", newRiskScore);
        _lzSend(message);
    }

    function updateLocationScore(uint256 newLocationScore) public onlyBaseSepolia {
        require(newLocationScore <= 100, "Score cannot exceed 100");
        rwaData.locationScore = newLocationScore;
        
        // Send cross-chain message to DST contract
        bytes memory message = abi.encode("updateLocationScore", newLocationScore);
        _lzSend(message);
    }

    function updateHighestBid(uint256 newHighestBid) public {
        rwaData.highestBid = newHighestBid;
        rwaData.highestBidTimestamp = block.timestamp;
    }

    function updateLastBid(uint256 newLastBid) public {
        rwaData.lastBid = newLastBid;
        rwaData.lastBidTimestamp = block.timestamp;
    }

    function _lzSend(bytes memory _message) internal {
        require(peer != address(0), "Peer not set");

        MessagingFee memory fee =_quote(DST_EID, _message, bytes(""), false);
        _lzSend(DST_EID, _message, bytes(""), fee, payable(msg.sender));
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
    ) public {
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

        if (keccak256(bytes(functionSig)) == keccak256(bytes("updateBids"))) {
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
