import { SupportedChainId, TOKENS, Token } from "@/lib/constants";
import { getTelegramMembers } from "@/lib/telegramUtils";
import axios from "axios";
import chalk from "chalk";
import { NextResponse } from "next/server";

const CMC_API_KEY = process.env.CMC_API_KEY;
const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;
const CMC_API_URL =
  "https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest";
const DEX_API_URL = "https://api.dexscreener.com/latest/dex/search";
const DEX_PROFILES_URL = "https://api.dexscreener.com/token-profiles/latest/v1";
const GITHUB_API_URL = "https://api.github.com";
const COINGECKO_API_URL = "https://api.coingecko.com/api/v3";

interface DexPair {
  url: string;
  pairAddress: string;
  priceUsd?: string;
  priceChange: {
    h24: number;
  };
  liquidity?: {
    usd?: number;
  };
  volume: {
    h24: number;
  };
  fdv?: number;
  quoteToken: {
    symbol: string;
  };
  txns: {
    h24: {
      buys: number;
      sells: number;
    };
  };
}

interface DexProfile {
  url: string;
  chainId: string;
  tokenAddress: string;
  icon?: string;
  header?: string;
  description?: string;
  links: Array<{
    type: string;
    label: string;
    url: string;
  }>;
}

async function getDexScreenerData(token: Token) {
  try {
    const response = await axios.get<{ pairs: DexPair[] }>(
      `${DEX_API_URL}?q=${token.address}`
    );
    if (response.data?.pairs?.length > 0) {
      const pair = response.data.pairs.reduce((prev, current) =>
        prev.txns.h24.buys + prev.txns.h24.sells >
        current.txns.h24.buys + current.txns.h24.sells
          ? prev
          : current
      );
      return {
        priceUsd: pair.priceUsd,
        priceChange: pair.priceChange.h24,
        volume: pair.volume.h24,
        liquidity: pair.liquidity?.usd,
        fdv: pair.fdv,
        pairAddress: pair.pairAddress,
        quoteTokenSymbol: pair.quoteToken.symbol,
        url: pair.url,
      };
    }
  } catch (error: any) {
    console.error(
      chalk.red(
        `Error fetching DexScreener data for ${token.name}: ${error.message}`
      )
    );
  }
  return null;
}

async function getDexScreenerProfile(token: Token) {
  try {
    const response = await axios.get<DexProfile[]>(DEX_PROFILES_URL);
    if (response.data?.length > 0) {
      // Find profile matching our token address
      const profile = response.data.find(
        (p) => p.tokenAddress.toLowerCase() === token.address.toLowerCase()
      );
      if (profile) {
        return {
          description: profile.description,
          icon: profile.icon,
          header: profile.header,
          socialLinks: profile.links.map((link) => ({
            platform: link.type,
            label: link.label,
            url: link.url,
          })),
        };
      }
    }
  } catch (error: any) {
    console.error(
      chalk.red(
        `Error fetching DexScreener profile for ${token.name}: ${error.message}`
      )
    );
  }
  return null;
}

