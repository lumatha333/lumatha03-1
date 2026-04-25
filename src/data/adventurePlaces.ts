// Adventure Discover Places - 200 countries, 10-20 places each = 2000+ places
// ALL IMAGES: High-quality Unsplash photos - FREE for commercial use
// Source: https://unsplash.com - Optimized for fast loading (w=800, q=80, auto=format)

export interface Place {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  countryFlag: string;
  type: 'unesco' | 'hidden';
  image: string;
  thumb: string;
  stars: number;
  mapUrl: string;
}

const mapUrl = (name: string, country: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ', ' + country)}`;

const img = (id: string) => `https://images.unsplash.com/photo-${id}?w=800&q=80&auto=format&fit=crop`;
const thumb = (id: string) => `https://images.unsplash.com/photo-${id}?w=400&q=60&auto=format&fit=crop`;

// ============================================================================
// UNSPLASH IMAGE MAP – real Unsplash photo IDs
// ============================================================================
const U: Record<string, string> = {
  // NEPAL
  'Mount Everest Base Camp': img('1544735716-392fe2489ffa'),
  'Lumbini Buddha Birthplace': img('1609766857041-ed402ea8069a'),
  'Kathmandu Durbar Square': img('1558799401-1dcba79f0e5c'),
  'Boudhanath Stupa': img('1565073624497-7144969d7e37'),
  'Pashupatinath Temple': img('1582654454409-778d91b7a0e2'),
  'Tilicho Lake': img('1585409677983-0f6c41ca9c3b'),
  'Upper Mustang': img('1544735716-392fe2489ffa'),
  'Rara Lake': img('1506905925346-21bda4d32df4'),
  'Bandipur Village': img('1605649487212-47bdab064df7'),
  'Gosainkunda Lake': img('1464822759023-fed622ff2c3b'),
  'Annapurna Base Camp': img('1486911278844-a81c5267e227'),
  'Pokhara Lakeside': img('1544735716-392fe2489ffa'),
  'Patan Durbar Square': img('1558799401-1dcba79f0e5c'),
  'Bhaktapur Old Town': img('1544735716-392fe2489ffa'),
  'Chitwan National Park': img('1549366021-9f761d450615'),

  // INDIA
  'Taj Mahal': img('1564507592333-c60657eea523'),
  'Red Fort Delhi': img('1587474260584-136574528ed5'),
  'Ajanta Caves': img('1590077428593-a55bb07c4665'),
  'Varanasi Ghats': img('1561361513-2d000a50f0dc'),
  'Jaipur Hawa Mahal': img('1599661046289-e31897846e41'),
  'Spiti Valley': img('1626621341517-bbf3d9990a23'),
  'Kerala Backwaters': img('1602216056096-3b40cc0c9944'),
  'Hampi Ruins': img('1600100397608-6d8cd6e5c7a5'),
  'Udaipur Lake Palace': img('1587922546307-776227941871'),
  'Golden Temple Amritsar': img('1514222134-b57cbb8ce073'),

  // JAPAN
  'Mount Fuji': img('1490806843957-31f4c9a91c65'),
  'Fushimi Inari Shrine': img('1478436127897-769e1b3f0f36'),
  'Himeji Castle': img('1590559899731-a382839e5549'),
  'Hiroshima Peace Memorial': img('1545569341-9eb8b30979d9'),
  'Itsukushima Shrine': img('1528164344705-47542687000d'),
  'Arashiyama Bamboo Grove': img('1545569341-9eb8b30979d9'),
  'Naoshima Art Island': img('1480796927426-f609979314bd'),
  'Nara Deer Park': img('1493976040374-85c8e12f0c0e'),
  'Shirakawa-go Village': img('1578271887552-5ac3a72752bc'),
  'Tokyo Senso-ji Temple': img('1540959733332-eab4deabeeaf'),

  // CHINA
  'Great Wall of China': img('1508804185872-d7badad00f7d'),
  'Forbidden City Beijing': img('1584450150050-4b9bdbd51f68'),
  'Terracotta Army': img('1591017403286-fd8493524e1e'),
  'Potala Palace': img('1548013146-72479768bada'),
  'Jiuzhaigou Valley': img('1513415277900-a62401e19be4'),
  'Zhangjiajie Pillars': img('1537531383496-f4749b85e4d4'),
  'Shanghai Bund': img('1474181487882-5abf3f0ba6c2'),

  // THAILAND
  'Grand Palace Bangkok': img('1563492065599-3520f775eeed'),
  'Historic Ayutthaya': img('1528181304800-259b08848526'),
  'Phi Phi Islands': img('1552465011-b4e21bf6e79a'),
  'Chiang Mai Temples': img('1512100356356-de1b84283e18'),
  'Krabi Railay Beach': img('1519451241324-20b4ea2c4220'),

  // FRANCE
  'Eiffel Tower Paris': img('1511739001486-6bfe10ce65f4'),
  'Palace of Versailles': img('1551410224-699683e15636'),
  'Mont Saint-Michel': img('1596394516093-501ba68a0ba6'),
  'Louvre Museum': img('1499856871958-5b9627545d1a'),
  'Provence Lavender Fields': img('1499002238440-d264edd596ec'),
  'Chamonix Mont Blanc': img('1519681393784-d120267933ba'),

  // ITALY
  'Colosseum Rome': img('1552832230-c0197dd311b5'),
  'Venice Grand Canal': img('1514890547357-a9ee288728e0'),
  'Florence Duomo': img('1541370976299-4d24ebbc9077'),
  'Cinque Terre': img('1498307833015-e7b400441eb8'),
  'Amalfi Coast': img('1534008897995-27a23e859048'),
  'Dolomites Mountains': img('1505567745926-ba89000d255a'),
  'Lake Como': img('1553073520-80b5ad5a1d77'),

  // USA
  'Grand Canyon': img('1474044159687-1ee9f3a51722'),
  'Yellowstone National Park': img('1533419779758-8a9db0bc8a8b'),
  'Statue of Liberty': img('1485738422979-f5c462d49f74'),
  'Golden Gate Bridge': img('1449034446853-66c86144b0ad'),
  'Yosemite Valley': img('1426604966848-d7adac402bff'),
  'Antelope Canyon': img('1518098268026-4e89f1a2cd8e'),

  // EGYPT
  'Pyramids of Giza': img('1503177119275-0aa32b3a9368'),
  'Sphinx of Giza': img('1568322445389-f64ac2515020'),
  'Valley of the Kings': img('1553913861-c69a8b7f0d0d'),

  // AUSTRALIA
  'Sydney Opera House': img('1523482580672-f109ba8cb9be'),
  'Great Barrier Reef': img('1559128010-7c1ad6e1b6a5'),
  'Uluru Ayers Rock': img('1523066621771-4a168a82b684'),

  // BRAZIL
  'Christ the Redeemer': img('1483729558449-99ef09a8c325'),
  'Iguazu Falls': img('1548866634-4c1c1f97e4e4'),

  // PERU
  'Machu Picchu': img('1526392060635-9d6019884377'),

  // UK
  'Big Ben London': img('1513635269975-59663e0ac1ad'),
  'Stonehenge': img('1599833975787-5c143f373c30'),
  'Edinburgh Castle': img('1548105249-da14a53c8a1a'),

  // GREECE
  'Santorini Sunset': img('1613395877344-13d4a8e0d49e'),
  'Acropolis Athens': img('1555993539-1732b0258235'),
  'Meteora Monasteries': img('1599832618723-a1e6f4e4a88d'),

  // MOROCCO
  'Chefchaouen Blue City': img('1553603227-2358aabe821e'),
  'Marrakech Medina': img('1539020140153-e479b8c22e70'),
  'Sahara Desert': img('1509023464722-18d996393ca8'),

  // TURKEY
  'Cappadocia': img('1570939274717-7eda259b50ed'),
  'Hagia Sophia': img('1541432901042-2d8bd64b4a9b'),
  'Pamukkale': img('1565551793543-c67f4f7e4e2e'),

  // ICELAND
  'Northern Lights Iceland': img('1531366936337-7c912a4589a7'),
  'Blue Lagoon Iceland': img('1504893524553-b855bce32c67'),

  // NORWAY
  'Trolltunga': img('1513519245088-0e12902e5a38'),
  'Lofoten Islands': img('1516571748831-5d81767b044d'),
  'Geirangerfjord': img('1531604250646-2f0e818c4f06'),

  // JORDAN
  'Petra Jordan': img('1579606032821-4e6161c81571'),
  'Wadi Rum': img('1552581234-26160f608093'),

  // UAE
  'Burj Khalifa Dubai': img('1512453979798-5ea266f8880c'),
  'Sheikh Zayed Mosque': img('1512632578888-169bbbc64f33'),

  // SOUTH AFRICA
  'Table Mountain': img('1580060839134-75a5edca2e99'),
  'Kruger National Park': img('1547970810-dc1eac37d174'),

  // INDONESIA
  'Borobudur Temple': img('1596402184320-417e7178b2cd'),
  'Bali Rice Terraces': img('1537996194471-e657df975ab4'),
  'Komodo National Park': img('1577717903315-1691ae25ab3f'),
  'Raja Ampat Islands': img('1516690561799-46d8f74f9abf'),

  // VIETNAM
  'Ha Long Bay': img('1557750255-c76072a7aad1'),
  'Hoi An Ancient Town': img('1559592413-7cec4d0cae2b'),

  // SWITZERLAND
  'Matterhorn': img('1531804055935-76f44d7c3621'),
  'Jungfrau Swiss Alps': img('1527668752968-14dc70a27c95'),

  // NEW ZEALAND
  'Milford Sound': img('1507699622108-4be3abd695ad'),

  // SPAIN
  'Sagrada Familia Barcelona': img('1583779457115-354f39b8811e'),
  'Alhambra Granada': img('1591017403286-fd8493524e1e'),

  // TANZANIA
  'Serengeti National Park': img('1516426122078-c23e76319801'),
  'Mount Kilimanjaro': img('1516026672322-bc52d61a55d5'),

  // CAMBODIA
  'Angkor Wat': img('1508159452718-52e7baba0943'),

  // RUSSIA
  'Red Square Moscow': img('1513326738677-b964603b136d'),
  'Hermitage Museum': img('1556610961-2fecc5927173'),

  // ARGENTINA
  'Perito Moreno Glacier': img('1516306580123-e6e52b1b7b5f'),

  // CANADA
  'Banff National Park': img('1503614472-8c93d56e92ce'),
  'Niagara Falls Canada': img('1489447068241-b3490214e879'),

  // MEXICO
  'Chichen Itza': img('1518638150340-f706e86654de'),

  // PORTUGAL
  'Sintra Palaces': img('1555881400-74d7acaacd6b'),
};

// Fallback images for places without specific Unsplash IDs
const FALLBACK_IMAGES = {
  unesco: [
    img('1506905925346-21bda4d32df4'), img('1464822759023-fed622ff2c3b'),
    img('1519681393784-d120267933ba'), img('1486911278844-a81c5267e227'),
    img('1501785888041-af3ef285b470'), img('1468276311594-df7cb65d8df6'),
    img('1464278533981-50106e6176b1'), img('1433086966358-54859d0ed716'),
    img('1552832230-c0197dd311b5'), img('1526392060635-9d6019884377'),
    img('1503177119275-0aa32b3a9368'), img('1523482580672-f109ba8cb9be'),
    img('1508804185872-d7badad00f7d'), img('1490806843957-31f4c9a91c65'),
    img('1474044159687-1ee9f3a51722'), img('1564507592333-c60657eea523'),
  ],
  hidden: [
    img('1490750967868-88aa4486c946'), img('1507525428034-b723cf961d3e'),
    img('1506744038136-46273834b3fb'), img('1505142468610-359e7d316be0'),
    img('1484591974057-265bb767ef71'), img('1470770841072-f978cf4d019e'),
    img('1476610182048-b716b8518aae'), img('1499002238440-d264edd596ec'),
    img('1518098268026-4e89f1a2cd8e'), img('1537996194471-e657df975ab4'),
    img('1552465011-b4e21bf6e79a'), img('1519451241324-20b4ea2c4220'),
    img('1534008897995-27a23e859048'), img('1553073520-80b5ad5a1d77'),
    img('1548866634-4c1c1f97e4e4'), img('1580060839134-75a5edca2e99'),
  ],
};

const getPlaceImage = (placeName: string, country: string, type: 'unesco' | 'hidden'): string => {
  if (U[placeName]) return U[placeName];
  const fallbacks = FALLBACK_IMAGES[type];
  let hash = 0;
  const str = `${placeName}${country}`;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return fallbacks[Math.abs(hash) % fallbacks.length];
};

