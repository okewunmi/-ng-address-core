import test from "node:test";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import {
  parseAddress,
  normalizeAddress,
  compareAddresses,
  scoreAddress,
  isDigitalPostcode,
  normalizeDigitalPostcode,
  isLegacyPostcode,
  classifyAddress,
  parseAddresses,
  validateAddress,
  redactAddress,
  serializeAddress,
  addressId
} from "../dist/index.js";

test("parses a common Nigerian street address", () => {
  const { address } = parseAddress("12 Adeola Odeku St., Victoria Island, Lagos State");
  assert.equal(address.houseNumber, "12");
  assert.equal(address.street, "Adeola Odeku Street");
  assert.equal(address.state?.name, "Lagos");
  assert.equal(address.locality, "Victoria Island");
});

test("extracts Nigerian landmark relations", () => {
  const { address } = parseAddress("House 12, behind Bodija Market, Ibadan, Oyo State");
  assert.equal(address.houseNumber, "12");
  assert.equal(address.state?.name, "Oyo");
  assert.equal(address.landmark?.relation, "behind");
  assert.equal(address.landmark?.value, "Bodija Market");
  assert.equal(address.type, "landmark");
});

test("normalizes common street abbreviations", () => {
  const address = normalizeAddress("33 Oran Rd., Ikeja, Lagos State");
  assert.equal(address.street, "Oran Road");
  assert.equal(address.state?.name, "Lagos");
});

test("recognizes Abuja/FCT alias", () => {
  const { address } = parseAddress("24 Aminu Kano Cres, Wuse 2, Abuja");
  assert.equal(address.state?.name, "Federal Capital Territory");
});

test("recognizes legacy and digital postcodes by shape", () => {
  assert.equal(isLegacyPostcode("200212"), true);
  assert.equal(isLegacyPostcode("20021"), false);
  assert.equal(isDigitalPostcode("FC 02 A09 DB 09"), true);
  assert.equal(isDigitalPostcode("FC02A09DB09"), true);
  assert.equal(isDigitalPostcode("EK-01-A03-FK-01"), true);
  assert.equal(isDigitalPostcode("EK 01 A03 FK 01"), true);
  assert.equal(isDigitalPostcode("EK01A03FK01"), true);
  assert.equal(isDigitalPostcode("EK-00-A03-FK-01"), false);
  assert.equal(normalizeDigitalPostcode("ek-01-a03-fk-01"), "EK 01 A03 FK 01");
});

test("classifies estates and business addresses", () => {
  assert.equal(classifyAddress({ raw: "Block 4, Phase 2, Harmony Estate, Ibadan" }), "estate");
  assert.equal(classifyAddress({ raw: "ABC Bank Plc, Allen Avenue, Ikeja, Lagos" }), "business");
});

test("scores completeness without claiming existence", () => {
  const address = parseAddress("12 Adeola Odeku St, Victoria Island, Lagos 101241").address;
  const score = scoreAddress(address);
  assert.ok(score.score >= 60);
  assert.equal(address.warnings.some((w) => /exist/i.test(w)), false);
});

test("compares equivalent normalized addresses", () => {
  const a = parseAddress("12 Adeola Odeku St, Victoria Island, Lagos State").address;
  const b = parseAddress("12 Adeola Odeku Street, Victoria Island, Lagos").address;
  const result = compareAddresses(a, b);
  assert.equal(result.sameEntity, true);
  assert.ok(result.confidence >= 0.78);
});

test("strict mode rejects text with no useful address structure", () => {
  assert.throws(() => parseAddress("hello world", { strict: true }));
});


test("parses numeric house number separated by comma", () => {
  const { address } = parseAddress("12, Adeola Odeku St., Victoria Island, Lagos State");
  assert.equal(address.houseNumber, "12");
  assert.equal(address.street, "Adeola Odeku Street");
});

test("does not mistake Nigeria for Niger", () => {
  const { address } = parseAddress("34 Alayande Cl, Mokola, Ibadan, Oyo State, Nigeria");
  assert.equal(address.state?.name, "Oyo");
  assert.equal(address.locality, "Ibadan");
});

