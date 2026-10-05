# Changelog

## 0.1.0-alpha.1 (first public pre-release)
Version reset from the internal 0.10.0 line to signal alpha status. Internal history is kept below.

### Fixed
- House numbers: `No.`, `No.12`, `House No. 12`, `Number 12` now parse.
- A state name inside a street (`5 Kano Road, Ibadan`) no longer overrides the real state.
- `validateAddress` accepted no parser-produced Digital Postcode; now uses `isDigitalPostcode`.
- Single source of truth for state codes (catalog / ISO 3166-2); the conflicting second table was removed.
- `compareAddresses`: requires overlapping house number/street/postcode, compares `unit`, flags one-sided house/unit and differing street types.
- `addressFingerprint`/`addressId` now include `unit` and `poBox`.
- Casing keeps acronyms and Roman numerals (`UI`, `GRA`, `Wuse II`); street types are Title Case.
- Street no longer duplicated into `district`; labelled `Area 11` keeps its label; P.O. Box has its own field.
- `normalizeState` returns canonical names or `undefined`.
- NIPOST adapter: object-shaped `administrative_address`/`recent_house_address`, GeoJSON coordinates, base-URL paths, optional key via `allowAnonymous`, opt-in retries with `Retry-After`.
- `redactAddress` also removes Digital Postcode, landmarks, P.O. Box and premises; `serializeAddress` is key-order independent.
### Added
- `premises` and `poBox` fields; unversioned catalog names (`getState`, `listLgas`, `lookupLga`, `STATES`, `LGAS`); `RedactOptions.coarse`.
### Changed
- Gold corpus test now asserts exact street/house number/premises (previously 0 of 37 streets were correct while the test passed). 66 tests.
- Parsing ~4x faster (precompiled patterns, memoized normalization).
- `typescript` is a pinned devDependency; `prepublishOnly` runs the full check.
### Deprecated
- `*V8` catalog names; `parseAddresses({ concurrency })` (no effect).


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
