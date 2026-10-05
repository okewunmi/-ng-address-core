import test from "node:test";
import assert from "node:assert/strict";
import { parseAddress, normalizeComparable } from "../dist/index.js";

/**
 * Public institutional addresses copied from INEC's current State Offices directory.
 * They are used as a parser corpus, not as proof of any private residence.
 */
const PUBLIC_INEC_ADDRESSES = [
  ["Abia", "INEC State Headquarters, Bende Road, Umuahia, Abia State", "Bende Road", "Umuahia"],
  ["Adamawa", "INEC State Headquarters, Galadima Aminu Way, Jimeta-Yola, Adamawa State", "Galadima Aminu Way", "Jimeta-Yola"],
  ["Akwa Ibom", "INEC State Headquarters, Udo Udoma Avenue, Uyo, Akwa Ibom State", "Udo Udoma Avenue", "Uyo"],
  ["Anambra", "INEC State Headquarters, House of Assembly Road, Awka, Anambra State", "House of Assembly Road", "Awka"],
  ["Bauchi", "INEC State Headquarters, Ahmadu Bello Way, Bauchi, Bauchi State", "Ahmadu Bello Way", "Bauchi"],
  ["Bayelsa", "INEC State Headquarters, Swali Road, Yenagoa, Bayelsa State", "Swali Road", "Yenagoa"],
  ["Benue", "INEC State Headquarters, Jonah Jang Crescent, Makurdi, Benue State", "Jonah Jang Crescent", "Makurdi"],
  ["Borno", "INEC State Headquarters, Bama Road, Maiduguri, Borno State", "Bama Road", "Maiduguri"],
  ["Cross River", "INEC State Headquarters, Murtala Mohammed Highway, Calabar, Cross River State", "Murtala Mohammed Highway", "Calabar"],
  ["Delta", "INEC State Headquarters, Okpanam Road, Asaba, Delta State", "Okpanam Road", "Asaba"],
  ["Ebonyi", "INEC State Headquarters, Town Planning Road, Abakaliki, Ebonyi State", "Town Planning Road", "Abakaliki"],
  ["Edo", "INEC State Headquarters, Ikpoba Hill, Benin City, Edo State", "Ikpoba Hill", "Benin City"],
  ["Ekiti", "INEC State Headquarters, New Iyin Road, Ado-Ekiti, Ekiti State", "New Iyin Road", "Ado-Ekiti"],
  ["Enugu", "INEC State Headquarters, 1 Achi Street, Independence Layout, Enugu, Enugu State", "1 Achi Street", "Enugu"],
  ["Federal Capital Territory", "INEC FCT Office, Area 10, Garki, Abuja, FCT", "Area 10", "Abuja"],
  ["Gombe", "INEC State Headquarters, Bauchi Road, Gombe, Gombe State", "Bauchi Road", "Gombe"],
  ["Imo", "INEC State Headquarters, Port Harcourt Road, Owerri, Imo State", "Port Harcourt Road", "Owerri"],
  ["Jigawa", "INEC State Headquarters, Kiyawa Road, Dutse, Jigawa State", "Kiyawa Road", "Dutse"],
  ["Kaduna", "INEC State Headquarters, Isa Kaita Road, Kaduna, Kaduna State", "Isa Kaita Road", "Kaduna"],
  ["Kano", "INEC State Headquarters, Hadejia Road, Kano, Kano State", "Hadejia Road", "Kano"],
  ["Katsina", "INEC State Headquarters, Hassan Usman Katsina Road, Katsina, Katsina State", "Hassan Usman Katsina Road", "Katsina"],
  ["Kebbi", "INEC State Headquarters, Sultan Abubakar Way, Birnin Kebbi, Kebbi State", "Sultan Abubakar Way", "Birnin Kebbi"],
  ["Kogi", "INEC State Headquarters, Mount Patti Road, Lokoja, Kogi State", "Mount Patti Road", "Lokoja"],
  ["Kwara", "INEC State Headquarters, Fate Road, G.R.A, Ilorin, Kwara State", "Fate Road", "Ilorin"],
  ["Lagos", "INEC State Headquarters, 6 Birrel Avenue, Sabo, Yaba, Lagos State", "6 Birrel Avenue", "Yaba"],
  ["Nasarawa", "INEC State Headquarters, Shendam Road, Lafia, Nasarawa State", "Shendam Road", "Lafia"],
  ["Niger", "INEC State Headquarters, David Mark Road, Minna, Niger State", "David Mark Road", "Minna"],
  ["Ogun", "INEC State Headquarters, Magbon, Abeokuta, Ogun State", "Magbon", "Abeokuta"],
  ["Ondo", "INEC State Headquarters, Alagbaka, Akure, Ondo State", "Alagbaka", "Akure"],
  ["Osun", "INEC State Headquarters, Gbongan/Osogbo Road, Osogbo, Osun State", "Gbongan/Osogbo Road", "Osogbo"],
  ["Oyo", "INEC State Headquarters, Parliament Road, Agodi, Ibadan, Oyo State", "Parliament Road", "Ibadan"],
  ["Plateau", "INEC State Headquarters, Miango Road, Jos, Plateau State", "Miango Road", "Jos"],
  ["Rivers", "INEC State Headquarters, 236 Aba Road, Port Harcourt, Rivers State", "236 Aba Road", "Port Harcourt"],
  ["Sokoto", "INEC State Headquarters, Garba Duba Road, Sokoto, Sokoto State", "Garba Duba Road", "Sokoto"],
  ["Taraba", "INEC State Headquarters, Barde Way, Jalingo, Taraba State", "Barde Way", "Jalingo"],
  ["Yobe", "INEC State Headquarters, Gujba Road, Damaturu, Yobe State", "Gujba Road", "Damaturu"],
  ["Zamfara", "INEC State Headquarters, Sokoto Road, Gusau, Zamfara State", "Sokoto Road", "Gusau"],
] as const;

