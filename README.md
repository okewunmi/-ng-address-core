## v0.11.0

v0.11 adds locality/entity resolution and benchmark-oriented parser hardening.

### Locality resolution

```ts
import { normalizeLocality, resolveLocality } from "@ng-address/core";

normalizeLocality("Ìbàdàn"); // "Ibadan"
normalizeLocality("V.I.");    // "Victoria Island"

resolveLocality("Oluyole", "Oyo");
// unique → canonical Oyo LGA entity
```

The resolver distinguishes capital cities from LGA names and returns `unique`, `ambiguous`, or `not-found`. It does not claim that a locality or building exists.

### Parser hardening

- embedded city detection for unpunctuated addresses such as `14 Bodija Road Ibadan Oyo State`
- diacritic-insensitive locality matching
- stable canonical casing for locality values, including all-uppercase input
- explicit locality normalization reused by the parser and public resolver
- ambiguity protection when a locality/entity cannot be uniquely resolved

### Benchmark coverage

v0.11 adds adversarial field-level tests for state, locality, street and house-number extraction on messy Nigerian address forms, alongside the existing 200-case regression corpus.

Administrative and public-address references remain provenance-aware and are not treated as proof of address existence.

# @ng-address/core v0.10.0

Production-oriented Nigerian address intelligence with deterministic parsing, fuzzy matching, quality scoring, batch processing, privacy helpers, NIPOST provider boundaries, and a provenance-aware national administrative catalog.

## What's new in v0.10.0

- Bundled **37 states/FCT** administrative records.
- Bundled **774 administrative units**: **768 state LGAs + 6 FCT area councils**.
- Added state codes, capitals, geopolitical zones and common state aliases.
- Added canonical LGA names with selected Nigerian spelling/format aliases.
- Added deterministic LGA lookup with explicit `unique`, `ambiguous`, and `not-found` outcomes.
- Added administrative conflict detection so duplicate LGA names are never silently treated as globally unique.
- Added dataset provenance and manifest metadata.
- Kept the core offline and dependency-free.

The current INEC directory lists 36 states + FCT and 774 LGA offices. The catalog is therefore deliberately modeled as 768 state LGAs plus 6 FCT area councils rather than pretending FCT councils are ordinary state LGAs.


## v1.0 stable orchestration API

The v1 API combines parsing, national administrative entity resolution, structural validation, quality scoring and deterministic identity into one offline pipeline.

```ts
import { resolveAddress, resolveAddresses } from "@ng-address/core";

const result = resolveAddress(
  "12 Adeola Odeku Street, Lagos Island LGA, Lagos State"
);

console.log(result.status);       // "resolved"
console.log(result.address.state); // { name: "Lagos", code: "LA" }
console.log(result.address.lga);   // { name: "Lagos Island" }
console.log(result.quality.grade);
console.log(result.fingerprint);
console.log(result.verified);      // false
```

`verified` is intentionally always `false` in the core package. the core does not claim that a building exists, that an occupant owns or occupies it, or that a Digital Postcode is valid. Authoritative provider checks remain behind the NIPOST adapter boundary.

### Resolution states

- `resolved` — the deterministic administrative evidence supports a canonical state/LGA result.
- `partial` — address structure exists, but administrative evidence is incomplete.
- `ambiguous` — multiple administrative entities remain plausible.
- `conflict` — supplied fields contradict the administrative catalog.
- `not-found` — insufficient recognizable administrative/address structure.

### Batch resolution

```ts
const results = resolveAddresses([
  "12 Bodija Road, Ibadan, Oyo",
  "5 Broad Street, Lagos",
]);
```

Batch results preserve input order and isolate individual parse errors.

### Stable identity

`fingerprint` and `resolutionKey()` are deterministic normalized representations suitable for local caching and deduplication. They are not legal identifiers and do not prove address ownership or existence.

## Administrative catalog

```ts
import {
  ADMINISTRATIVE_DATASET_V8,
  getStateV8,
  getLgasV8,
  resolveLgaV8,
} from "@ng-address/core";

console.log(ADMINISTRATIVE_DATASET_V8);
// { version: "0.8.0", states: 37, lgas: 768, fctAreaCouncils: 6, ... }

const lagos = getStateV8("Lagos State");
const lagosLgas = getLgasV8("Lagos");

const result = resolveLgaV8("Ibadan South West", "Oyo");
if (result.status === "unique") {
  console.log(result.record.name); // Ibadan South-West
}
```

### Do not guess ambiguous LGAs

Some LGA names occur in more than one state. Without a state constraint, resolution can return `ambiguous`:

```ts
const result = resolveLgaV8("Obi");

if (result.status === "ambiguous") {
  // Ask the caller for the state instead of choosing one arbitrarily.
}
```

### Provenance

`ADMINISTRATIVE_PROVENANCE` records the sources and verification status used for the bundled catalog. The INEC directory is used as the authoritative administrative-count cross-check; the machine-readable LGA reference used during preparation is separately identified as a secondary MIT-licensed source.

This catalog is **not** an address-existence database. A state/LGA match does not prove that a building, occupant, ownership record, postal assignment, or Digital Postcode exists. For authoritative Digital Postcode resolution, use the NIPOST adapter/service according to current NIPOST documentation and terms.

## Batch parsing

```ts
const results = parseAddresses(inputs, { concurrency: 32 });
```

## Structural validation

```ts
const result = validateAddress(address);
```

This checks structure and format. It does not prove that the address exists.

## Privacy helper

```ts
const safe = redactAddress(address);
```

This removes raw address, normalized address, house number, unit and coordinates from the returned object.

## Provider boundary

NIPOST remains an adapter. Digital Postcode resolution belongs behind the provider boundary; API credentials must stay on trusted backends. Do not embed the NIPOST NDAPS database in this package.

## Quality gate

```bash
npm run check
npm pack --dry-run
```

The v0.10.0 release passes **50/50 tests** and TypeScript strict compilation.

## Third-party data notice

The administrative reference used during data preparation includes material derived from `Some19ice/nigeria-geo`, which is published under the MIT license. See `THIRD_PARTY_NOTICES.md` for attribution and source information.

## v0.9 Administrative entity resolution

v0.9 adds deterministic administrative entity resolution on top of the v0.8 national catalog.

```ts
import { resolveAdministrative, resolveState } from "@ng-address/core";

resolveAdministrative("12 Adeola Odeku Street, Lagos Island LGA, Lagos State");

resolveAdministrative({
  raw: "",
  state: { name: "Oyo" },
  lga: { name: "Ibadan South West" },
});

resolveState("FCT");
```

The resolver provides:

- canonical and alias matching;
- deterministic fuzzy fallback;
- state/LGA relationship checking;
- ambiguity reporting for names shared by multiple states;
- ranked alternatives and field-level evidence;
- explicit conflict status instead of silently accepting contradictory input.

Resolution is an **entity-resolution result, not authoritative verification**. It does not prove that a building, address, occupant, owner, or Digital Postcode exists. For authoritative Digital Postcode resolution/validation, use an authorized NIPOST service/provider.

### Why v0.9 does not infer every locality

Nigerian locality names are not interchangeable with LGAs. A place such as Victoria Island can be useful address context without being sufficient evidence to assign a specific administrative unit. v0.9 therefore prefers `not-found`, `ambiguous`, or a ranked candidate set over an unjustified exact answer.