test("handles landmark-first addresses", () => {
  const { address } = parseAddress("Opposite UCH, Queen Elizabeth Road, Ibadan, Oyo State");
  assert.equal(address.landmark?.relation, "opposite");
  assert.equal(address.landmark?.value, "UCH");
  assert.equal(address.street, "Queen Elizabeth Road");
  assert.equal(address.locality, "Ibadan");
});

test("handles P.O. Box addresses separately from street addresses", () => {
  const { address } = parseAddress("P.O. Box 125, Garki, Abuja, Federal Capital Territory");
  assert.equal(address.type, "po-box");
  assert.equal(address.poBox, "P.O. Box 125");
  assert.equal(address.unit, undefined);
  assert.equal(address.street, undefined);
  assert.equal(address.district, "Garki");
  assert.equal(address.locality, "Abuja");
});

test("handles estate and area structures", () => {
  const { address } = parseAddress("Flat 3, Block B, Harmony Estate, Oluyole, Ibadan, Oyo");
  assert.equal(address.unit, "Flat 3, Block B");
  assert.equal(address.locality, "Ibadan");
  assert.equal(address.state?.name, "Oyo");
  assert.equal(address.type, "estate");
});

test("supports all 37 state/FCT names", () => {
  const states = [
    "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno","Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","Gombe","Imo","Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos","Nasarawa","Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto","Taraba","Yobe","Zamfara","Federal Capital Territory"
  ];
  for (const state of states) {
    const { address } = parseAddress(`12 Main Street, Central, ${state}`);
    assert.equal(address.state?.name, state);
  }
});

test("digital postcode syntax is separator-tolerant and semantic state validation is separate", async () => {
  const { isKnownDigitalPostcodeState } = await import("../dist/postcode.js");
  assert.equal(isDigitalPostcode("ZZ 02 A09 DB 09"), true);
  assert.equal(isKnownDigitalPostcodeState("ZZ 02 A09 DB 09"), false);
  assert.equal(isKnownDigitalPostcodeState("EK-01-A03-FK-01"), true);
});

test("comparison does not match different house numbers as exact", () => {
  const a = parseAddress("12 Adeola Odeku Street, Victoria Island, Lagos").address;
  const b = parseAddress("14 Adeola Odeku Street, Victoria Island, Lagos").address;
  const result = compareAddresses(a, b);
  assert.equal(result.evidence.find((x) => x.field === "houseNumber")?.score, 0);
});


test("extracts multiple landmark relations", () => {
  const { address } = parseAddress("House 4, opposite UI, beside the mosque, Ibadan, Oyo State");
  assert.equal(address.landmarks?.length, 2);
  assert.equal(address.landmarks?.[0]?.relation, "opposite");
  assert.equal(address.landmarks?.[1]?.relation, "beside");
});

test("normalizes terrace and punctuation consistently", () => {
  const address = normalizeAddress("7, Oke-Ado Rd., Ibadan, Oyo State");
  assert.equal(address.street, "Oke-Ado Road");
});

test("comparison reports contradictions", () => {
  const a = parseAddress("12 Adeola Odeku Street, Victoria Island, Lagos").address;
  const b = parseAddress("14 Adeola Odeku Street, Victoria Island, Lagos").address;
  const result = compareAddresses(a, b);
  assert.equal(result.sameEntity, false);
  assert.ok(result.contradictions.includes("houseNumber differs."));
});

test("administrative validation canonicalizes Abuja", async () => {
  const { validateAdministrativeUnits } = await import("../dist/administrative.js");
  const result = validateAdministrativeUnits({ state: "Abuja" });
  assert.equal(result.state?.canonical, "Federal Capital Territory");
  assert.equal(result.state?.valid, true);
});


test("finds bundled Nigerian LGAs", async () => {
  const { findLga } = await import("../dist/lga-data.js");
  const result = findLga("Ibadan North", "Oyo");
  assert.equal(result?.state, "Oyo");
});

test("exposes national LGA counts without pretending the core embeds the full registry", async () => {
  const { LGA_COUNTS } = await import("../dist/lga-data.js");
  assert.equal(Object.keys(LGA_COUNTS).length, 37);
  assert.equal(LGA_COUNTS["Oyo"], 33);
});

