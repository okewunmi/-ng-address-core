import test from "node:test";
import assert from "node:assert/strict";
import {
  parseAddress, parseAddresses, compareAddresses, addressFingerprint, validateAddress, resolveAddress,
  redactAddress, serializeAddress, normalizeState, isKnownDigitalPostcodeState, DIGITAL_STATE_CODES, STATES,
  NipostClient, NipostError, lookupLga,
} from "../dist/index.js";

const P = (s: string) => parseAddress(s).address;

test("house-number prefixes: No / No. / No.12 / House No. / Number", () => {
  for (const input of ["No 12, Bodija Road, Ibadan, Oyo", "No. 12, Bodija Road, Ibadan, Oyo", "No.12 Bodija Road, Ibadan, Oyo",
    "House No 12, Bodija Road, Ibadan, Oyo", "House No. 12, Bodija Road, Ibadan, Oyo", "Number 12 Bodija Road, Ibadan, Oyo", "NO 12 BODIJA ROAD IBADAN OYO"]) {
    const a = P(input);
    assert.equal(a.houseNumber, "12", input);
    assert.equal(a.street, "Bodija Road", input);
  }
  assert.equal(P("No. 5 Niger Street, Kano").houseNumber, "5");
  assert.equal(P("Nobel Street, Ikeja, Lagos").houseNumber, undefined);
});

test("a state name inside a street name does not hijack the state", () => {
  const cases: Array<[string, string, string]> = [
    ["5 Kano Road, Ibadan", "Oyo", "Kano Road"], ["12 Niger Street, Ikeja", "Lagos", "Niger Street"],
    ["7 Plateau Close, Ikeja", "Lagos", "Plateau Close"], ["10 Imo Avenue, Ikeja", "Lagos", "Imo Avenue"],
    ["12 Ogun Street, Ikeja", "Lagos", "Ogun Street"], ["12 Oyo Road, Ikeja, Lagos", "Lagos", "Oyo Road"],
  ];
  for (const [input, state, street] of cases) { const a = P(input); assert.equal(a.state?.name, state, input); assert.equal(a.street, street, input); }
  assert.equal(P("14 Bodija Road Ibadan Oyo State").state?.name, "Oyo");
  assert.equal(P("Ibadan Oyo").state?.name, "Oyo");
});

test("acronyms and roman numerals keep their case", () => {
  assert.equal(P("12 Wuse II, Abuja").street, "Wuse II");
  assert.equal(P("12 UI Road, Ibadan").street, "UI Road");
  assert.equal(P("34 GRA Road, Port Harcourt").street, "GRA Road");
  assert.equal(P("8 NNPC Road, Kaduna").street, "NNPC Road");
  assert.equal(P("12 BODIJA ROAD, IBADAN").street, "Bodija Road");
});

test("street is not duplicated into district; labelled area keeps its label", () => {
  const a = P("12, Adeola Odeku St., Victoria Island, Lagos");
  assert.equal(a.street, "Adeola Odeku Street"); assert.equal(a.district, undefined);
  const b = P("5, Broad Street, Lagos Island, Lagos"); assert.equal(b.district, undefined);
  const c = P("Plot 18, Area 11, Garki, Abuja"); assert.equal(c.area, "Area 11"); assert.equal(c.houseNumber, "18");
  const d = P("Block 5, Plot 12, Lekki Phase 1, Lagos"); assert.equal(d.unit, "Block 5"); assert.equal(d.houseNumber, "12");
});

test("digital postcodes pass structural validation and resolveAddress", () => {
  const a = P("12 Bodija Road, Ibadan, Oyo, OY-12-ABC-DE-34");
  assert.equal(a.digitalPostcode, "OY 12 ABC DE 34");
  assert.equal(validateAddress(a).valid, true);
  assert.equal(resolveAddress("12 Bodija Road, Ibadan, Oyo, OY-12-ABC-DE-34").structuralValidation.valid, true);
  assert.equal(validateAddress({ ...a, digitalPostcode: "nonsense" }).valid, false);
});

test("state prefixes have a single source of truth (the catalog)", () => {
  assert.deepEqual([...DIGITAL_STATE_CODES].sort(), STATES.map(s => s.code).sort());
  assert.equal(isKnownDigitalPostcodeState("EK-01-A03-FK-01"), true);
  assert.equal(isKnownDigitalPostcodeState("ZZ-01-A03-FK-01"), false);
});

test("normalizeState canonicalises or returns undefined", () => {
  assert.equal(normalizeState("lagos"), "Lagos"); assert.equal(normalizeState("F.C.T"), "Federal Capital Territory");
  assert.equal(normalizeState("akwa ibom"), "Akwa Ibom"); assert.equal(normalizeState("Cross River State"), "Cross River");
  assert.equal(normalizeState("Atlantis"), undefined);
});