async function getCmcData(token: Token, chainId: SupportedChainId) {
  try {
    // First, get metadata for the token
    const metadataParams = { address: token.address };

    console.log(
      chalk.cyan(`Fetching CMC metadata for ${token.name} (${token.symbol})...`)
    );

    const metadataResponse = await axios.get(
      `https://pro-api.coinmarketcap.com/v2/cryptocurrency/info?address=${token.address}`,
      {
        headers: { "X-CMC_PRO_API_KEY": CMC_API_KEY },
        // params: metadataParams,
      }
    );

    // Extract the CMC ID from the response (first key in data object)
    const dataKeys = Object.keys(metadataResponse.data.data);
    const cmcIdFromResponse = dataKeys[0];
    const metadata = metadataResponse.data.data[cmcIdFromResponse];

    // Use pre-defined CMC ID if available, otherwise extract from metadata
    const cmcId = token.cmcId || metadata?.id;
    if (!cmcId) {
      console.error(chalk.red(`No CMC ID found for ${token.name}`));
      return null;
    }

    console.log(
      chalk.cyan(
        `Using CMC ID: ${cmcId} for ${token.name} (${
          token.cmcId ? "pre-defined" : "from metadata"
        })`
      )
    );

    // Get quotes data using ID
    console.log("fetching url: ", CMC_API_URL);
    const response = await axios.get(CMC_API_URL, {
      headers: { "X-CMC_PRO_API_KEY": CMC_API_KEY },
      params: { id: cmcId },
    });

    const cryptoData = response.data.data[cmcId];

    if (cryptoData) {
      const quote = cryptoData.quote.USD;

      let historicalData = null;
      try {
        console.log(
          chalk.cyan(`Fetching historical data for ${token.name}...`)
        );
        const historicalResponse = await axios.get(
          "https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/historical",
          {
            headers: { "X-CMC_PRO_API_KEY": CMC_API_KEY },
            params: {
              id: cmcId,
              count: 30,
              interval: "daily",
            },
          }
        );
        historicalData = historicalResponse.data;
        console.log("historicalResponse: ", historicalData);
      } catch (error: any) {
        console.error(
          chalk.yellow(
            `Could not fetch historical data for ${token.name}: ${error.message}`
          )
        );
      }

      let marketPairsData = null;
      try {
        console.log(chalk.cyan(`Fetching market pairs for ${token.name}...`));
        const marketPairsResponse = await axios.get(
          "https://pro-api.coinmarketcap.com/v2/cryptocurrency/market-pairs/latest",
          {
            headers: { "X-CMC_PRO_API_KEY": CMC_API_KEY },
            params: {
              id: cmcId,
            },
          }
        );
        marketPairsData = marketPairsResponse.data;
      } catch (error: any) {
        console.error(
          chalk.yellow(
            `Could not fetch market pairs for ${token.name}: ${error.message}`
          )
        );
      }
      const chatUrls: string[] = metadata?.urls?.chat || [];
      const telegramUrl =
        chatUrls.find((url: string) => url.includes("t.me/")) || null;

      let telegramMemberCount = 0;
      if (telegramUrl) {
        try {
          console.log(
            chalk.cyan(`Fetching Telegram members for ${token.name}...`)
          );
          telegramMemberCount = await getTelegramMembers(telegramUrl);
          console.log(
            chalk.green(
              `Telegram members for ${token.name}: ${telegramMemberCount}`
            )
          );
        } catch (error: any) {
          console.error(
            chalk.yellow(
              `Could not fetch Telegram members for ${token.name}: ${error.message}`
            )
          );
          console.log(
            chalk.blue(
              `Will attempt to get Telegram data from CoinGecko instead...`
            )
          );
        }
      }

      // Fetch GitHub data
      const githubData = await getGithubData(token, metadata);

      // Fetch CoinGecko data
      const coinGeckoData = await getCoinGeckoData(token, metadata);

      // Filter out unwanted fields from metadata
      const filteredMetadata = metadata
        ? {
            ...metadata,
            tags: undefined,
            "tag-names": undefined,
            "tag-groups": undefined,
            contract_address: undefined,
          }
        : metadata;

      // Remove undefined fields
      if (filteredMetadata) {
        delete filteredMetadata.tags;
        delete filteredMetadata["tag-names"];
        delete filteredMetadata["tag-groups"];
        delete filteredMetadata.contract_address;
      }

      return {
        price: quote.price,
        marketCap: quote.market_cap,
        volume24h: quote.volume_24h,
        circulatingSupply: cryptoData.circulating_supply,
        metadata: filteredMetadata,
        historical: historicalData,
        marketPairs: marketPairsData,
        ...(telegramMemberCount > 0 && {
          telegram: {
            url: telegramUrl,
            memberCount: telegramMemberCount,
          },
        }),
        github: githubData,
        coingecko: coinGeckoData,
      };
    }
  } catch (error: any) {
    console.error(
      chalk.red(
        `Error fetching CoinMarketCap data for ${token.name}: ${error.message} ${error}`
      )
    );
  }
  return null;
}

