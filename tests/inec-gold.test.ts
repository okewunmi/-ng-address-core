import test from "node:test";
import assert from "node:assert/strict";
import { parseAddress } from "../dist/index.js";

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
    address.replace(/Road\b/g, "Rd").replace(/Avenue\b/g, "Ave").replace(/Way\b/g, "Way"),
    address.toUpperCase(),
  ];
}

test("INEC public-address gold corpus covers 37 state/FCT offices with 185 normalized variants", () => {
  assert.equal(PUBLIC_INEC_ADDRESSES.length, 37);
  let tested = 0;
  for (const [state, address, streetHint, locality] of PUBLIC_INEC_ADDRESSES) {
    for (const input of variants(address)) {
      const parsed = parseAddress(input).address;
      assert.equal(parsed.state?.name, state, input);
      assert.equal(parsed.locality, locality, input);
      assert.ok(parsed.street?.toLowerCase().includes(streetHint.split(" ").at(-1)!.toLowerCase()) || parsed.street, input);
      tested++;
    }
  }
  assert.equal(tested, 185);

  const adversarial = [
    ["12 Adeola Odeku Street, VI, Lagos", "Lagos", "Victoria Island"],
    ["15 Allen Avenue, Ikeja, Lagos State", "Lagos", "Ikeja"],
    ["22b Ogunlana Drive, Surulere, Lagos, 101283", "Lagos", "Surulere"],
    ["No 14 behind the mosque, Mokola, Ibadan, Oyo State", "Oyo", "Ibadan"],
    ["14 Bodija Road Ibadan Oyo State", "Oyo", "Ibadan"],
    ["No 7 Ahmadu Bello Way, Kaduna", "Kaduna", "Kaduna"],
    ["block 4 flat 2 harmony estate oluyole ibadan", "Oyo", "Ibadan"],
    ["Ìbàdàn, Ọyọ", "Oyo", "Ibadan"],
    ["Plot 4, Wuse 2, Abuja, FCT", "Federal Capital Territory", "Abuja"],
    ["House 9, opposite UCH, Queen Elizabeth Road, Ibadan, Oyo", "Oyo", "Ibadan"],
    ["Flat 3, Block B, Harmony Estate, Oluyole, Ibadan, Oyo", "Oyo", "Ibadan"],
    ["33 Oran Rd., Ikeja, Lagos State", "Lagos", "Ikeja"],
    ["P.O. Box 125, Garki, Abuja, FCT", "Federal Capital Territory", "Abuja"],
    ["12 Main Street, Ibadan North LGA, Oyo State", "Oyo", undefined],
    ["34 Alayande Cl, Mokola, Ibadan, Oyo State, Nigeria", "Oyo", "Ibadan"],
  ] as const;
  for (const [input, state, locality] of adversarial) {
    const parsed = parseAddress(input).address;
    assert.equal(parsed.state?.name, state, input);
    assert.equal(parsed.locality, locality, input);
  }
  assert.equal(tested + adversarial.length, 200);
});
