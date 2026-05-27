# DECISIONS.md — Design Decisions & Tradeoffs

## Ambiguities Resolved

### 1. SAP Export Format
**Decision:** Flat CSV export (via SAP transaction SE16/SM35)
**Why:** IDocs are complex middleware formats requiring SAP
integration expertise. Flat file exports are what sustainability
leads actually receive and work with day-to-day. OData would
require live SAP API access which no client would grant during
onboarding. CSV is the realistic starting point.
**What I ignored:** Plant hierarchy tables, cost center mappings,
German column headers (handled by lowercasing all columns),
multi-currency procurement values.
**What I'd ask the PM:** Does the client have a dedicated SAP
admin who can configure custom export layouts, or are we working
with whatever the sustainability lead can pull themselves?

### 2. Utility Data Format
**Decision:** CSV portal export
**Why:** Most UK/EU utilities (British Gas, EDF, Octopus) offer
CSV downloads from their business portals. PDF parsing is fragile
and breaks with every bill layout change. API access requires
utility partnerships that take months to set up. CSV is what
a facilities team actually emails over.
**What I ignored:** Half-hourly meter data (HH data), reactive
power charges, multi-tariff time-of-use billing, demand charges.
**What I'd ask the PM:** Are all sites on smart meters with
half-hourly data available, or are we working with monthly
bill summaries?

### 3. Travel Data Format
**Decision:** CSV export from Navan/Concur
**Why:** Concur's API requires OAuth enterprise credentials and
IT involvement. Navan exports trip reports as CSV from their
dashboard. This is what a travel manager can produce in 5
minutes without IT help, which matches the onboarding reality.
**What I ignored:** Rail travel, taxi receipts, mileage claims,
personal car business travel, airport-code-only records without
distances.
**What I'd ask the PM:** Does the client use a managed travel
platform or do employees book independently and expense later?
This changes everything about data quality.

### 4. Emission Factors
**Decision:** Static factors hardcoded per category
**Why:** For a prototype, hardcoded DEFRA 2023 factors are
accurate enough to demonstrate the pipeline. Dynamic factor
tables would require a separate data model and admin interface.
**What I'd ask the PM:** Do auditors require specific factor
vintages (e.g. DEFRA 2022 vs 2023)? Some clients lock factors
at the start of a reporting year.

### 5. Authentication
**Decision:** No authentication in prototype
**Why:** Time constraint. The data model and ingestion logic
are the hard parts. Auth is well-understood and can be added
with Django's built-in system in a day.
**What I'd ask the PM:** Is this analyst-only or do clients
also log in to see their own data?

### 6. Suspicious Record Flagging
**Decision:** Simple threshold-based flagging
**Why:** Statistical anomaly detection requires historical data
we don't have at onboarding. Thresholds catch obvious errors
(e.g. a fuel entry of 100,000 liters in one day) without
needing ML.
**What I'd ask the PM:** Do analysts want to configure their
own thresholds per client, or are global defaults acceptable?

### 7. Database
**Decision:** SQLite for prototype, PostgreSQL for production
**Why:** SQLite requires zero setup and works everywhere.
The schema is identical; switching to PostgreSQL is one
settings change.

## What I Would Ask The PM
1. What is the client's SAP version and do they have BASIS support?
2. How many utility accounts/meters does the client have?
3. Is travel data complete or are personal bookings excluded?
4. What reporting standard are auditors using (GHG Protocol, ISO 14064)?
5. What is the reporting period (calendar year vs financial year)?
6. Are emission factors locked at period start or updated retroactively?