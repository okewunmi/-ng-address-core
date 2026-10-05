# @ng-address/core maintenance policy

## Monthly cadence

### Week 1 — Standards & provider review
- Check NIPOST Digital Postcode documentation and addressing standards.
- Check state/LGA administrative changes and data-source licenses.
- Review NIPOST adapter contract without hard-coding undocumented endpoints.
- Re-check the administrative catalog against current authoritative references.

### Week 2 — Address corpus
Add 25–100 new anonymized or synthetic fixtures covering:
- street/house formats
- estates, compounds, campuses and markets
- landmark relations: opposite, behind, beside, after, before, off, along
- P.O. Boxes
- Nigerian spelling/abbreviation variants
- unit/building/plot distinctions
- incomplete and contradictory addresses
- state/LGA ambiguity cases

### Week 3 — Parser and data quality
- Every parser or catalog change requires a regression fixture.
- Track false positives separately from false negatives.
- Never silently turn a landmark into a street or a unit into a house number.
- Preserve raw input and explainable confidence signals.
- Verify that state counts remain 37 and administrative-unit counts remain 774 unless an authoritative source documents a structural change.
- Record source, retrieval date, license and verification status for every bundled dataset.

### Week 4 — Release engineering
Run:

```bash
npm run check
npm pack --dry-run
```

Review bundle size, public exports, generated declarations, provenance notices, and breaking changes.

## Version policy

- Patch: bug fixes and fixture additions.
- Minor: additive parser/data/provider capabilities.
- Major: breaking model/API changes.

## Data policy

Do not copy an external Nigerian geographic dataset into the package unless its license permits redistribution and its provenance is recorded. Prefer authoritative sources, licensed datasets, or generated fixtures.

The national reference point is 37 states/FCT and 774 administrative offices. In v0.8.0 this is represented explicitly as 768 state LGAs plus 6 FCT area councils.

Administrative membership is not address verification. The core must never claim that a building, person, occupancy, ownership, legal status, or Digital Postcode exists merely because a state/LGA record matches.

## Security

- Never put NIPOST API keys in source control.
- Never log customer addresses by default in provider adapters.
- Keep network access out of deterministic parsing functions.
- Add dependency/security review before every published release.
