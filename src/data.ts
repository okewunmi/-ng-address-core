export const NIGERIAN_STATES = [
  ["Abia", "AB"], ["Adamawa", "AD"], ["Akwa Ibom", "AK"], ["Anambra", "AN"],
  ["Bauchi", "BA"], ["Bayelsa", "BY"], ["Benue", "BE"], ["Borno", "BO"],
  ["Cross River", "CR"], ["Delta", "DE"], ["Ebonyi", "EB"], ["Edo", "ED"],
  ["Ekiti", "EK"], ["Enugu", "EN"], ["Gombe", "GO"], ["Imo", "IM"],
  ["Jigawa", "JI"], ["Kaduna", "KD"], ["Kano", "KN"], ["Katsina", "KT"],
  ["Kebbi", "KE"], ["Kogi", "KO"], ["Kwara", "KW"], ["Lagos", "LA"],
  ["Nasarawa", "NA"], ["Niger", "NI"], ["Ogun", "OG"], ["Ondo", "ON"],
  ["Osun", "OS"], ["Oyo", "OY"], ["Plateau", "PL"], ["Rivers", "RI"],
  ["Sokoto", "SO"], ["Taraba", "TA"], ["Yobe", "YO"], ["Zamfara", "ZA"],
  ["Federal Capital Territory", "FC"]
] as const;

export const STATE_ALIASES: Record<string, string> = {
  fct: "Federal Capital Territory", "f.c.t": "Federal Capital Territory",
  "federal capital territory": "Federal Capital Territory", abuja: "Federal Capital Territory",
  "akwa-ibom": "Akwa Ibom", "akwa ibom state": "Akwa Ibom",
  "cross-river": "Cross River", "cross river state": "Cross River",
  ...Object.fromEntries(NIGERIAN_STATES.map(([name]) => [`${name.toLowerCase()} state`, name]))
};

export const STREET_TYPE_ALIASES: Record<string, string> = {
  st: "street", str: "street", street: "street", rd: "road", road: "road",
  ave: "avenue", av: "avenue", avenue: "avenue", cl: "close", close: "close",
  cres: "crescent", crescent: "crescent", dr: "drive", drive: "drive", way: "way",
  blvd: "boulevard", boulevard: "boulevard", ln: "lane", lane: "lane", ct: "court",
  court: "court", pl: "place", place: "place", ter: "terrace", terrace: "terrace"
};

export const LANDMARK_RELATIONS = [
  "close to", "opposite", "behind", "beside", "near", "after", "before", "along",
  "off", "inside", "within", "alongside", "by"
] as const;

export const COMMON_STRUCTURE_WORDS = [
  "house", "no", "number", "plot", "block", "flat", "shop", "unit", "building",
  "floor", "room", "gate", "phase", "estate", "compound", "junction", "market",
  "bus stop", "roundabout", "campus"
] as const;
