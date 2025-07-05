// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { OFT } from "@layerzerolabs/oft-evm/contracts/OFT.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { MessagingFee, Origin } from "@layerzerolabs/oapp-evm/contracts/oapp/OApp.sol";

contract RWAToken is OFT {
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
    
    // Chain identifiers for data updates
    uint256 public constant BASE_SEPOLIA_CHAIN_ID = 84532;
    uint256 public immutable CHAIN_ID;

    // Events
    event ValuationUpdated(uint256 newValuation, uint256 timestamp);
    event RiskScoreUpdated(uint256 newRiskScore);
    event LocationScoreUpdated(uint256 newLocationScore);
    event BidPlaced(address bidder, uint256 amount, uint256 timestamp, uint256 chainId);
    event CrossChainDataReceived(string dataType, uint256 value, uint32 srcEid);

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
        address _lzEndpoint,
        address _owner
    ) OFT(name, symbol, _lzEndpoint, _owner) Ownable() {
        require(riskScoreValue <= 100, "Score cannot exceed 100");
        require(locationScoreValue <= 100, "Score cannot exceed 100");
        _mint(msg.sender, TOTAL_SUPPLY);
        riskScoreUpdater = riskScoreUpdaterAddress;
        CHAIN_ID = block.chainid;
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
        
        emit ValuationUpdated(newValuation, block.timestamp);
        
        // Send cross-chain message to all other chains
        bytes memory message = abi.encode("updateValuation", newValuation);
        _broadcastMessage(message);
    }

    function updateRiskScore(uint256 newRiskScore) public onlyBaseSepolia {
        require(newRiskScore <= 100, "Score cannot exceed 100");
        rwaData.riskScore = newRiskScore;
        
        emit RiskScoreUpdated(newRiskScore);
        
        // Send cross-chain message to all other chains
        bytes memory message = abi.encode("updateRiskScore", newRiskScore);
        _broadcastMessage(message);
    }

    function updateLocationScore(uint256 newLocationScore) public onlyBaseSepolia {
        require(newLocationScore <= 100, "Score cannot exceed 100");
        rwaData.locationScore = newLocationScore;
        
        emit LocationScoreUpdated(newLocationScore);
        
        // Send cross-chain message to all other chains
        bytes memory message = abi.encode("updateLocationScore", newLocationScore);
        _broadcastMessage(message);
    }

    // Bidirectional Updates (Any Chain ↔ All Chains)
    function bid() public payable {
        rwaData.lastBid = msg.value;
        rwaData.lastBidTimestamp = block.timestamp;

        if (msg.value > rwaData.highestBid) {
            rwaData.highestBid = msg.value;
            rwaData.highestBidTimestamp = block.timestamp;
            rwaData.highestBidChain = CHAIN_ID;
        }

        emit BidPlaced(msg.sender, msg.value, block.timestamp, CHAIN_ID);

        // Send bid updates to all peer chains
        bytes memory message = abi.encode(
            "updateBids",
            rwaData.lastBid,
            rwaData.lastBidTimestamp,
            rwaData.highestBid,
            rwaData.highestBidTimestamp,
            rwaData.highestBidChain
        );
        _broadcastMessage(message);
    }

    function _broadcastMessage(bytes memory _message) internal {
        // Get all configured peers and send message to each
        uint32[] memory eids = new uint32[](3);
        eids[0] = 40245; // Base Sepolia
        eids[1] = 40267; // Polygon Amoy  
        eids[2] = 40161; // Ethereum Sepolia
        
        for (uint i = 0; i < eids.length; i++) {
            // Skip sending to self
            if (_isCurrentChain(eids[i])) continue;
            
            if (peers[eids[i]] != bytes32(0)) {
                try this._sendMessage(eids[i], _message) {
                    // Message sent successfully
                } catch {
                    // Silently fail to prevent reverting the main operation
                    // In production, consider logging or retrying failed messages
                }
            }
        }
    }

    function _sendMessage(uint32 _dstEid, bytes memory _message) external {
        require(msg.sender == address(this), "Internal only");
        bytes memory options = abi.encodePacked(uint16(1), uint128(80000)); // Basic gas option
        MessagingFee memory fee = _quote(_dstEid, _message, options, false);
        _lzSend(_dstEid, _message, options, fee, payable(address(this)));
    }

    function _isCurrentChain(uint32 _eid) internal view returns (bool) {
        if (_eid == 40245 && CHAIN_ID == 84532) return true;  // Base Sepolia
        if (_eid == 40267 && CHAIN_ID == 80002) return true;  // Polygon Amoy
        if (_eid == 40161 && CHAIN_ID == 11155111) return true; // Ethereum Sepolia
        return false;
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

        emit CrossChainDataReceived(functionSig, 0, _origin.srcEid);

        if (keccak256(bytes(functionSig)) == keccak256(bytes("updateValuation"))) {
            (, uint256 value) = abi.decode(_message, (string, uint256));
            // Only update local data, don't send cross-chain message back
            rwaData.valuation = value;
            rwaData.valuationDate = block.timestamp;
            emit ValuationUpdated(value, block.timestamp);
            
        } else if (keccak256(bytes(functionSig)) == keccak256(bytes("updateRiskScore"))) {
            (, uint256 value) = abi.decode(_message, (string, uint256));
            require(value <= 100, "Score cannot exceed 100");
            // Only update local data, don't send cross-chain message back
            rwaData.riskScore = value;
            emit RiskScoreUpdated(value);
            
        } else if (keccak256(bytes(functionSig)) == keccak256(bytes("updateLocationScore"))) {
            (, uint256 value) = abi.decode(_message, (string, uint256));
            require(value <= 100, "Score cannot exceed 100");
            // Only update local data, don't send cross-chain message back
            rwaData.locationScore = value;
            emit LocationScoreUpdated(value);
            
        } else if (keccak256(bytes(functionSig)) == keccak256(bytes("updateBids"))) {
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

    // View functions
    function getRWAData() external view returns (RWAData memory) {
        return rwaData;
    }

    function getHighestBidInfo() external view returns (uint256 amount, uint256 timestamp, uint256 chainId) {
        return (rwaData.highestBid, rwaData.highestBidTimestamp, rwaData.highestBidChain);
    }

    function getLastBidInfo() external view returns (uint256 amount, uint256 timestamp) {
        return (rwaData.lastBid, rwaData.lastBidTimestamp);
    }
} 