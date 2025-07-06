next I would like to have a set of addresses from tokens:

- flow mainnet
  WETH: 0x2F6F07CDcf3588944Bf4C42aC74ff24bF56e7590
  FVIX: 0x00f4CE400130C9383115f3858F9CA54677426583
  ankrFLOW: 0x1b97100eA1D7126C4d60027e231EA4CB25314bdb
- ethereum mainnet
  LINK : 0x514910771AF9Ca656af840dff83E8264EcF986CA
  UNI : 0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984
  AAVE : 0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9

then I would like to fetch a bunch of data from these providers, dex screener

ex:https://api.dexscreener.com/latest/dex/tokens/0x91d7730e698cAe7514f319873a14061C8a5eF655?chainId=1

coinmarket cap as much data as possible for each of these tokens using hte free API.
CMC api key is in envs with CMC_API_KEY. Propose other data that I can augment this data as well.

store these under a const.ts file and then do an endpoint that once I call it will fetch all these data. Use extensive logging using chalk library.
