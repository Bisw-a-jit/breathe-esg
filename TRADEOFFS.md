# TRADEOFFS.md — Things Deliberately Not Built

## 1. User Authentication & Role-Based Access
**What it would be:** Django auth system with two roles —
analyst (can review, cannot approve locked records) and
admin (can configure tenants, manage users, unlock records).
JWT tokens for the React frontend.

**Why I didn't build it:** Authentication is well-understood
and mechanical to implement. The hard, differentiated work
in this assignment is the data model, ingestion logic, and
review workflow. Building auth would have consumed 4-6 hours
that were better spent on the parts Breathe ESG actually
cares about evaluating.

**What breaks without it:** Anyone with the URL can upload
data and approve records. Acceptable for a prototype reviewed
by 3 people. Not acceptable in production.

**How I'd add it:** Django REST Framework's TokenAuthentication
plus a login page in React. One day of work.

---

## 2. Dynamic Emission Factor Tables
**What it would be:** A separate EmissionFactor model with
fields for category, region, year, source (DEFRA/EPA/GHG
Protocol), and value. Factors would be looked up at ingestion
time based on activity date and client region, and stored
alongside the record so historical calculations don't change
when factors are updated.

**Why I didn't build it:** This requires a data entry interface
for factor management, versioning logic, and decisions about
retroactive recalculation that belong to the PM and auditors,
not to me. Building it wrong would be worse than not building
it. I used DEFRA 2023 averages hardcoded, which are accurate
enough to demonstrate the pipeline and honest about the
limitation.

**What breaks without it:** All records use the same factor
regardless of year, region, or fuel type. A diesel record and
a petrol record both use 2.68 kg CO2e/liter. In production
this would fail an audit.

**How I'd add it:** EmissionFactor table with (category,
subcategory, region, year, value, source, created_at). Lookup
at ingestion time, store factor_used and factor_source on
EmissionRecord.

---

## 3. PDF Bill Parsing for Utility Data
**What it would be:** A parser that accepts PDF utility bills,
extracts meter readings, billing periods, and consumption
figures using a combination of pdfplumber and regex patterns,
with a fallback manual entry form when parsing fails.

**Why I didn't build it:** PDF parsing is brittle. Every
utility has a different bill layout. A parser that works on
British Gas bills breaks on EDF bills. Building this properly
requires a library of real bill samples to test against, which
I don't have. I chose CSV portal export instead because it is
more reliable and is what a facilities team can actually produce
consistently.

**What breaks without it:** Clients who only have PDF bills
and no portal access cannot use the utility ingestion. This
is a real gap — smaller sites often only have paper bills
scanned to PDF.

**How I'd add it:** pdfplumber for text extraction, a
template-matching system per utility provider, and a manual
review step where the extracted values are shown to the user
for confirmation before saving.