# Changelog

## 0.11.0 - 2026-10-04

### Added
- locality resolver with capital/LGA entity kinds
- locality aliases and diacritic-insensitive matching
- explicit `unique` / `ambiguous` / `not-found` locality results
- adversarial field-level parser benchmark tests

### Improved
- unpunctuated city detection in common Nigerian addresses
- canonical locality casing for uppercase and accented input
- parser reuse of the locality resolution layer

### Safety
- locality resolution remains non-authoritative and does not imply building existence or provider verification


## 0.10.0

### Correctness
- Digital Postcode validation now accepts canonical hyphenated, spaced, and compact forms.
- Digital Postcode format validation is syntactic; known Nigerian state-prefix checking is exposed separately.
- Digital Postcode extraction now recognizes hyphenated codes embedded in addresses.
- NIPOST adapter now targets `GET /v1/lookup`, sends `X-API-Key`, and decodes `data.valid`/provider error envelopes.
- NIPOST merge no longer manufactures verification or boosts confidence to 0.98.
- Typed provider error codes/statuses are preserved for HTTP failures.

### Parser
- Fixed duplicated street-as-district extraction on standard comma-separated addresses.
- Added unpunctuated city/state recognition using the national state-capital catalog.
- Improved landmark extraction for `No 14 behind the mosque`-style inputs.
- Improved block/flat/unit chaining and estate handling.
- Improved casing of street and locality names.
- Replaced the parser's simple field-count confidence with explicit structural-pattern confidence.

### Verification corpus
- Added 185 variants of 37 public INEC State/FCT office addresses.
- Added adversarial Nigerian address regression cases.
- Current test suite contains 50 tests.

## 0.9.0

### Added
- Administrative entity-resolution engine for state and LGA matching.
- Exact canonical/alias matching with deterministic fuzzy fallback.
- State/LGA conflict detection instead of silently choosing contradictory records.
- Ranked administrative alternatives with field-level evidence.
- `resolveAdministrative()` and `resolveState()` APIs.

### Safety
- Entity resolution is explicitly non-authoritative: a match does not prove address existence, occupancy, ownership, or Digital Postcode validity.

## 0.8.0
- Added a provenance-aware national administrative catalog.
- Added 37 state/FCT records with state codes, capitals, geopolitical zones and aliases.
- Added 774 administrative units: 768 state LGAs and 6 FCT area councils.
- Added canonical LGA lookup with explicit ambiguity handling.
- Added selected Nigerian LGA spelling/format aliases.
- Added administrative duplicate/conflict detection.
- Added dataset manifest and provenance metadata.
- Added third-party data attribution notice.

## 0.7.0
- Added batch parsing for imports and background jobs.
- Added structural address validation independent of provider verification.
- Added privacy-oriented `redactAddress()` helper.
- Added deterministic serialization and `addressId()` based on the normalized address fingerprint.
- Kept all parsing deterministic and network-free.

## 0.6.0
- Added fuzzy address comparison and candidate ranking.

## 0.5.0
- Added address quality grading and deterministic fingerprints.

## 0.4.0
- Added the provider-isolated NIPOST adapter foundation.
