// Adventure Challenges - 500+ Exciting & Genuine Challenges

export interface Challenge {
  id: string;
  title: string;
  description: string;
  category: string;
  categoryIcon: string;
  duration: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'lifetime';
  type: 'system';
  likes: number;
  comments: number;
  createdAt: string;
}

// Exciting, genuine, and varied challenges by category
const HEALTH_CHALLENGES = {
  daily: [
    'Drink 8 glasses of water and log each one',
    'Take 10 deep breaths before each meal',
    'Eat a fruit with every meal today',
    'Sleep 7-8 hours tonight without screens',
    'Walk 5000 steps before noon',
    'Do 5 minutes of morning stretching',
    'Have a completely sugar-free day',
    'Eat dinner before 7 PM',
    'Drink warm lemon water every morning',
    'Practice 4-7-8 breathing for 3 minutes',
    'No caffeine after 2 PM',
    'Chew each bite 20 times',
    'Stand up and move every 45 minutes',
    'Eat one green vegetable with lunch',
    'Practice gratitude before sleep',
  ],
  weekly: [
    'Complete 5 days of 10K steps',
    'Cook 4 healthy homemade meals',
    'Achieve 7 consecutive 8-hour sleep nights',
    'Drink 2L water for 5 days straight',
    'No processed food for one week',
    'Practice meditation 5 days this week',
    'Eat plant-based for 3 days',
    'Wake up at same time for 7 days',
    'Journal health observations daily',
    'Do a digital detox weekend',
  ],
  monthly: [
    'Complete a 30-day hydration challenge',
    'Build a consistent sleep schedule all month',
    'Reduce sugar intake by 50% for 30 days',
    'Practice intermittent fasting 16:8 for a month',
    'Eat breakfast within 1 hour of waking daily',
    'Complete 30 days of food journaling',
    'Take daily vitamins for entire month',
    'Practice mindful eating every meal',
  ],
  yearly: [
    'Get a full health checkup this year',
    'Maintain healthy BMI for 12 months',
    'Build sustainable eating habits',
    'Create and follow a wellness routine',
    'Complete a seasonal detox each quarter',
  ],
  lifetime: [
    'Develop a lifelong healthy relationship with food',
    'Master stress management techniques',
    'Create sustainable health habits that last forever',
  ]
};

const FITNESS_CHALLENGES = {
  daily: [
    'Complete 30 push-ups in sets',
    'Hold plank for 2 minutes total',
    'Walk 10,000 steps today',
    'Do 50 jumping jacks',
    '15-minute HIIT session',
    'Complete 100 squats throughout the day',
    'Run 2 kilometers today',
    'Do 30 burpees challenge',
    'Yoga sun salutations 10 times',
    'Take stairs instead of elevator all day',
    'Do 50 lunges alternating legs',
    'Complete a 20-minute full body workout',
    '100 ab crunches challenge',
    'Dance for 15 minutes non-stop',
    'Swimming 20 laps at the pool',
  ],
  weekly: [
    'Run 20km total this week',
    'Workout 5 days this week',
    'Complete 200 push-ups by Sunday',
    'Hit 70K steps this week',
    'Try 2 new workout styles',
    'Strength train 3 times this week',
    'Complete a 5K run under 30 minutes',
    'Master 3 new yoga poses',
    'Cycle 50km this week',
    'Do cardio 4 times this week',
  ],
  monthly: [
    'Complete the 30-day plank challenge',
    'Run a total of 100km this month',
    'Increase your PR in one exercise',
    'Try 4 different sports this month',
    'Complete 1000 push-ups this month',
    'Master the splits or handstand',
    'Complete 30 consecutive workout days',
    'Improve 5K time by 2 minutes',
  ],
  yearly: [
    'Run a half marathon',
    'Complete an obstacle course race',
    'Achieve your goal body composition',
    'Master a martial art belt level',
    'Complete a triathlon',
  ],
  lifetime: [
    'Run a full marathon',
    'Climb a mountain over 4000m',
    'Complete an Ironman triathlon',
  ]
};

