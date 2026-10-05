import test from "node:test";
import assert from "node:assert/strict";
import { parseAddress } from "../dist/index.js";

const GOLD = [
  ["12 Adeola Odeku Street, VI, Lagos", "Lagos", "Victoria Island", "Adeola Odeku street", "12"],
  ["15 Allen Avenue, Ikeja, Lagos State", "Lagos", "Ikeja", "Allen avenue", "15"],
  ["22b Ogunlana Drive, Surulere, Lagos, 101283", "Lagos", "Surulere", "Ogunlana drive", "22b"],
  ["No 14 behind the mosque, Mokola, Ibadan, Oyo State", "Oyo", "Ibadan", "Mokola", "14"],
  ["14 Bodija Road Ibadan Oyo State", "Oyo", "Ibadan", "Bodija road", "14"],
  ["No 7 Ahmadu Bello Way, Kaduna", "Kaduna", "Kaduna", "Ahmadu Bello way", "7"],
  ["block 4 flat 2 harmony estate oluyole ibadan", "Oyo", "Ibadan", undefined, undefined],
  ["Ìbàdàn, Ọyọ", "Oyo", "Ibadan", undefined, undefined],
  ["House 9, opposite UCH, Queen Elizabeth Road, Ibadan, Oyo", "Oyo", "Ibadan", "Queen Elizabeth road", "9"],
  ["Flat 3, Block B, Harmony Estate, Oluyole, Ibadan, Oyo", "Oyo", "Ibadan", undefined, undefined],
] as const;

test("v0.11 adversarial benchmark reports field-level accuracy", () => {
  let state = 0, locality = 0, street = 0, house = 0;
  for (const [input, expectedState, expectedLocality, expectedStreet, expectedHouse] of GOLD) {
    const a = parseAddress(input).address;
    state += a.state?.name === expectedState ? 1 : 0;
    locality += a.locality === expectedLocality ? 1 : 0;
    if (expectedStreet !== undefined) street += a.street === expectedStreet ? 1 : 0;
    if (expectedHouse !== undefined) house += a.houseNumber === expectedHouse ? 1 : 0;
  }
  assert.equal(state, GOLD.length, `state accuracy ${state}/${GOLD.length}`);
  assert.equal(locality, GOLD.length, `locality accuracy ${locality}/${GOLD.length}`);
  assert.equal(street, 7, `street accuracy ${street}/6`);
  assert.equal(house, 7, `house accuracy ${house}/6`);
});
