// Pseudo Name Generator - Adjective + Nature/Object + Random Number pattern
// Generates millions of unique combinations for each session

const adjectives = [
  'Quiet', 'Gentle', 'Soft', 'Calm', 'Warm', 'Silent', 'Blue', 'Golden',
  'Misty', 'Serene', 'Tender', 'Still', 'Peaceful', 'Dreamy', 'Hazy',
  'Whispering', 'Floating', 'Distant', 'Hidden', 'Wandering', 'Fading',
  'Glowing', 'Velvet', 'Amber', 'Silver', 'Crimson', 'Ivory', 'Jade',
  'Dusky', 'Twilight', 'Moonlit', 'Starlit', 'Dawning', 'Evening',
  'Morning', 'Autumn', 'Winter', 'Spring', 'Summer', 'Cosmic', 'Endless',
  'Crystal', 'Sapphire', 'Ruby', 'Emerald', 'Pearl', 'Azure', 'Coral',
  'Midnight', 'Sunrise', 'Sunset', 'Aurora', 'Polar', 'Tropical', 'Arctic',
  'Oceanic', 'Meadow', 'Desert', 'Forest', 'Mountain', 'Valley', 'Coastal',
  'Mystic', 'Sacred', 'Ancient', 'Eternal', 'Infinite', 'Boundless', 'Free',
  'Wild', 'Noble', 'Pure', 'Bright', 'Deep', 'Light', 'Dark', 'Clear',
  'Fresh', 'Sweet', 'Cool', 'Vivid', 'Radiant', 'Luminous', 'Tranquil'
];

const natureObjects = [
  'River', 'Cloud', 'Mountain', 'Ocean', 'Forest', 'Meadow', 'Valley',
  'Stream', 'Lake', 'Shore', 'Sunset', 'Sunrise', 'Moon', 'Star',
  'Rain', 'Snow', 'Wind', 'Breeze', 'Storm', 'Thunder', 'Lightning',
  'Leaf', 'Flower', 'Petal', 'Garden', 'Path', 'Road', 'Trail',
  'Sky', 'Horizon', 'Shadow', 'Light', 'Echo', 'Wave', 'Tide',
  'Mist', 'Fog', 'Dew', 'Frost', 'Ember', 'Flame', 'Spark',
  'Canyon', 'Cliff', 'Island', 'Bay', 'Harbor', 'Cove', 'Peninsula',
  'Glacier', 'Volcano', 'Plateau', 'Plain', 'Marsh', 'Swamp', 'Oasis',
  'Waterfall', 'Spring', 'Creek', 'Pond', 'Lagoon', 'Delta', 'Fjord',
  'Cave', 'Grotto', 'Cavern', 'Gorge', 'Ravine', 'Bluff', 'Dune',
  'Pebble', 'Stone', 'Rock', 'Crystal', 'Gem', 'Diamond', 'Sapphire',
  'Feather', 'Wing', 'Nest', 'Shell', 'Coral', 'Reed', 'Fern'
];

// Generate pseudo name with random number for millions of combinations
// Format: AdjectiveObject-12345 (e.g., SilentForest-48291)
export const generatePseudoName = (): string => {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const object = natureObjects[Math.floor(Math.random() * natureObjects.length)];
  const number = Math.floor(Math.random() * 99999) + 1; // 1-99999
  return `${adjective}${object}-${number}`;
};

// Generate a shorter pseudo name for display (without number)
export const generateShortPseudoName = (): string => {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const object = natureObjects[Math.floor(Math.random() * natureObjects.length)];
  return `${adjective}${object}`;
};

// Conversation starters - neutral, calming prompts
export const conversationStarters = [
  "What kind of day did you have?",
  "Say one thought that stayed with you today.",
  "What's something small that made you smile recently?",
  "If you could be anywhere right now, where would you be?",
  "What's on your mind at this moment?",
  "Share something you're looking forward to.",
  "What's a simple joy you appreciate?",
  "If today had a color, what would it be?",
  "What's something you learned recently?",
  "Describe your current mood in one word.",
  "What would make this moment perfect?",
  "Share a peaceful memory.",
  "What's something you're grateful for today?",
  "If you could talk to anyone right now, who would it be?",
  "What's a song that matches your mood?",
  "Describe your ideal quiet evening.",
  "What's something you've been thinking about lately?",
  "Share a dream you had recently.",
  "What helps you feel calm?",
  "What's one thing you wish people understood about you?"
];

export const getRandomConversationStarter = (): string => {
  return conversationStarters[Math.floor(Math.random() * conversationStarters.length)];
};
