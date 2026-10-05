import test from "node:test";
import assert from "node:assert/strict";
import { normalizeLocality, resolveLocality } from "../dist/index.js";

test("v0.11 resolves accented and aliased capitals", () => {
  assert.equal(normalizeLocality("Ìbàdàn"), "Ibadan");
  assert.equal(normalizeLocality("V.I."), "Victoria Island");
  const result = resolveLocality("Ìbàdàn");
  assert.equal(result.status, "unique");
  assert.equal(result.candidates[0]?.name, "Ibadan");
});

test("v0.11 resolves an LGA as a locality only when it is canonical", () => {
  const result = resolveLocality("Oluyole", "Oyo");
  assert.equal(result.status, "unique");
  assert.equal(result.candidates[0]?.kind, "lga");
});

test("v0.11 refuses an ambiguous locality without state context", () => {
  const result = resolveLocality("Obi");
  assert.equal(result.status, "ambiguous");
  assert.ok(result.candidates.length > 1);
});
