/** v0.8.0 administrative catalog.
 *
 * Dataset provenance: derived from the MIT-licensed `Some19ice/nigeria-geo`
 * state/LGA reference dataset, cross-checked against INEC's current 37-state/FCT
 * and 774-LGA administrative directory. This catalog is an address-intelligence
 * reference; it does not prove that an address, building, occupancy, ownership,
 * or postcode exists.
 */
export type GeopoliticalZone = "North Central" | "North East" | "North West" | "South East" | "South South" | "South West";
export type AdministrativeLevel = "state" | "lga" | "fct-area-council";
export interface DataProvenance { source: string; sourceUrl: string; license?: string; retrievedAt: string; verification: "secondary" | "cross-checked" | "authoritative"; notes?: string; }
export interface StateRecord { id: string; name: string; code: string; capital: string; zone: GeopoliticalZone; aliases: readonly string[]; lgas: readonly string[]; }
export interface LgaRecordV8 { id: string; name: string; state: string; stateCode: string; level: "lga" | "fct-area-council"; aliases: readonly string[]; }
export interface DatasetManifest { version: string; states: number; lgas: number; fctAreaCouncils: number; totalAdministrativeUnits: number; provenance: readonly DataProvenance[]; }

export const ADMINISTRATIVE_PROVENANCE: readonly DataProvenance[] = [
  { source: "INEC State Offices & LGA Offices", sourceUrl: "https://www.inecnigeria.org/about/state-offices", retrievedAt: "2026-10-04", verification: "authoritative", notes: "Current INEC directory confirms 36 states + FCT and 774 LGA offices." },
  { source: "Some19ice/nigeria-geo", sourceUrl: "https://github.com/Some19ice/nigeria-geo", license: "MIT", retrievedAt: "2026-10-04", verification: "secondary", notes: "Used as a machine-readable secondary reference; normalized/corrected spellings are maintained here." },
] as const;