const generateRating = (type: 'unesco' | 'hidden'): number => {
  const base = type === 'unesco' ? 4.0 : 3.5;
  const range = type === 'unesco' ? 1.0 : 1.5;
  return Math.round((base + Math.random() * range) * 100) / 100;
};

// ============================================================================
// 200 COUNTRIES - 10-20 places each
// ============================================================================
export const ALL_COUNTRIES_EXTENDED: {
  code: string; name: string; flag: string;
  unesco: string[]; hidden: string[];
}[] = [
  // ======================== ASIA ========================
  { code: 'NP', name: 'Nepal', flag: '🇳🇵',
    unesco: ['Mount Everest Base Camp','Lumbini Buddha Birthplace','Kathmandu Durbar Square','Boudhanath Stupa','Pashupatinath Temple','Sagarmatha National Park','Chitwan National Park'],
    hidden: ['Tilicho Lake','Upper Mustang','Rara Lake','Bandipur Village','Gosainkunda Lake','Annapurna Base Camp','Pokhara Lakeside','Patan Durbar Square','Bhaktapur Old Town','Ilam Tea Gardens','Poon Hill','Manaslu Circuit','Nagarkot Sunrise Point']
  },
  { code: 'IN', name: 'India', flag: '🇮🇳',
    unesco: ['Taj Mahal','Red Fort Delhi','Ajanta Caves','Ellora Caves','Jaipur City Palace','Humayun Tomb','Qutub Minar','Konark Sun Temple','Mahabodhi Temple','Kaziranga National Park'],
    hidden: ['Varanasi Ghats','Spiti Valley','Kerala Backwaters','Hampi Ruins','Udaipur Lake Palace','Golden Temple Amritsar','Rishikesh Ganges','Munnar Tea Plantations','Ladakh Pangong Lake','Goa Beaches']
  },
  { code: 'JP', name: 'Japan', flag: '🇯🇵',
    unesco: ['Mount Fuji','Hiroshima Peace Memorial','Himeji Castle','Fushimi Inari Shrine','Itsukushima Shrine','Historic Kyoto','Nara Temples','Shiretoko Peninsula'],
    hidden: ['Arashiyama Bamboo Grove','Naoshima Art Island','Nara Deer Park','Shirakawa-go Village','Tokyo Senso-ji Temple','Hakone Hot Springs','Okinawa Beaches','Yakushima Forest','Kanazawa Kenrokuen','Miyajima Island']
  },
  { code: 'CN', name: 'China', flag: '🇨🇳',
    unesco: ['Great Wall of China','Forbidden City Beijing','Terracotta Army','Potala Palace','Jiuzhaigou Valley','Summer Palace','Temple of Heaven','Mount Emei','Wulingyuan Scenic Area'],
    hidden: ['Zhangjiajie Pillars','Guilin Karst Mountains','Huangshan Yellow Mountain','Li River Cruise','Shanghai Bund','Chengdu Panda Base','Yunnan Rice Terraces','Tiger Leaping Gorge','Lijiang Old Town','Pingyao Ancient City']
  },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭',
    unesco: ['Grand Palace Bangkok','Historic Ayutthaya','Ban Chiang','Dong Phayayen-Khao Yai','Sukhothai Historical Park'],
    hidden: ['Phi Phi Islands','Chiang Mai Temples','Krabi Railay Beach','Pai Mountain Town','Koh Lipe Island','Erawan Falls','Koh Samui','Phuket','Koh Tao Diving','White Temple Chiang Rai','Khao Sok National Park','Floating Markets Bangkok','Koh Lanta','Similan Islands']
  },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳',
    unesco: ['Ha Long Bay','Hoi An Ancient Town','Phong Nha Caves','Trang An Landscape','Imperial Citadel Thang Long','My Son Sanctuary'],
    hidden: ['Sapa Rice Terraces','Ninh Binh Tam Coc','Hanoi Old Quarter','Ho Chi Minh City','Mekong Delta','Da Nang','Hue Imperial City','Phu Quoc Island','Dalat Highlands','Ban Gioc Falls','Cat Ba Island','Mui Ne Sand Dunes']
  },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩',
    unesco: ['Borobudur Temple','Prambanan Temple','Komodo National Park','Tropical Rainforest Heritage Sumatra','Sangiran Early Man Site'],
    hidden: ['Bali Rice Terraces','Raja Ampat Islands','Ubud Sacred Monkey Forest','Gili Islands','Mount Bromo','Nusa Penida','Lake Toba','Flores Kelimutu','Tana Toraja','Derawan Islands','Yogyakarta','Lombok Beaches','Bunaken Marine Park','Wakatobi']
  },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷',
    unesco: ['Gyeongbokgung Palace','Jeju Volcanic Island','Bulguksa Temple','Changdeokgung Palace','Hwaseong Fortress','Jongmyo Shrine','Hahoe Village','Baekje Historic Areas'],
    hidden: ['Bukchon Hanok Village','Nami Island','Busan Beaches','Seoraksan National Park','Hongdae Seoul','Gamcheon Culture Village','DMZ','Gyeongju','Jeonju Hanok Village','Lotte World Tower']
  },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬',
    unesco: ['Singapore Botanic Gardens','Hawker Centres Culture'],
    hidden: ['Marina Bay Sands','Gardens by the Bay','Sentosa Island','Clarke Quay','Little India','Chinatown Heritage','Jewel Changi Airport','East Coast Park','Haji Lane','MacRitchie Reservoir','Pulau Ubin']
  },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾',
    unesco: ['George Town Penang','Kinabalu Park','Gunung Mulu','Melaka Historic City','Archaeological Heritage Lenggong'],
    hidden: ['Kuala Lumpur Petronas','Cameron Highlands','Perhentian Islands','Langkawi','Ipoh Old Town','Sipadan Island','Taman Negara','Kuching Sarawak','Kota Kinabalu','Tioman Island']
  },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭',
    unesco: ['Rice Terraces of Ifugao','Puerto Princesa Subterranean River','Tubbataha Reefs','Historic Vigan','Baroque Churches'],
    hidden: ['El Nido Palawan','Boracay','Chocolate Hills Bohol','Siargao','Coron','Mayon Volcano','Batad Rice Terraces','Apo Island','Hundred Islands','Banaue','Kawasan Falls','Camiguin Island']
  },
  { code: 'LK', name: 'Sri Lanka', flag: '🇱🇰',
    unesco: ['Sigiriya Rock Fortress','Temple of the Tooth','Galle Fort','Dambulla Cave Temple','Polonnaruwa Ancient City','Sacred City Anuradhapura'],
    hidden: ['Ella Train Ride','Yala National Park','Mirissa Whale Watching','Nuwara Eliya Tea Country','Arugam Bay','Unawatuna Beach','Adams Peak','Trincomalee','Jaffna Peninsula','Knuckles Mountain Range']
  },
  { code: 'MM', name: 'Myanmar', flag: '🇲🇲',
    unesco: ['Bagan Temples','Pyu Ancient Cities'],
    hidden: ['Shwedagon Pagoda','Inle Lake','Mandalay Palace','Golden Rock Pagoda','Ngapali Beach','Hsipaw Trekking','Mrauk U','Mergui Archipelago','Kalaw Trekking','Hpa An Caves']
  },
  { code: 'KH', name: 'Cambodia', flag: '🇰🇭',
    unesco: ['Angkor Wat','Temple of Preah Vihear','Sambor Prei Kuk'],
    hidden: ['Bayon Temple','Ta Prohm Temple','Tonle Sap Lake','Phnom Penh Royal Palace','Sihanoukville Beaches','Koh Rong Island','Battambang','Kampot Pepper Farms','Bokor Hill Station','Kep Crab Market','Kulen Mountain']
  },
  { code: 'LA', name: 'Laos', flag: '🇱🇦',
    unesco: ['Luang Prabang','Vat Phou','Plain of Jars'],
    hidden: ['Kuang Si Falls','Vang Vieng','Mekong River Cruise','Pha That Luang','4000 Islands','Bolaven Plateau','Nong Khiaw','Nam Ou River','Vieng Xai Caves','Thakhek Loop']
  },
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩',
    unesco: ['Sundarbans Mangroves','Ruins of Paharpur','Historic Mosque City Bagerhat'],
    hidden: ['Cox Bazar Beach','Srimangal Tea Gardens','Saint Martin Island','Rangamati Lake','Sylhet Ratargul Forest','Old Dhaka','Kuakata Beach','Bandarban Hills','Sajek Valley','Jaflong']
  },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰',
    unesco: ['Mohenjo-daro','Taxila','Rohtas Fort','Lahore Fort','Makli Necropolis'],
    hidden: ['Hunza Valley','Fairy Meadows','Karakoram Highway','Skardu','Deosai Plains','Swat Valley','Neelum Valley','Attabad Lake','Naltar Valley','Badshahi Mosque']
  },
  { code: 'AF', name: 'Afghanistan', flag: '🇦🇫',
    unesco: ['Minaret of Jam','Bamiyan Valley'],
    hidden: ['Band-e-Amir Lakes','Wakhan Corridor','Panjshir Valley','Blue Mosque Mazar','Herat Citadel','Kabul Old City','Nuristan Valleys','Istalif Pottery Village']
  },
  { code: 'BT', name: 'Bhutan', flag: '🇧🇹',
    unesco: ['Tentative Jigme Dorji NP'],
    hidden: ['Tiger Nest Monastery','Punakha Dzong','Thimphu','Paro Valley','Bumthang Valley','Dochula Pass','Gangtey Valley','Haa Valley','Trongsa Dzong','Chele La Pass']
  },
  { code: 'MV', name: 'Maldives', flag: '🇲🇻',
    unesco: ['Friday Mosque Male'],
    hidden: ['Baa Atoll Biosphere','Ari Atoll','Maafushi Island','Vaadhoo Glowing Beach','Hulhumale Beach','Banana Reef','Male Fish Market','Fuvahmulah Island','Addu Atoll','Dhigurah Whale Sharks']
  },
  { code: 'MN', name: 'Mongolia', flag: '🇲🇳',
    unesco: ['Orkhon Valley','Burkhan Khaldun','Great Burkhan Khaldun'],
    hidden: ['Gobi Desert','Khuvsgul Lake','Terelj National Park','Genghis Khan Statue','Erdene Zuu Monastery','Flaming Cliffs','Altai Tavan Bogd','Yolyn Am Canyon','Khongoryn Sand Dunes','Ulaanbaatar']
  },
  { code: 'UZ', name: 'Uzbekistan', flag: '🇺🇿',
    unesco: ['Samarkand Registan','Bukhara Historic Centre','Itchan Kala Khiva','Shakhrisyabz'],
    hidden: ['Aral Sea','Chimgan Mountains','Fergana Valley','Tashkent Chorsu Bazaar','Nukus Savitsky Museum','Moynak Ship Graveyard','Charvak Reservoir','Shahrisabz','Kokand Palace','Termez']
  },
  { code: 'KZ', name: 'Kazakhstan', flag: '🇰🇿',
    unesco: ['Mausoleum of Khoja Ahmed Yasawi','Petroglyphs of Tamgaly'],
    hidden: ['Charyn Canyon','Big Almaty Lake','Kolsai Lakes','Astana Bayterek','Altyn-Emel NP','Baikonur Cosmodrome','Turgen Gorge','Shymbulak Ski Resort','Lake Balkhash','Aksu-Zhabagly Reserve']
  },
  { code: 'KG', name: 'Kyrgyzstan', flag: '🇰🇬',
    unesco: ['Sulaiman-Too Sacred Mountain','Silk Roads Sites'],
    hidden: ['Issyk-Kul Lake','Song-Kol Lake','Ala-Archa National Park','Burana Tower','Jeti-Oguz Red Rocks','Skazka Canyon','Tash Rabat Caravanserai','Arslanbob Walnut Forest','Osh Bazaar','Altyn Arashan Hot Springs']
  },
  { code: 'TJ', name: 'Tajikistan', flag: '🇹🇯',
    unesco: ['Sarazm Proto-urban Site'],
    hidden: ['Pamir Highway','Iskanderkul Lake','Fann Mountains','Dushanbe Ismaili Centre','Wakhan Valley','Yagnob Valley','Marguzor Seven Lakes','Khorog Botanical Garden','Yamg Village','Karakul Lake Pamir']
  },
  { code: 'TM', name: 'Turkmenistan', flag: '🇹🇲',
    unesco: ['Ancient Merv','Nisa Parthian Fortresses','Kunya-Urgench'],
    hidden: ['Darvaza Gas Crater','Ashgabat White Marble City','Yangykala Canyon','Turkmenbashi Ruhy Mosque','Gonur Depe','Nokhur Village','Kow Ata Underground Lake','Avaza Beach']
  },
  { code: 'GE', name: 'Georgia', flag: '🇬🇪',
    unesco: ['Mtskheta Historical Monuments','Gelati Monastery','Upper Svaneti'],
    hidden: ['Tbilisi Old Town','Kazbegi Mountain Church','Vardzia Cave City','Ananuri Fortress','Batumi Seaside','Tusheti Villages','Prometheus Cave','David Gareja Monastery','Borjomi Mineral Springs','Mestia Svaneti']
  },
  { code: 'AM', name: 'Armenia', flag: '🇦🇲',
    unesco: ['Haghpat Monastery','Geghard Monastery','Echmiadzin Cathedral'],
    hidden: ['Lake Sevan','Tatev Monastery','Garni Temple','Noravank Monastery','Dilijan National Park','Khor Virap','Jermuk Waterfall','Areni Wine Region','Goris Stone Forest','Mount Aragats']
  },
  { code: 'AZ', name: 'Azerbaijan', flag: '🇦🇿',
    unesco: ['Walled City of Baku','Gobustan Petroglyphs','Sheki Khan Palace'],
    hidden: ['Flame Towers Baku','Mud Volcanoes','Sheki Caravanserai','Yanar Dag Fire Mountain','Gabala','Lahic Copper Village','Khinalig Village','Shahdag Mountain','Naftalan Oil Baths','Baku Boulevard']
  },
  { code: 'IQ', name: 'Iraq', flag: '🇮🇶',
    unesco: ['Hatra','Ashur','Samarra Archaeological City','Erbil Citadel','Babylon'],
    hidden: ['Marshlands of Mesopotamia','Kurdistan Mountains','Lalish Temple','Dukan Lake','Shaqlawa Resort','Amedi Town','Darbandikhan Lake','Baghdad Al-Mutanabbi Street']
  },
  { code: 'IR', name: 'Iran', flag: '🇮🇷',
    unesco: ['Persepolis','Isfahan Meidan Emam','Pasargadae','Golestan Palace','Shushtar Hydraulic System','Tabriz Historic Bazaar'],
    hidden: ['Nasir al-Mulk Pink Mosque','Dasht-e Lut Desert','Badab-e Surt','Kandovan Village','Hormuz Island','Sheikh Lotfollah Mosque','Alamut Castle','Filband Cloud Forest','Qeshm Island','Varzaneh Desert']
  },
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦',
    unesco: ['Al-Hijr Madain Saleh','At-Turaif District Diriyah','Historic Jeddah','Al-Ahsa Oasis','Hima Cultural Area'],
    hidden: ['AlUla Desert','Edge of the World','Farasan Islands','Rijal Almaa Village','Elephant Rock','Tanumah Mountains','Al Wahbah Crater','Jeddah Corniche','Dumat Al-Jandal','Tabuk Castle']
  },
  { code: 'OM', name: 'Oman', flag: '🇴🇲',
    unesco: ['Bahla Fort','Archaeological Sites of Bat','Land of Frankincense','Aflaj Irrigation Systems'],
    hidden: ['Wadi Shab','Jebel Akhdar','Musandam Fjords','Wahiba Sands','Sultan Qaboos Grand Mosque','Nizwa Fort','Bimmah Sinkhole','Jebel Shams','Ras Al Jinz Turtle Reserve','Nakhal Fort']
  },
  { code: 'QA', name: 'Qatar', flag: '🇶🇦',
    unesco: ['Al Zubarah Fort'],
    hidden: ['Museum of Islamic Art','The Pearl Qatar','Souq Waqif','Inland Sea Khor Al Adaid','Katara Cultural Village','National Museum Qatar','Al Thakira Mangroves','Zekreet Peninsula','Film City Ruins','Banana Island']
  },
  { code: 'BH', name: 'Bahrain', flag: '🇧🇭',
    unesco: ['Qal at al-Bahrain','Pearling Testimony','Dilmun Burial Mounds'],
    hidden: ['Bahrain Fort','Tree of Life','Al Fateh Grand Mosque','Bahrain National Museum','Muharraq Heritage','Amwaj Islands','Bab el-Bahrain','Al Areen Wildlife Park']
  },
  { code: 'KW', name: 'Kuwait', flag: '🇰🇼',
    unesco: ['Al-Qurain Martyrs Museum'],
    hidden: ['Kuwait Towers','Grand Mosque Kuwait','Failaka Island','Souq Al Mubarakiya','Mirror House','Scientific Center','Al Shaheed Park','Liberation Tower','Kubbar Island','Marina Crescent']
  },
  { code: 'YE', name: 'Yemen', flag: '🇾🇪',
    unesco: ['Old Walled City of Shibam','Old City of Sanaa','Historic Zabid','Socotra Archipelago'],
    hidden: ['Dragon Blood Trees','Aden Crater','Dar al-Hajar Rock Palace','Al Saleh Mosque','Wadi Hadramout','Jibla Town','Kawkaban Fortress','Bura Mountains']
  },

  // ======================== EUROPE ========================
  { code: 'FR', name: 'France', flag: '🇫🇷',
    unesco: ['Eiffel Tower Paris','Palace of Versailles','Mont Saint-Michel','Louvre Museum','Chartres Cathedral','Carcassonne','Pont du Gard','Strasbourg Grande Île'],
    hidden: ['French Riviera Nice','Provence Lavender Fields','Chamonix Mont Blanc','Bordeaux Vineyards','Strasbourg Old Town','Normandy D-Day Beaches','Gorges du Verdon','Annecy Old Town','Corsica','Colmar Alsace','Étretat Cliffs','Loire Valley Châteaux']
  },
  { code: 'IT', name: 'Italy', flag: '🇮🇹',
    unesco: ['Colosseum Rome','Venice Grand Canal','Florence Duomo','Cinque Terre','Pompeii Ruins','Vatican City','Trulli of Alberobello','Ravenna Mosaics'],
    hidden: ['Amalfi Coast','Lake Como','Dolomites Mountains','Tuscany Countryside','Positano','Matera Sassi','Sardinia Beaches','Capri Blue Grotto','Procida Island','Burano Venice','San Gimignano','Orvieto']
  },
  { code: 'ES', name: 'Spain', flag: '🇪🇸',
    unesco: ['Sagrada Familia Barcelona','Alhambra Granada','Park Guell Barcelona','Historic Toledo','Old Town Segovia','Santiago de Compostela Cathedral','Córdoba Mosque-Cathedral','Ibiza Biodiversity'],
    hidden: ['Plaza de España Seville','San Sebastián Beaches','Ronda Gorge','Mallorca','Valencia City Arts','Tenerife Teide','Montserrat Monastery','Caminito del Rey','Formentera','La Palma Caldera','Nerja Caves','Cadaqués']
  },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧',
    unesco: ['Big Ben London','Stonehenge','Tower of London','Edinburgh Castle','Bath Roman Baths','Canterbury Cathedral','Durham Castle','Giant Causeway'],
    hidden: ['Cotswolds Villages','Isle of Skye','Lake District','Oxford University','Cambridge','Snowdonia Wales','Scottish Highlands','Jurassic Coast','Peak District','Cornwall Beaches','York Shambles','Glastonbury Tor']
  },
  { code: 'DE', name: 'Germany', flag: '🇩🇪',
    unesco: ['Neuschwanstein Castle','Cologne Cathedral','Berlin Wall Memorial','Sanssouci Palace','Bamberg Old Town','Wartburg Castle','Museum Island Berlin','Aachen Cathedral'],
    hidden: ['Black Forest','Rhine Valley','Heidelberg','Rothenburg ob der Tauber','Munich Marienplatz','Brandenburg Gate','Bavarian Alps','Dresden Frauenkirche','Eltz Castle','Saxon Switzerland','Berchtesgaden','Hamburg Speicherstadt']
  },
  { code: 'GR', name: 'Greece', flag: '🇬🇷',
    unesco: ['Acropolis Athens','Meteora Monasteries','Delphi Oracle','Mount Athos','Archaeological Site of Olympia','Medieval City of Rhodes','Delos Island'],
    hidden: ['Santorini Sunset','Mykonos Windmills','Zakynthos Shipwreck Beach','Crete','Corfu','Naxos','Milos','Hydra Island','Thessaloniki White Tower','Samaria Gorge','Pelion Peninsula','Monemvasia']
  },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹',
    unesco: ['Sintra Palaces','Porto Ribeira','Lisbon Belém Tower','Monastery of Jerónimos','University of Coimbra','Alto Douro Wine Region'],
    hidden: ['Azores Islands','Madeira Island','Algarve Beaches','Lagos Grottos','Cascais','Évora Roman Temple','Aveiro Canals','Peneda-Gerês NP','Óbidos','Tavira','Nazaré Giant Waves','Comporta']
  },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱',
    unesco: ['Amsterdam Canal Ring','Schokland','Rietveld Schröderhuis','Beemster Polder'],
    hidden: ['Keukenhof Gardens','Windmills of Kinderdijk','Van Gogh Museum','Tulip Fields','Giethoorn','Delft Old Town','Haarlem','Maastricht','Texel Island','Rotterdam Cube Houses','Leiden','The Hague Binnenhof']
  },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪',
    unesco: ['Grand Place Brussels','Belfries of Belgium','Bruges Historic Centre','Tournai Cathedral'],
    hidden: ['Ghent Old Town','Antwerp Cathedral','Dinant','Waterloo Battlefield','Spa Town','Bouillon Castle','Durbuy','Leuven','Ypres','Ardennes Forest']
  },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭',
    unesco: ['Swiss Alps Jungfrau-Aletsch','Lavaux Vineyard Terraces','Old City of Berne','Monte San Giorgio'],
    hidden: ['Matterhorn','Jungfrau Swiss Alps','Lake Geneva','Lucerne Old Town','Interlaken','Zermatt','Grindelwald','Lauterbrunnen','Zurich','Rhine Falls','Lake Brienz','Appenzell','Oeschinensee','Lugano']
  },
  { code: 'AT', name: 'Austria', flag: '🇦🇹',
    unesco: ['Vienna Historic Centre','Schönbrunn Palace','Salzburg Old Town','Hallstatt-Dachstein','Semmeringbahn Railway','Wachau Cultural Landscape'],
    hidden: ['Hallstatt','Austrian Alps Tyrol','Innsbruck Golden Roof','Grossglockner High Alpine Road','Zell am See','Krimml Waterfalls','Graz Old Town','Melk Abbey','Hohe Tauern NP','Achensee']
  },
  { code: 'CZ', name: 'Czech Republic', flag: '🇨🇿',
    unesco: ['Prague Old Town','Český Krumlov','Kutná Hora Ossuary','Telč','Litomyšl Castle','Kroměříž Gardens'],
    hidden: ['Charles Bridge','Prague Castle','Bohemian Switzerland','Karlovy Vary','Brno','Olomouc','Adršpach Rocks','Loket Castle','Mikulov','Moravian Wine Country']
  },
  { code: 'PL', name: 'Poland', flag: '🇵🇱',
    unesco: ['Kraków Old Town','Wieliczka Salt Mine','Auschwitz-Birkenau','Warsaw Old Town','Białowieża Forest','Malbork Castle'],
    hidden: ['Wrocław','Zakopane','Gdańsk','Tatra Mountains','Toruń','Morskie Oko Lake','Wawel Castle','Poznań','Łódź','Bieszczady Mountains']
  },
  { code: 'HU', name: 'Hungary', flag: '🇭🇺',
    unesco: ['Budapest Banks of the Danube','Hollókő Village','Caves of Aggtelek','Pannonhalma Abbey','Pécs Early Christian Necropolis','Tokaj Wine Region'],
    hidden: ['Parliament Building Budapest','Széchenyi Thermal Baths','Fishermans Bastion','Eger Castle','Lake Balaton','Hévíz Thermal Lake','Visegrád','Tihany','Szeged','Debrecen']
  },
  { code: 'RO', name: 'Romania', flag: '🇷🇴',
    unesco: ['Painted Monasteries Bukovina','Historic Sighișoara','Horezu Monastery','Villages with Fortified Churches','Dacian Fortresses'],
    hidden: ['Bran Castle Dracula','Peleș Castle','Transfăgărășan Highway','Danube Delta','Sibiu Old Town','Turda Salt Mine','Maramureș Wooden Churches','Brașov','Corvin Castle','Bâlea Lake','Apuseni Mountains','Merry Cemetery Săpânța']
  },
  { code: 'BG', name: 'Bulgaria', flag: '🇧🇬',
    unesco: ['Rila Monastery','Ancient City Nessebar','Thracian Tomb of Kazanlak','Boyana Church','Madara Rider'],
    hidden: ['Seven Rila Lakes','Plovdiv Old Town','Belogradchik Rocks','Sozopol','Devetashka Cave','Buzludzha Monument','Veliko Tarnovo','Bansko','Melnik','Prohodna Eye of God Cave']
  },
  { code: 'HR', name: 'Croatia', flag: '🇭🇷',
    unesco: ['Dubrovnik Old Town','Plitvice Lakes NP','Split Diocletian Palace','Trogir Historic City','Euphrasian Basilica Poreč'],
    hidden: ['Hvar Island','Rovinj Old Town','Krka Waterfalls','Korčula Island','Zadar Sea Organ','Mljet National Park','Brač Zlatni Rat','Motovun','Vis Island','Makarska Riviera']
  },
  { code: 'SI', name: 'Slovenia', flag: '🇸🇮',
    unesco: ['Škocjan Caves','Idrija Mercury Heritage'],
    hidden: ['Lake Bled','Ljubljana Old Town','Lake Bohinj','Postojna Cave','Predjama Castle','Triglav National Park','Piran Coastal Town','Soča River Valley','Vintgar Gorge','Logarska Valley']
  },
  { code: 'RS', name: 'Serbia', flag: '🇷🇸',
    unesco: ['Studenica Monastery','Stari Ras','Gamzigrad','Medieval Monuments in Kosovo'],
    hidden: ['Belgrade Fortress','Tara National Park','Drvengrad Mokra Gora','Đavolja Varoš','Uvac Canyon','Golubac Fortress','Niš Fortress','Fruška Gora','Drina River House','Subotica']
  },
  { code: 'BA', name: 'Bosnia and Herzegovina', flag: '🇧🇦',
    unesco: ['Old Bridge of Mostar','Mehmed Paša Bridge','Stećci Tombstones'],
    hidden: ['Kravice Waterfalls','Sarajevo Old Town','Blagaj Tekke','Una National Park','Jajce Waterfalls','Lukomir Village','Počitelj','Trebinje','Vrelo Bosne','Sutjeska National Park']
  },
  { code: 'ME', name: 'Montenegro', flag: '🇲🇪',
    unesco: ['Natural and Culturo-Historical Region of Kotor','Durmitor National Park'],
    hidden: ['Bay of Kotor','Sveti Stefan','Budva Old Town','Tara River Canyon','Lovćen National Park','Ostrog Monastery','Ada Bojana','Skadar Lake','Perast','Biogradska Gora']
  },
  { code: 'MK', name: 'North Macedonia', flag: '🇲🇰',
    unesco: ['Natural and Cultural Heritage of Ohrid Region'],
    hidden: ['Ohrid Lake','Matka Canyon','Skopje Old Bazaar','Bitola Heraclea','Mavrovo National Park','Galicica NP','Kratovo Stone Town','Pelister NP','Kokino Observatory','Demir Kapija Gorge']
  },
  { code: 'AL', name: 'Albania', flag: '🇦🇱',
    unesco: ['Butrint','Historic Berat','Historic Gjirokastra'],
    hidden: ['Albanian Riviera','Blue Eye Spring','Theth Valley','Ksamil Beaches','Valbona Valley','Llogara Pass','Apollonia Ruins','Ohrid Lake Albania Side','Shkodër Castle','Bunk Art Tirana']
  },
  { code: 'XK', name: 'Kosovo', flag: '🇽🇰',
    unesco: ['Medieval Monuments in Kosovo'],
    hidden: ['Prizren Old Town','Rugova Gorge','Gadimë Cave','Gračanica Monastery','Pristina National Library','Deçan Monastery','Mirusha Waterfalls','Brezovica Ski','Germia Park','Bear Sanctuary']
  },
  { code: 'IS', name: 'Iceland', flag: '🇮🇸',
    unesco: ['Þingvellir National Park','Surtsey Island'],
    hidden: ['Northern Lights Iceland','Blue Lagoon Iceland','Gullfoss Waterfall','Skógafoss Waterfall','Jökulsárlón Glacier Lagoon','Seljalandsfoss','Reynisfjara Black Beach','Landmannalaugar','Vatnajökull Glacier','Diamond Beach','Fjaðrárgljúfur Canyon','Dynjandi Waterfall','Studlagil Canyon']
  },
  { code: 'NO', name: 'Norway', flag: '🇳🇴',
    unesco: ['Geirangerfjord','Bergen Bryggen','Røros Mining Town','Urnes Stave Church','Rjukan-Notodden Industrial Heritage'],
    hidden: ['Trolltunga','Lofoten Islands','Preikestolen Pulpit Rock','Northern Lights Tromsø','Flåm Railway','Svalbard','Oslo Opera House','Ålesund Art Nouveau','Atlantic Road','Sognefjord','Jostedalsbreen Glacier','Kjeragbolten']
  },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪',
    unesco: ['Drottningholm Palace','Birka Viking','Gammelstad Church Town','Laponian Area','Skogskyrkogården'],
    hidden: ['Stockholm Old Town Gamla Stan','Icehotel Jukkasjärvi','Gothenburg Archipelago','Abisko National Park','Visby Gotland','Malmö Turning Torso','Kungsleden Trail','High Coast','Gotland','Swedish Lapland','Dalarna','Uppsala']
  },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰',
    unesco: ['Roskilde Cathedral','Kronborg Castle','Jelling Mounds','Stevns Klint','Wadden Sea'],
    hidden: ['Nyhavn Copenhagen','Tivoli Gardens','Little Mermaid','Faroe Islands','Skagen','Bornholm Island','Legoland Billund','Mons Klint','Frederiksberg Gardens','Aarhus']
  },
  { code: 'FI', name: 'Finland', flag: '🇫🇮',
    unesco: ['Fortress of Suomenlinna','Old Rauma','Sammallahdenmäki','Struves Geodetic Arc'],
    hidden: ['Rovaniemi Santa Claus Village','Helsinki Cathedral','Northern Lights Lapland','Lake Saimaa','Nuuksio National Park','Turku Castle','Koli National Park','Levi Ski Resort','Porvoo Old Town','Aland Islands']
  },
  { code: 'EE', name: 'Estonia', flag: '🇪🇪',
    unesco: ['Historic Tallinn Old Town','Struve Geodetic Arc'],
    hidden: ['Lahemaa National Park','Saaremaa Island','Pärnu Beach','Tartu University','Viru Bog Trail','Haapsalu','Soomaa National Park','Pirita Beach','Rakvere Castle','Hiiumaa Island']
  },
  { code: 'LV', name: 'Latvia', flag: '🇱🇻',
    unesco: ['Historic Centre of Riga','Struve Geodetic Arc'],
    hidden: ['Jūrmala Beach','Sigulda','Gauja National Park','Rundāle Palace','Cēsis Medieval Castle','Liepāja','Cape Kolka','Turaida Castle','Kuldīga Waterfall','Daugavpils Fortress']
  },
  { code: 'LT', name: 'Lithuania', flag: '🇱🇹',
    unesco: ['Vilnius Historic Centre','Curonian Spit','Kernavė Archaeological Site'],
    hidden: ['Trakai Island Castle','Hill of Crosses','Druskininkai','Kaunas Old Town','Nida','Anykščiai Treetop Walk','Birštonas','Rumšiškės Open Air Museum','Žemaitija NP','Palanga Beach']
  },
  { code: 'UA', name: 'Ukraine', flag: '🇺🇦',
    unesco: ['Saint-Sophia Cathedral Kyiv','Lviv Historic Centre','Residence of Bukovinian Metropolitans'],
    hidden: ['Kyiv Pechersk Lavra','Carpathian Mountains','Chernobyl Exclusion Zone','Odesa Opera House','Kamianets-Podilskyi Castle','Tunnel of Love Klevan','Sofiyivka Park','Synevyr Lake','Bukovel Ski Resort','Khortytsia Island']
  },
  { code: 'BY', name: 'Belarus', flag: '🇧🇾',
    unesco: ['Mir Castle','Nesvizh Castle','Białowieża Primeval Forest','Struve Geodetic Arc'],
    hidden: ['Minsk Victory Square','Brest Fortress','Braslav Lakes','Pripyatsky NP','Dudutki Folk Museum','National Library Minsk','Belovezhskaya Pushcha','Grodno Old Town']
  },
  { code: 'MD', name: 'Moldova', flag: '🇲🇩',
    unesco: ['Struve Geodetic Arc'],
    hidden: ['Mileștii Mici Wine Cellar','Orheiul Vechi Monastery','Chișinău Cathedral','Cricova Winery','Tipova Monastery','Soroca Fortress','Saharna Monastery','Căpriana Monastery','Transnistria Tiraspol','Old Orhei']
  },
  { code: 'RU', name: 'Russia', flag: '🇷🇺',
    unesco: ['Red Square Moscow','Hermitage Museum','Historic Saint Petersburg','Kremlin','Lake Baikal','Kizhi Pogost','Golden Mountains of Altai'],
    hidden: ['Trans-Siberian Railway','Kamchatka Volcanoes','Peterhof Palace','Kazan Kremlin','Sochi','Vladivostok','Elbrus Mountain','Solovetsky Islands','Valley of Geysers','Derbent Citadel','Suzdal','Olkhon Island']
  },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪',
    unesco: ['Brú na Bóinne Newgrange','Skellig Michael'],
    hidden: ['Cliffs of Moher','Ring of Kerry','Giant Causeway NI','Galway','Killarney National Park','Aran Islands','Dingle Peninsula','Dublin Temple Bar','Rock of Cashel','Glendalough','Wild Atlantic Way','Connemara']
  },
  { code: 'LU', name: 'Luxembourg', flag: '🇱🇺',
    unesco: ['City of Luxembourg Fortifications'],
    hidden: ['Vianden Castle','Mullerthal Trail','Echternach','Bock Casemates','Bourscheid Castle','Moselle Valley','Esch-sur-Sûre','Grand Ducal Palace','Philharmonie','Remich']
  },
  { code: 'LI', name: 'Liechtenstein', flag: '🇱🇮',
    unesco: [],
    hidden: ['Vaduz Castle','Malbun Ski Resort','Gutenberg Castle','Kunstmuseum Liechtenstein','Rhine Valley Trail','Fürstensteig Trail','Treasure Chamber','Red House Vaduz','Balzers Castle','Gaflei Viewpoint']
  },
  { code: 'MC', name: 'Monaco', flag: '🇲🇨',
    unesco: [],
    hidden: ['Monte Carlo Casino','Prince Palace Monaco','Oceanographic Museum','Japanese Garden Monaco','Monaco Grand Prix Circuit','Exotic Garden','La Condamine Market','Fort Antoine','Larvotto Beach','Cathedral of Our Lady']
  },
  { code: 'AD', name: 'Andorra', flag: '🇦🇩',
    unesco: ['Madriu-Perafita-Claror Valley'],
    hidden: ['Grandvalira Ski Resort','Caldea Spa','Vallnord','Andorra la Vella Shopping','Sant Joan de Caselles','Meritxell Sanctuary','Naturlandia','Engolasters Lake','Casa de la Vall','Coma Pedrosa']
  },
  { code: 'MT', name: 'Malta', flag: '🇲🇹',
    unesco: ['Valletta','Ħal Saflieni Hypogeum','Megalithic Temples'],
    hidden: ['Blue Lagoon Comino','Mdina Old City','Gozo Island','Marsaxlokk Fishing Village','St Johns Co-Cathedral','Three Cities','Dingli Cliffs','Popeye Village','Golden Bay','Blue Grotto Malta']
  },
  { code: 'CY', name: 'Cyprus', flag: '🇨🇾',
    unesco: ['Paphos Archaeological Park','Painted Churches Troodos','Choirokoitia'],
    hidden: ['Nissi Beach Ayia Napa','Cape Greco','Kyrenia Castle','Lefkara Village','Troodos Mountains','Aphrodite Rock','Kourion Ancient City','Avakas Gorge','Larnaca Salt Lake','Akamas Peninsula']
  },
  { code: 'SM', name: 'San Marino', flag: '🇸🇲',
    unesco: ['Historic Centre and Mount Titano'],
    hidden: ['Guaita Tower','Cesta Tower','Palazzo Pubblico','Basilica di San Marino','Montale Tower','State Museum','Borgo Maggiore Funicular','Crossbow Competition','Piazza della Libertà','Panoramic Views']
  },
  { code: 'VA', name: 'Vatican City', flag: '🇻🇦',
    unesco: ['Vatican City Heritage Site'],
    hidden: ['Sistine Chapel','St Peters Basilica','Vatican Museums','Vatican Gardens','Apostolic Palace','St Peters Square','Vatican Library','Raphael Rooms','Pinacoteca Vaticana','Bramante Staircase']
  },
  { code: 'SK', name: 'Slovakia', flag: '🇸🇰',
    unesco: ['Vlkolínec','Banská Štiavnica','Spiš Castle','Caves of Aggtelek and Slovak Karst'],
    hidden: ['Bratislava Castle','High Tatras','Bojnice Castle','Slovak Paradise NP','Orava Castle','Demänovská Ice Cave','Bardejov','Trenčín Castle','Čičmany','Strbske Pleso']
  },

  // ======================== AMERICAS ========================
  { code: 'US', name: 'United States', flag: '🇺🇸',
    unesco: ['Grand Canyon','Yellowstone National Park','Statue of Liberty','Yosemite Valley','Mesa Verde','Everglades','Independence Hall','Hawaii Volcanoes NP','Carlsbad Caverns','Olympic National Park'],
    hidden: ['Golden Gate Bridge','Antelope Canyon','Monument Valley','Niagara Falls','Zion National Park','Glacier National Park','Sedona','Lake Tahoe','Big Sur','Savannah GA']
  },
  { code: 'CA', name: 'Canada', flag: '🇨🇦',
    unesco: ['Canadian Rocky Mountain Parks','Old Quebec','Lunenburg','Dinosaur Provincial Park','Head-Smashed-In Buffalo Jump','Nahanni NP','SGang Gwaay'],
    hidden: ['Niagara Falls Canada','Banff National Park','Lake Louise','Whistler','Vancouver','Jasper','Tofino','CN Tower Toronto','Icefields Parkway','Peggy Cove','Cabot Trail','Churchill Polar Bears']
  },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽',
    unesco: ['Chichén Itzá','Teotihuacán','Mexico City Historic Centre','Palenque','Monte Albán','Sian Kaan','Uxmal','Calakmul'],
    hidden: ['Cancún Beaches','Tulum','Playa del Carmen','Guanajuato','Oaxaca','Cenotes Yucatán','San Miguel de Allende','Copper Canyon','Hierve el Agua','Isla Holbox','Sayulita','Bacalar Lagoon']
  },
  { code: 'GT', name: 'Guatemala', flag: '🇬🇹',
    unesco: ['Tikal','Antigua Guatemala','Quiriguá'],
    hidden: ['Lake Atitlán','Semuc Champey','Chichicastenango Market','Flores','Pacaya Volcano','Livingston','Lanquín Caves','Rio Dulce','Acatenango Volcano','Coban']
  },
  { code: 'BZ', name: 'Belize', flag: '🇧🇿',
    unesco: ['Belize Barrier Reef'],
    hidden: ['Great Blue Hole','Caye Caulker','Ambergris Caye','Actun Tunichil Muknal','Lamanai Ruins','Placencia','Hopkins','Cockscomb Jaguar Preserve','Xunantunich','Turneffe Atoll']
  },
  { code: 'HN', name: 'Honduras', flag: '🇭🇳',
    unesco: ['Maya Site of Copán','Río Plátano Biosphere Reserve'],
    hidden: ['Roatán Island','Utila Island','Lake Yojoa','La Ceiba','Pico Bonito NP','Gracias','Comayagua','Lancetilla Botanical Garden']
  },
  { code: 'SV', name: 'El Salvador', flag: '🇸🇻',
    unesco: ['Joya de Cerén'],
    hidden: ['Ruta de las Flores','El Tunco Beach','Lake Coatepeque','Suchitoto','Tazumal Ruins','Santa Ana Volcano','El Impossible NP','Juayúa','Tamanique Falls','Conchagua Volcano']
  },
  { code: 'NI', name: 'Nicaragua', flag: '🇳🇮',
    unesco: ['Ruins of León Viejo','León Cathedral'],
    hidden: ['Ometepe Island','Granada Nicaragua','Corn Islands','San Juan del Sur','Masaya Volcano','Apoyo Lagoon','Somoto Canyon','León Cerro Negro','Solentiname Islands','Rio San Juan']
  },
  { code: 'CR', name: 'Costa Rica', flag: '🇨🇷',
    unesco: ['Cocos Island','Stone Spheres of the Diquís','Area de Conservación Guanacaste'],
    hidden: ['Arenal Volcano','Manuel Antonio NP','Monteverde Cloud Forest','La Fortuna Waterfall','Tortuguero','Corcovado NP','Tamarindo','Rincón de la Vieja','Cahuita','Poás Volcano']
  },
  { code: 'PA', name: 'Panama', flag: '🇵🇦',
    unesco: ['Panama Canal','Fortifications Portobelo','Darién NP','Coiba NP'],
    hidden: ['San Blas Islands','Bocas del Toro','Panama City Casco Viejo','Boquete','Santa Catalina','Isla Taboga','El Valle de Antón','Chiriquí Highlands','Pearl Islands','Gamboa Rainforest']
  },
  { code: 'CU', name: 'Cuba', flag: '🇨🇺',
    unesco: ['Old Havana','Trinidad','Viñales Valley','Cienfuegos','Camagüey'],
    hidden: ['Varadero Beach','Santiago de Cuba','Cayo Coco','Playa Ancón','Bay of Pigs','Baracoa','Cayo Largo','María La Gorda','Remedios','El Nicho Waterfalls']
  },
  { code: 'JM', name: 'Jamaica', flag: '🇯🇲',
    unesco: ['Blue and John Crow Mountains'],
    hidden: ['Dunn River Falls','Negril Seven Mile Beach','Blue Lagoon Jamaica','Rick Café Negril','Port Antonio','Luminous Lagoon','Bob Marley Museum','Ocho Rios','Montego Bay','Reach Falls']
  },
  { code: 'HT', name: 'Haiti', flag: '🇭🇹',
    unesco: ['National History Park – Citadelle'],
    hidden: ['Labadee Beach','Bassin Bleu','Île-à-Vache','Jacmel','Saut-Mathurine Waterfall','Port-au-Prince Iron Market','Kenscoff Mountains','Wahoo Bay']
  },
  { code: 'DO', name: 'Dominican Republic', flag: '🇩🇴',
    unesco: ['Colonial City Santo Domingo'],
    hidden: ['Punta Cana Beaches','Samaná Peninsula','Los Haitises NP','Hoyo Azul','Bahía de las Águilas','Jarabacoa','Lago Enriquillo','27 Waterfalls Damajagua','Isla Saona','Playa Rincón']
  },
  { code: 'TT', name: 'Trinidad and Tobago', flag: '🇹🇹',
    unesco: [],
    hidden: ['Maracas Bay','Tobago Main Ridge','Nylon Pool','Pitch Lake','Caroni Bird Sanctuary','Buccoo Reef','Argyle Waterfall','Fort George','Pigeon Point','Asa Wright Nature Centre']
  },
  { code: 'BB', name: 'Barbados', flag: '🇧🇧',
    unesco: ['Historic Bridgetown'],
    hidden: ['Crane Beach','Harrison Cave','Animal Flower Cave','Bathsheba','Bottom Bay','Carlisle Bay','Hunte Gardens','St Nicholas Abbey','Cherry Tree Hill','Oistins Fish Fry']
  },
  { code: 'BS', name: 'Bahamas', flag: '🇧🇸',
    unesco: [],
    hidden: ['Swimming Pigs Exuma','Nassau Paradise Island','Pink Sands Beach Harbour Island','Thunderball Grotto','Dean Blue Hole','Lucayan NP','Andros Barrier Reef','Eleuthera Glass Window Bridge','Abacos','Bimini']
  },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴',
    unesco: ['Cartagena','San Agustín Archaeological Park','Coffee Cultural Landscape','Los Katíos NP','Malpelo Island'],
    hidden: ['Medellín','Bogotá','Tayrona National Park','Coffee Region','Guatapé','San Andrés Island','Cocora Valley','Caño Cristales','Villa de Leyva','Lost City Trek','Providencia','Barichara']
  },
  { code: 'VE', name: 'Venezuela', flag: '🇻🇪',
    unesco: ['Canaima National Park','Ciudad Universitaria Caracas','Coro'],
    hidden: ['Angel Falls','Los Roques','Mérida Cable Car','Morrocoy NP','Margarita Island','Gran Sabana','Orinoco Delta','Medanos de Coro','Choroní','Mount Roraima']
  },
  { code: 'PE', name: 'Peru', flag: '🇵🇪',
    unesco: ['Machu Picchu','Cusco Historic Centre','Nazca Lines','Chan Chan','Huascarán NP','Chavín','Sacred City of Caral-Supe'],
    hidden: ['Rainbow Mountain Peru','Sacred Valley','Lake Titicaca','Colca Canyon','Huacachina Oasis','Lima Miraflores','Arequipa White City','Kuelap Fortress','Mancora Beach','Iquitos Amazon','Palcoyo Rainbow Mountain','Vinicunca']
  },
  { code: 'EC', name: 'Ecuador', flag: '🇪🇨',
    unesco: ['Galápagos Islands','Quito Historic Centre','Cuenca Historic Centre','Sangay NP'],
    hidden: ['Cotopaxi Volcano','Baños de Agua Santa','Quilotoa Crater Lake','Otavalo Market','Mindo Cloud Forest','Amazon Lodge Ecuador','Montañita Beach','Nariz del Diablo Train','Ingapirca Ruins','Cajas NP']
  },
  { code: 'BO', name: 'Bolivia', flag: '🇧🇴',
    unesco: ['Sucre Historic City','Potosí','Tiwanaku','Noel Kempff Mercado NP','Samaipata Fort'],
    hidden: ['Salar de Uyuni','Lake Titicaca Bolivia','Death Road Yungas','La Paz Witches Market','Madidi NP','Isla del Sol','Tupiza','Laguna Colorada','Coroico','Eduardo Avaroa Reserve']
  },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷',
    unesco: ['Christ the Redeemer Rio','Iguaçu Falls','Historic Olinda','Historic Ouro Preto','Fernando de Noronha','Pantanal Conservation Area','Central Amazon','Brasília'],
    hidden: ['Sugarloaf Mountain','Amazon Rainforest','Copacabana Beach','Salvador Pelourinho','Lençóis Maranhenses','Florianópolis','Chapada Diamantina','Jericoacoara','Bonito','Paraty','Alter do Chão','Ilha Grande']
  },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷',
    unesco: ['Iguazú National Park','Los Glaciares','Quebrada de Humahuaca','Cueva de las Manos','Jesuit Missions Córdoba','Valdés Peninsula'],
    hidden: ['Perito Moreno Glacier','Buenos Aires','Mendoza Wine Region','Bariloche','El Chaltén','Ushuaia','Tierra del Fuego','Salta','Cafayate','El Calafate','Colonia Carlos Pellegrini','Purmamarca']
  },
  { code: 'CL', name: 'Chile', flag: '🇨🇱',
    unesco: ['Easter Island Rapa Nui','Humberstone','Sewell Mining Town','Valparaíso Historic City','Chiloé Churches'],
    hidden: ['Torres del Paine','Atacama Desert','Patagonia Chile','Valparaíso Street Art','Marble Caves','Lake District','Robinson Crusoe Island','Pucon','Carretera Austral','San Pedro de Atacama','Elqui Valley','Cape Horn']
  },
  { code: 'UY', name: 'Uruguay', flag: '🇺🇾',
    unesco: ['Colonia del Sacramento','Fray Bentos Industrial Landscape'],
    hidden: ['Punta del Este','Montevideo Ciudad Vieja','José Ignacio','Cabo Polonio','Punta del Diablo','Carmelo Wine Region','Salto Hot Springs','Rocha Beaches','Mercedes','Valle del Lunarejo']
  },
  { code: 'PY', name: 'Paraguay', flag: '🇵🇾',
    unesco: ['Jesuit Missions of La Santísima Trinidad de Paraná'],
    hidden: ['Asunción Historic Centre','Iguazú Falls Paraguay Side','Encarnación Carnival','Chaco Region','Cerro Corá NP','Ypacaraí Lake','San Bernardino','Ciudad del Este','Salto Cristal','Ñeembucú Wetlands']
  },
  { code: 'GY', name: 'Guyana', flag: '🇬🇾',
    unesco: [],
    hidden: ['Kaieteur Falls','Iwokrama Rainforest','Shell Beach','Rupununi Savanna','Georgetown','Surama Village','Orinduik Falls','Kanuku Mountains','St George Cathedral','Bartica']
  },
  { code: 'SR', name: 'Suriname', flag: '🇸🇷',
    unesco: ['Historic Inner City Paramaribo','Central Suriname Nature Reserve'],
    hidden: ['Brownsberg Nature Park','Raleighvallen','Galibi Nature Reserve','Brokopondo Reservoir','Jodensavanne','Commewijne Plantations','Voltzberg','Blanche Marie Falls']
  },

  // ======================== AFRICA ========================
  { code: 'EG', name: 'Egypt', flag: '🇪🇬',
    unesco: ['Pyramids of Giza','Valley of the Kings','Abu Simbel Temples','Luxor Temple','Historic Cairo','Memphis and Necropolis','Nubian Monuments'],
    hidden: ['Sphinx of Giza','Nile River Cruise','White Desert','Siwa Oasis','Red Sea Diving Hurghada','Alexandria Library','Aswan','Dahab','Fayoum Oasis','Sharm El Sheikh','Wadi El Rayan','Colored Canyon Sinai']
  },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦',
    unesco: ['Robben Island','iSimangaliso Wetland','Cradle of Humankind','Cape Floral Region','Mapungubwe','Vredefort Dome'],
    hidden: ['Table Mountain','Kruger National Park','Cape of Good Hope','Cape Town Waterfront','Garden Route','Blyde River Canyon','Stellenbosch Winelands','Durban Beaches','Drakensberg Mountains','Wild Coast','Addo Elephant Park','Johannesburg Apartheid Museum']
  },
  { code: 'MA', name: 'Morocco', flag: '🇲🇦',
    unesco: ['Fes Medina','Marrakech Medina','Aït Benhaddou','Volubilis','Essaouira Medina','Rabat'],
    hidden: ['Chefchaouen Blue City','Sahara Desert Merzouga','Atlas Mountains','Todra Gorge','Dades Valley','Casablanca Hassan II Mosque','Tangier','Ouarzazate','Paradise Valley','Legzira Beach','Ouzoud Falls','Draa Valley']
  },
  { code: 'TZ', name: 'Tanzania', flag: '🇹🇿',
    unesco: ['Serengeti National Park','Ngorongoro Crater','Kilimanjaro NP','Stone Town Zanzibar','Kondoa Rock Art','Selous Game Reserve'],
    hidden: ['Mount Kilimanjaro','Zanzibar Beaches','Lake Manyara','Tarangire NP','Pemba Island','Dar es Salaam','Mafia Island','Ruaha NP','Usambara Mountains','Lake Victoria']
  },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪',
    unesco: ['Mount Kenya NP','Lake Turkana NP','Lamu Old Town','Fort Jesus Mombasa','Kenya Lake System Great Rift Valley'],
    hidden: ['Masai Mara','Nairobi National Park','Diani Beach','Lake Nakuru','Amboseli NP','Tsavo NP','Hell Gate NP','Samburu NP','Watamu Beach','Ol Pejeta Conservancy']
  },
  { code: 'ET', name: 'Ethiopia', flag: '🇪🇹',
    unesco: ['Rock-Hewn Churches Lalibela','Simien Mountains','Fasil Ghebbi Gondar','Aksum Obelisks','Lower Omo Valley','Harar Jugol'],
    hidden: ['Danakil Depression','Blue Nile Falls','Bale Mountains','Erta Ale Volcano','Lake Tana Monasteries','Addis Ababa National Museum','Tigray Rock Churches','Omo Valley Tribes','Sof Omar Caves','Awash NP']
  },
  { code: 'UG', name: 'Uganda', flag: '🇺🇬',
    unesco: ['Bwindi Impenetrable Forest','Rwenzori Mountains','Tombs of Buganda Kings'],
    hidden: ['Mountain Gorillas','Murchison Falls NP','Queen Elizabeth NP','Jinja Source of Nile','Ssese Islands','Lake Bunyonyi','Kibale Forest','Kidepo Valley NP','Sipi Falls','Kampala']
  },
  { code: 'RW', name: 'Rwanda', flag: '🇷🇼',
    unesco: ['Nyungwe Forest'],
    hidden: ['Volcanoes NP Gorillas','Lake Kivu','Kigali Genocide Memorial','Akagera NP','Musanze Caves','Congo Nile Trail','Bisoke Volcano','Butare National Museum','Gishwati Forest','Twin Lakes Burera Ruhondo']
  },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬',
    unesco: ['Osun-Osogbo Sacred Grove','Sukur Cultural Landscape'],
    hidden: ['Obudu Mountain Resort','Yankari NP','Zuma Rock','Olumo Rock','Nike Art Gallery Lagos','Lekki Conservation Centre','Cross River NP','Idanre Hills','Ogbunike Caves','Erin Ijesha Waterfalls']
  },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭',
    unesco: ['Forts and Castles Volta','Asante Traditional Buildings'],
    hidden: ['Cape Coast Castle','Kakum NP Canopy Walk','Mole NP','Wli Waterfalls','Lake Volta','Accra','Elmina Castle','Labadi Beach','Nzulezo Stilt Village','Aburi Botanical Gardens']
  },
  { code: 'SN', name: 'Senegal', flag: '🇸🇳',
    unesco: ['Gorée Island','Niokolo-Koba NP','Djoudj Bird Sanctuary','Saloum Delta','Bassari Country'],
    hidden: ['Lac Rose Pink Lake','Saint-Louis','Cap Skirring','Casamance','Bandia Wildlife Reserve','Dakar','Sine Saloum','Touba Grand Mosque','Lompoul Desert','Île de Ngor']
  },
  { code: 'CI', name: 'Côte d\'Ivoire', flag: '🇨🇮',
    unesco: ['Taï NP','Comoé NP','Grand-Bassam','Sudanese Mosques'],
    hidden: ['Yamoussoukro Basilica','Man Mountains','Assinie Beach','Banco NP','Mont Nimba','Abidjan Plateau','Sassandra','Grand-Lahou','Jacqueville','Mount Tonkoui']
  },
  { code: 'CM', name: 'Cameroon', flag: '🇨🇲',
    unesco: ['Dja Faunal Reserve'],
    hidden: ['Mount Cameroon','Limbe Beaches','Kribi Waterfalls','Waza NP','Rhumsiki Village','Ring Road Bamenda','Lake Nyos','Ekom Nkam Falls','Bamoun Palace','Bafut Fon Palace']
  },
  { code: 'CD', name: 'DR Congo', flag: '🇨🇩',
    unesco: ['Virunga NP','Garamba NP','Kahuzi-Biega NP','Salonga NP','Okapi Wildlife Reserve'],
    hidden: ['Nyiragongo Volcano','Lake Kivu DRC Side','Lola Ya Bonobo','Tchambal Rapids','Livingstone Falls','Epulu Reserve','Lubumbashi','Kinshasa','Boyoma Falls','Upemba NP']
  },
  { code: 'ZW', name: 'Zimbabwe', flag: '🇿🇼',
    unesco: ['Victoria Falls','Great Zimbabwe','Mana Pools NP','Khami Ruins','Matobo Hills'],
    hidden: ['Hwange NP','Lake Kariba','Chimanimani Mountains','Eastern Highlands','Gonarezhou NP','Matobo Hills Balancing Rocks','Chinhoyi Caves','Nyanga NP','Kariba Dam','Harare Gardens']
  },
  { code: 'ZM', name: 'Zambia', flag: '🇿🇲',
    unesco: ['Victoria Falls Zambia Side'],
    hidden: ['South Luangwa NP','Lower Zambezi NP','Lake Kariba Zambia','Kafue NP','Bangweulu Wetlands','Shiwa Ngandu','Kasanka Bat Migration','Lilayi Elephant Nursery','Devil Pool Victoria Falls','Kundalila Falls']
  },
  { code: 'BW', name: 'Botswana', flag: '🇧🇼',
    unesco: ['Tsodilo Hills','Okavango Delta'],
    hidden: ['Chobe NP','Moremi Game Reserve','Makgadikgadi Pans','Central Kalahari Game Reserve','Nxai Pan NP','Gcwihaba Caves','Kubu Island','Mashatu Game Reserve','Khama Rhino Sanctuary','Linyanti']
  },
  { code: 'NA', name: 'Namibia', flag: '🇳🇦',
    unesco: ['Twyfelfontein','Namib Sand Sea'],
    hidden: ['Sossusvlei Dunes','Etosha NP','Fish River Canyon','Skeleton Coast','Deadvlei','Spitzkoppe','Kolmanskop Ghost Town','Swakopmund','Cape Cross Seal Colony','Waterberg Plateau','Damaraland','Caprivi Strip']
  },
  { code: 'MZ', name: 'Mozambique', flag: '🇲🇿',
    unesco: ['Island of Mozambique'],
    hidden: ['Bazaruto Archipelago','Tofo Beach','Quirimbas Archipelago','Gorongosa NP','Vilankulo','Inhambane','Lake Malawi Mozambique Side','Maputo','Cahora Bassa Dam','Niassa Reserve']
  },
  { code: 'MW', name: 'Malawi', flag: '🇲🇼',
    unesco: ['Lake Malawi NP','Chongoni Rock Art'],
    hidden: ['Cape Maclear','Liwonde NP','Mount Mulanje','Nkhata Bay','Likoma Island','Majete Wildlife Reserve','Zomba Plateau','Nyika NP','Blantyre','Senga Bay']
  },
  { code: 'MG', name: 'Madagascar', flag: '🇲🇬',
    unesco: ['Tsingy de Bemaraha','Atsinanana Rainforests','Royal Hill of Ambohimanga'],
    hidden: ['Avenue of the Baobabs','Nosy Be Island','Isalo NP','Andasibe-Mantadia NP','Ifaty Beach','Morondava','Ranomafana NP','Île Sainte-Marie','Ankarana Reserve','Antananarivo']
  },
  { code: 'MU', name: 'Mauritius', flag: '🇲🇺',
    unesco: ['Aapravasi Ghat','Le Morne Cultural Landscape'],
    hidden: ['Chamarel Seven-Coloured Earth','Île aux Cerfs','Black River Gorges NP','Le Morne Beach','Chamarel Waterfall','Trou aux Biches','Grand Baie','Underwater Waterfall Illusion','Pamplemousses Garden','Flic en Flac']
  },
  { code: 'SC', name: 'Seychelles', flag: '🇸🇨',
    unesco: ['Vallée de Mai','Aldabra Atoll'],
    hidden: ['Anse Source d\'Argent','Anse Lazio','Praslin Island','La Digue Island','Beau Vallon Beach','Morne Seychellois NP','Curieuse Island','Sainte Anne Marine Park','Moyenne Island','Victoria Market']
  },
  { code: 'DZ', name: 'Algeria', flag: '🇩🇿',
    unesco: ['Tassili n\'Ajjer','M\'Zab Valley','Djémila','Tipasa','Timgad','Beni Hammad Fort','Casbah of Algiers'],
    hidden: ['Ghardaia','Constantine Bridges','Oran','Tlemcen','Hoggar Mountains','Djanet Oasis','Béjaïa','Annaba','El Oued','Tadrart Rouge']
  },
  { code: 'TN', name: 'Tunisia', flag: '🇹🇳',
    unesco: ['Carthage','Amphitheatre of El Jem','Medina of Tunis','Kairouan','Dougga','Ichkeul NP','Kerkuane'],
    hidden: ['Sidi Bou Said','Sahara Tozeur','Matmata Star Wars Caves','Djerba Island','Chott el Jerid','Tabarka','Hammamet','Douz Desert Gate','Chebika Oasis','Monastir']
  },
  { code: 'LY', name: 'Libya', flag: '🇱🇾',
    unesco: ['Leptis Magna','Sabratha','Cyrene','Rock Art Sites of Tadrart Acacus','Old Town of Ghadamès'],
    hidden: ['Tripoli Medina','Acacus Mountains','Ubari Sand Sea','Ghadames Old Town','Nalut','Tobruk','Benghazi','Awbari Lakes']
  },
  { code: 'SD', name: 'Sudan', flag: '🇸🇩',
    unesco: ['Gebel Barkal','Archaeological Sites of Meroe','Sanganeb Marine NP'],
    hidden: ['Pyramids of Meroe','Nile Confluence Khartoum','Suakin Ghost Port','Dinder NP','Jebel Marra','Port Sudan Diving','Naga Temples','Kerma Kingdom']
  },
  { code: 'AO', name: 'Angola', flag: '🇦🇴',
    unesco: ['Mbanza-Kongo'],
    hidden: ['Kalandula Falls','Luanda Ilha','Tundavala Gap','Kissama NP','Benguela','Namibe Desert','Mussulo Island','Serra da Leba Pass','Lobito','Black Rocks Pungo Andongo']
  },
  { code: 'CV', name: 'Cape Verde', flag: '🇨🇻',
    unesco: ['Cidade Velha'],
    hidden: ['Sal Island','Boa Vista','Santo Antão Hiking','Fogo Volcano','Mindelo','Santa Maria Beach','Praia','São Vicente','Brava','Tarrafal']
  },
  { code: 'RE', name: 'Réunion', flag: '🇷🇪',
    unesco: ['Pitons Cirques and Remparts'],
    hidden: ['Piton de la Fournaise','Cirque de Mafate','Cirque de Cilaos','Cirque de Salazie','Saint-Leu','Grand Anse Beach','Forêt de Bélouve','Cascade Langevin','Cap Méchant','Maïdo Viewpoint']
  },

  // ======================== OCEANIA ========================
  { code: 'AU', name: 'Australia', flag: '🇦🇺',
    unesco: ['Sydney Opera House','Great Barrier Reef','Uluru-Kata Tjuta','Kakadu NP','Blue Mountains','Shark Bay','Lord Howe Island','Fraser Island','Wet Tropics Queensland'],
    hidden: ['Harbour Bridge Sydney','Twelve Apostles','Whitsunday Islands','Tasmania','Melbourne','Perth','Kimberley Region','Kangaroo Island','Ningaloo Reef','Daintree Rainforest','Byron Bay']
  },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿',
    unesco: ['Tongariro Alpine Crossing','Te Wahipounamu','Sub-Antarctic Islands'],
    hidden: ['Milford Sound','Hobbiton Movie Set','Queenstown','Bay of Islands','Rotorua','Franz Josef Glacier','Wanaka','Auckland','Wellington','Abel Tasman NP','Aoraki Mount Cook','Coromandel Peninsula','Waitomo Glowworm Caves']
  },
  { code: 'FJ', name: 'Fiji', flag: '🇫🇯',
    unesco: ['Levuka Historical Port'],
    hidden: ['Mamanuca Islands','Coral Coast','Taveuni Garden Island','Cloud 9 Floating Bar','Navua River','Yasawa Islands','Beqa Lagoon','Nadi','Sigatoka Sand Dunes','Bouma NP']
  },
  { code: 'PG', name: 'Papua New Guinea', flag: '🇵🇬',
    unesco: ['Kuk Early Agricultural Site'],
    hidden: ['Kokopo Rabaul','Tufi Fjords','Sepik River','Tari Valley','Madang','Mount Wilhelm','Trobriand Islands','Alotau','Rabaul Volcano','Kimbe Bay Diving']
  },
  { code: 'WS', name: 'Samoa', flag: '🇼🇸',
    unesco: [],
    hidden: ['To Sua Ocean Trench','Lalomanu Beach','Piula Cave Pool','Apia','Savai\'i Blowholes','Papaseea Sliding Rocks','Togitogiga Falls','Alofaaga Blowholes','Return to Paradise Beach','Aganoa Beach']
  },
  { code: 'TO', name: 'Tonga', flag: '🇹🇴',
    unesco: [],
    hidden: ['Ha\'atafu Beach','Mapu a Vaea Blowholes','Swallows Cave Vava\'u','Whale Swimming Vava\'u','Nuku\'alofa Royal Palace','Anahulu Cave','Pangaimotu Island','Fafa Island','Tofua Island','Eua NP']
  },
  { code: 'VU', name: 'Vanuatu', flag: '🇻🇺',
    unesco: ['Chief Roi Mata Domain'],
    hidden: ['Mount Yasur Volcano','Blue Holes Espiritu Santo','Champagne Beach','Port Vila','Mele Cascades','Million Dollar Point','Hideaway Island','Pentecost Land Diving','Millennium Cave','Tanna Coffee']
  },
  { code: 'NC', name: 'New Caledonia', flag: '🇳🇨',
    unesco: ['Lagoons of New Caledonia'],
    hidden: ['Île des Pins','Heart of Voh','Nouméa Anse Vata','Lifou','Ouvéa','Blue River Park','Prony Bay','Hienghène','Bourail','Tjibaou Cultural Centre']
  },
  { code: 'PF', name: 'French Polynesia', flag: '🇵🇫',
    unesco: ['Taputapuātea'],
    hidden: ['Bora Bora','Moorea','Tahiti','Rangiroa','Fakarava','Tikehau','Huahine','Raiatea','Marquesas Islands','Tetiaroa']
  },
  { code: 'CK', name: 'Cook Islands', flag: '🇨🇰',
    unesco: [],
    hidden: ['Aitutaki Lagoon','Rarotonga','Muri Beach','Te Vara Nui Cultural Village','Aroa Marine Reserve','One Foot Island','Cross-Island Track','Titikaveka Beach','Avarua','Punanga Nui Market']
  },

  // ======================== MIDDLE EAST (remaining) ========================
  { code: 'JO', name: 'Jordan', flag: '🇯🇴',
    unesco: ['Petra','Quseir Amra','Um er-Rasas','Wadi Rum Protected Area','As-Salt'],
    hidden: ['Dead Sea Jordan','Jerash Ruins','Amman Citadel','Red Sea Aqaba','Dana Nature Reserve','Ajloun Castle','Madaba Mosaic Map','Bethany Beyond Jordan','Azraq Wetland Reserve','Mukawir']
  },
  { code: 'AE', name: 'UAE', flag: '🇦🇪',
    unesco: ['Al Ain Oasis'],
    hidden: ['Burj Khalifa Dubai','Sheikh Zayed Mosque','Dubai Marina','Palm Jumeirah','Abu Dhabi Louvre','Dubai Frame','Dubai Miracle Garden','Liwa Oasis','Jebel Jais','Hatta','Al Fahidi Dubai','Sir Bani Yas Island']
  },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷',
    unesco: ['Cappadocia Göreme NP','Hagia Sophia Istanbul','Ephesus','Troy','Hierapolis-Pamukkale','Nemrut Dağ','Safranbolu','Divriği Great Mosque'],
    hidden: ['Blue Mosque Istanbul','Istanbul Bosphorus','Antalya','Gallipoli','Sumela Monastery','Ölüdeniz Blue Lagoon','Butterfly Valley','Olympos','Ani Ruins','Kaçkar Mountains','Saklıkent Gorge','Mount Ararat']
  },
  { code: 'IL', name: 'Israel', flag: '🇮🇱',
    unesco: ['Jerusalem Old City','White City Tel Aviv','Masada','Caves of Maresha','Negev Incense Route'],
    hidden: ['Western Wall','Dead Sea Israel','Eilat Red Sea','Haifa Bahai Gardens','Sea of Galilee','Ramon Crater','Akko Old City','Rosh Hanikra','Caesarea','Ein Gedi Oasis']
  },
  { code: 'LB', name: 'Lebanon', flag: '🇱🇧',
    unesco: ['Baalbek','Byblos','Anjar','Tyre','Ouadi Qadisha Cedars'],
    hidden: ['Beirut','Jeita Grotto','Harissa','Sidon Sea Castle','Jounieh Bay','Beiteddine Palace','Tripoli Souks','Faraya Ski Resort','Baatara Gorge Waterfall','Tannourine Cedars']
  },
  { code: 'SY', name: 'Syria', flag: '🇸🇾',
    unesco: ['Ancient City of Damascus','Palmyra','Ancient City of Bosra','Ancient City of Aleppo','Crac des Chevaliers'],
    hidden: ['Umayyad Mosque Damascus','Maaloula Village','Dead Cities','Apamea Colonnades','Latakia Beach','Hama Waterwheels','Sednaya Monastery','Tartus']
  },
  { code: 'PS', name: 'Palestine', flag: '🇵🇸',
    unesco: ['Birthplace of Jesus Bethlehem','Hebron Al-Khalil Old Town','Land of Olives Battir'],
    hidden: ['Jericho','Ramallah','Nablus Old City','Dead Sea Palestine','Wadi Qelt','Mar Saba Monastery','Sebastia Ruins','Tell Balata']
  },

  // ======================== CENTRAL ASIA & CAUCASUS (additional) ========================

  // ======================== CARIBBEAN & SMALL ISLANDS ========================
  { code: 'AG', name: 'Antigua and Barbuda', flag: '🇦🇬',
    unesco: ['Nelson Dockyard'],
    hidden: ['Dickenson Bay','Half Moon Bay','Stingray City','Shirley Heights','Devil Bridge','Barbuda Pink Sand Beach','English Harbour','Jolly Beach','Galley Bay','Cedar Valley']
  },
  { code: 'LC', name: 'Saint Lucia', flag: '🇱🇨',
    unesco: ['Pitons Management Area'],
    hidden: ['Pitons','Soufrière','Marigot Bay','Anse Chastanet','Diamond Falls','Pigeon Island','Jalousie Beach','Sulphur Springs','Toraille Waterfall','Rodney Bay']
  },
  { code: 'GD', name: 'Grenada', flag: '🇬🇩',
    unesco: [],
    hidden: ['Grand Anse Beach Grenada','Underwater Sculpture Park','Annandale Falls','Fort George Grenada','Concord Falls','Levera Beach','Chocolate Factory Tour','Grand Etang Lake','Bathway Beach','Calivigny Island']
  },
  { code: 'VC', name: 'Saint Vincent', flag: '🇻🇨',
    unesco: [],
    hidden: ['Tobago Cays','La Soufrière Volcano','Dark View Falls','Bequia Island','Mustique','Fort Charlotte','Botanical Gardens','Baleine Falls','Wallilabou Bay','Mayreau']
  },
  { code: 'KN', name: 'Saint Kitts and Nevis', flag: '🇰🇳',
    unesco: ['Brimstone Hill Fortress'],
    hidden: ['South Friars Beach','Pinney Beach Nevis','Mount Liamuiga','Basseterre','Cockleshell Bay','Nevis Peak','Frigate Bay','Romney Manor','Black Rocks','Charlestown Nevis']
  },
  { code: 'DM', name: 'Dominica', flag: '🇩🇲',
    unesco: ['Morne Trois Pitons NP'],
    hidden: ['Boiling Lake','Trafalgar Falls','Champagne Reef','Emerald Pool','Titou Gorge','Middleham Falls','Scotts Head','Indian River','Morne Diablotin','Cabrits NP']
  },

  // ======================== PACIFIC ISLANDS ========================
  { code: 'MH', name: 'Marshall Islands', flag: '🇲🇭',
    unesco: ['Bikini Atoll Nuclear Test Site'],
    hidden: ['Majuro Atoll','Laura Beach','Arno Atoll','Jaluit Atoll','Kwajalein','Mili Atoll','Ailinglaplap','Rongelap','Eneko Island','Bikini Lagoon Diving']
  },
  { code: 'FM', name: 'Micronesia', flag: '🇫🇲',
    unesco: ['Nan Madol'],
    hidden: ['Chuuk Lagoon Wrecks','Pohnpei','Yap Stone Money','Kosrae Ruins','Ant Atoll','Kepirohi Waterfall','Lelu Ruins','Sokehs Rock','Blue Hole Pohnpei','Pingelap']
  },
  { code: 'PW', name: 'Palau', flag: '🇵🇼',
    unesco: ['Rock Islands Southern Lagoon'],
    hidden: ['Jellyfish Lake','Blue Corner Diving','Milky Way Lagoon','Ngardmau Waterfall','Long Beach','German Channel','Kayangel Atoll','Peleliu Battlefield','Ngemelis Wall','Babeldaob']
  },
  { code: 'KI', name: 'Kiribati', flag: '🇰🇮',
    unesco: ['Phoenix Islands Protected Area'],
    hidden: ['Christmas Island Kiribati','Tarawa Atoll','Fanning Island','London Village','Abemama','Butaritari','Kiritimati Fly Fishing','Abaiang','Nonouti','Marakei']
  },
  { code: 'NR', name: 'Nauru', flag: '🇳🇷',
    unesco: [],
    hidden: ['Anibare Bay','Buada Lagoon','Command Ridge','Moqua Well','Central Plateau','Topside','Japanese Guns','Nauru Pinnacles','Parliament House','Ewa Beach']
  },
  { code: 'TV', name: 'Tuvalu', flag: '🇹🇻',
    unesco: [],
    hidden: ['Funafuti Atoll','Funafuti Marine Conservation','Nanumea','Vaitupu','Nukufetau','Nui Atoll','Fongafale','Tepuka Islet','Telele Islet','Fuagea Islet']
  },

  // ======================== ADDITIONAL COUNTRIES ========================
  { code: 'IS2', name: 'Israel', flag: '🇮🇱', unesco: [], hidden: [] }, // skip duplicate

  // AFRICA continued
  { code: 'SS', name: 'South Sudan', flag: '🇸🇸',
    unesco: [],
    hidden: ['Boma NP','Southern NP','Sudd Wetland','Nimule NP','Bandingilo NP','Juba','White Nile Source','Imatong Mountains','Bor','Torit']
  },
  { code: 'ER', name: 'Eritrea', flag: '🇪🇷',
    unesco: ['Asmara Modernist City'],
    hidden: ['Massawa Old Town','Dahlak Archipelago','Debre Bizen Monastery','Keren','Filfil Tropical Forest','Qohaito Ruins','Adulis','Nakfa','Senafe','Green Island']
  },
  { code: 'DJ', name: 'Djibouti', flag: '🇩🇯',
    unesco: [],
    hidden: ['Lake Assal','Lac Abbé','Day Forest NP','Moucha Island','Tadjoura','Arta Beach','Ali Sabieh','Ghoubbet Bay','Whale Sharks Gulf of Tadjoura','Maskali Island']
  },
  { code: 'SO', name: 'Somalia', flag: '🇸🇴',
    unesco: [],
    hidden: ['Laas Geel Cave Art','Mogadishu Lido Beach','Hargeisa','Berbera Beach','Cal Madow Mountains','Jazeera Beach','Bosaso','Galkayo','Merca Old Town','Warsheikh']
  },
  { code: 'ML', name: 'Mali', flag: '🇲🇱',
    unesco: ['Timbuktu','Djenné','Cliff of Bandiagara Dogon','Tomb of Askia'],
    hidden: ['Bamako','Ségou','Mopti','Niger River','Hombori Tondo','Pays Dogon','Boucle du Baoulé NP','Sikasso','Debo Lake','Bamako National Museum']
  },
  { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫',
    unesco: ['Ruins of Loropéni','W-Arly-Pendjari Complex'],
    hidden: ['Ouagadougou','Sindou Peaks','Bobo-Dioulasso','Banfora Cascades','Nazinga Game Ranch','Lake Tengrela','Domes de Fabédougou','Tiébélé Royal Court','Réserve de Nazinga','Mare aux Hippopotames']
  },
  { code: 'NE', name: 'Niger', flag: '🇳🇪',
    unesco: ['Air and Ténéré Reserves','W National Park'],
    hidden: ['Agadez','Niamey','Ténéré Desert','Aïr Mountains','Timia Oasis','Cure Salée Festival','Diffa','Zinder Sultan Palace','Kouré Giraffes','Dosso']
  },
  { code: 'TD', name: 'Chad', flag: '🇹🇩',
    unesco: ['Lakes of Ounianga','Ennedi Massif'],
    hidden: ['N\'Djamena','Zakouma NP','Tibesti Mountains','Lake Chad','Guelta d\'Archei','Ennedi Plateau','Aloba Arch','Ouadi Rimé-Ouadi Achim','Moundou','Abéché']
  },
  { code: 'CF', name: 'Central African Republic', flag: '🇨🇫',
    unesco: ['Manovo-Gounda St Floris NP','Sangha Trinational'],
    hidden: ['Bangui','Dzanga-Sangha Reserve','Boali Falls','Bayanga Bai','Chinko NP','Bangassou','Kembe Falls','Oubangui River','Bamingui-Bangoran NP','Birao']
  },
  { code: 'CG', name: 'Republic of Congo', flag: '🇨🇬',
    unesco: ['Sangha Trinational Congo'],
    hidden: ['Brazzaville','Odzala-Kokoua NP','Pointe-Noire','Lefini Reserve','Lac Télé','Lésio-Louna Gorilla Reserve','Diosso Gorge','Loango Beach','Nouabalé-Ndoki NP','Mboko']
  },
  { code: 'GA', name: 'Gabon', flag: '🇬🇦',
    unesco: ['Lopé-Okanda'],
    hidden: ['Loango NP','Libreville','Ivindo NP','Pongara NP','Akanda NP','Crystal Mountains','Nyonié','Cap Estérias','Lambaréné','Mikongo']
  },
  { code: 'GQ', name: 'Equatorial Guinea', flag: '🇬🇶',
    unesco: [],
    hidden: ['Malabo','Bioko Island','Pico Basile','Arena Blanca Beach','Ureca','Bata','Monte Alén NP','Corisco Island','Luba Crater Lake','Moca']
  },
  { code: 'ST', name: 'São Tomé and Príncipe', flag: '🇸🇹',
    unesco: [],
    hidden: ['Pico Cão Grande','Praia Jale','Obo NP','Lagoa Azul','Roça Sundy','Bom Bom Island','Praia Banana','São Tomé City','Rolas Islet Equator','Cascata de São Nicolau']
  },
  { code: 'GW', name: 'Guinea-Bissau', flag: '🇬🇼',
    unesco: [],
    hidden: ['Bijagós Archipelago','Orango Island','Bolama','Cacheu Fort','Varela Beach','Bissau','João Vieira Marine Park','Cantanhez NP','Bubaque Island','Cufada Lagoon']
  },
  { code: 'GN', name: 'Guinea', flag: '🇬🇳',
    unesco: ['Mount Nimba Strict Nature Reserve'],
    hidden: ['Îles de Los','Fouta Djallon Highlands','Conakry','Kindia','Dalaba','Badiar NP','Tinkisso Falls','Kassa Island','Ditinn Falls','Dubréka']
  },
  { code: 'SL', name: 'Sierra Leone', flag: '🇸🇱',
    unesco: [],
    hidden: ['Tokeh Beach','Banana Islands','Tiwai Island','Freetown','River Number Two Beach','Bunce Island','Bureh Beach','Tacugama Chimpanzee','Outamba-Kilimi NP','Turtle Islands']
  },
  { code: 'LR', name: 'Liberia', flag: '🇱🇷',
    unesco: [],
    hidden: ['Sapo NP','Robertsport','Monrovia','Buchanan Beach','Lake Piso','Kpatawee Falls','Firestone Plantation','Marshall','Cestos River','Mount Nimba Liberia']
  },
  { code: 'TG', name: 'Togo', flag: '🇹🇬',
    unesco: ['Koutammakou Batammariba'],
    hidden: ['Lomé','Togoville','Kpalimé','Fazao-Malfakassa NP','Aneho','Cascade de Womé','Kara','Mont Agou','Lake Togo','Tamberma Valley']
  },
  { code: 'BJ', name: 'Benin', flag: '🇧🇯',
    unesco: ['Royal Palaces of Abomey','W-Arly-Pendjari'],
    hidden: ['Ganvié Lake Village','Cotonou','Ouidah Python Temple','Pendjari NP','Porto-Novo','Tanougou Falls','Grand-Popo Beach','Route des Pêches','Possotomé','Dassa-Zoumé Hills']
  },
  { code: 'MR', name: 'Mauritania', flag: '🇲🇷',
    unesco: ['Banc d\'Arguin NP','Ancient Ksour of Ouadane','Chinguetti','Tichitt','Oualata'],
    hidden: ['Nouakchott','Richat Structure Eye of Africa','Atar','Terjit Oasis','Train du Désert','Adrar Plateau','Erg Ouarane','Nouadhibou','Tagant','Ben Amera Monolith']
  },
  { code: 'GM', name: 'Gambia', flag: '🇬🇲',
    unesco: ['Stone Circles of Senegambia','Kunta Kinteh Island'],
    hidden: ['Banjul','Abuko Nature Reserve','River Gambia NP','Bijilo Forest Park','Sanyang Beach','Makasutu Culture Forest','Bakau','Tendaba','Georgetown','Kartong Beach']
  },
  { code: 'BI', name: 'Burundi', flag: '🇧🇮',
    unesco: [],
    hidden: ['Source of the Nile','Lake Tanganyika Burundi','Kibira NP','Rusizi NP','Bujumbura','Karera Falls','Gitega National Museum','Saga Beach','Ruvubu NP','Gishora Drum Sanctuary']
  },
  { code: 'KM', name: 'Comoros', flag: '🇰🇲',
    unesco: [],
    hidden: ['Mount Karthala','Mohéli Marine Park','Grande Comore','Itsandra Beach','Moroni','Lac Salé','Chomoni Beach','Anjouan','Mohéli','Mitsamiouli Beach']
  },
  { code: 'SZ', name: 'Eswatini', flag: '🇸🇿',
    unesco: [],
    hidden: ['Hlane Royal NP','Mlilwane Wildlife Sanctuary','Mantenga Cultural Village','Sibebe Rock','Malolotja Nature Reserve','Ezulwini Valley','Ngwenya Glass','Lobamba','Swazi Candles','Phophonyane Falls']
  },
  { code: 'LS', name: 'Lesotho', flag: '🇱🇸',
    unesco: ['Maloti-Drakensberg Park'],
    hidden: ['Sani Pass','Afriski Mountain Resort','Maletsunyane Falls','Katse Dam','Thaba-Bosiu','Sehlabathebe NP','Maseru','Tsehlanyane NP','Bokong Nature Reserve','Ha Kome Cave Houses']
  },

  // ======================== ADDITIONAL ASIA/PACIFIC ========================
  { code: 'TL', name: 'Timor-Leste', flag: '🇹🇱',
    unesco: [],
    hidden: ['Atauro Island','Cristo Rei Dili','Jaco Island','Nino Konis Santana NP','Dili','Lake Ira Lalaro','Mount Ramelau','Com Beach','Tutuala','Baucau']
  },
  { code: 'BN', name: 'Brunei', flag: '🇧🇳',
    unesco: [],
    hidden: ['Sultan Omar Ali Saifuddien Mosque','Ulu Temburong NP','Kampong Ayer Water Village','Jame Asr Hassanil Bolkiah Mosque','Royal Regalia Museum','Tasek Lama Recreational Park','Gadong Night Market','Muara Beach','Brunei Museum','Proboscis Monkey River Safari']
  },
  { code: 'NP2', name: 'Nepal', flag: '🇳🇵', unesco: [], hidden: [] }, // skip duplicate
];

