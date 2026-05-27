# SOURCES.md — Data Source Research

## 1. SAP — Fuel & Procurement Data

### What I researched
SAP stores procurement and consumption data in several modules:
- MM (Materials Management) for procurement
- PM (Plant Maintenance) for fuel consumption
- CO (Controlling) for cost allocation

Common export methods:
- SE16/SE16N: Direct table export to CSV/Excel
- MB52/MB51: Material document reports
- ME2M: Purchase order reports
- IDocs: Intermediate Documents for system-to-system transfer

### What I learned
Real SAP exports have several painful characteristics:
- Column headers are often in German (Menge = Quantity,
  Werk = Plant, Buchungsdatum = Posting Date)
- Plant codes (e.g. PLANT01) mean nothing without a
  separate plant master data table
- Units are inconsistent: fuel can appear as L, LT, GAL
  depending on regional configuration
- Dates appear in DD.MM.YYYY format in European systems
- Document numbers are 10-digit SAP internal references
- Material descriptions are truncated at 40 characters

### What my sample data looks like and why
My sample uses these columns:
- document_number: 10-digit SAP document reference
- posting_date: YYYY-MM-DD (normalized from SAP format)
- material_description: what was consumed
- quantity: amount used
- unit: liters (normalized from SAP's LT)
- category: fuel or procurement
- plant_code: site identifier

I chose diesel and petrol as fuel types because these are
the most common Scope 1 sources for a UK enterprise client.
Quantities (300-750 liters) are realistic for a mid-sized
manufacturing site over a few days.

### What would break in real deployment
- German column headers would need a translation mapping
- Plant codes would need joining to a master data table
- Date formats would need regional detection
- Units like LT, GAL, M3 would need a complete conversion table
- Multi-currency procurement values would need FX conversion
- Some SAP configs export numbers with commas as decimal
  separators (European format)

---

## 2. Utility Data — Electricity

### What I researched
UK business electricity data sources:
- Smart meter portals (British Gas, EDF, Octopus Business)
- Half-hourly (HH) data for sites >100kW
- Bureau services like Stark, Utilitec for multi-site clients
- ESOS (Energy Savings Opportunity Scheme) reports

Most large UK utilities offer a business portal with CSV
export of monthly consumption by meter point (MPAN).

### What I learned
Real utility CSV exports contain:
- MPAN (Meter Point Administration Number): 13-digit UK meter ID
- Site name and address
- Billing period start and end (not always calendar months)
- Consumption in kWh
- Tariff name and unit rate
- Standing charge
- Total amount (£)
- Estimated vs actual read flag

Key complexity: billing periods don't align with calendar
months. A bill might cover 23 days because the meter was
read on the 8th and 31st. This matters for monthly reporting.

### What my sample data looks like and why
My sample uses:
- meter_id: realistic MPAN-style identifier
- site_name: named UK office locations
- billing_period_start/end: realistic date ranges
- consumption_kwh: realistic values (8,500-92,000 kWh/month)
  based on UK benchmarks (office: ~50 kWh/m²/year,
  warehouse: ~100 kWh/m²/year)
- tariff and amount_gbp: for context

I chose 5 different sites to show multi-meter reality.
The Leeds Factory at 92,000 kWh is realistic for a
medium industrial facility.

### What would break in real deployment
- Half-hourly data would produce 48 rows per day per meter
  requiring aggregation before storage
- Estimated reads need flagging separately from actual reads
- Multi-site clients may have 200+ MPANs
- Some utilities export kVAh (apparent energy) not kWh
- Billing period misalignment needs pro-rata allocation
  for monthly reporting

---

## 3. Corporate Travel — Flights, Hotels, Ground Transport

### What I researched
Major corporate travel platforms:
- Concur (SAP): market leader, complex OAuth API
- Navan (formerly TripActions): modern API + CSV export
- Cytric (Amadeus): European market
- Travelperk: SME focused, good API

Concur API requires:
- Enterprise OAuth 2.0 credentials
- IT department involvement
- Separate endpoints for trips, expenses, receipts

Navan offers:
- Trip report CSV export from dashboard
- API with simpler authentication
- Fields: trip ID, traveler, dates, origin, destination,
  travel type, cost, carbon estimate

### What I learned
Real travel data challenges:
- Flights often only have airport codes (LHR, JFK) not distances
- Distance must be calculated from great circle formula
- Hotel stays may only have city, not property name
- Ground transport is often missing (expensed separately)
- Business vs economy class has 2-3x emission factor difference
- Connections vs direct flights changes emissions significantly
- Some platforms give carbon estimates but use unknown factors

### What my sample data looks like and why
My sample uses:
- trip_id: platform-style identifier
- travel_type: flight/hotel/ground (the three Scope 3 categories)
- origin/destination: airport codes for flights, cities for hotels
- distance_km: pre-calculated great circle distances
  (LHR-JFK: 5,570km, LHR-DXB: 5,500km are accurate)
- nights: for hotel stays
- class: economy/business (captured but single factor used)

I chose routes that a UK enterprise client would realistically
take: transatlantic (LHR-JFK), Middle East (LHR-DXB),
and domestic ground transport (Manchester-Leeds: 70km).

### What would break in real deployment
- Airport-code-only records need a distance lookup table
  (OpenFlights database or similar)
- Business class should use 2x economy emission factor
- Connecting flights need leg-by-leg calculation
- Rail travel is completely absent from this model
- Personal car mileage claims use a different factor
- Some employees book outside the platform entirely