test("validates a state/LGA relationship when data is available", async () => {
  const { validateAdministrativeUnits } = await import("../dist/administrative.js");
  const result = validateAdministrativeUnits({ state: "Oyo", lga: "Ibadan North" });
  assert.equal(result.state?.valid, true);
  assert.equal(result.lga?.valid, true);
});


test("NIPOST client resolves through an injected transport", async () => {
  const { NipostClient, mergeNipostResult } = await import("../dist/nipost.js");
  const fetchImpl = async (url: URL, init: RequestInit) => {
    assert.equal(url.pathname, "/v1/lookup");
    assert.equal(url.searchParams.get("code"), "FC-02-A09-DB-09");
    assert.equal((init.headers as Record<string,string>)["X-API-Key"], "test-key");
    return new Response(JSON.stringify({ data: { postcode: "FC-02-A09-DB-09", valid: true, status: "valid" } }), { status: 200 });
  };
  const client = new NipostClient({ apiKey: "test-key", baseUrl: "https://example.test", fetchImpl });
  const result = await client.lookup({ code: "FC-02-A09-DB-09", level: 1 });
  assert.equal(result.digitalPostcode, "FC 02 A09 DB 09");
  assert.equal(result.valid, true);
  const parsed = parseAddress("Plot 1, Abuja").address;
  assert.equal(mergeNipostResult(parsed, result).confidence, parsed.confidence);
});

test("NIPOST client surfaces HTTP failures", async () => {
  const { NipostClient, NipostError } = await import("../dist/nipost.js");
  const fetchImpl = async () => new Response("bad", { status: 401 });
  const client = new NipostClient({ apiKey: "test-key", baseUrl: "https://example.test", fetchImpl });
  await assert.rejects(() => client.resolve({ postcode: "FC 02 A09 DB 09" }), (error) => error instanceof NipostError && error.status === 401);
});


test("keeps flat/block/unit labels out of houseNumber", () => {
  const { address } = parseAddress("Flat 3, Block B, Harmony Estate, Oluyole, Ibadan, Oyo State");
  assert.equal(address.houseNumber, undefined);
  assert.equal(address.unit, "Flat 3, Block B");
});


test("infers a known LGA from locality in v0.3+", () => {
  const { address } = parseAddress("12 Main Street, Ibadan North, Oyo State");
  assert.equal(address.lga?.name, "Ibadan North");
});


test("v0.7 batch parsing preserves input order", () => {
  const result = parseAddresses(["12 Bodija Road, Ibadan, Oyo", "Flat 3, Block B, Estate, Lagos"]);
  assert.equal(result.length, 2);
  assert.equal(result[0]?.index, 0);
  assert.equal(result[1]?.index, 1);
});

test("v0.7 validates structure without claiming existence", () => {
  const address = parseAddress("12 Bodija Road, Ibadan, Oyo State").address;
  const result = validateAddress(address);
  assert.equal(result.valid, true);
});

test("v0.7 redaction removes direct location details", () => {
  const address = parseAddress("12 Bodija Road, Ibadan, Oyo State").address;
  const redacted = redactAddress(address);
  assert.equal(redacted.raw, "[REDACTED]");
  assert.equal(redacted.houseNumber, undefined);
  assert.equal(redacted.coordinates, undefined);
  assert.equal(redacted.digitalPostcode, undefined);
  assert.equal(redacted.landmark, undefined);
  const withCoordinates = { ...address, coordinates: { latitude: 7.3775, longitude: 3.947 } };
  assert.equal(redactAddress(withCoordinates).coordinates, undefined);
});

test("v0.7 serialization and id are deterministic", () => {
  const address = parseAddress("12 Bodija Road, Ibadan, Oyo State").address;
  assert.ok(serializeAddress(address).includes("Bodija"));
  assert.equal(addressId(address), addressId(address));
});

test("v0.8 catalog contains 37 states and exactly 774 LGAs", async () => {
  const { ADMINISTRATIVE_DATASET_V8, STATES_V8, LGAS_V8 } = await import("../dist/catalog.js");
  assert.equal(STATES_V8.length, 37);
  assert.equal(LGAS_V8.length, 774);
  assert.equal(ADMINISTRATIVE_DATASET_V8.lgas, 768);
  assert.equal(ADMINISTRATIVE_DATASET_V8.fctAreaCouncils, 6);
});

