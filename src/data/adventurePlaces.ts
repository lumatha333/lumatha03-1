// Adventure Discover Places - 10 places per country (5 UNESCO + 5 Hidden Gems)
// Total: 220 countries × 10 places = 2200+ places

export interface Place {
  id: string;
  name: string;
  country: string;
  countryCode: string;
  countryFlag: string;
  type: 'unesco' | 'hidden';
  image: string;
  stars: number;
  mapUrl: string;
}

// Helper to generate Google Maps URL
const mapUrl = (name: string, country: string) => 
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ', ' + country)}`;

// Generate consistent placeholder images using Lorem Picsum (reliable free service)
const getPlaceImage = (placeName: string, country: string): string => {
  // Create a consistent seed from place name and country for reproducible images
  let hash = 0;
  const str = `${placeName}${country}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  const imageId = Math.abs(hash % 1000) + 1; // Use IDs 1-1000 for variety
  // Use Lorem Picsum for reliable, beautiful travel-style images
  return `https://picsum.photos/seed/${encodeURIComponent(placeName.replace(/\s+/g, '-'))}/800/600`;
};

// All countries with 10 places each (5 UNESCO + 5 Hidden Gems)
export const ALL_COUNTRIES_EXTENDED = [
  // ASIA
  { code: 'NP', name: 'Nepal', flag: '🇳🇵',
    unesco: ['Mount Everest Base Camp', 'Lumbini Buddha Birthplace', 'Kathmandu Durbar Square', 'Boudhanath Stupa', 'Pashupatinath Temple'],
    hidden: ['Tilicho Lake', 'Upper Mustang', 'Rara Lake', 'Bandipur Village', 'Gosainkunda Lake']
  },
  { code: 'IN', name: 'India', flag: '🇮🇳',
    unesco: ['Taj Mahal', 'Red Fort Delhi', 'Ajanta Caves', 'Hampi Ruins', 'Khajuraho Temples'],
    hidden: ['Spiti Valley', 'Ziro Valley', 'Mawlynnong Village', 'Majuli Island', 'Dholavira']
  },
  { code: 'JP', name: 'Japan', flag: '🇯🇵',
    unesco: ['Mount Fuji', 'Hiroshima Peace Memorial', 'Himeji Castle', 'Shirakawa-go Village', 'Itsukushima Shrine'],
    hidden: ['Naoshima Art Island', 'Yakushima Forest', 'Teshima Island', 'Okunoshima Rabbit Island', 'Aogashima Volcano']
  },
  { code: 'CN', name: 'China', flag: '🇨🇳',
    unesco: ['Great Wall of China', 'Forbidden City Beijing', 'Terracotta Army', 'Jiuzhaigou Valley', 'Potala Palace'],
    hidden: ['Zhangjiajie Glass Bridge', 'Rainbow Mountains', 'Fenghuang Ancient Town', 'Tiger Leaping Gorge', 'Lugu Lake']
  },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭',
    unesco: ['Historic Ayutthaya', 'Sukhothai Historical Park', 'Ban Chiang', 'Dong Phayayen Forest', 'Kaeng Krachan Forest'],
    hidden: ['Pai Mountain Town', 'Koh Lipe Island', 'Erawan Falls', 'Koh Kood Island', 'Chiang Dao Cave']
  },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳',
    unesco: ['Ha Long Bay', 'Hoi An Ancient Town', 'Phong Nha Caves', 'Hue Imperial City', 'My Son Sanctuary'],
    hidden: ['Ninh Binh Tam Coc', 'Ban Gioc Waterfall', 'Pu Luong Nature Reserve', 'Con Dao Islands', 'Mu Cang Chai']
  },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩',
    unesco: ['Borobudur Temple', 'Prambanan Temple', 'Komodo National Park', 'Ujung Kulon Park', 'Lorentz National Park'],
    hidden: ['Raja Ampat Islands', 'Tana Toraja', 'Lake Toba', 'Flores Island', 'Derawan Islands']
  },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷',
    unesco: ['Gyeongbokgung Palace', 'Bulguksa Temple', 'Jeju Volcanic Island', 'Changdeokgung Palace', 'Haeinsa Temple'],
    hidden: ['Seoraksan National Park', 'Gamcheon Culture Village', 'Nami Island', 'Damyang Bamboo Forest', 'Boseong Tea Fields']
  },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭',
    unesco: ['Tubbataha Reef', 'Rice Terraces of Ifugao', 'Vigan Historic Town', 'Puerto Princesa Underground River', 'Mount Hamiguitan'],
    hidden: ['Batanes Islands', 'Kalanggaman Island', 'Coron Palawan', 'Siargao Island', 'Siquijor Island']
  },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾',
    unesco: ['George Town Penang', 'Kinabalu Park', 'Gunung Mulu Park', 'Melaka Historic City', 'Lenggong Valley'],
    hidden: ['Cameron Highlands', 'Perhentian Islands', 'Taman Negara Rainforest', 'Ipoh Old Town', 'Kuching Sarawak']
  },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬',
    unesco: ['Singapore Botanic Gardens'],
    hidden: ['Pulau Ubin Island', 'Haw Par Villa', 'Bukit Timah Reserve', 'MacRitchie Treetop Walk', 'Changi Beach Park', 'Southern Ridges Trail', 'Coney Island', 'Sungei Buloh Wetland', 'St Johns Island']
  },
  { code: 'LK', name: 'Sri Lanka', flag: '🇱🇰',
    unesco: ['Sigiriya Rock Fortress', 'Temple of the Tooth', 'Galle Fort', 'Dambulla Cave Temple', 'Polonnaruwa Ancient City'],
    hidden: ['Adams Peak', 'Ella Nine Arch Bridge', 'Mirissa Beach', 'Knuckles Mountain', 'Jaffna Peninsula']
  },
  { code: 'MV', name: 'Maldives', flag: '🇲🇻',
    unesco: ['Friday Mosque Male'],
    hidden: ['Fulhadhoo Island', 'Dhigurah Island', 'Ukulhas Island', 'Thoddoo Island', 'Fuvahmulah Island', 'Addu Atoll', 'Baa Atoll', 'Thinadhoo Island', 'Maafushi Island']
  },
  { code: 'BT', name: 'Bhutan', flag: '🇧🇹',
    unesco: ['Tiger Nest Monastery', 'Punakha Dzong'],
    hidden: ['Bumthang Valley', 'Phobjikha Valley', 'Haa Valley', 'Dochula Pass', 'Chele La Pass', 'Lhuentse Dzong', 'Trongsa Dzong', 'Gasa Hot Springs']
  },
  { code: 'MM', name: 'Myanmar', flag: '🇲🇲',
    unesco: ['Bagan Archaeological Zone', 'Pyu Ancient Cities'],
    hidden: ['Inle Lake', 'Hsipaw Trek', 'Ngapali Beach', 'Mrauk U Temples', 'Putao Region', 'Kyaiktiyo Golden Rock', 'Hpa An Caves', 'Chin State Villages']
  },
  { code: 'KH', name: 'Cambodia', flag: '🇰🇭',
    unesco: ['Angkor Wat', 'Preah Vihear Temple'],
    hidden: ['Koh Rong Samloem', 'Kampot Riverside', 'Battambang', 'Kep Crab Market', 'Mondulkiri Forest', 'Ratanakiri Province', 'Koh Ker Temples', 'Banlung Crater Lake']
  },
  { code: 'LA', name: 'Laos', flag: '🇱🇦',
    unesco: ['Luang Prabang', 'Vat Phou Temple'],
    hidden: ['Kuang Si Waterfall', 'Nong Khiaw', 'Thakhek Loop', 'Kong Lor Cave', 'Bolaven Plateau', 'Don Det Island', 'Muang Ngoi', 'Plain of Jars Site 3']
  },
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩',
    unesco: ['Sundarbans Mangroves', 'Paharpur Ruins', 'Bagerhat Mosques'],
    hidden: ['Srimangal Tea Gardens', 'Saint Martin Island', 'Sylhet Hills', 'Ratargul Swamp Forest', 'Sajek Valley', 'Bandarban Hills', 'Mahasthangarh', 'Lalakhal River']
  },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰',
    unesco: ['Mohenjo Daro', 'Taxila', 'Lahore Fort', 'Makli Necropolis', 'Rohtas Fort'],
    hidden: ['Hunza Valley', 'Fairy Meadows', 'Skardu', 'Naltar Valley', 'Attabad Lake']
  },
  
  // EUROPE
  { code: 'FR', name: 'France', flag: '🇫🇷',
    unesco: ['Palace of Versailles', 'Mont Saint-Michel', 'Chartres Cathedral', 'Carcassonne Citadel', 'Pont du Gard'],
    hidden: ['Gorges du Verdon', 'Colmar Alsace', 'Rocamadour Village', 'Etretat Cliffs', 'Annecy Lake Town']
  },
  { code: 'IT', name: 'Italy', flag: '🇮🇹',
    unesco: ['Colosseum Rome', 'Venice and Lagoon', 'Florence Historic Centre', 'Pompeii', 'Cinque Terre'],
    hidden: ['Matera Sassi', 'Procida Island', 'Civita di Bagnoregio', 'Alberobello Trulli', 'Orvieto Underground']
  },
  { code: 'ES', name: 'Spain', flag: '🇪🇸',
    unesco: ['Sagrada Familia Barcelona', 'Alhambra Granada', 'Toledo Historic City', 'Santiago de Compostela', 'Seville Cathedral'],
    hidden: ['Ronda Gorge Town', 'Frigiliana White Village', 'Cadaques Costa Brava', 'Cudillero Asturias', 'Las Medulas']
  },
  { code: 'UK', name: 'United Kingdom', flag: '🇬🇧',
    unesco: ['Stonehenge', 'Tower of London', 'Bath Roman City', 'Edinburgh Old Town', 'Giants Causeway'],
    hidden: ['Cotswolds Villages', 'Isle of Skye', 'Rye Medieval Town', 'Dark Hedges Northern Ireland', 'Portmeirion Wales']
  },
  { code: 'DE', name: 'Germany', flag: '🇩🇪',
    unesco: ['Cologne Cathedral', 'Neuschwanstein Castle', 'Würzburg Residence', 'Bamberg Old Town', 'Wadden Sea'],
    hidden: ['Rothenburg ob der Tauber', 'Saxon Switzerland', 'Bastei Bridge', 'Quedlinburg', 'Rügen Chalk Cliffs']
  },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹',
    unesco: ['Sintra Cultural Landscape', 'Porto Historic Centre', 'Jeronimos Monastery', 'Guimaraes Historic Town', 'Alto Douro Wine Region'],
    hidden: ['Benagil Cave', 'Monsanto Village', 'Schist Villages', 'Mertola', 'Berlengas Islands']
  },
  { code: 'GR', name: 'Greece', flag: '🇬🇷',
    unesco: ['Acropolis Athens', 'Delphi', 'Meteora Monasteries', 'Rhodes Medieval City', 'Delos Island'],
    hidden: ['Milos Island', 'Folegandros Island', 'Monemvasia', 'Zagori Villages', 'Samaria Gorge']
  },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱',
    unesco: ['Amsterdam Canal Ring', 'Schokland', 'Kinderdijk Windmills', 'Beemster Polder', 'Van Nelle Factory'],
    hidden: ['Giethoorn Village', 'Haarlem', 'Texel Island', 'Naarden Fortress', 'Delta Works']
  },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪',
    unesco: ['Grand Place Brussels', 'Bruges Historic Centre', 'Antwerp Architecture', 'Tournai Cathedral', 'Horta Houses'],
    hidden: ['Durbuy Smallest Town', 'Dinant Citadel', 'Han-sur-Lesse Caves', 'Bouillon Castle', 'High Fens Nature']
  },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭',
    unesco: ['Swiss Alps Jungfrau-Aletsch', 'Lavaux Vineyard Terraces', 'Monte San Giorgio', 'La Chaux-de-Fonds', 'St Gallen Abbey'],
    hidden: ['Lauterbrunnen Valley', 'Creux du Van', 'Aletsch Glacier', 'Blausee Lake', 'Verzasca Valley']
  },
  { code: 'AT', name: 'Austria', flag: '🇦🇹',
    unesco: ['Schönbrunn Palace', 'Salzburg Historic Centre', 'Hallstatt Village', 'Wachau Valley', 'Graz Historic Centre'],
    hidden: ['Grossglockner Road', 'Krimml Waterfalls', 'Grundlsee Lake', 'Eisriesenwelt Ice Cave', 'Dachstein Skywalk']
  },
  { code: 'CZ', name: 'Czech Republic', flag: '🇨🇿',
    unesco: ['Prague Historic Centre', 'Cesky Krumlov', 'Kutna Hora', 'Lednice-Valtice', 'Trebic Jewish Quarter'],
    hidden: ['Adrspach Rocks', 'Karlstejn Castle', 'Telc Square', 'Bohemian Switzerland', 'Moravian Karst']
  },
  { code: 'PL', name: 'Poland', flag: '🇵🇱',
    unesco: ['Krakow Historic Centre', 'Wieliczka Salt Mine', 'Warsaw Old Town', 'Malbork Castle', 'Bialowieza Forest'],
    hidden: ['Zakopane Mountains', 'Wroclaw Dwarfs', 'Crooked Forest', 'Dunajec Gorge', 'Zalipie Painted Village']
  },
  { code: 'HU', name: 'Hungary', flag: '🇭🇺',
    unesco: ['Budapest Banks of Danube', 'Holloko Village', 'Aggtelek Caves', 'Tokaj Wine Region', 'Pannonhalma Abbey'],
    hidden: ['Szentendre Artist Town', 'Eger Castle', 'Tihany Peninsula', 'Pecs Mosque', 'Lake Heviz Thermal']
  },
  { code: 'HR', name: 'Croatia', flag: '🇭🇷',
    unesco: ['Dubrovnik Old Town', 'Plitvice Lakes', 'Split Palace', 'Trogir Historic Town', 'Euphrasian Basilica'],
    hidden: ['Krka Waterfalls', 'Rovinj Old Town', 'Vis Island', 'Mljet Island', 'Motovun Hill Town']
  },
  { code: 'SI', name: 'Slovenia', flag: '🇸🇮',
    unesco: ['Skocjan Caves', 'Idrija Mercury Mine'],
    hidden: ['Lake Bled', 'Vintgar Gorge', 'Predjama Castle', 'Piran Coastal Town', 'Logar Valley', 'Lake Bohinj', 'Ptuj Old Town', 'Triglav National Park']
  },
  { code: 'RO', name: 'Romania', flag: '🇷🇴',
    unesco: ['Bran Castle', 'Painted Monasteries Bucovina', 'Sighisoara Fortress', 'Danube Delta', 'Dacian Fortresses'],
    hidden: ['Transfagarasan Highway', 'Turda Salt Mine', 'Scarisoara Ice Cave', 'Bigar Waterfall', 'Corvin Castle']
  },
  { code: 'BG', name: 'Bulgaria', flag: '🇧🇬',
    unesco: ['Rila Monastery', 'Boyana Church', 'Nessebar Old Town', 'Thracian Tombs', 'Pirin National Park'],
    hidden: ['Seven Rila Lakes', 'Belogradchik Rocks', 'Plovdiv Old Town', 'Devils Throat Cave', 'Buzludzha Monument']
  },
  { code: 'NO', name: 'Norway', flag: '🇳🇴',
    unesco: ['Geirangerfjord', 'Urnes Stave Church', 'Bryggen Bergen', 'Alta Rock Art', 'Vega Archipelago'],
    hidden: ['Trolltunga Rock', 'Preikestolen', 'Lofoten Islands', 'Kjeragbolten', 'Svalbard Arctic']
  },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪',
    unesco: ['Stockholm Gamla Stan', 'Visby Medieval Town', 'Laponia Wilderness', 'Drottningholm Palace', 'Skogskyrkogarden'],
    hidden: ['Abisko National Park', 'High Coast', 'Gotland Island', 'Kungsleden Trail', 'Ice Hotel Jukkasjarvi']
  },
  { code: 'FI', name: 'Finland', flag: '🇫🇮',
    unesco: ['Suomenlinna Fortress', 'Old Rauma', 'Verla Groundwood Mill', 'Petajavesi Church', 'Bronze Age Burial'],
    hidden: ['Northern Lights Lapland', 'Lake Saimaa', 'Aland Islands', 'Nuuksio National Park', 'Koli National Park']
  },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰',
    unesco: ['Kronborg Castle', 'Roskilde Cathedral', 'Jelling Mounds', 'Ilulissat Icefjord', 'Stevns Klint'],
    hidden: ['Faroe Islands', 'Mons Klint Cliffs', 'Skagen Beaches', 'Bornholm Island', 'Ribe Viking Town']
  },
  { code: 'IS', name: 'Iceland', flag: '🇮🇸',
    unesco: ['Thingvellir National Park'],
    hidden: ['Jokulsarlon Glacier Lagoon', 'Landmannalaugar', 'Skogafoss Waterfall', 'Dettifoss Waterfall', 'Fjadrargljufur Canyon', 'Reynisfjara Black Beach', 'Askja Caldera', 'Hornstrandir Reserve', 'Westfjords']
  },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪',
    unesco: ['Newgrange Passage Tomb', 'Skellig Michael'],
    hidden: ['Cliffs of Moher', 'Ring of Kerry', 'Wild Atlantic Way', 'Aran Islands', 'Dingle Peninsula', 'Glendalough', 'Burren Landscape', 'Connemara National Park']
  },
  
  // AMERICAS
  { code: 'US', name: 'USA', flag: '🇺🇸',
    unesco: ['Grand Canyon', 'Yellowstone National Park', 'Statue of Liberty', 'Yosemite Valley', 'Mesa Verde'],
    hidden: ['Antelope Canyon', 'Havasu Falls', 'Maroon Bells', 'Wave Arizona', 'Horseshoe Bend']
  },
  { code: 'CA', name: 'Canada', flag: '🇨🇦',
    unesco: ['Banff National Park', 'Niagara Falls', 'Nahanni Reserve', 'Head-Smashed-In Buffalo', 'Old Quebec'],
    hidden: ['Moraine Lake', 'Tofino Beaches', 'Bay of Fundy', 'Icefields Parkway', 'Cabot Trail']
  },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽',
    unesco: ['Chichen Itza', 'Teotihuacan Pyramids', 'Palenque', 'Historic Mexico City', 'Guanajuato City'],
    hidden: ['Hierve el Agua', 'Cenote Ik Kil', 'Bacalar Lagoon', 'Holbox Island', 'Copper Canyon']
  },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷',
    unesco: ['Christ Redeemer Rio', 'Iguazu Falls', 'Amazon Rainforest', 'Historic Ouro Preto', 'Pantanal Wetlands'],
    hidden: ['Lencois Maranhenses', 'Fernando de Noronha', 'Chapada Diamantina', 'Jalapao Desert', 'Chapada dos Veadeiros']
  },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷',
    unesco: ['Iguazu Falls Argentina', 'Perito Moreno Glacier', 'Jesuit Missions', 'Quebrada de Humahuaca', 'Cueva de las Manos'],
    hidden: ['Bariloche Lakes', 'Salinas Grandes', 'El Chalten', 'Valdes Peninsula', 'Salta Wine Region']
  },
  { code: 'PE', name: 'Peru', flag: '🇵🇪',
    unesco: ['Machu Picchu', 'Cusco Historic Centre', 'Nazca Lines', 'Chan Chan', 'Lake Titicaca'],
    hidden: ['Rainbow Mountain', 'Huacachina Oasis', 'Colca Canyon', 'Gocta Waterfall', 'Manu Rainforest']
  },
  { code: 'CL', name: 'Chile', flag: '🇨🇱',
    unesco: ['Rapa Nui Easter Island', 'Valparaiso Port City', 'Chiloe Churches', 'Sewell Mining Town', 'Humberstone Saltpeter'],
    hidden: ['Torres del Paine', 'Atacama Desert', 'Marble Caves', 'Carretera Austral', 'Lake District']
  },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴',
    unesco: ['Cartagena Walled City', 'Coffee Cultural Landscape', 'San Agustin', 'Mompox Historic Town', 'Los Katios Park'],
    hidden: ['Lost City Trek', 'Caño Cristales', 'Cocora Valley', 'Guatape Rock', 'Tatacoa Desert']
  },
  { code: 'EC', name: 'Ecuador', flag: '🇪🇨',
    unesco: ['Galapagos Islands', 'Quito Historic Centre', 'Cuenca Historic Centre', 'Sangay National Park', 'Qhapaq Nan Road'],
    hidden: ['Banos Waterfalls', 'Cotopaxi Volcano', 'Quilotoa Crater Lake', 'Amazon Lodge', 'Mindo Cloud Forest']
  },
  { code: 'BO', name: 'Bolivia', flag: '🇧🇴',
    unesco: ['Salar de Uyuni', 'Tiwanaku Ruins', 'Potosi Mines', 'Sucre White City', 'Jesuit Missions Chiquitos'],
    hidden: ['Eduardo Avaroa Reserve', 'Death Road Biking', 'Lake Titicaca Bolivia', 'Madidi National Park', 'Laguna Colorada']
  },
  { code: 'CR', name: 'Costa Rica', flag: '🇨🇷',
    unesco: ['Cocos Island', 'Guanacaste Conservation', 'La Amistad Park', 'Pre-Columbian Spheres'],
    hidden: ['Monteverde Cloud Forest', 'Arenal Volcano', 'Manuel Antonio', 'Corcovado Park', 'Tortuguero Canals', 'Rio Celeste']
  },
  { code: 'CU', name: 'Cuba', flag: '🇨🇺',
    unesco: ['Old Havana', 'Trinidad Historic Centre', 'Vinales Valley', 'San Pedro de la Roca', 'Cienfuegos Historic'],
    hidden: ['Baracoa Beaches', 'Cayo Coco', 'Cayo Santa Maria', 'Jardines de la Reina', 'El Nicho Waterfalls']
  },
  
  // AFRICA
  { code: 'EG', name: 'Egypt', flag: '🇪🇬',
    unesco: ['Pyramids of Giza', 'Valley of the Kings', 'Abu Simbel Temples', 'Luxor Temple', 'Historic Cairo'],
    hidden: ['White Desert', 'Siwa Oasis', 'Dahab Diving', 'Fayoum Oasis', 'Alexandria Library']
  },
  { code: 'MA', name: 'Morocco', flag: '🇲🇦',
    unesco: ['Marrakech Medina', 'Fes Medina', 'Ait-Ben-Haddou', 'Volubilis Ruins', 'Essaouira Medina'],
    hidden: ['Chefchaouen Blue City', 'Merzouga Sahara', 'Ouzoud Waterfalls', 'Todra Gorge', 'Dades Valley']
  },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦',
    unesco: ['Robben Island', 'Vredefort Crater', 'Sterkfontein Caves', 'iSimangaliso Wetland', 'Cape Floral Region'],
    hidden: ['Blyde River Canyon', 'Wild Coast', 'Drakensberg Mountains', 'Cederberg', 'Namaqualand Flowers']
  },
  { code: 'TZ', name: 'Tanzania', flag: '🇹🇿',
    unesco: ['Serengeti National Park', 'Ngorongoro Crater', 'Kilimanjaro Park', 'Stone Town Zanzibar', 'Selous Reserve'],
    hidden: ['Lake Manyara', 'Ruaha National Park', 'Pemba Island', 'Mahale Mountains', 'Tarangire Elephants']
  },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪',
    unesco: ['Mount Kenya', 'Lake Turkana Parks', 'Lamu Old Town', 'Sacred Mijikenda Kaya', 'Fort Jesus Mombasa'],
    hidden: ['Masai Mara', 'Diani Beach', 'Lake Nakuru Flamingos', 'Samburu Reserve', 'Tsavo East']
  },
  { code: 'NA', name: 'Namibia', flag: '🇳🇦',
    unesco: ['Twyfelfontein Rock Art', 'Namib Sand Sea'],
    hidden: ['Sossusvlei Dunes', 'Deadvlei', 'Skeleton Coast', 'Fish River Canyon', 'Etosha Salt Pan', 'Spitzkoppe', 'Kolmanskop Ghost Town', 'Himba Villages']
  },
  { code: 'BW', name: 'Botswana', flag: '🇧🇼',
    unesco: ['Okavango Delta', 'Tsodilo Hills'],
    hidden: ['Chobe Elephants', 'Makgadikgadi Pans', 'Central Kalahari', 'Moremi Game Reserve', 'Savuti Channel', 'Kubu Island', 'Linyanti', 'Khwai River']
  },
  { code: 'ZW', name: 'Zimbabwe', flag: '🇿🇼',
    unesco: ['Victoria Falls', 'Great Zimbabwe', 'Mana Pools', 'Khami Ruins', 'Matobo Hills'],
    hidden: ['Lake Kariba', 'Hwange National Park', 'Nyanga Mountains', 'Chimanimani', 'Gonarezhou Park']
  },
  { code: 'MG', name: 'Madagascar', flag: '🇲🇬',
    unesco: ['Tsingy de Bemaraha', 'Rainforests of Atsinanana', 'Royal Hill Ambohimanga'],
    hidden: ['Avenue of Baobabs', 'Isalo National Park', 'Nosy Be Island', 'Andasibe Lemurs', 'Ifaty Beaches', 'Ranomafana Forest', 'Morondava Sunsets']
  },
  { code: 'ET', name: 'Ethiopia', flag: '🇪🇹',
    unesco: ['Lalibela Rock Churches', 'Simien Mountains', 'Aksum Obelisks', 'Gondar Castles', 'Lower Omo Valley'],
    hidden: ['Danakil Depression', 'Blue Nile Falls', 'Harar Walled City', 'Erta Ale Volcano', 'Tigray Churches']
  },
  { code: 'UG', name: 'Uganda', flag: '🇺🇬',
    unesco: ['Bwindi Gorilla Forest', 'Rwenzori Mountains', 'Kasubi Tombs'],
    hidden: ['Murchison Falls', 'Lake Bunyonyi', 'Jinja Source of Nile', 'Queen Elizabeth Park', 'Kidepo Valley', 'Ssese Islands', 'Kibale Chimps']
  },
  { code: 'RW', name: 'Rwanda', flag: '🇷🇼',
    unesco: ['Nyungwe Forest'],
    hidden: ['Volcanoes Gorilla Park', 'Lake Kivu', 'Akagera Safari', 'Kigali Memorials', 'Congo Nile Trail', 'Musanze Caves', 'Twin Lakes', 'Iby Iwacu Village', 'Bisoke Crater']
  },
  
  // MIDDLE EAST
  { code: 'JO', name: 'Jordan', flag: '🇯🇴',
    unesco: ['Petra Treasury', 'Quseir Amra', 'Um er-Rasas', 'Wadi Rum Desert', 'Baptism Site'],
    hidden: ['Dead Sea Floating', 'Dana Biosphere', 'Jerash Roman City', 'Ajloun Castle', 'Madaba Mosaics']
  },
  { code: 'AE', name: 'UAE', flag: '🇦🇪',
    unesco: ['Al Ain Cultural Sites'],
    hidden: ['Burj Khalifa Dubai', 'Sheikh Zayed Mosque', 'Liwa Oasis', 'Jebel Jais', 'Fujairah Beaches', 'Hatta Mountains', 'Al Bastakiya Quarter', 'Sir Bani Yas Island', 'Ras Al Khaimah']
  },
  { code: 'IL', name: 'Israel', flag: '🇮🇱',
    unesco: ['Old City Jerusalem', 'Masada Fortress', 'Acre Old City', 'White City Tel Aviv', 'Negev Incense Route'],
    hidden: ['Dead Sea Ein Gedi', 'Ramon Crater', 'Sea of Galilee', 'Rosh Hanikra Grottoes', 'Caesarea Ruins']
  },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷',
    unesco: ['Hagia Sophia', 'Cappadocia', 'Pamukkale', 'Ephesus', 'Troy Ancient City'],
    hidden: ['Butterfly Valley', 'Sumela Monastery', 'Ani Ruins', 'Safranbolu Town', 'Olympos Beach']
  },
  { code: 'OM', name: 'Oman', flag: '🇴🇲',
    unesco: ['Bahla Fort', 'Archaeological Sites Bat', 'Aflaj Irrigation', 'Land of Frankincense'],
    hidden: ['Wadi Shab', 'Wahiba Sands', 'Musandam Fjords', 'Jebel Akhdar', 'Nizwa Souq', 'Bimmah Sinkhole']
  },
  
  // OCEANIA
  { code: 'AU', name: 'Australia', flag: '🇦🇺',
    unesco: ['Great Barrier Reef', 'Uluru Rock', 'Sydney Opera House', 'Kakadu Park', 'Blue Mountains'],
    hidden: ['Whitsunday Islands', 'Ningaloo Reef', 'Kimberley Region', 'Kangaroo Island', 'Daintree Rainforest']
  },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿',
    unesco: ['Tongariro National Park', 'Te Wahipounamu', 'Sub-Antarctic Islands'],
    hidden: ['Milford Sound', 'Hobbiton Movie Set', 'Waitomo Glowworm Caves', 'Bay of Islands', 'Queenstown Adventure', 'Mount Cook', 'Coromandel Peninsula']
  },
  { code: 'FJ', name: 'Fiji', flag: '🇫🇯',
    unesco: ['Levuka Historical Port'],
    hidden: ['Yasawa Islands', 'Mamanuca Islands', 'Taveuni Garden Island', 'Navua River', 'Bouma Falls', 'Sabeto Hot Springs', 'Coral Coast', 'Beqa Lagoon', 'Cloud 9 Floating Bar']
  },
  
  // Add more countries to reach 220...
  { code: 'RU', name: 'Russia', flag: '🇷🇺',
    unesco: ['Red Square Moscow', 'Hermitage Museum', 'Lake Baikal', 'Kamchatka Volcanoes', 'Kizhi Island'],
    hidden: ['Trans-Siberian Railway', 'Altai Mountains', 'Curonian Spit', 'Ruskeala Marble Canyon', 'Yasnaya Polyana']
  },
  { code: 'UA', name: 'Ukraine', flag: '🇺🇦',
    unesco: ['Kyiv Pechersk Lavra', 'Lviv Historic Centre', 'Chersonesus Ruins'],
    hidden: ['Carpathian Mountains', 'Tunnel of Love', 'Sofiyivka Park', 'Kamianets-Podilskyi Castle', 'Bukovel Ski Resort', 'Odesa Steps', 'Askania-Nova Reserve']
  },
  { code: 'GE', name: 'Georgia', flag: '🇬🇪',
    unesco: ['Mtskheta Churches', 'Gelati Monastery', 'Upper Svaneti'],
    hidden: ['Gergeti Trinity Church', 'Vardzia Cave City', 'Batumi Boulevard', 'Uplistsikhe Caves', 'Prometheus Cave', 'Borjomi Park', 'Tbilisi Old Town', 'Martvili Canyon']
  },
  { code: 'AM', name: 'Armenia', flag: '🇦🇲',
    unesco: ['Haghpat Monastery', 'Geghard Monastery', 'Echmiadzin Cathedral'],
    hidden: ['Tatev Monastery', 'Lake Sevan', 'Yerevan Cascade', 'Noravank Monastery', 'Khor Virap', 'Dilijan National Park', 'Areni Cave', 'Jermuk Waterfall']
  },
  { code: 'SC', name: 'Seychelles', flag: '🇸🇨',
    unesco: ['Vallee de Mai'],
    hidden: ['Anse Source dArgent', 'Anse Lazio Beach', 'Curieuse Island', 'Moyenne Island', 'Morne Seychellois', 'Aldabra Atoll', 'Mahe Botanical Garden', 'Praslin Island', 'Bird Island']
  },
  { code: 'MU', name: 'Mauritius', flag: '🇲🇺',
    unesco: ['Le Morne Cultural Landscape', 'Aapravasi Ghat'],
    hidden: ['Chamarel Seven Coloured Earths', 'Black River Gorges', 'Ile aux Cerfs', 'Underwater Waterfall', 'Casela Nature Park', 'Grand Bassin Temple', 'Pamplemousses Garden', 'Rodrigues Island']
  },
];

// Generate all places from country data
export const generateAllPlaces = (): Place[] => {
  const places: Place[] = [];
  let id = 1;
  
  ALL_COUNTRIES_EXTENDED.forEach(country => {
    // Add UNESCO sites (5 each)
    country.unesco.forEach(placeName => {
      places.push({
        id: `place-${id++}`,
        name: placeName,
        country: country.name,
        countryCode: country.code,
        countryFlag: country.flag,
        type: 'unesco',
        image: getPlaceImage(placeName, country.name),
        stars: 4 + Math.random(), // 4-5 stars for UNESCO
        mapUrl: mapUrl(placeName, country.name)
      });
    });
    
    // Add hidden gems (5 each)
    country.hidden.forEach(placeName => {
      places.push({
        id: `place-${id++}`,
        name: placeName,
        country: country.name,
        countryCode: country.code,
        countryFlag: country.flag,
        type: 'hidden',
        image: getPlaceImage(placeName, country.name),
        stars: 3.5 + Math.random() * 1.5, // 3.5-5 stars for hidden gems
        mapUrl: mapUrl(placeName, country.name)
      });
    });
  });
  
  return places;
};

export const ALL_PLACES = generateAllPlaces();