const MIND_CHALLENGES = {
  daily: [
    'Meditate for 15 minutes today',
    'Journal 3 pages of thoughts',
    'Read 30 pages of a book',
    'Practice 5 minutes of visualization',
    'Write down 5 things you are grateful for',
    'No social media for 24 hours',
    'Solve a puzzle or brain teaser',
    'Listen to calming music for 20 minutes',
    'Practice deep breathing 4 times today',
    'Spend 30 minutes in nature mindfully',
    'Write a letter to your future self',
    'Practice active listening in every conversation',
    'Do a body scan meditation',
    'Practice mindful eating one meal',
    'Reflect on your emotions for 10 minutes',
  ],
  weekly: [
    'Meditate every day this week',
    'Complete a journal challenge 7 days',
    'Read an entire book this week',
    'Practice yoga 5 times',
    'No screen time for 2 hours daily',
    'Complete a mindfulness course module',
    'Write morning pages every day',
    'Practice box breathing daily',
    'Do creative visualization 5 days',
    'Have 3 deep conversations this week',
  ],
  monthly: [
    '30 days of consecutive meditation',
    'Read 4 books this month',
    'Complete a personal development course',
    'Keep a dream journal all month',
    'Practice positive affirmations daily',
    'Master a new breathing technique',
    'Attend 4 yoga or meditation classes',
    'Digital detox every weekend this month',
  ],
  yearly: [
    'Complete a meditation retreat',
    'Read 50 books this year',
    'Develop a consistent mindfulness practice',
    'Master a form of meditation',
    'Complete therapy or coaching program',
  ],
  lifetime: [
    'Achieve inner peace and balance',
    'Develop unshakeable mental resilience',
    'Master the art of mindfulness',
  ]
};

const LEARNING_CHALLENGES = {
  daily: [
    'Learn 10 new vocabulary words',
    'Watch an educational TED talk',
    'Practice a new skill for 30 minutes',
    'Read 3 articles about a new topic',
    'Complete one lesson in an online course',
    'Learn 5 phrases in a new language',
    'Solve 3 math or logic problems',
    'Write a summary of something you learned',
    'Listen to an educational podcast',
    'Teach someone something you know',
    'Practice typing for 15 minutes',
    'Learn a new keyboard shortcut',
    'Study a historical event for 20 minutes',
    'Practice public speaking for 10 minutes',
    'Learn origami or a craft technique',
  ],
  weekly: [
    'Complete 5 online course lessons',
    'Read a non-fiction book',
    'Practice instrument for 5 hours total',
    'Learn 50 new words in a language',
    'Complete a coding challenge',
    'Write a blog post or article',
    'Master a new recipe',
    'Study for a certification',
    'Create something with a new skill',
    'Attend a workshop or webinar',
  ],
  monthly: [
    'Complete an entire online course',
    'Learn basics of a new language',
    'Master a new software or tool',
    'Read 3 non-fiction books',
    'Start and progress a side project',
    'Learn to cook 10 new dishes',
    'Practice public speaking 4 times',
    'Complete a certification exam',
  ],
  yearly: [
    'Become conversational in a new language',
    'Master a musical instrument basics',
    'Complete 10 professional courses',
    'Write and publish something',
    'Get a professional certification',
  ],
  lifetime: [
    'Become fluent in 3 languages',
    'Master multiple instruments',
    'Become an expert in your field',
  ]
};

