# @ng-address/core

> **Status: alpha (`0.1.0-alpha.1`, published under the `next` tag).** The API may change. See "Known limitations".

Offline, deterministic Nigerian address intelligence: parse messy addresses, resolve state/LGA against a bundled national catalog, compare, score and fingerprint them. It does **not** verify that an address exists.

## How this relates to NIPOST's Digital Postcode

NIPOST's postcode (NDAPS) tells you whether a *building code* exists. Most real inputs are still free text ("No. 14 behind the mosque, Mokola"). This package sits **in front of** NIPOST: it turns free text into structured, normalized fields and an administrative guess, and extracts/validates the *format* of any postcode written in the address. Use the NIPOST API (via the optional `NipostClient`, or NIPOST's own SDKs) for authoritative lookup. If you only need postcode parsing/lookup, a dedicated NIPOST client may be enough for you.

## `resolveAddress` (orchestration)

`resolveAddress` combines parsing, national administrative entity resolution, structural validation, quality scoring and deterministic identity into one offline pipeline.

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
  ADMINISTRATIVE_DATASET,
  getState,
  listLgas,
  lookupLga,
} from "@ng-address/core";

console.log(ADMINISTRATIVE_DATASET);
// { version: "0.8.0" /* dataset revision, not the package version */, states: 37, lgas: 768, fctAreaCouncils: 6, ... }

const lagos = getState("Lagos State");
const lagosLgas = listLgas("Lagos");

const result = lookupLga("Ibadan South West", "Oyo");
if (result.status === "unique") {
  console.log(result.record.name); // Ibadan South-West
}
```

### Do not guess ambiguous LGAs

Some LGA names occur in more than one state. Without a state constraint, resolution can return `ambiguous`:

```ts
const result = lookupLga("Obi");

if (result.status === "ambiguous") {
  // Ask the caller for the state instead of choosing one arbitrarily.
}
```

### Provenance

`ADMINISTRATIVE_PROVENANCE` records the sources and verification status used for the bundled catalog. The INEC directory is used as the authoritative administrative-count cross-check; the machine-readable LGA reference used during preparation is separately identified as a secondary MIT-licensed source.

This catalog is **not** an address-existence database. A state/LGA match does not prove that a building, occupant, ownership record, postal assignment, or Digital Postcode exists. For authoritative Digital Postcode resolution, use the NIPOST adapter/service according to current NIPOST documentation and terms.

## Batch parsing

```ts
const results = parseAddresses(inputs); // synchronous; order preserved; errors isolated per item
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

Removes building-level identifiers: raw/normalized strings, house number, unit, P.O. Box, premises, landmarks, coordinates and the Digital Postcode. Street/locality/state are kept; pass `{ coarse: true }` to drop those too.

## Provider boundary

NIPOST remains an adapter. Digital Postcode resolution belongs behind the provider boundary; API credentials must stay on trusted backends. Do not embed the NIPOST NDAPS database in this package.

## Quality gate

```bash
npm run check
npm pack --dry-run
```

Tests run on Node 22.6+ (`--experimental-strip-types`). The library itself targets Node 20+. ESM only (Node 22.12+ can `require()` it).

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

## Known limitations (alpha)

- Heuristic parser: handles common comma-separated and simple unpunctuated forms, not arbitrary free text. Expect misses on `Km 5, Ibadan-Ife Road`-style addresses, multi-landmark chains, and neighbourhood-vs-street ambiguity (a place such as `Computer Village` is returned as `street`).
- `plot` is still mapped to `houseNumber`.
- The Digital Postcode state-prefix check uses ISO 3166-2 codes and is **unconfirmed** against NIPOST's own prefix table. Format validation matches NIPOST's published pattern; existence needs the API.
- State/LGA is inferred only from explicit names or exact locality matches (e.g. `Ibadan` does not resolve to a single LGA).
- Accuracy on real-world addresses has not been measured on a large independent corpus.
- `NipostClient` targets `GET /v1/lookup` per NIPOST's OpenAPI spec; response objects are passed through as returned.
