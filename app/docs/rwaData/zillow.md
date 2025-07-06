# Zillow API Integration

## Overview

The Zillow API provides comprehensive property data including pricing, property details, market information, and comparable properties. This integration enables real-time property valuation and market analysis for RWA tokenization.

## API Configuration

### Environment Variables

```bash
ZILLOW_API_KEY=your_rapidapi_key_here
```

### API Endpoint

- **Host**: `zillow-working-api.p.rapidapi.com`
- **Method**: GET
- **Base Path**: `/pro/byaddress`

## Request Implementation

### Basic Request Structure

```typescript
interface ZillowRequest {
  propertyaddress: string; // URL encoded address
  x_rapidapi_key: string;
  x_rapidapi_host: string;
}
```

### Example Implementation

```typescript
import https from "https";

interface ZillowApiResponse {
  message: string;
  source: string;
  zillowURL: string;
  propertyDetails: PropertyDetails;
  // ... other response fields
}

interface PropertyDetails {
  price: number;
  priceChange: number | null;
  streetAddress: string;
  city: string;
  state: string;
  zipcode: string;
  resoFacts: ResoFacts;
  address: Address;
  bedrooms: number;
  bathrooms: number;
  yearBuilt: number;
  livingArea: number;
  homeType: string;
  homeStatus: string;
  // ... additional fields
}

interface ResoFacts {
  bathrooms: number;
  bedrooms: number;
  livingArea: string;
  lotSize: string;
  yearBuilt: number;
  taxAnnualAmount: number;
  taxAssessedValue: number;
  pricePerSquareFoot: number;
  // ... additional property facts
}

interface Address {
  streetAddress: string;
  city: string;
  state: string;
  zipcode: string;
  neighborhood: string | null;
  community: string | null;
  subdivision: string | null;
}

export async function fetchZillowPropertyData(
  address: string
): Promise<ZillowApiResponse> {
  const encodedAddress = encodeURIComponent(address);
  const apiKey = process.env.ZILLOW_API_KEY;

  if (!apiKey) {
    throw new Error("ZILLOW_API_KEY environment variable is required");
  }

  const options = {
    method: "GET",
    hostname: "zillow-working-api.p.rapidapi.com",
    port: null,
    path: `/pro/byaddress?propertyaddress=${encodedAddress}`,
    headers: {
      "x-rapidapi-key": apiKey,
      "x-rapidapi-host": "zillow-working-api.p.rapidapi.com",
    },
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const response = JSON.parse(data);
          resolve(response);
        } catch (error) {
          reject(new Error(`Failed to parse Zillow API response: ${error}`));
        }
      });
    });

    req.on("error", (error) => {
      reject(new Error(`Zillow API request failed: ${error.message}`));
    });

    req.end();
  });
}
```

## Response Data Structure

### Key Property Information

The Zillow API returns comprehensive property data including:

1. **Basic Property Info**:

   - Price and price changes
   - Address details (street, city, state, zip)
   - Property type and status

2. **Property Specifications**:

   - Bedrooms and bathrooms count
   - Square footage and lot size
   - Year built
   - Property condition

3. **Financial Data**:

   - Current price
   - Price per square foot
   - Annual property taxes
   - Tax assessed value

4. **Market Information**:

   - Home status (FOR_SALE, RECENTLY_SOLD, etc.)
   - Days on market
   - Comparable properties

5. **Property Features**:
   - Appliances and amenities
   - Heating/cooling systems
   - Parking information
   - Exterior and interior features

### Data Extraction Functions

```typescript
export function extractPropertyValuation(data: ZillowApiResponse) {
  const details = data.propertyDetails;

  return {
    currentPrice: details.price,
    pricePerSqFt: details.resoFacts.pricePerSquareFoot,
    taxAssessedValue: details.resoFacts.taxAssessedValue,
    annualTaxAmount: details.resoFacts.taxAnnualAmount,
    livingArea: details.livingArea,
    lotSize: details.resoFacts.lotSize,
    yearBuilt: details.yearBuilt,
    propertyType: details.homeType,
    marketStatus: details.homeStatus,
  };
}

export function extractPropertyFeatures(data: ZillowApiResponse) {
  const facts = data.propertyDetails.resoFacts;

  return {
    bedrooms: facts.bedrooms,
    bathrooms: facts.bathrooms,
    appliances: facts.appliances || [],
    heating: facts.heating || [],
    cooling: facts.cooling || [],
    parking: facts.parkingFeatures || [],
    exteriorFeatures: facts.exteriorFeatures || [],
    interiorFeatures: facts.interiorFeatures || [],
    securityFeatures: facts.securityFeatures || [],
    utilities: facts.utilities || [],
  };
}

export function extractMarketData(data: ZillowApiResponse) {
  return {
    homeStatus: data.propertyDetails.homeStatus,
    listingDate: data.propertyDetails.onMarketDate,
    comparableProperties:
      data.collections?.modules?.find(
        (module) => module.name === "Similar homes"
      )?.propertyDetails || [],
  };
}
```