async function getGithubData(token: Token, metadata: any) {
  try {
    const sourceUrls = metadata?.urls?.source_code || [];
    const githubUrl = sourceUrls.find((url: string) =>
      url.includes("github.com")
    );

    if (!githubUrl) return null;

    // Extract owner and repo from URL
    const match = githubUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) return null;

    const [, owner, repo] = match;
    const cleanRepo = repo.replace(/\.git$/, "");

    console.log(chalk.cyan(`Fetching GitHub data for ${token.name}...`));

    const [repoResponse, contributorsResponse, releasesResponse] =
      await Promise.allSettled([
        axios.get(`${GITHUB_API_URL}/repos/${owner}/${cleanRepo}`),
        axios.get(`${GITHUB_API_URL}/repos/${owner}/${cleanRepo}/contributors`),
        axios.get(
          `${GITHUB_API_URL}/repos/${owner}/${cleanRepo}/releases?per_page=10`
        ),
      ]);

    let repoData = null;
    let contributors = null;
    let releases = null;

    if (repoResponse.status === "fulfilled") {
      repoData = repoResponse.value.data;
    }

    if (contributorsResponse.status === "fulfilled") {
      contributors = contributorsResponse.value.data;
    }

    if (releasesResponse.status === "fulfilled") {
      releases = releasesResponse.value.data;
    }

    if (repoData) {
      return {
        url: githubUrl,
        stars: repoData.stargazers_count,
        forks: repoData.forks_count,
        openIssues: repoData.open_issues_count,
        language: repoData.language,
        lastPush: repoData.pushed_at,
        contributors: contributors?.length || 0,
        latestRelease: releases?.[0]
          ? {
              name: releases[0].name,
              tagName: releases[0].tag_name,
              publishedAt: releases[0].published_at,
              downloadCount:
                releases[0].assets?.reduce(
                  (sum: number, asset: any) =>
                    sum + (asset.download_count || 0),
                  0
                ) || 0,
            }
          : null,
        totalReleases: releases?.length || 0,
      };
    }
  } catch (error: any) {
    console.error(
      chalk.yellow(
        `Could not fetch GitHub data for ${token.name}: ${error.message}`
      )
    );
  }
  return null;
}