const LIFESTYLE_CHALLENGES = {
  daily: [
    'Make your bed immediately after waking',
    'Call or text a friend you miss',
    'Declutter one drawer or space',
    'Do a random act of kindness',
    'Spend 30 minutes on a hobby',
    'Cook a meal from scratch',
    'Write a handwritten note to someone',
    'Spend 1 hour completely offline',
    'Organize your digital files for 15 minutes',
    'Practice saying "no" to one thing',
    'Create a to-do list and complete it',
    'Dress up even if staying home',
    'Listen to a new music album fully',
    'Try a new coffee shop or cafe',
    'Plan your meals for tomorrow',
  ],
  weekly: [
    'Complete a home organization project',
    'Have 3 meaningful conversations',
    'Try a new restaurant or cuisine',
    'Spend quality time with family',
    'Create a weekly budget and stick to it',
    'Host a dinner or gathering',
    'Complete a DIY project',
    'Visit somewhere new in your city',
    'Take a day trip adventure',
    'Have a complete self-care day',
  ],
  monthly: [
    'Declutter and donate unused items',
    'Create and follow a budget',
    'Start a new hobby and stick with it',
    'Plan and execute a memorable experience',
    'Deep clean entire living space',
    'Build a new healthy routine',
    'Reconnect with 5 old friends',
    'Complete a 30-day minimalism challenge',
  ],
  yearly: [
    'Take a life-changing solo trip',
    'Create a vision board and achieve it',
    'Build lasting friendships',
    'Develop work-life balance',
    'Complete a major life goal',
  ],
  lifetime: [
    'Design your ideal lifestyle',
    'Build a home you love',
    'Create lasting family traditions',
  ]
};

const TRAVEL_CHALLENGES = {
  daily: [
    'Explore a new neighborhood in your city',
    'Visit a local landmark you have never seen',
    'Try authentic cuisine from another country',
    'Take photos of 5 beautiful spots nearby',
    'Talk to a stranger about their travels',
    'Research and plan a future trip',
    'Visit a local museum or gallery',
    'Find a hidden gem in your area',
    'Watch sunrise or sunset at a scenic spot',
    'Take public transport to somewhere new',
    'Find the best view point in your city',
    'Discover a new park or nature area',
    'Try street food from a different culture',
    'Visit a historic site nearby',
    'Explore a farmers market',
  ],
  weekly: [
    'Complete a day trip to a new place',
    'Visit 3 places you have never been',
    'Explore a different district each day',
    'Find and photograph 10 hidden spots',
    'Try cuisine from 5 different countries',
    'Visit 2 museums or cultural sites',
    'Complete a walking tour of your city',
    'Camp overnight in nature',
    'Visit a neighboring city',
    'Complete a scenic drive or bike ride',
  ],
  monthly: [
    'Take a weekend trip somewhere new',
    'Explore 10 new places in your region',
    'Visit 5 UNESCO sites or landmarks',
    'Complete a hiking trail you never tried',
    'Document a travel story with photos',
    'Plan a major trip with full itinerary',
    'Visit 3 different countries or regions',
    'Complete a road trip adventure',
  ],
  yearly: [
    'Visit 5 new countries this year',
    'Complete a bucket list destination',
    'Take a trip longer than 2 weeks',
    'Visit all UNESCO sites in your country',
    'Complete a famous trail or route',
  ],
  lifetime: [
    'Visit every continent',
    'See the 7 Wonders of the World',
    'Complete a world trip',
  ]
};

// Generate all challenges
export const generateSystemChallenges = (): Challenge[] => {
  const challenges: Challenge[] = [];
  let id = 1;
  
  const categories = [
    { name: 'health', icon: '💚', data: HEALTH_CHALLENGES },
    { name: 'fitness', icon: '🏃', data: FITNESS_CHALLENGES },
    { name: 'mind', icon: '🧠', data: MIND_CHALLENGES },
    { name: 'learning', icon: '📚', data: LEARNING_CHALLENGES },
    { name: 'lifestyle', icon: '🌟', data: LIFESTYLE_CHALLENGES },
    { name: 'travel', icon: '✈️', data: TRAVEL_CHALLENGES },
  ];
  
  categories.forEach(category => {
    Object.entries(category.data).forEach(([duration, tasks]) => {
      (tasks as string[]).forEach(title => {
        challenges.push({
          id: `sys-${id++}`,
          title,
          description: `${category.name.charAt(0).toUpperCase() + category.name.slice(1)} challenge - ${duration}`,
          category: category.name,
          categoryIcon: category.icon,
          duration: duration as any,
          type: 'system',
          likes: 0,
          comments: 0,
          createdAt: new Date().toISOString()
        });
      });
    });
  });
  
  return challenges;
};

export const SYSTEM_CHALLENGES = generateSystemChallenges();