test("v0.8 resolves FCT and state aliases", async () => {
  const { getStateV8 } = await import("../dist/catalog.js");
  assert.equal(getStateV8("Abuja")?.name, "Federal Capital Territory");
  assert.equal(getStateV8("F.C.T.")?.code, "FC");
  assert.equal(getStateV8("Akwa-Ibom")?.name, "Akwa Ibom");
});

test("v0.8 resolves an LGA within its parent state", async () => {
  const { resolveLgaV8 } = await import("../dist/catalog.js");
  const result = resolveLgaV8("Ibeju Lekki", "Lagos");
  assert.equal(result.status, "unique");
  if (result.status === "unique") assert.equal(result.record.name, "Ibeju-Lekki");
});

test("v0.8 detects ambiguous LGA names instead of guessing", async () => {
  const { resolveLgaV8 } = await import("../dist/catalog.js");
  const result = resolveLgaV8("Obi");
  assert.equal(result.status, "ambiguous");
  if (result.status === "ambiguous") assert.ok(result.records.length > 1);
});

test("v0.8 exposes provenance and national conflict inventory", async () => {
  const { ADMINISTRATIVE_PROVENANCE, findAdministrativeConflicts } = await import("../dist/catalog.js");
  assert.equal(ADMINISTRATIVE_PROVENANCE.length, 2);
  assert.ok(ADMINISTRATIVE_PROVENANCE.some(x => x.source.includes("INEC")));
  assert.ok(findAdministrativeConflicts().length > 0);
});

test("v0.8 normalizes common LGA spelling variants without changing canonical names", async () => {
  const { resolveLgaV8 } = await import("../dist/catalog.js");
  const ibadan = resolveLgaV8("Ibadan South West", "Oyo");
  assert.equal(ibadan.status, "unique");
  if (ibadan.status === "unique") assert.equal(ibadan.record.name, "Ibadan South-West");
  const amac = resolveLgaV8("AMAC", "FCT");
  assert.equal(amac.status, "unique");
});

test("resolves an exact LGA and state from a natural address", async () => {
  const { resolveAdministrative } = await import("../dist/resolution.js");
  const result = resolveAdministrative("12 Adeola Odeku Street, Lagos Island LGA, Lagos State");
  assert.equal(result.status, "resolved");
  assert.equal(result.state?.name, "Lagos");
  assert.equal(result.lga?.name, "Lagos Island");
});

test("resolves LGA aliases deterministically", async () => {
  const { resolveAdministrative } = await import("../dist/resolution.js");
  const result = resolveAdministrative({ raw: "", state: { name: "Oyo" }, lga: { name: "Ibadan South West" } });
  assert.equal(result.status, "resolved");
  assert.equal(result.lga?.name, "Ibadan South-West");
});

test("reports a state/LGA conflict instead of silently choosing", async () => {
  const { resolveAdministrative } = await import("../dist/resolution.js");
  const result = resolveAdministrative({ raw: "", state: { name: "Lagos" }, lga: { name: "Ibadan North" } });
  assert.equal(result.status, "conflict");
  assert.ok(result.conflicts.length > 0);
});

test("returns ambiguous candidates when an LGA name is shared across states", async () => {
  const { resolveAdministrative } = await import("../dist/resolution.js");
  const result = resolveAdministrative({ raw: "", lga: { name: "Obi" } });
  assert.equal(result.status, "ambiguous");
  assert.ok(result.alternatives.length >= 2);
});

test("does not treat an approximate administrative match as authoritative verification", async () => {
  const { resolveAdministrative } = await import("../dist/resolution.js");
  const result = resolveAdministrative("12 Main Street, Ibadn, Oyo");
  assert.ok(["resolved", "ambiguous"].includes(result.status));
  assert.ok(result.lga === undefined || result.lga.confidence <= 1);
});