// Remove empty/duplicate entries
const cleanedCountries = ALL_COUNTRIES_EXTENDED.filter(c => 
  (c.unesco.length > 0 || c.hidden.length > 0) && !c.code.includes('2')
);

// Generate all places from countries
export const generatePlaces = (): Place[] => {
  const places: Place[] = [];
  let id = 1;

  for (const country of cleanedCountries) {
    for (const placeName of country.unesco) {
      const imageUrl = getPlaceImage(placeName, country.name, 'unesco');
      places.push({
        id: `place_${id++}`,
        name: placeName,
        country: country.name,
        countryCode: country.code,
        countryFlag: country.flag,
        type: 'unesco',
        image: imageUrl,
        thumb: imageUrl.replace('w=800', 'w=400'),
        stars: generateRating('unesco'),
        mapUrl: mapUrl(placeName, country.name)
      });
    }
    for (const placeName of country.hidden) {
      const imageUrl = getPlaceImage(placeName, country.name, 'hidden');
      places.push({
        id: `place_${id++}`,
        name: placeName,
        country: country.name,
        countryCode: country.code,
        countryFlag: country.flag,
        type: 'hidden',
        image: imageUrl,
        thumb: imageUrl.replace('w=800', 'w=400'),
        stars: generateRating('hidden'),
        mapUrl: mapUrl(placeName, country.name)
      });
    }
  }

  return places;
};

export const ADVENTURE_PLACES = generatePlaces();

export const getPlacesByCountry = (countryCode: string): Place[] =>
  ADVENTURE_PLACES.filter(p => p.countryCode === countryCode);

export const getUNESCOPlaces = (): Place[] =>
  ADVENTURE_PLACES.filter(p => p.type === 'unesco');

export const getHiddenGems = (): Place[] =>
  ADVENTURE_PLACES.filter(p => p.type === 'hidden');

export const searchPlaces = (query: string): Place[] => {
  const lq = query.toLowerCase();
  return ADVENTURE_PLACES.filter(p =>
    p.name.toLowerCase().includes(lq) || p.country.toLowerCase().includes(lq)
  );
};

export const getAllCountries = (): { code: string; name: string; flag: string }[] =>
  cleanedCountries.map(c => ({ code: c.code, name: c.name, flag: c.flag }));