test("compareAddresses: no false 'same entity' on sparse or unit-differing addresses", () => {
  assert.equal(compareAddresses(P("Ibadan, Oyo"), P("12 Bodija Road, Ibadan, Oyo")).sameEntity, false);
  assert.equal(compareAddresses(P("Lagos"), P("12 Allen Avenue, Ikeja, Lagos")).sameEntity, false);
  assert.equal(compareAddresses(P("Flat 3, 12 Bodija Road, Ibadan, Oyo"), P("Flat 9, 12 Bodija Road, Ibadan, Oyo")).sameEntity, false);
  assert.equal(compareAddresses(P("12 Bodija Road, Ibadan, Oyo"), P("Bodija Road, Ibadan, Oyo")).sameEntity, false);
  assert.equal(compareAddresses(P("12 Bodija Road, Ibadan, Oyo"), P("12 Bodija Rd, Ibadan, Oyo")).sameEntity, true);
  assert.equal(compareAddresses(P("12 Allen Avenue, Ikeja, Lagos"), P("12 Allen Ave, Ikeja, Lagos")).sameEntity, true);
});

test("fingerprint distinguishes units", () => {
  assert.notEqual(addressFingerprint(P("Flat 3, 12 Bodija Road, Ibadan, Oyo")), addressFingerprint(P("Flat 9, 12 Bodija Road, Ibadan, Oyo")));
});

test("redactAddress removes building-level identifiers; coarse removes street too", () => {
  const a = P("12 Bodija Road, Ibadan, Oyo, OY-12-ABC-DE-34, opposite UCH");
  const r = redactAddress(a);
  for (const f of ["houseNumber", "digitalPostcode", "landmark", "landmarks", "coordinates", "unit", "poBox", "premises"]) assert.equal((r as unknown as Record<string, unknown>)[f], undefined, f);
  assert.equal(r.street, "Bodija Road");
  const c = redactAddress(a, { coarse: true });
  assert.equal(c.street, undefined); assert.equal(c.locality, undefined); assert.equal(c.state?.name, "Oyo");
});

test("serializeAddress is key-order independent", () => {
  const a = P("12 Bodija Road, Ibadan, Oyo");
  assert.equal(serializeAddress(a), serializeAddress(JSON.parse(JSON.stringify(Object.fromEntries(Object.entries(a).reverse())))));
});

test("lookupLga flags ambiguity without a state", () => {
  assert.equal(lookupLga("Surulere").status, "ambiguous");
  assert.equal(lookupLga("Surulere", "Lagos").status, "unique");
});

test("parseAddresses isolates bad inputs and preserves order", () => {
  const r = parseAddresses(["12 Bodija Road, Ibadan", "", "5 Broad Street, Lagos"]);
  assert.equal(r.length, 3); assert.ok(r[1]!.error); assert.ok(r[0]!.result && r[2]!.result);
});

// ---------------- NIPOST adapter ----------------
const okBody = { data: { valid: true, postcode: "OY-12-ABC-DE-34", administrative_address: { state: "Oyo" }, recent_house_address: { line1: "12 Bodija Road" }, point_geometry: { type: "Point", coordinates: [3.9, 7.4] } } };
const mkFetch = (handler: (url: string, init: RequestInit) => Response | Promise<Response>) => (async (u: URL | string, i?: RequestInit) => handler(String(u), i ?? {})) as unknown as typeof fetch;

test("NipostClient maps object-shaped fields, GeoJSON, and keeps a base-URL path", async () => {
  let seen = "";
  const c = new NipostClient({ apiKey: "k", baseUrl: "https://gw.example.com/nipost/", fetchImpl: mkFetch((u, i) => { seen = u; assert.equal((i.headers as Record<string, string>)["X-API-Key"], "k"); return new Response(JSON.stringify(okBody)); }) });
  const r = await c.lookup({ code: "OY12ABCDE34", level: 2 });
  assert.equal(seen, "https://gw.example.com/nipost/v1/lookup?code=OY-12-ABC-DE-34&level=2");
  assert.equal(r.valid, true); assert.equal(r.verified, false);
  assert.deepEqual(r.administrativeAddress, { state: "Oyo" }); assert.deepEqual(r.houseAddress, { line1: "12 Bodija Road" });
  assert.deepEqual(r.coordinates, { latitude: 7.4, longitude: 3.9 });
});

test("NipostClient key handling, retries and error codes", async () => {
  assert.throws(() => new NipostClient({}), TypeError);
  let sentKey: unknown = "unset";
  const anon = new NipostClient({ allowAnonymous: true, fetchImpl: mkFetch((_u, i) => { sentKey = (i.headers as Record<string, string>)["X-API-Key"]; return new Response(JSON.stringify({ data: { valid: false } })); }) });
  assert.equal((await anon.lookup({ code: "OY12ABCDE34" })).status, "not_found"); assert.equal(sentKey, undefined);

  let calls = 0;
  const flaky = new NipostClient({ apiKey: "k", retries: 2, retryDelayMs: 1, fetchImpl: mkFetch(() => (++calls < 3 ? new Response("{}", { status: 503 }) : new Response(JSON.stringify(okBody)))) });
  assert.equal((await flaky.lookup({ code: "OY12ABCDE34" })).valid, true); assert.equal(calls, 3);

  calls = 0;
  const noRetry = new NipostClient({ apiKey: "k", fetchImpl: mkFetch(() => { calls++; return new Response(JSON.stringify({ error: { code: "insufficient_credits", message: "no credits" } }), { status: 402 }); }) });
  await assert.rejects(() => noRetry.lookup({ code: "OY12ABCDE34" }), (e: unknown) => e instanceof NipostError && e.code === "insufficient_credits" && e.status === 402);
  assert.equal(calls, 1);
  await assert.rejects(() => noRetry.lookup({ code: "bad" }), TypeError);
});