async function getCoinGeckoData(token: Token, metadata: any) {
  try {
    if (!COINGECKO_API_KEY) {
      console.log(
        chalk.yellow(
          `CoinGecko API key not provided, skipping CoinGecko data for ${token.name}`
        )
      );
      return null;
    }

    const headers = {
      "x-cg-pro-api-key": COINGECKO_API_KEY,
    };

    // Try to find CoinGecko ID from metadata or use a search
    let coinGeckoId = null;

    // First try to search for the token
    console.log(chalk.cyan(`Searching CoinGecko for ${token.name}...`));
    const searchResponse = await axios.get(
      `${COINGECKO_API_URL}/search?query=${token.name}`,
      { headers }
    );

    const searchResults = searchResponse.data.coins || [];
    const match = searchResults.find(
      (coin: any) => coin.symbol.toLowerCase() === token.symbol.toLowerCase()
    );

    if (match) {
      coinGeckoId = match.id;
      console.log(
        chalk.green(`Found CoinGecko ID: ${coinGeckoId} for ${token.name}`)
      );
    } else {
      console.log(chalk.yellow(`No CoinGecko match found for ${token.name}`));
      return null;
    }

    // Fetch detailed coin data
    const coinResponse = await axios.get(
      `${COINGECKO_API_URL}/coins/${coinGeckoId}?localization=false&tickers=false&market_data=true&community_data=true&developer_data=true`,
      { headers }
    );

    const coinData = coinResponse.data;

    if (coinData) {
      // Fetch additional data in parallel
      const [tickersResponse, marketChartResponse, ohlcResponse] =
        await Promise.allSettled([
          // Get ticker data (exchange listings)
          axios.get(
            `${COINGECKO_API_URL}/coins/${coinGeckoId}/tickers?depth=true`,
            { headers }
          ),
          // Get 30-day market chart data
          axios.get(
            `${COINGECKO_API_URL}/coins/${coinGeckoId}/market_chart?vs_currency=usd&days=30`,
            { headers }
          ),
          // Get OHLC data (7 days)
          axios.get(
            `${COINGECKO_API_URL}/coins/${coinGeckoId}/ohlc?vs_currency=usd&days=7`,
            { headers }
          ),
        ]);

      let tickersData = null;
      let marketChartData = null;
      let ohlcData = null;

      if (tickersResponse.status === "fulfilled") {
        tickersData = tickersResponse.value.data;
      }

      if (marketChartResponse.status === "fulfilled") {
        marketChartData = marketChartResponse.value.data;
      }

      if (ohlcResponse.status === "fulfilled") {
        ohlcData = ohlcResponse.value.data;
      }

      return {
        id: coinGeckoId,
        marketCapRank: coinData.market_cap_rank,
        communityScore: coinData.community_score,
        developerScore: coinData.developer_score,
        liquidityScore: coinData.liquidity_score,
        publicInterestScore: coinData.public_interest_score,
        marketData: {
          currentPrice: coinData.market_data?.current_price?.usd,
          marketCap: coinData.market_data?.market_cap?.usd,
          volume24h: coinData.market_data?.total_volume?.usd,
          priceChange24h: coinData.market_data?.price_change_percentage_24h,
          priceChange7d: coinData.market_data?.price_change_percentage_7d,
          priceChange30d: coinData.market_data?.price_change_percentage_30d,
          ath: coinData.market_data?.ath?.usd,
          athDate: coinData.market_data?.ath_date?.usd,
          atl: coinData.market_data?.atl?.usd,
          atlDate: coinData.market_data?.atl_date?.usd,
        },
        communityData: {
          twitterFollowers: coinData.community_data?.twitter_followers,
          redditSubscribers: coinData.community_data?.reddit_subscribers,
          redditActiveUsers:
            coinData.community_data?.reddit_accounts_active_48h,
          telegramUsers: coinData.community_data?.telegram_channel_user_count,
        },
        developerData: {
          githubForks: coinData.developer_data?.forks,
          githubStars: coinData.developer_data?.stars,
          githubSubscribers: coinData.developer_data?.subscribers,
          githubCommits4Weeks: coinData.developer_data?.commit_count_4_weeks,
        },
        tickers:
          tickersData?.tickers?.slice(0, 10).map((ticker: any) => ({
            base: ticker.base,
            target: ticker.target,
            market: ticker.market?.name,
            last: ticker.last,
            volume: ticker.volume,
            costToMoveUpUsd: ticker.cost_to_move_up_usd,
            costToMoveDownUsd: ticker.cost_to_move_down_usd,
            spreadPercentage: ticker.bid_ask_spread_percentage,
            trustScore: ticker.trust_score,
            isStale: ticker.is_stale,
          })) || [],
        marketChart: {
          prices: marketChartData?.prices?.slice(-30) || [], // Last 30 data points
          marketCaps: marketChartData?.market_caps?.slice(-30) || [],
          volumes: marketChartData?.total_volumes?.slice(-30) || [],
        },
        ohlc: ohlcData || [],
      };
    }
  } catch (error: any) {
    console.error(
      chalk.yellow(
        `Could not fetch CoinGecko data for ${token.name}: ${error.message}`
      )
    );
  }
  return null;
}