## Integration with RWA System

### Property Valuation Enhancement

```typescript
export async function enhancePropertyValuation(propertyAddress: string) {
  try {
    const zillowData = await fetchZillowPropertyData(propertyAddress);

    const valuation = extractPropertyValuation(zillowData);
    const features = extractPropertyFeatures(zillowData);
    const marketData = extractMarketData(zillowData);

    return {
      zillowValuation: valuation,
      propertyFeatures: features,
      marketInsights: marketData,
      dataSource: "Zillow API",
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Failed to fetch Zillow data:", error);
    throw error;
  }
}
```

### Risk Assessment Integration

```typescript
export function calculatePropertyRiskScore(zillowData: ZillowApiResponse) {
  const details = zillowData.propertyDetails;
  const facts = details.resoFacts;

  let riskScore = 0;

  // Price volatility risk
  if (details.priceChange) {
    const priceChangePercent = Math.abs(details.priceChange / details.price);
    riskScore += priceChangePercent * 100;
  }

  // Market liquidity risk
  if (details.homeStatus === "RECENTLY_SOLD") {
    riskScore += 20; // Lower liquidity for sold properties
  }

  // Property age risk
  const currentYear = new Date().getFullYear();
  const propertyAge = currentYear - details.yearBuilt;
  if (propertyAge > 50) {
    riskScore += 15;
  }

  // Tax assessment risk
  const taxToPriceRatio = facts.taxAssessedValue / details.price;
  if (taxToPriceRatio > 0.8) {
    riskScore += 10;
  }

  return Math.min(riskScore, 100); // Cap at 100
}
```

## Error Handling

### Common Error Scenarios

```typescript
export function handleZillowApiError(error: any) {
  if (error.message.includes("401")) {
    throw new Error("Invalid Zillow API key");
  }

  if (error.message.includes("404")) {
    throw new Error("Property not found in Zillow database");
  }

  if (error.message.includes("429")) {
    throw new Error("Zillow API rate limit exceeded");
  }

  throw new Error(`Zillow API error: ${error.message}`);
}
```

## Rate Limiting and Caching

### Implementation Considerations

- Zillow API has rate limits (check RapidAPI dashboard)
- Implement caching for frequently accessed properties
- Consider batch processing for multiple addresses
- Store historical data for trend analysis

### Caching Strategy

```typescript
import NodeCache from "node-cache";

const zillowCache = new NodeCache({ stdTTL: 3600 }); // 1 hour cache

export async function getCachedZillowData(address: string) {
  const cacheKey = `zillow_${address}`;
  const cached = zillowCache.get(cacheKey);

  if (cached) {
    return cached as ZillowApiResponse;
  }

  const data = await fetchZillowPropertyData(address);
  zillowCache.set(cacheKey, data);

  return data;
}
```

## Usage Example

```typescript
// Fetch property data
const propertyAddress = "1875 AVONDALE Circle, Jacksonville, FL 32205";
const zillowData = await fetchZillowPropertyData(propertyAddress);

// Extract valuation metrics
const valuation = extractPropertyValuation(zillowData);
console.log("Property Value:", valuation.currentPrice);
console.log("Price per sq ft:", valuation.pricePerSqFt);

// Calculate risk score
const riskScore = calculatePropertyRiskScore(zillowData);
console.log("Risk Score:", riskScore);

// Get market insights
const marketData = extractMarketData(zillowData);
console.log("Market Status:", marketData.homeStatus);
```

## Data Quality Considerations

1. **Address Formatting**: Ensure addresses are properly formatted and URL encoded
2. **Data Freshness**: Zillow data may have delays, consider timestamp validation
3. **Missing Data**: Handle null/undefined values gracefully
4. **Data Consistency**: Validate response structure before processing
5. **Geographic Coverage**: Verify API coverage for target markets

## Integration Points

- **Property Valuation Service**: Enhance existing valuation models
- **Risk Assessment Engine**: Incorporate Zillow data into risk calculations
- **Market Analysis**: Use comparable properties for market insights
- **Tokenization Process**: Validate property data during tokenization
- **Portfolio Management**: Monitor property performance using Zillow metrics