function variants(address: string): string[] {
  return [
    address,
    address.replaceAll(", ", ","),
    address.replace(/State Headquarters/i, "State HQ"),
    address.replace(/Road\b/g, "Rd").replace(/Avenue\b/g, "Ave"),
    address.toUpperCase(),
  ];
}
const cmp = (v: string | undefined) => normalizeComparable(v);

// Expectations are derived from the hint column (the source of truth), NOT from parser output.
function expected(state: string, hint: string, locality: string) {
  if (hint === "Area 10") return { state, locality, houseNumber: undefined, street: undefined, area: "Area 10" };
  const m = hint.match(/^(\d+)\s+(.+)$/);
  return { state, locality, houseNumber: m?.[1], street: m ? m[2]! : hint, area: undefined };
}

test("INEC gold corpus: strict state, locality, house number, street and premises on all variants", () => {
  assert.equal(PUBLIC_INEC_ADDRESSES.length, 37);
  let tested = 0;
  for (const [state, address, hint, locality] of PUBLIC_INEC_ADDRESSES) {
    const want = expected(state, hint, locality);
    for (const input of variants(address)) {
      const got = parseAddress(input).address;
      assert.equal(got.state?.name, want.state, `state: ${input}`);
      assert.equal(cmp(got.locality), cmp(want.locality), `locality: ${input}`);
      assert.equal(got.houseNumber, want.houseNumber, `houseNumber: ${input}`);
      assert.equal(cmp(got.street), cmp(want.street), `street: ${input}`);
      if (want.area) assert.equal(cmp(got.area), cmp(want.area), `area: ${input}`);
      assert.ok(/^inec\b/i.test(got.premises ?? ""), `premises: ${input} -> ${got.premises}`);
      tested++;
    }
  }
  assert.equal(tested, 185);
});

test("adversarial Nigerian shapes: strict fields", () => {
  const cases: Array<[string, Record<string, string | undefined>]> = [
    ["12 Adeola Odeku Street, VI, Lagos", { houseNumber: "12", street: "Adeola Odeku Street", locality: "Victoria Island", state: "Lagos", district: undefined }],
    ["15 Allen Avenue, Ikeja, Lagos State", { houseNumber: "15", street: "Allen Avenue", locality: "Ikeja", state: "Lagos" }],
    ["22b Ogunlana Drive, Surulere, Lagos, 101283", { houseNumber: "22b", street: "Ogunlana Drive", locality: "Surulere", state: "Lagos", postcode: "101283" }],
    ["No 14 behind the mosque, Mokola, Ibadan, Oyo State", { houseNumber: "14", locality: "Ibadan", state: "Oyo" }],
    ["14 Bodija Road Ibadan Oyo State", { houseNumber: "14", street: "Bodija Road", locality: "Ibadan", state: "Oyo" }],
    ["No 7 Ahmadu Bello Way, Kaduna", { houseNumber: "7", street: "Ahmadu Bello Way", locality: "Kaduna", state: "Kaduna" }],
    ["Ìbàdàn, Ọyọ", { locality: "Ibadan", state: "Oyo", street: undefined }],
    ["House 9, opposite UCH, Queen Elizabeth Road, Ibadan, Oyo", { houseNumber: "9", street: "Queen Elizabeth Road", locality: "Ibadan", state: "Oyo" }],
    ["33 Oran Rd., Ikeja, Lagos State", { houseNumber: "33", street: "Oran Road", locality: "Ikeja", state: "Lagos" }],
    ["34 Alayande Cl, Mokola, Ibadan, Oyo State, Nigeria", { houseNumber: "34", street: "Alayande Close", locality: "Ibadan", state: "Oyo" }],
  ];
  for (const [input, want] of cases) {
    const got = parseAddress(input).address;
    for (const [field, value] of Object.entries(want)) {
      const actual = field === "state" ? got.state?.name : (got as unknown as Record<string, unknown>)[field];
      assert.equal(actual, value, `${field}: ${input}`);
    }
  }
});
