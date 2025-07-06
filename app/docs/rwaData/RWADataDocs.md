Property Data
Retrieve data for residential and commercial properties in the US.

The /properties endpoints allow you to retrieve data for over 140 million properties in the United States, covering most residential and commercial properties in the country.

Property Records
Each property record contains several fields with information for that specific property:

Property attributes: including the property type, number of bedrooms, number of bathrooms, living area size, lot size, year built, etc.
HOA fees: including the homeowner's association monthly fee or assessment amount
Property features: including room count, floor count, architecture type, parking, pool type, cooling and heating types, construction materials, etc.
Tax assessment history: including the assessed values of the land and building structures
Tax history: including the tax year and the total tax amount
Sale history: including the property's last sold date and price, as well as the sale transaction history
Current owner information: including the owner's name, type, mailing address, and owner-occupied status
View the full property data schema to learn more about the returned fields and their possible values.

Below is an example of a property record returned by our API:

Property Record Example

{
"id": "5500-Grand-Lake-Dr,-San-Antonio,-TX-78244",
"formattedAddress": "5500 Grand Lake Dr, San Antonio, TX 78244",
"addressLine1": "5500 Grand Lake Dr",
"addressLine2": null,
"city": "San Antonio",
"state": "TX",
"zipCode": "78244",
"county": "Bexar",
"latitude": 29.476011,
"longitude": -98.351454,
"propertyType": "Single Family",
"bedrooms": 3,
"bathrooms": 2,
"squareFootage": 1878,
"lotSize": 8843,
"yearBuilt": 1973,
"assessorID": "05076-103-0500",
"legalDescription": "CB 5076A BLK 3 LOT 50",
"subdivision": "CONV A/S CODE",
"zoning": "RH",
"lastSaleDate": "2017-10-19T00:00:00.000Z",
"lastSalePrice": 185000,
"hoa": {
"fee": 175
},
"features": {
"architectureType": "Contemporary",
"cooling": true,
"coolingType": "Central",
"exteriorType": "Wood",
"fireplace": true,
"fireplaceType": "Masonry",
"floorCount": 1,
"foundationType": "Slab / Mat / Raft",
"garage": true,
"garageSpaces": 2,
"garageType": "Garage",
"heating": true,
"heatingType": "Forced Air",
"pool": true,
"poolType": "Concrete",
"roofType": "Asphalt",
"roomCount": 5,
"unitCount": 1,
"viewType": "City"
},
"taxAssessments": {
"2019": {
"year": 2019,
"value": 135430,
"land": 23450,
"improvements": 111980
},
"2020": {
"year": 2020,
"value": 142610,
"land": 23450,
"improvements": 119160
},
"2021": {
"year": 2021,
"value": 163440,
"land": 45050,
"improvements": 118390
},
"2022": {
"year": 2022,
"value": 197600,
"land": 49560,
"improvements": 148040
},
"2023": {
"year": 2023,
"value": 225790,
"land": 59380,
"improvements": 166410
}
},
"propertyTaxes": {
"2019": {
"year": 2019,
"total": 2984
},
"2020": {
"year": 2020,
"total": 3023
},
"2021": {
"year": 2021,
"total": 3455
},
"2022": {
"year": 2022,
"total": 4091
},
"2023": {
"year": 2023,
"total": 4201
}
},
"history": {
"2004-06-16": {
"event": "Sale",
"date": "2004-06-16T00:00:00.000Z",
"price": 95000
},
"2017-10-19": {
"event": "Sale",
"date": "2017-10-19T00:00:00.000Z",
"price": 185000
}
},
"owner": {
"names": [
"Michael Smith"
],
"type": "Individual",
"mailingAddress": {
"id": "149-Weaver-Blvd,---264,-Weaverville,-NC-28787",
"formattedAddress": "149 Weaver Blvd, # 264, Weaverville, NC 28787",
"addressLine1": "149 Weaver Blvd",
"addressLine2": "# 264",
"city": "Weaverville",
"state": "NC",
"zipCode": "28787"
}
},
"ownerOccupied": false
}
📘
Data availability of specific property record fields may vary by county and state. Our API will always return all available fields and data for each property.

Data Sources and Coverage
Our property record data is obtained from various sources, including public county records, recorded deeds, and tax assessor databases.

We continuously update our property database, and each individual property record is updated at least once per week. Certain updates, including recent property sales and tax assessments, may take longer to be reflected in our database, based on the availability of recent data in public records.

We aim to provide at least 94% property record coverage for residential properties in all 50 US states, including single-family, condos, townhomes, manufactured, and 2-4 unit multi-family properties. This includes vacant land parcels.

We also aim to provide at least 90% property record coverage for 5+ unit commercial dwellings, including apartment buildings, condo complexes, and other large residential developments. At this time, we do not have property records coverage for office, retail, industrial, manufacturing, farm or other non-residential commercial properties.

Search Queries
The /properties endpoint supports retrieving data for a specific address; searching for properties in a city, state or zip code; or searching for them in a particular geographical area.

See this guide for an overview of how to structure your search queries to retrieve the property data you are looking for, as well as how to retrieve property data in bulk.

Pagination
The /properties endpoint will return large lists of property records in sets, up to 500 records at a time, and supports pagination.

See this guide for an overview of how to use the limit and offset query parameters to retrieve additional sets of results.

Available Endpoints
The following endpoints are available for retrieving property data and records:

/properties: an endpoint that allows you to retrieve a group of property records matching specific criteria, or a single property record for a specific address

/properties/random: an endpoint that allows you to retrieve up to 500 property records selected at random, to facilitate testing or use cases that require a random sampling of property data

/properties/{id}: an endpoint that allows you to retrieve a specific property record, given its internal id. The id can be retrieved using the other /properties, /avm or /listings endpoints, or cached in your application from prior requests