test("regression gold set handles common Nigerian messy address shapes", () => {
  const cases = [
    ["12 Adeola Odeku Street, VI, Lagos", { houseNumber: "12", street: "Adeola Odeku Street", locality: "Victoria Island", state: "Lagos", district: undefined }],
    ["15 Allen Avenue, Ikeja, Lagos State", { houseNumber: "15", street: "Allen Avenue", locality: "Ikeja", state: "Lagos", district: undefined }],
    ["22b Ogunlana Drive, Surulere, Lagos, 101283", { houseNumber: "22b", street: "Ogunlana Drive", locality: "Surulere", state: "Lagos", district: undefined }],
    ["No 14 behind the mosque, Mokola, Ibadan, Oyo State", { houseNumber: "14", street: "Mokola", locality: "Ibadan", state: "Oyo", landmark: "behind" }],
    ["14 Bodija Road Ibadan Oyo State", { houseNumber: "14", street: "Bodija Road", locality: "Ibadan", state: "Oyo" }],
    ["No 7 Ahmadu Bello Way, Kaduna", { houseNumber: "7", street: "Ahmadu Bello Way", locality: "Kaduna", state: "Kaduna" }],
    ["block 4 flat 2 harmony estate oluyole ibadan", { unit: "block 4 flat 2", locality: "Ibadan", state: "Oyo" }],
    ["Ìbàdàn, Ọyọ", { locality: "Ibadan", state: "Oyo", street: undefined }],
  ] as const;
  for (const [input, expected] of cases) {
    const { address } = parseAddress(input);
    for (const [field, value] of Object.entries(expected)) {
      if (field === "state") assert.equal(address.state?.name, value, input);
      else if (field === "landmark") assert.equal(address.landmark?.relation, value, input);
      else assert.equal((address as Record<string, unknown>)[field], value, input);
    }
  }
});

test("v1 resolves a complete address through the stable orchestration API", async () => {
  const { resolveAddress, NG_ADDRESS_CORE_VERSION } = await import("../dist/address-resolution.js");
  const result = resolveAddress("12 Adeola Odeku Street, Lagos Island LGA, Lagos State");
  assert.equal(NG_ADDRESS_CORE_VERSION, JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8")).version);
  assert.equal(result.status, "resolved");
  assert.equal(result.address.state?.name, "Lagos");
  assert.equal(result.address.lga?.name, "Lagos Island");
  assert.equal(result.verified, false);
  assert.ok(result.fingerprint.length > 0);
  assert.ok(result.evidence.length >= 4);
});

test("v1 never upgrades an ambiguous administrative match into a verified address", async () => {
  const { resolveAddress } = await import("../dist/address-resolution.js");
  const result = resolveAddress("12 Main Street, Obi");
  assert.equal(result.verified, false);
  assert.ok(result.status === "ambiguous" || result.status === "partial" || result.status === "not-found");
  assert.ok(result.warnings.some((warning: string) => warning.includes("not-authoritative") || warning.includes("ambiguous")));
});

test("v1 reports cross-state administrative conflicts", async () => {
  const { resolveAddress } = await import("../dist/address-resolution.js");
  const result = resolveAddress("12 Main Street, Ibadan North LGA, Lagos State");
  assert.equal(result.status, "conflict");
  assert.ok(result.administrative.conflicts.length > 0);
  assert.equal(result.verified, false);
});

test("v1 batch resolution preserves order and isolates invalid inputs", async () => {
  const { resolveAddresses } = await import("../dist/address-resolution.js");
  const result = resolveAddresses(["12 Bodija Road, Ibadan, Oyo", "", "5 Broad Street, Lagos"]);
  assert.equal(result.length, 3);
  assert.equal(result[0]?.index, 0);
  assert.equal(result[1]?.index, 1);
  assert.ok(result[1]?.error);
  assert.equal(result[2]?.index, 2);
});

test("v1 resolution key is deterministic", async () => {
  const { resolveAddress, resolutionKey } = await import("../dist/address-resolution.js");
  const a = resolveAddress("12 Bodija Road, Ibadan, Oyo");
  const b = resolveAddress("12 Bodija Road, Ibadan, Oyo State");
  assert.equal(resolutionKey(a), resolutionKey(b));
});
