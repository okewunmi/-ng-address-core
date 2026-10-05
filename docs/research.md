# Research notes — v0.4.0

## Official standards and infrastructure

NIPOST's National Addressing Standard describes digital-form fields including Address Line 1, Address Line 2, District/Postcode, City, LGA and State. The current Digital Postcode service describes an 11-character alphanumeric postcode linked to an addressable building/location and provides API, web/mobile SDK and bulk integration options.

## Design consequences

1. `@ng-address/core` remains deterministic and offline.
2. A postcode shape check is not an existence check.
3. Provider verification belongs in `@ng-address/nipost` or another adapter.
4. Administrative data is versioned and provenance-sensitive.
5. Parser confidence must be explainable and should not imply physical verification.

## Data-source policy

Nigeria currently has multiple public LGA datasets. Some are explicitly licensed for redistribution; others do not clearly state a redistribution license. The package therefore avoids embedding an unlicensed national third-party dataset. A future `@ng-address/data` release should use an authoritative or explicitly redistributable source and record source URL, retrieval date, license, checksum, and transformation script.