function slug(value: string): string { return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
function key(value: string): string { return value.trim().toLowerCase().replace(/[’`]/g, "").replace(/[^a-z0-9]+/g, ""); }

export const STATES_V8: readonly StateRecord[] = [
  {
    id: 'abia', name: 'Abia', code: 'AB', capital: 'Umuahia', zone: 'South East',
    aliases: ['Abia State'],
    lgas: ['Aba North', 'Aba South', 'Arochukwu', 'Bende', 'Ikwuano', 'Isiala Ngwa North', 'Isiala Ngwa South', 'Isuikwuato', 'Obi Ngwa', 'Ohafia', 'Osisioma Ngwa', 'Ugwunagbo', 'Ukwa East', 'Ukwa West', 'Umuahia North', 'Umuahia South', 'Umunneochi'],
  },
  {
    id: 'adamawa', name: 'Adamawa', code: 'AD', capital: 'Yola', zone: 'North East',
    aliases: ['Adamawa State'],
    lgas: ['Demsa', 'Fufore', 'Ganye', 'Girei', 'Gombi', 'Guyuk', 'Hong', 'Jada', 'Lamurde', 'Madagali', 'Maiha', 'Mayo-Belwa', 'Michika', 'Mubi North', 'Mubi South', 'Numan', 'Shelleng', 'Song', 'Toungo', 'Yola North', 'Yola South'],
  },
  {
    id: 'akwa-ibom', name: 'Akwa Ibom', code: 'AK', capital: 'Uyo', zone: 'South South',
    aliases: ['Akwa Ibom State', 'Akwa-Ibom', 'Akwa-Ibom State'],
    lgas: ['Abak', 'Eastern Obolo', 'Eket', 'Esit Eket', 'Essien Udim', 'Etim Ekpo', 'Etinan', 'Ibeno', 'Ibesikpo Asutan', 'Ibiono Ibom', 'Ika', 'Ikono', 'Ikot Abasi', 'Ikot Ekpene', 'Ini', 'Itu', 'Mbo', 'Mkpat Enin', 'Nsit Atai', 'Nsit Ibom', 'Nsit Ubium', 'Obot Akara', 'Okobo', 'Onna', 'Oron', 'Oruk Anam', 'Udung Uko', 'Ukanafun', 'Uruan', 'Urue-Offong/Oruko', 'Uyo'],
  },
  {
    id: 'anambra', name: 'Anambra', code: 'AN', capital: 'Awka', zone: 'South East',
    aliases: ['Anambra State'],
    lgas: ['Aguata', 'Anambra East', 'Anambra West', 'Anaocha', 'Awka North', 'Awka South', 'Ayamelum', 'Dunukofia', 'Ekwusigo', 'Idemili North', 'Idemili South', 'Ihiala', 'Njikoka', 'Nnewi North', 'Nnewi South', 'Ogbaru', 'Onitsha North', 'Onitsha South', 'Orumba North', 'Orumba South', 'Oyi'],
  },
  {
    id: 'bauchi', name: 'Bauchi', code: 'BA', capital: 'Bauchi', zone: 'North East',
    aliases: ['Bauchi State'],
    lgas: ['Alkaleri', 'Bauchi', 'Bogoro', 'Damban', 'Darazo', 'Dass', 'Gamawa', 'Ganjuwa', 'Giade', 'Itas/Gadau', "Jama'are", 'Katagum', 'Kirfi', 'Misau', 'Ningi', 'Shira', 'Tafawa Balewa', 'Toro', 'Warji', 'Zaki'],
  },
  {
    id: 'bayelsa', name: 'Bayelsa', code: 'BY', capital: 'Yenagoa', zone: 'South South',
    aliases: ['Bayelsa State'],
    lgas: ['Brass', 'Ekeremor', 'Kolokuma/Opokuma', 'Nembe', 'Ogbia', 'Sagbama', 'Southern Ijaw', 'Yenagoa'],
  },
  {
    id: 'benue', name: 'Benue', code: 'BE', capital: 'Makurdi', zone: 'North Central',
    aliases: ['Benue State'],
    lgas: ['Ado', 'Agatu', 'Apa', 'Buruku', 'Gboko', 'Guma', 'Gwer East', 'Gwer West', 'Katsina-Ala', 'Konshisha', 'Kwande', 'Logo', 'Makurdi', 'Obi', 'Ogbadibo', 'Oju', 'Okpokwu', 'Ohimini', 'Oturkpo', 'Tarka', 'Ukum', 'Ushongo', 'Vandeikya'],
  },
  {
    id: 'borno', name: 'Borno', code: 'BO', capital: 'Maiduguri', zone: 'North East',
    aliases: ['Borno State', 'Bornu'],
    lgas: ['Abadam', 'Askira/Uba', 'Bama', 'Bayo', 'Biu', 'Chibok', 'Damboa', 'Dikwa', 'Gubio', 'Guzamala', 'Gwoza', 'Hawul', 'Jere', 'Kaga', 'Kala/Balge', 'Konduga', 'Kukawa', 'Kwaya Kusar', 'Mafa', 'Magumeri', 'Maiduguri', 'Marte', 'Mobbar', 'Monguno', 'Ngala', 'Nganzai', 'Shani'],
  },
  {
    id: 'cross-river', name: 'Cross River', code: 'CR', capital: 'Calabar', zone: 'South South',
    aliases: ['Cross River State', 'Cross-River'],
    lgas: ['Abi', 'Akamkpa', 'Akpabuyo', 'Bakassi', 'Bekwarra', 'Biase', 'Boki', 'Calabar Municipal', 'Calabar South', 'Etung', 'Ikom', 'Obanliku', 'Obubra', 'Obudu', 'Odukpani', 'Ogoja', 'Yakuur', 'Yala'],
  },
  {
    id: 'delta', name: 'Delta', code: 'DE', capital: 'Asaba', zone: 'South South',
    aliases: ['Delta State'],
    lgas: ['Aniocha North', 'Aniocha South', 'Bomadi', 'Burutu', 'Ethiope East', 'Ethiope West', 'Ika North East', 'Ika South', 'Isoko North', 'Isoko South', 'Ndokwa East', 'Ndokwa West', 'Okpe', 'Oshimili North', 'Oshimili South', 'Patani', 'Sapele', 'Udu', 'Ughelli North', 'Ughelli South', 'Ukwuani', 'Uvwie', 'Warri North', 'Warri South', 'Warri South West'],
  },
  {
    id: 'ebonyi', name: 'Ebonyi', code: 'EB', capital: 'Abakaliki', zone: 'South East',
    aliases: ['Ebonyi State'],
    lgas: ['Abakaliki', 'Afikpo North', 'Afikpo South', 'Ebonyi', 'Ezza North', 'Ezza South', 'Ikwo', 'Ishielu', 'Ivo', 'Izzi', 'Ohaukwu', 'Ohaozara', 'Onicha'],
  },
  {
    id: 'edo', name: 'Edo', code: 'ED', capital: 'Benin City', zone: 'South South',
    aliases: ['Edo State'],
    lgas: ['Akoko-Edo', 'Egor', 'Esan Central', 'Esan North-East', 'Esan South-East', 'Esan West', 'Etsako Central', 'Etsako East', 'Etsako West', 'Igueben', 'Ikpoba-Okha', 'Oredo', 'Orhionmwon', 'Ovia North-East', 'Ovia South-West', 'Owan East', 'Owan West', 'Uhunmwonde'],
  },
  {
    id: 'ekiti', name: 'Ekiti', code: 'EK', capital: 'Ado-Ekiti', zone: 'South West',
    aliases: ['Ekiti State'],
    lgas: ['Ado Ekiti', 'Efon', 'Ekiti East', 'Ekiti South-West', 'Ekiti West', 'Emure', 'Gbonyin', 'Ido-Osi', 'Ijero', 'Ikere', 'Ikole', 'Ilejemeje', 'Irepodun/Ifelodun', 'Ise/Orun', 'Moba', 'Oye'],
  },
  {
    id: 'enugu', name: 'Enugu', code: 'EN', capital: 'Enugu', zone: 'South East',
    aliases: ['Enugu State'],
    lgas: ['Aninri', 'Awgu', 'Enugu East', 'Enugu North', 'Enugu South', 'Ezeagu', 'Igbo-Etiti', 'Igbo-Eze North', 'Igbo-Eze South', 'Isi-Uzo', 'Nkanu East', 'Nkanu West', 'Nsukka', 'Oji River', 'Udenu', 'Udi', 'Uzo-Uwani'],
  },
  {
    id: 'gombe', name: 'Gombe', code: 'GO', capital: 'Gombe', zone: 'North East',
    aliases: ['Gombe State'],
    lgas: ['Akko', 'Balanga', 'Billiri', 'Dukku', 'Funakaye', 'Gombe', 'Kaltungo', 'Kwami', 'Nafada', 'Shongom', 'Yamaltu/Deba'],
  },
  {
    id: 'imo', name: 'Imo', code: 'IM', capital: 'Owerri', zone: 'South East',
    aliases: ['Imo State'],
    lgas: ['Aboh Mbaise', 'Ahiazu Mbaise', 'Ehime Mbano', 'Ezinihitte', 'Ideato North', 'Ideato South', 'Ihitte/Uboma', 'Ikeduru', 'Isiala Mbano', 'Isu', 'Mbaitoli', 'Ngor Okpala', 'Njaba', 'Nkwerre', 'Nwangele', 'Obowo', 'Oguta', 'Ohaji/Egbema', 'Okigwe', 'Orlu', 'Orsu', 'Oru East', 'Oru West', 'Owerri Municipal', 'Owerri North', 'Owerri West', 'Unuimo'],
  },
  {
    id: 'jigawa', name: 'Jigawa', code: 'JI', capital: 'Dutse', zone: 'North West',
    aliases: ['Jigawa State'],
    lgas: ['Auyo', 'Babura', 'Biriniwa', 'Birnin Kudu', 'Buji', 'Dutse', 'Gagarawa', 'Garki', 'Gumel', 'Guri', 'Gwaram', 'Gwiwa', 'Hadejia', 'Jahun', 'Kafin Hausa', 'Kaugama', 'Kazaure', 'Kiri Kasama', 'Kiyawa', 'Maigatari', 'Malam Madori', 'Miga', 'Ringim', 'Roni', 'Sule Tankarkar', 'Taura', 'Yankwashi'],
  },
  {
    id: 'kaduna', name: 'Kaduna', code: 'KD', capital: 'Kaduna', zone: 'North West',
    aliases: ['Kaduna State'],
    lgas: ['Birnin Gwari', 'Chikun', 'Giwa', 'Igabi', 'Ikara', 'Jaba', "Jema'a", 'Kachia', 'Kaduna North', 'Kaduna South', 'Kagarko', 'Kajuru', 'Kaura', 'Kauru', 'Kubau', 'Kudan', 'Lere', 'Makarfi', 'Sabon Gari', 'Sanga', 'Soba', 'Zangon Kataf', 'Zaria'],
  },
  {
    id: 'kano', name: 'Kano', code: 'KN', capital: 'Kano', zone: 'North West',
    aliases: ['Kano State'],
    lgas: ['Ajingi', 'Albasu', 'Bagwai', 'Bebeji', 'Bichi', 'Bunkure', 'Dala', 'Dambatta', 'Dawakin Kudu', 'Dawakin Tofa', 'Doguwa', 'Fagge', 'Gabasawa', 'Garko', 'Garun Mallam', 'Gaya', 'Gezawa', 'Gwale', 'Gwarzo', 'Kabo', 'Kano Municipal', 'Karaye', 'Kibiya', 'Kiru', 'Kumbotso', 'Kunchi', 'Kura', 'Madobi', 'Makoda', 'Minjibir', 'Nasarawa', 'Rano', 'Rimin Gado', 'Rogo', 'Shanono', 'Sumaila', 'Takai', 'Tarauni', 'Tofa', 'Tsanyawa', 'Tudun Wada', 'Ungogo', 'Warawa', 'Wudil'],
  },
  {
    id: 'katsina', name: 'Katsina', code: 'KT', capital: 'Katsina', zone: 'North West',
    aliases: ['Katsina State'],
    lgas: ['Bakori', 'Batagarawa', 'Batsari', 'Baure', 'Bindawa', 'Charanchi', 'Dan Musa', 'Dandume', 'Danja', 'Daura', 'Dutsi', 'Dutsin-Ma', 'Faskari', 'Funtua', 'Ingawa', 'Jibia', 'Kafur', 'Kaita', 'Kankara', 'Kankia', 'Katsina', 'Kurfi', 'Kusada', "Mai'Adua", 'Malumfashi', 'Mani', 'Mashi', 'Matazu', 'Musawa', 'Rimi', 'Sabuwa', 'Safana', 'Sandamu', 'Zango'],
  },
  {
    id: 'kebbi', name: 'Kebbi', code: 'KE', capital: 'Birnin Kebbi', zone: 'North West',
    aliases: ['Kebbi State'],
    lgas: ['Aleiro', 'Arewa Dandi', 'Argungu', 'Augie', 'Bagudo', 'Birnin Kebbi', 'Bunza', 'Dandi', 'Fakai', 'Gwandu', 'Jega', 'Kalgo', 'Koko/Besse', 'Maiyama', 'Ngaski', 'Sakaba', 'Shanga', 'Suru', 'Wasagu/Danko', 'Yauri', 'Zuru'],
  },
  {
    id: 'kogi', name: 'Kogi', code: 'KO', capital: 'Lokoja', zone: 'North Central',
    aliases: ['Kogi State'],
    lgas: ['Adavi', 'Ajaokuta', 'Ankpa', 'Bassa', 'Dekina', 'Ibaji', 'Idah', 'Igalamela/Odolu', 'Ijumu', 'Kabba/Bunu', 'Kogi', 'Lokoja', 'Mopa-Muro', 'Ofu', 'Ogori/Magongo', 'Okehi', 'Okene', 'Olamaboro', 'Omala', 'Yagba East', 'Yagba West'],
  },
  {
    id: 'kwara', name: 'Kwara', code: 'KW', capital: 'Ilorin', zone: 'North Central',
    aliases: ['Kwara State'],
    lgas: ['Asa', 'Baruten', 'Edu', 'Ekiti', 'Ifelodun', 'Ilorin East', 'Ilorin South', 'Ilorin West', 'Irepodun', 'Isin', 'Kaiama', 'Moro', 'Offa', 'Oke Ero', 'Oyun', 'Pategi'],
  },
  {
    id: 'lagos', name: 'Lagos', code: 'LA', capital: 'Ikeja', zone: 'South West',
    aliases: ['Lagos State'],
    lgas: ['Agege', 'Ajeromi-Ifelodun', 'Alimosho', 'Amuwo-Odofin', 'Apapa', 'Badagry', 'Epe', 'Eti-Osa', 'Ibeju-Lekki', 'Ifako-Ijaiye', 'Ikeja', 'Ikorodu', 'Kosofe', 'Lagos Island', 'Lagos Mainland', 'Mushin', 'Ojo', 'Oshodi-Isolo', 'Shomolu', 'Surulere'],
  },
  {
    id: 'nasarawa', name: 'Nasarawa', code: 'NA', capital: 'Lafia', zone: 'North Central',
    aliases: ['Nasarawa State'],
    lgas: ['Akwanga', 'Awe', 'Doma', 'Karu', 'Keana', 'Keffi', 'Kokona', 'Lafia', 'Nasarawa', 'Nasarawa Eggon', 'Obi', 'Toto', 'Wamba'],
  },
  {
    id: 'niger', name: 'Niger', code: 'NI', capital: 'Minna', zone: 'North Central',
    aliases: ['Niger State'],
    lgas: ['Agaie', 'Agwara', 'Bida', 'Borgu', 'Bosso', 'Chanchaga', 'Edati', 'Gbako', 'Gurara', 'Katcha', 'Kontagora', 'Lapai', 'Lavun', 'Magama', 'Mariga', 'Mashegu', 'Mokwa', 'Munya', 'Paikoro', 'Rafi', 'Rijau', 'Shiroro', 'Suleja', 'Tafa', 'Wushishi'],
  },
  {
    id: 'ogun', name: 'Ogun', code: 'OG', capital: 'Abeokuta', zone: 'South West',
    aliases: ['Ogun State'],
    lgas: ['Abeokuta North', 'Abeokuta South', 'Ado-Odo/Ota', 'Egbado North', 'Egbado South', 'Ewekoro', 'Ifo', 'Ijebu East', 'Ijebu North', 'Ijebu North East', 'Ijebu Ode', 'Ikenne', 'Imeko Afon', 'Ipokia', 'Obafemi Owode', 'Ogun Waterside', 'Odeda', 'Odogbolu', 'Remo North', 'Sagamu'],
  },
  {
    id: 'ondo', name: 'Ondo', code: 'ON', capital: 'Akure', zone: 'South West',
    aliases: ['Ondo State'],
    lgas: ['Akoko North-East', 'Akoko North-West', 'Akoko South-East', 'Akoko South-West', 'Akure North', 'Akure South', 'Ese Odo', 'Idanre', 'Ifedore', 'Ilaje', 'Ile Oluji/Okeigbo', 'Irele', 'Odigbo', 'Okitipupa', 'Ondo East', 'Ondo West', 'Ose', 'Owo'],
  },
  {
    id: 'osun', name: 'Osun', code: 'OS', capital: 'Osogbo', zone: 'South West',
    aliases: ['Osun State'],
    lgas: ['Atakunmosa East', 'Atakunmosa West', 'Ayedaade', 'Ayedire', 'Boluwaduro', 'Boripe', 'Ede North', 'Ede South', 'Egbedore', 'Ejigbo', 'Ife Central', 'Ife East', 'Ife North', 'Ife South', 'Ifedayo', 'Ifelodun', 'Ila', 'Ilesa East', 'Ilesa West', 'Irepodun', 'Irewole', 'Isokan', 'Iwo', 'Obokun', 'Odo Otin', 'Ola Oluwa', 'Olorunda', 'Oriade', 'Orolu', 'Osogbo'],
  },
  {
    id: 'oyo', name: 'Oyo', code: 'OY', capital: 'Ibadan', zone: 'South West',
    aliases: ['Oyo State'],
    lgas: ['Afijio', 'Akinyele', 'Atiba', 'Atigbo', 'Egbeda', 'Ibadan North', 'Ibadan North-East', 'Ibadan North-West', 'Ibadan South-East', 'Ibadan South-West', 'Ibarapa Central', 'Ibarapa East', 'Ibarapa North', 'Ido', 'Irepo', 'Iseyin', 'Itesiwaju', 'Iwajowa', 'Kajola', 'Lagelu', 'Ogbomoso North', 'Ogbomoso South', 'Ogo Oluwa', 'Olorunsogo', 'Oluyole', 'Ona Ara', 'Orelope', 'Oriire', 'Oyo East', 'Oyo West', 'Saki East', 'Saki West', 'Surulere'],
  },
  {
    id: 'plateau', name: 'Plateau', code: 'PL', capital: 'Jos', zone: 'North Central',
    aliases: ['Plateau State'],
    lgas: ['Barkin Ladi', 'Bassa', 'Bokkos', 'Jos East', 'Jos North', 'Jos South', 'Kanam', 'Kanke', 'Langtang North', 'Langtang South', 'Mangu', 'Mikang', 'Pankshin', "Qua'an Pan", 'Riyom', 'Shendam', 'Wase'],
  },
  {
    id: 'rivers', name: 'Rivers', code: 'RI', capital: 'Port Harcourt', zone: 'South South',
    aliases: ['Rivers State'],
    lgas: ['Abua/Odual', 'Ahoada East', 'Ahoada West', 'Akuku-Toru', 'Andoni', 'Asari-Toru', 'Bonny', 'Degema', 'Eleme', 'Emohua', 'Etche', 'Gokana', 'Ikwerre', 'Khana', 'Obio/Akpor', 'Ogba/Egbema/Ndoni', 'Ogu/Bolo', 'Okrika', 'Omuma', 'Opobo/Nkoro', 'Oyigbo', 'Port Harcourt', 'Tai'],
  },
  {
    id: 'sokoto', name: 'Sokoto', code: 'SO', capital: 'Sokoto', zone: 'North West',
    aliases: ['Sokoto State'],
    lgas: ['Binji', 'Bodinga', 'Dange Shuni', 'Gada', 'Goronyo', 'Gudu', 'Gwadabawa', 'Illela', 'Isa', 'Kebbe', 'Kware', 'Rabah', 'Sabon Birni', 'Shagari', 'Silame', 'Sokoto North', 'Sokoto South', 'Tambuwal', 'Tangaza', 'Tureta', 'Wamako', 'Wurno', 'Yabo'],
  },
  {
    id: 'taraba', name: 'Taraba', code: 'TA', capital: 'Jalingo', zone: 'North East',
    aliases: ['Taraba State'],
    lgas: ['Ardo Kola', 'Bali', 'Donga', 'Gashaka', 'Gassol', 'Ibi', 'Jalingo', 'Karim Lamido', 'Kumi', 'Lau', 'Sardauna', 'Takum', 'Ussa', 'Wukari', 'Yorro', 'Zing'],
  },
  {
    id: 'yobe', name: 'Yobe', code: 'YO', capital: 'Damaturu', zone: 'North East',
    aliases: ['Yobe State'],
    lgas: ['Bade', 'Bursari', 'Damaturu', 'Fika', 'Fune', 'Geidam', 'Gujba', 'Gulani', 'Jakusko', 'Karasuwa', 'Machina', 'Nangere', 'Nguru', 'Potiskum', 'Tarmuwa', 'Yunusari', 'Yusufari'],
  },
  {
    id: 'zamfara', name: 'Zamfara', code: 'ZA', capital: 'Gusau', zone: 'North West',
    aliases: ['Zamfara State'],
    lgas: ['Anka', 'Bakura', 'Birnin Magaji/Kiyaw', 'Bukkuyum', 'Bungudu', 'Gummi', 'Gusau', 'Kaura Namoda', 'Maradun', 'Maru', 'Shinkafi', 'Talata Mafara', 'Tsafe', 'Zurmi'],
  },
  {
    id: 'federal-capital-territory', name: 'Federal Capital Territory', code: 'FC', capital: 'Abuja', zone: 'North Central',
    aliases: ['FCT', 'F.C.T.', 'Abuja', 'Federal Capital Territory of Nigeria'],
    lgas: ['Abaji', 'Bwari', 'Gwagwalada', 'Kuje', 'Kwali', 'Municipal Area Council'],
  },
] as const;

const LGA_ALIASES_V8: Record<string, readonly string[]> = {
  "Lagos|Ibeju-Lekki": ["Ibeju Lekki"],
  "Lagos|Ifako-Ijaiye": ["Ifako Ijaiye"],
  "Lagos|Oshodi-Isolo": ["Oshodi Isolo"],
  "Lagos|Ajeromi-Ifelodun": ["Ajeromi Ifelodun"],
  "Oyo|Ibadan South-West": ["Ibadan South West", "Ibadan South West LGA"],
  "Oyo|Ibadan North-East": ["Ibadan North East"],
  "Oyo|Ibadan North-West": ["Ibadan North West"],
  "Oyo|Ibadan South-East": ["Ibadan South East"],
  "Oyo|Ona Ara": ["Ona-Ara"],
  "Ogun|Sagamu": ["Shagamu"],
  "Rivers|Port Harcourt": ["Port-Harcourt", "Port Harcourt City"],
  "FCT|Municipal Area Council": ["Abuja Municipal", "AMAC", "Abuja Municipal Area Council"],
  "Federal Capital Territory|Municipal Area Council": ["Abuja Municipal", "AMAC", "Abuja Municipal Area Council"],
  "Ebonyi|Izzi": ["Izzi LGA"],
  "Kogi|Igalamela/Odolu": ["Igalamela Odolu", "Igalamela-Odolu"],
  "Kwara|Ilorin South": ["Ilorin South LGA"],
};
function lgaAliases(state: string, name: string): readonly string[] { return LGA_ALIASES_V8[`${state}|${name}`] ?? []; }

export const LGAS_V8: readonly LgaRecordV8[] = STATES_V8.flatMap((state) => state.lgas.map((name) => ({
  id: slug(`${state.name}-${name}`),
  name,
  state: state.name,
  stateCode: state.code,
  level: state.name === "Federal Capital Territory" ? "fct-area-council" : "lga",
  aliases: lgaAliases(state.name, name),
})));

export const ADMINISTRATIVE_DATASET_V8: DatasetManifest = {
  version: "0.8.0",
  states: STATES_V8.length,
  lgas: LGAS_V8.filter(x => x.level === "lga").length,
  fctAreaCouncils: LGAS_V8.filter(x => x.level === "fct-area-council").length,
  totalAdministrativeUnits: LGAS_V8.length,
  provenance: ADMINISTRATIVE_PROVENANCE,
};

export function getStateV8(value: string): StateRecord | undefined { const k=key(value); return STATES_V8.find(s => key(s.name)===k || s.aliases.some(a=>key(a)===k)); }
export function getLgasV8(state?: string): readonly LgaRecordV8[] { if(!state) return LGAS_V8; const s=getStateV8(state); return s ? LGAS_V8.filter(x=>x.state===s.name) : []; }
export function findLgasV8(name: string, state?: string): readonly LgaRecordV8[] { const k=key(name); const pool=state?getLgasV8(state):LGAS_V8; return pool.filter(x=>key(x.name)===k || x.aliases.some(a=>key(a)===k)); }
export type LgaResolution = { status: "not-found" } | { status: "unique"; record: LgaRecordV8 } | { status: "ambiguous"; records: readonly LgaRecordV8[] };
export function resolveLgaV8(name: string, state?: string): LgaResolution { const matches=findLgasV8(name,state); if(matches.length===0)return {status:"not-found"}; if(matches.length===1)return {status:"unique",record:matches[0]!}; return {status:"ambiguous",records:matches}; }
export interface AdministrativeConflict { normalized: string; records: readonly LgaRecordV8[]; reason: "duplicate-name-across-states"; }
export function findAdministrativeConflicts(): readonly AdministrativeConflict[] { const groups=new Map<string,LgaRecordV8[]>(); for(const r of LGAS_V8){const k=key(r.name); const arr=groups.get(k)??[]; arr.push(r); groups.set(k,arr);} return [...groups.entries()].filter(([,v])=>new Set(v.map(x=>x.state)).size>1).map(([normalized,records])=>({normalized,records,reason:"duplicate-name-across-states" as const})); }

// ---- Unversioned public names (the *V8 names above are kept as deprecated aliases) ----
/** Bundled administrative dataset manifest. */
export const ADMINISTRATIVE_DATASET: DatasetManifest = ADMINISTRATIVE_DATASET_V8;
export const STATES: readonly StateRecord[] = STATES_V8;
export const LGAS: readonly LgaRecordV8[] = LGAS_V8;
export const getState = getStateV8;
export const listLgas = getLgasV8;
export const lookupLga = resolveLgaV8;
