"use client";

import { amoy, base, ethSepolia } from "@/lib/constants";
import { useEffect, useState } from "react";
import { createPublicClient, createWalletClient, custom, http } from "viem";
import { baseSepolia, Chain, polygonAmoy, sepolia } from "viem/chains";

// Extend Window interface for ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: {
        method: string;
        params?: unknown[];
      }) => Promise<unknown>;
      on: (event: string, callback: (accounts: string[]) => void) => void;
      removeListener: (
        event: string,
        callback: (accounts: string[]) => void
      ) => void;
    };
  }
}

// ABI from the deployment files
const rwaTokenAbi = [
  {
    inputs: [],
    name: "getRWAData",
    outputs: [
      {
        components: [
          { internalType: "string", name: "description", type: "string" },
          { internalType: "string", name: "physicalAddress", type: "string" },
          { internalType: "uint256", name: "valuation", type: "uint256" },
          { internalType: "uint256", name: "valuationDate", type: "uint256" },
          { internalType: "uint256", name: "squareMeters", type: "uint256" },
          { internalType: "uint256", name: "riskScore", type: "uint256" },
          { internalType: "uint256", name: "locationScore", type: "uint256" },
          { internalType: "uint256", name: "highestBid", type: "uint256" },
          {
            internalType: "uint256",
            name: "highestBidTimestamp",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "highestBidChain",
            type: "uint256",
          },
          { internalType: "uint256", name: "lastBid", type: "uint256" },
          {
            internalType: "uint256",
            name: "lastBidTimestamp",
            type: "uint256",
          },
        ],
        internalType: "struct RWAToken.RWAData",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "bid",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [],
    name: "getContractBalance",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "estimateBidFee",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

// Define chains and their corresponding contract data
const chains: {
  viemChain: Chain;
  contract: {
    eid: number;
    endpoint: string;
    rwaToken: string;
  };
  name: string;
  rpcEndpoint: string;
}[] = [
  {
    viemChain: sepolia,
    contract: ethSepolia,
    name: "Ethereum Sepolia",
    rpcEndpoint: "sepolia",
  },
  {
    viemChain: baseSepolia,
    contract: base,
    name: "Base Sepolia",
    rpcEndpoint: "base-sepolia",
  },
  {
    viemChain: polygonAmoy,
    contract: amoy,
    name: "Polygon Amoy",
    rpcEndpoint: "polygon-amoy",
  },
];

// Helper to create a public client
const getClient = (rpcEndpoint: string, chain: Chain) => {
  const infuraKey = process.env.NEXT_PUBLIC_INFURA_KEY;
  if (!infuraKey) {
    console.error("NEXT_PUBLIC_INFURA_KEY is not set in .env.local");
    return null;
  }

  return createPublicClient({
    chain,
    transport: http(`https://${rpcEndpoint}.infura.io/v3/${infuraKey}`),
  });
};

type RWAData = {
  description: string;
  physicalAddress: string;
  valuation: bigint;
  valuationDate: bigint;
  squareMeters: bigint;
  riskScore: bigint;
  locationScore: bigint;
  highestBid: bigint;
  highestBidTimestamp: bigint;
  highestBidChain: bigint;
  lastBid: bigint;
  lastBidTimestamp: bigint;
};

export default function StatePage() {
  const [data, setData] = useState<Record<string, RWAData>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [bidAmount, setBidAmount] = useState<Record<string, string>>({});
  const [bidding, setBidding] = useState<Record<string, boolean>>({});

  // Connect wallet function
  const connectWallet = async () => {
    try {
      setIsConnecting(true);
      if (typeof window !== "undefined" && (window as any).ethereum) {
        const accounts = await (window as any).ethereum.request({
          method: "eth_requestAccounts",
        });
        setAccount(accounts[0]);
      } else {
        alert("Please install MetaMask or another Web3 wallet");
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect wallet function
  const disconnectWallet = () => {
    setAccount(null);
  };

  // Place bid function
  const placeBid = async (
    chainName: string,
    contractAddress: string,
    viemChain: Chain
  ) => {
    if (!account) {
      alert("Please connect your wallet first");
      return;
    }

    const usdAmount = bidAmount[chainName];
    if (!usdAmount || parseFloat(usdAmount) <= 0) {
      alert("Please enter a valid bid amount in USD");
      return;
    }

    try {
      setBidding((prev) => ({ ...prev, [chainName]: true }));

      // Create wallet client
      const walletClient = createWalletClient({
        chain: viemChain,
        transport: custom((window as any).ethereum as any),
      });

      // Switch to the correct chain
      try {
        await (window as any).ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: `0x${viemChain.id.toString(16)}` }],
        });
      } catch (switchError: unknown) {
        // Chain not added to wallet
        const error = switchError as { code: number };
        if (error.code === 4902) {
          await (window as any).ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: `0x${viemChain.id.toString(16)}`,
                chainName: viemChain.name,
                nativeCurrency: viemChain.nativeCurrency,
                rpcUrls: viemChain.rpcUrls.default.http,
                blockExplorerUrls: viemChain.blockExplorers?.default
                  ? [viemChain.blockExplorers.default.url]
                  : [],
              },
            ],
          });
        }
      }

      // Send bid transaction
      const hash = await walletClient.writeContract({
        address: contractAddress as `0x${string}`,
        abi: rwaTokenAbi,
        functionName: "bid",
        // value: parseEther(usdAmount), // Use USD amount directly as arbitrary value
        account: account as `0x${string}`,
      });

      alert(`Bid placed successfully! $${usdAmount} USD\nTransaction: ${hash}`);

      // Reset bid amount and refresh data
      setBidAmount((prev) => ({ ...prev, [chainName]: "" }));

      // Refresh data after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error("Failed to place bid:", error);
      alert("Failed to place bid. Please try again.");
    } finally {
      setBidding((prev) => ({ ...prev, [chainName]: false }));
    }
  };

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const allData: Record<string, RWAData> = {};
        for (const chainInfo of chains) {
          console.log("rpcEndpoint", chainInfo.rpcEndpoint);
          const client = getClient(chainInfo.rpcEndpoint, chainInfo.viemChain);
          if (!client) {
            throw new Error(`Failed to create client for ${chainInfo.name}`);
          }

          const result = (await client.readContract({
            address: chainInfo.contract.rwaToken as `0x${string}`,
            abi: rwaTokenAbi,
            functionName: "getRWAData",
          })) as RWAData;
          console.log("result:", result);

          allData[chainInfo.name] = result;
        }
        console.log("allData:", allData);
        setData(allData);
      } catch (err: unknown) {
        console.error(err);
        setError(
          (err as Error).message ||
            "An unexpected error occurred while fetching data."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  const renderCard = (chainName: string, chainData: RWAData | undefined) => {
    const formatValuation = (val: bigint) =>
      `$${Number(val).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;

    const formatBidAmount = (val: bigint) => {
      if (val === BigInt(0)) return "No bids";
      return `$${Number(val).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    };

    const formatTimestamp = (timestamp: bigint) => {
      if (timestamp === BigInt(0)) return "No bids yet";
      return new Date(Number(timestamp) * 1000).toLocaleDateString();
    };

    const getExplorerLink = (chainName: string, address: string) => {
      const explorerUrls: Record<string, string> = {
        "Ethereum Sepolia": "https://sepolia.etherscan.io/address/",
        "Base Sepolia": "https://sepolia.basescan.org/address/",
        "Polygon Amoy": "https://amoy.polygonscan.com/address/",
      };
      return explorerUrls[chainName] + address;
    };

    const getContractAddress = (chainName: string) => {
      const addresses: Record<string, string> = {
        "Ethereum Sepolia": "0xd3042a0244dD3428F6B327b9C245D24AF0024bd8",
        "Base Sepolia": "0x4Fea3A6A4CBaCBc848065D18F04B9524d635e1e4",
        "Polygon Amoy": "0x7B79861D0C7092C2FD4831F3a5baA299a219df51",
      };
      return addresses[chainName];
    };

    const getContractName = (chainName: string) => {
      const names: Record<string, string> = {
        "Ethereum Sepolia": "RWAToken-ETH",
        "Base Sepolia": "RWAToken-BASE",
        "Polygon Amoy": "RWAToken-POLY",
      };
      return names[chainName];
    };

    const getViemChain = (chainName: string): Chain => {
      const viemChains: Record<string, Chain> = {
        "Ethereum Sepolia": sepolia,
        "Base Sepolia": baseSepolia,
        "Polygon Amoy": polygonAmoy,
      };
      return viemChains[chainName];
    };

    return (
      <div key={chainName} className="w-full md:w-1/3">
        <div className="bg-gray-800 border border-[#4B0082]/30 rounded-lg p-6 transform hover:scale-105 transition-transform duration-300 hover:border-[#008080]/50">
          <h2 className="text-2xl font-bold mb-4 font-merriweather text-[#008080]">
            {chainName}
          </h2>
          {chainData &&
          chainData.riskScore !== undefined &&
          chainData.locationScore !== undefined ? (
            <>
              <ul className="space-y-3 mb-6">
                <li className="flex justify-between items-center">
                  <span className="font-semibold font-roboto text-gray-300">
                    Valuation:
                  </span>
                  <span className="font-merriweather text-lg text-[#008080]">
                    {formatValuation(chainData.valuation)}
                  </span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="font-semibold font-roboto text-gray-300">
                    Risk Score:
                  </span>
                  <span className="font-merriweather text-lg text-red-400">
                    {chainData.riskScore.toString()} / 100
                  </span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="font-semibold font-roboto text-gray-300">
                    Location Score:
                  </span>
                  <span className="font-merriweather text-lg text-purple-400">
                    {chainData.locationScore.toString()} / 100
                  </span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="font-semibold font-roboto text-gray-300">
                    Highest Bid:
                  </span>
                  <span className="font-merriweather text-lg text-[#008080]">
                    {formatBidAmount(chainData.highestBid)}
                  </span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="font-semibold font-roboto text-gray-300">
                    Last Bid:
                  </span>
                  <span className="font-merriweather text-lg text-cyan-400">
                    {formatBidAmount(chainData.lastBid)}
                  </span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="font-semibold font-roboto text-gray-300">
                    Last Bid Date:
                  </span>
                  <span className="font-roboto text-sm text-gray-400">
                    {formatTimestamp(chainData.lastBidTimestamp)}
                  </span>
                </li>
              </ul>

              {/* Bid Section */}
              <div className="border-t border-gray-700 pt-4">
                <div className="flex flex-col space-y-3">
                  <div className="flex space-x-2">
                    <input
                      type="number"
                      step="10"
                      min="0"
                      placeholder="100"
                      value={bidAmount[chainName] || ""}
                      onChange={(e) =>
                        setBidAmount((prev) => ({
                          ...prev,
                          [chainName]: e.target.value,
                        }))
                      }
                      className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#008080] focus:border-transparent"
                    />
                    <span className="px-3 py-2 text-gray-300 font-roboto">
                      USD
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      placeBid(
                        chainName,
                        getContractAddress(chainName),
                        getViemChain(chainName)
                      )
                    }
                    disabled={bidding[chainName] || !account}
                    className={`w-full py-2 px-4 rounded-lg font-roboto font-semibold transition-colors duration-200 ${
                      bidding[chainName] || !account
                        ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                        : "bg-[#008080] hover:bg-[#006666] text-white"
                    }`}
                  >
                    {bidding[chainName]
                      ? "Placing Bid..."
                      : !account
                      ? "Connect Wallet to Bid"
                      : "Place Bid"}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <p className="text-gray-400">Could not load data.</p>
          )}
        </div>

        {/* Contract Address Links */}
        <div className="mt-3 text-center space-y-1">
          <div className="text-sm font-roboto font-semibold text-white">
            {getContractName(chainName)}
          </div>
          <div className="space-y-1">
            <a
              href={getExplorerLink(chainName, getContractAddress(chainName))}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-xs font-roboto text-[#008080] hover:text-[#4B0082] transition-colors duration-200"
            >
              View on {chainName.split(" ")[0]} Explorer
            </a>
            <a
              href={`https://testnet.layerzeroscan.com/address/${getContractAddress(
                chainName
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-xs font-roboto text-[#008080] hover:text-[#4B0082] transition-colors duration-200"
            >
              View on LayerZero Scan
            </a>
          </div>
        </div>
      </div>
    );
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-8 bg-gray-900 text-white">
      {/* Header */}
      <div className="z-10 w-full max-w-6xl items-center justify-center lg:flex mb-8">
        <div className="flex items-center justify-center space-x-8">
          <img
            src="/logo_darkmode.png"
            alt="RWA Property Logo"
            className="h-44 w-44 object-contain"
          />
          <div className="text-center">
            <h1 className="text-4xl font-bold font-merriweather bg-gradient-to-r from-[#4B0082] to-[#008080] bg-clip-text text-transparent">
              Cross-Chain RWA Property
            </h1>
            <p className="text-lg font-roboto text-gray-300 mt-2">
              Tokenized Real Estate Investment Platform
            </p>
          </div>
        </div>
      </div>

      {/* Wallet Connection Section */}
      <div className="w-full max-w-6xl mb-8 flex justify-center">
        {!account ? (
          <button
            onClick={connectWallet}
            disabled={isConnecting}
            className={`py-3 px-6 rounded-lg font-roboto font-semibold transition-colors duration-200 ${
              isConnecting
                ? "bg-gray-600 text-gray-400 cursor-not-allowed"
                : "bg-[#4B0082] hover:bg-[#5A0099] text-white"
            }`}
          >
            {isConnecting ? "Connecting..." : "Connect Wallet"}
          </button>
        ) : (
          <div className="flex items-center space-x-4">
            <span className="text-gray-300 font-roboto">
              Connected: {account.slice(0, 6)}...{account.slice(-4)}
            </span>
            <button
              onClick={disconnectWallet}
              className="py-2 px-4 rounded-lg font-roboto font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors duration-200"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>

      {/* Property Overview Section */}
      <div className="w-full max-w-6xl mb-12 bg-gray-800 rounded-2xl p-8 shadow-2xl border border-[#4B0082]/20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Property Image */}
          <div className="order-2 lg:order-1">
            <div className="relative overflow-hidden rounded-xl shadow-lg">
              <img
                src="/house.png"
                alt="Luxury Downtown Property"
                className="w-full h-80 object-cover hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
            </div>
          </div>

          {/* Property Details */}
          <div className="order-1 lg:order-2 space-y-6">
            <div>
              <h2 className="text-3xl font-bold font-merriweather text-white mb-2">
                Luxury Downtown Property
              </h2>
              <p className="text-gray-300 text-lg leading-relaxed font-roboto">
                Premium residential property in the heart of the downtown
                financial district. This modern architectural masterpiece
                features contemporary design with high-end finishes and stunning
                city views. Located in a prime location with excellent
                connectivity and amenities.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-[#008080] rounded-full"></div>
                <span className="text-gray-300 font-roboto">
                  <strong className="text-white">Address:</strong> 7849 S Drexel
                  Ave, Chicago, IL 60619
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-[#4B0082] rounded-full"></div>
                <span className="text-gray-300 font-roboto">
                  <strong className="text-white">Size:</strong> 135 sq meters
                  (1,453 sq ft)
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-[#008080] rounded-full"></div>
                <span className="text-gray-300 font-roboto">
                  <strong className="text-white">Base Valuation:</strong>{" "}
                  $290,000 USD
                </span>
              </div>
            </div>

            <div className="bg-gradient-to-r from-[#4B0082]/20 to-[#008080]/20 rounded-lg p-4 border border-[#4B0082]/30">
              <h3 className="text-xl font-semibold font-merriweather text-[#008080] mb-2">
                Investment Highlights
              </h3>
              <ul className="space-y-2 text-gray-300 font-roboto">
                <li>• Prime downtown location with high growth potential</li>
                <li>• Modern design with premium finishes</li>
                <li>• Excellent connectivity and infrastructure</li>
                <li>• Cross-chain tokenized ownership</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center space-x-4 mb-8">
          <div className="loader ease-linear rounded-full border-4 border-t-4 border-[#008080] h-12 w-12"></div>
          <p className="text-xl text-gray-300 font-roboto">
            Fetching cross-chain data...
          </p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-900/20 border border-red-500 text-red-100 px-6 py-4 rounded-lg relative mb-8 max-w-4xl">
          <strong className="font-bold font-roboto">Error:</strong>
          <span className="block sm:inline ml-2 font-roboto">{error}</span>
        </div>
      )}

      {/* Chain Data Section */}
      {!loading && !error && (
        <div className="w-full max-w-6xl">
          <h2 className="text-3xl font-bold text-center mb-8 text-white font-merriweather">
            Live Cross-Chain Data
          </h2>
          <div className="flex flex-col md:flex-row gap-6 justify-center">
            {chains.map((chain) => renderCard(chain.name, data[chain.name]))}
          </div>
        </div>
      )}

      {/* Additional CSS for loader animation */}
      <style jsx>{`
        .loader {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </main>
  );
}
