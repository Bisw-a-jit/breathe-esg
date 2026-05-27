# MODEL.md — Data Model Documentation

## Overview
The data model is designed around three core concerns:
multi-tenancy, source-of-truth tracking, and audit integrity.

## Entities

### 1. Tenant
Represents a client company onboarded to Breathe ESG.
Every record is scoped to a tenant so data never leaks across clients.

Fields: id (UUID), name, created_at

### 2. IngestionBatch
Every file upload creates a batch. This lets analysts trace
exactly which upload produced which rows.

Fields: id, tenant, source_type (sap/utility/travel),
filename, status (pending/processed/failed),
row_count, error_message, uploaded_at

### 3. EmissionRecord
The core table. Every row represents one emission activity,
normalized to standard units.

Fields:
- id (UUID) — stable identifier for audit references
- tenant, batch — ownership and lineage
- source_type — which system produced this row
- source_row_id — original ID from source system
- scope — Scope 1 / 2 / 3 (GHG Protocol)
- category — fuel / electricity / flight / hotel / ground / procurement
- quantity — normalized amount (always in kWh, liters, or km)
- unit — normalized unit
- co2_equivalent — always in kg CO2e
- raw_quantity, raw_unit — original values before normalization
- raw_data (JSON) — full original row for audit trail
- activity_date — when the activity occurred
- billing_period_start/end — for utility data
- status — pending / approved / rejected / flagged
- reviewer_note — analyst comments
- reviewed_at — when it was reviewed
- is_edited — whether analyst changed any value
- flag_reason — why it was auto-flagged
- created_at, updated_at — audit timestamps

## Scope Classification
- Scope 1: SAP fuel combustion (direct emissions)
- Scope 2: Utility electricity consumption
- Scope 3: Corporate travel (flights, hotels, ground transport)

## Unit Normalization
All quantities are normalized at ingestion time:
- Energy: everything → kWh
- Fuel: everything → liters
- Distance: everything → km
- Hotels: nights (no normalization needed)

Raw values are always preserved in raw_quantity, raw_unit, and raw_data.

## Emission Factors Used
- Electricity: 0.233 kg CO2e/kWh (UK grid average, DEFRA 2023)
- Diesel/Fuel: 2.68 kg CO2e/liter
- Flights: 0.255 kg CO2e/km (economy, DEFRA 2023)
- Hotels: 20.0 kg CO2e/night (DEFRA average)
- Ground transport: 0.14 kg CO2e/km (average car)

## Audit Trail
Every record stores:
1. The batch it came from (which file, when uploaded)
2. The original row ID from the source system
3. The full raw row as JSON
4. Who reviewed it and when
5. Whether it was edited post-ingestion

This means any approved record can be traced back to
the exact source file and original value.

## Multi-tenancy
All queries are scoped by tenant foreign key.
In production, row-level security or query filtering
would enforce this at the database level.

## Tradeoffs
- SQLite used for prototype; production would use PostgreSQL
- Single emission factor per category; production would use
  date-aware, region-aware factor tables
- No user authentication in prototype; production would use
  Django's auth system with role-based access