async function getOnChainDexData(token: Token, chainId: SupportedChainId) {
  try {
    if (!COINGECKO_API_KEY) {
      return null;
    }

    const headers = {
      "x-cg-pro-api-key": COINGECKO_API_KEY,
    };

    // Map chain IDs to GeckoTerminal network names
    const networkMap: { [key: string]: string } = {
      ethereum: "eth",
      polygon: "polygon_pos",
      bsc: "bsc",
      avalanche: "avax",
      arbitrum: "arbitrum",
      optimism: "optimism",
      base: "base",
      flow: "flow", // May not be supported on GeckoTerminal
    };

    const networkName = networkMap[chainId];
    if (!networkName) {
      console.log(
        chalk.yellow(`Network ${chainId} not supported on GeckoTerminal`)
      );
      return null;
    }

    console.log(
      chalk.cyan(
        `Fetching OnChain DEX data for ${token.name} on ${networkName}...`
      )
    );

    const [tokenInfoResponse, poolsResponse] = await Promise.allSettled([
      // Get token info
      axios.get(
        `${COINGECKO_API_URL}/onchain/networks/${networkName}/tokens/${token.address}/info`,
        { headers }
      ),
      // Get top pools for this token
      axios.get(
        `${COINGECKO_API_URL}/onchain/networks/${networkName}/tokens/${token.address}/pools`,
        { headers }
      ),
    ]);

    let tokenInfo = null;
    let pools = null;

    if (tokenInfoResponse.status === "fulfilled") {
      tokenInfo = tokenInfoResponse.value.data;
    }

    if (poolsResponse.status === "fulfilled") {
      pools = poolsResponse.value.data;
    }

    if (tokenInfo || pools) {
      return {
        tokenInfo: tokenInfo
          ? {
              name: tokenInfo.data?.attributes?.name,
              symbol: tokenInfo.data?.attributes?.symbol,
              decimals: tokenInfo.data?.attributes?.decimals,
              totalSupply: tokenInfo.data?.attributes?.total_supply,
              description: tokenInfo.data?.attributes?.description,
              websites: tokenInfo.data?.attributes?.websites,
              socials: tokenInfo.data?.attributes?.socials,
              coingeckoId: tokenInfo.data?.attributes?.coingecko_coin_id,
            }
          : null,
        pools:
          pools?.data?.slice(0, 5).map((pool: any) => ({
            address: pool.id,
            name: pool.attributes?.name,
            baseTokenSymbol: pool.attributes?.base_token_symbol,
            quoteTokenSymbol: pool.attributes?.quote_token_symbol,
            baseTokenPrice: pool.attributes?.base_token_price_usd,
            quoteTokenPrice: pool.attributes?.quote_token_price_usd,
            priceChangePercentage24h:
              pool.attributes?.price_change_percentage?.h24,
            volume24h: pool.attributes?.volume_usd?.h24,
            liquidity: pool.attributes?.reserve_in_usd,
            dexName: pool.attributes?.dex_id,
            fdv: pool.attributes?.fdv_usd,
            marketCap: pool.attributes?.market_cap_usd,
            poolCreatedAt: pool.attributes?.pool_created_at,
          })) || [],
      };
    }
  } catch (error: any) {
    console.error(
      chalk.yellow(
        `Could not fetch OnChain DEX data for ${token.name}: ${error.message}`
      )
    );
  }
  return null;
}

export async function GET() {
  console.log(chalk.blue("Fetching token data..."));
  if (!CMC_API_KEY) {
    console.error(chalk.red("CMC_API_KEY environment variable not set."));
    return NextResponse.json(
      { error: "CMC_API_KEY environment variable not set." },
      { status: 500 }
    );
  }

  const allTokensData = [];

  for (const chainId of Object.values(SupportedChainId)) {
    const tokens = TOKENS[chainId];
    for (const token of tokens) {
      console.log(
        chalk.yellow(`Fetching data for ${token.name} on ${chainId}...`)
      );

      const dexData = await getDexScreenerData(token);
      const dexProfile = await getDexScreenerProfile(token);
      const cmcData = await getCmcData(token, chainId);

      // Get metadata from CMC data for CoinGecko integration
      const metadata = cmcData?.metadata;
      const coinGeckoData = await getCoinGeckoData(token, metadata);

      // Get OnChain DEX data
      const onChainDexData = await getOnChainDexData(token, chainId);

      allTokensData.push({
        name: token.name,
        symbol: token.symbol,
        address: token.address,
        chain: chainId,
        dexscreener: dexData,
        dexProfile: dexProfile,
        coinmarketcap: cmcData,
        coingecko: coinGeckoData,
        onchainDex: onChainDexData,
      });
    }
  }

  console.log(chalk.green("Successfully fetched all token data."));
  return NextResponse.json(allTokensData);
}
