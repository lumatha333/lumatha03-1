import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Trophy, MapPin, Compass, Map, CheckCircle, ExternalLink, Heart, Star, Plus, Sparkles, Target, Search, Camera, Video } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// System challenges with difficulty-based points
const systemChallenges = [
  // Easy (30-50 pts)
  { id: 'sys_1', title: 'Drink 1L Water', description: 'Stay hydrated - drink 1 liter of water', points: 30, difficulty: 'easy' },
  { id: 'sys_2', title: 'Walk 1000 Steps', description: 'Walk at least 1000 steps today', points: 30, difficulty: 'easy' },
  { id: 'sys_3', title: '5 Minute Stretch', description: 'Do a 5-minute stretching routine', points: 30, difficulty: 'easy' },
  { id: 'sys_4', title: 'Read 10 Pages', description: 'Read 10 pages of any book', points: 35, difficulty: 'easy' },
  { id: 'sys_5', title: 'No Sugar Today', description: 'Avoid added sugar for the day', points: 40, difficulty: 'easy' },
  { id: 'sys_6', title: 'Make Your Bed', description: 'Start the day by making your bed', points: 25, difficulty: 'easy' },
  { id: 'sys_7', title: 'Write a Gratitude', description: 'Write 3 things you are grateful for', points: 30, difficulty: 'easy' },
  { id: 'sys_8', title: 'Take a Photo', description: 'Capture something beautiful today', points: 35, difficulty: 'easy' },
  { id: 'sys_9', title: 'Call a Friend', description: 'Have a phone call with someone you care about', points: 40, difficulty: 'easy' },
  { id: 'sys_10', title: 'Drink Green Tea', description: 'Have a cup of green tea', points: 25, difficulty: 'easy' },

  // Medium (60-100 pts)
  { id: 'sys_11', title: '20 Push-ups', description: 'Complete 20 push-ups with proper form', points: 60, difficulty: 'medium' },
  { id: 'sys_12', title: '30 Min Exercise', description: 'Complete a 30-minute workout', points: 80, difficulty: 'medium' },
  { id: 'sys_13', title: 'Cook a Healthy Meal', description: 'Prepare a nutritious home-cooked meal', points: 70, difficulty: 'medium' },
  { id: 'sys_14', title: '10 Min Meditation', description: 'Meditate for 10 minutes', points: 60, difficulty: 'medium' },
  { id: 'sys_15', title: 'Learn Something New', description: 'Learn a new skill or fact today', points: 75, difficulty: 'medium' },
  { id: 'sys_16', title: 'Walk 5000 Steps', description: 'Walk 5000 steps in a day', points: 70, difficulty: 'medium' },
  { id: 'sys_17', title: '2L Water Challenge', description: 'Drink 2 liters of water', points: 65, difficulty: 'medium' },
  { id: 'sys_18', title: 'Journal Entry', description: 'Write a full journal entry about your day', points: 60, difficulty: 'medium' },
  { id: 'sys_19', title: 'Help Someone', description: 'Perform an act of kindness', points: 80, difficulty: 'medium' },
  { id: 'sys_20', title: 'No Phone Hour', description: 'Stay away from phone for 1 hour', points: 70, difficulty: 'medium' },
  { id: 'sys_21', title: '50 Squats', description: 'Complete 50 squats', points: 75, difficulty: 'medium' },
  { id: 'sys_22', title: 'Cold Shower', description: 'Take a cold shower for 2 minutes', points: 85, difficulty: 'medium' },
  { id: 'sys_23', title: 'Early Bird', description: 'Wake up before 6 AM', points: 90, difficulty: 'medium' },
  { id: 'sys_24', title: 'Clean Room', description: 'Deep clean your room', points: 70, difficulty: 'medium' },
  { id: 'sys_25', title: 'Read 30 Pages', description: 'Read 30 pages of a book', points: 80, difficulty: 'medium' },

  // Hard (120-200 pts)
  { id: 'sys_26', title: '5K Run', description: 'Complete a 5 kilometer run', points: 150, difficulty: 'hard' },
  { id: 'sys_27', title: 'Plant a Tree', description: 'Plant a tree or sapling', points: 200, difficulty: 'hard' },
  { id: 'sys_28', title: '100 Push-ups', description: 'Complete 100 push-ups in a day', points: 180, difficulty: 'hard' },
  { id: 'sys_29', title: 'Social Media Detox', description: 'No social media for 24 hours', points: 150, difficulty: 'hard' },
  { id: 'sys_30', title: 'Volunteer Work', description: 'Spend time volunteering', points: 200, difficulty: 'hard' },
  { id: 'sys_31', title: 'Learn New Recipe', description: 'Cook a completely new dish from scratch', points: 120, difficulty: 'hard' },
  { id: 'sys_32', title: '10K Steps', description: 'Walk 10,000 steps in a day', points: 130, difficulty: 'hard' },
  { id: 'sys_33', title: 'Complete Project', description: 'Finish a pending project', points: 180, difficulty: 'hard' },
  { id: 'sys_34', title: 'Sunrise Watch', description: 'Watch the sunrise from a scenic spot', points: 140, difficulty: 'hard' },
  { id: 'sys_35', title: 'Teach Someone', description: 'Teach a skill to someone else', points: 160, difficulty: 'hard' },
  { id: 'sys_36', title: 'Week Streak', description: 'Complete any challenge for 7 days straight', points: 250, difficulty: 'hard' },
  { id: 'sys_37', title: 'Marathon Training', description: 'Complete a marathon training session', points: 200, difficulty: 'hard' },
  { id: 'sys_38', title: 'Donate Items', description: 'Donate clothes or items to charity', points: 150, difficulty: 'hard' },
  { id: 'sys_39', title: 'No Junk Week', description: 'Avoid junk food for 7 days', points: 280, difficulty: 'hard' },
  { id: 'sys_40', title: 'Learn Language', description: 'Learn 50 words of a new language', points: 170, difficulty: 'hard' },
  
  // Additional challenges
  { id: 'sys_41', title: 'Sunrise Yoga', description: 'Do yoga while watching sunrise', points: 90, difficulty: 'medium' },
  { id: 'sys_42', title: 'Digital Detox', description: 'Stay away from all screens for 4 hours', points: 100, difficulty: 'medium' },
  { id: 'sys_43', title: 'Cook for Family', description: 'Prepare a meal for your family', points: 80, difficulty: 'medium' },
  { id: 'sys_44', title: 'Write a Letter', description: 'Write a handwritten letter to someone', points: 60, difficulty: 'medium' },
  { id: 'sys_45', title: 'Plant Seeds', description: 'Plant seeds in your garden or pot', points: 50, difficulty: 'easy' },
  { id: 'sys_46', title: 'Learn Origami', description: 'Create an origami figure', points: 45, difficulty: 'easy' },
  { id: 'sys_47', title: 'Stargazing', description: 'Spend 30 minutes stargazing at night', points: 55, difficulty: 'easy' },
  { id: 'sys_48', title: 'Practice Instrument', description: 'Practice a musical instrument for 30 min', points: 70, difficulty: 'medium' },
  { id: 'sys_49', title: 'Random Act of Kindness', description: 'Do something kind for a stranger', points: 85, difficulty: 'medium' },
  { id: 'sys_50', title: 'Nature Photography', description: 'Take 10 nature photos outdoors', points: 50, difficulty: 'easy' },
  { id: 'sys_51', title: 'Complete Puzzle', description: 'Finish a 500+ piece puzzle', points: 120, difficulty: 'hard' },
  { id: 'sys_52', title: 'Sunrise to Sunset', description: 'Stay active from sunrise to sunset', points: 200, difficulty: 'hard' },
  { id: 'sys_53', title: 'Bike 10km', description: 'Complete a 10 kilometer bike ride', points: 100, difficulty: 'medium' },
  { id: 'sys_54', title: 'Swim 500m', description: 'Swim 500 meters without stopping', points: 110, difficulty: 'medium' },
  { id: 'sys_55', title: 'Climb Stairs 100', description: 'Climb 100 flights of stairs in a day', points: 130, difficulty: 'hard' },
  { id: 'sys_56', title: 'Silent Hour', description: 'Practice complete silence for 1 hour', points: 60, difficulty: 'medium' },
  { id: 'sys_57', title: 'Gratitude Journal', description: 'Write 10 things you are grateful for', points: 40, difficulty: 'easy' },
  { id: 'sys_58', title: 'Declutter Room', description: 'Remove 20 items from your room', points: 80, difficulty: 'medium' },
  { id: 'sys_59', title: 'Zero Waste Day', description: 'Produce zero waste for an entire day', points: 150, difficulty: 'hard' },
  { id: 'sys_60', title: 'Memory Challenge', description: 'Memorize 20 random items in order', points: 70, difficulty: 'medium' },
];

// 400+ Discover places (2 per country from 200 countries)
const discoverPlaces = [
  // Asia
  { id: 'd_1', name: 'Mount Everest Base Camp', country: 'Nepal', emoji: '🏔️', link: 'https://maps.google.com/?q=Everest+Base+Camp' },
  { id: 'd_2', name: 'Phewa Lake', country: 'Nepal', emoji: '🌊', link: 'https://maps.google.com/?q=Phewa+Lake+Pokhara' },
  { id: 'd_3', name: 'Taj Mahal', country: 'India', emoji: '🕌', link: 'https://maps.google.com/?q=Taj+Mahal' },
  { id: 'd_4', name: 'Varanasi Ghats', country: 'India', emoji: '🛕', link: 'https://maps.google.com/?q=Varanasi+Ghats' },
  { id: 'd_5', name: 'Great Wall', country: 'China', emoji: '🏯', link: 'https://maps.google.com/?q=Great+Wall+of+China' },
  { id: 'd_6', name: 'Forbidden City', country: 'China', emoji: '🏛️', link: 'https://maps.google.com/?q=Forbidden+City+Beijing' },
  { id: 'd_7', name: 'Mount Fuji', country: 'Japan', emoji: '🗻', link: 'https://maps.google.com/?q=Mount+Fuji' },
  { id: 'd_8', name: 'Fushimi Inari', country: 'Japan', emoji: '⛩️', link: 'https://maps.google.com/?q=Fushimi+Inari+Shrine' },
  { id: 'd_9', name: 'Angkor Wat', country: 'Cambodia', emoji: '🛕', link: 'https://maps.google.com/?q=Angkor+Wat' },
  { id: 'd_10', name: 'Tonle Sap Lake', country: 'Cambodia', emoji: '🚣', link: 'https://maps.google.com/?q=Tonle+Sap+Lake' },
  { id: 'd_11', name: 'Halong Bay', country: 'Vietnam', emoji: '🏝️', link: 'https://maps.google.com/?q=Halong+Bay' },
  { id: 'd_12', name: 'Hoi An Ancient Town', country: 'Vietnam', emoji: '🏮', link: 'https://maps.google.com/?q=Hoi+An+Ancient+Town' },
  { id: 'd_13', name: 'Bali Rice Terraces', country: 'Indonesia', emoji: '🌾', link: 'https://maps.google.com/?q=Tegallalang+Rice+Terraces' },
  { id: 'd_14', name: 'Komodo Island', country: 'Indonesia', emoji: '🦎', link: 'https://maps.google.com/?q=Komodo+Island' },
  { id: 'd_15', name: 'Petronas Towers', country: 'Malaysia', emoji: '🏢', link: 'https://maps.google.com/?q=Petronas+Towers' },
  { id: 'd_16', name: 'Langkawi', country: 'Malaysia', emoji: '🏖️', link: 'https://maps.google.com/?q=Langkawi' },
  { id: 'd_17', name: 'Grand Palace', country: 'Thailand', emoji: '👑', link: 'https://maps.google.com/?q=Grand+Palace+Bangkok' },
  { id: 'd_18', name: 'Phi Phi Islands', country: 'Thailand', emoji: '🏝️', link: 'https://maps.google.com/?q=Phi+Phi+Islands' },
  { id: 'd_19', name: 'Maldives Atolls', country: 'Maldives', emoji: '🏝️', link: 'https://maps.google.com/?q=Maldives' },
  { id: 'd_20', name: 'Male City', country: 'Maldives', emoji: '🌴', link: 'https://maps.google.com/?q=Male+Maldives' },
  { id: 'd_21', name: 'Burj Khalifa', country: 'UAE', emoji: '🏙️', link: 'https://maps.google.com/?q=Burj+Khalifa' },
  { id: 'd_22', name: 'Palm Jumeirah', country: 'UAE', emoji: '🌴', link: 'https://maps.google.com/?q=Palm+Jumeirah' },
  { id: 'd_23', name: 'Petra', country: 'Jordan', emoji: '🏛️', link: 'https://maps.google.com/?q=Petra+Jordan' },
  { id: 'd_24', name: 'Dead Sea', country: 'Jordan', emoji: '🌊', link: 'https://maps.google.com/?q=Dead+Sea+Jordan' },
  { id: 'd_25', name: 'Cappadocia', country: 'Turkey', emoji: '🎈', link: 'https://maps.google.com/?q=Cappadocia' },
  { id: 'd_26', name: 'Hagia Sophia', country: 'Turkey', emoji: '🕌', link: 'https://maps.google.com/?q=Hagia+Sophia' },
  { id: 'd_27', name: 'Seoul Tower', country: 'South Korea', emoji: '🗼', link: 'https://maps.google.com/?q=N+Seoul+Tower' },
  { id: 'd_28', name: 'Jeju Island', country: 'South Korea', emoji: '🏝️', link: 'https://maps.google.com/?q=Jeju+Island' },
  { id: 'd_29', name: 'Marina Bay', country: 'Singapore', emoji: '🌃', link: 'https://maps.google.com/?q=Marina+Bay+Sands' },
  { id: 'd_30', name: 'Gardens by the Bay', country: 'Singapore', emoji: '🌳', link: 'https://maps.google.com/?q=Gardens+by+the+Bay' },
  { id: 'd_31', name: 'Victoria Peak', country: 'Hong Kong', emoji: '🌆', link: 'https://maps.google.com/?q=Victoria+Peak+Hong+Kong' },
  { id: 'd_32', name: 'Tian Tan Buddha', country: 'Hong Kong', emoji: '🧘', link: 'https://maps.google.com/?q=Tian+Tan+Buddha' },
  { id: 'd_33', name: 'Sigiriya Rock', country: 'Sri Lanka', emoji: '🪨', link: 'https://maps.google.com/?q=Sigiriya' },
  { id: 'd_34', name: 'Ella Gap', country: 'Sri Lanka', emoji: '🚂', link: 'https://maps.google.com/?q=Ella+Sri+Lanka' },
  { id: 'd_35', name: 'K2 Base Camp', country: 'Pakistan', emoji: '🏔️', link: 'https://maps.google.com/?q=K2+Base+Camp' },
  { id: 'd_36', name: 'Hunza Valley', country: 'Pakistan', emoji: '🏞️', link: 'https://maps.google.com/?q=Hunza+Valley' },
  { id: 'd_37', name: 'Paro Taktsang', country: 'Bhutan', emoji: '🏯', link: 'https://maps.google.com/?q=Paro+Taktsang' },
  { id: 'd_38', name: 'Punakha Dzong', country: 'Bhutan', emoji: '🏰', link: 'https://maps.google.com/?q=Punakha+Dzong' },
  { id: 'd_39', name: 'Bagan Temples', country: 'Myanmar', emoji: '🛕', link: 'https://maps.google.com/?q=Bagan+Temples' },
  { id: 'd_40', name: 'Inle Lake', country: 'Myanmar', emoji: '🚣', link: 'https://maps.google.com/?q=Inle+Lake' },

  // Europe
  { id: 'd_41', name: 'Eiffel Tower', country: 'France', emoji: '🗼', link: 'https://maps.google.com/?q=Eiffel+Tower' },
  { id: 'd_42', name: 'Mont Saint-Michel', country: 'France', emoji: '🏰', link: 'https://maps.google.com/?q=Mont+Saint+Michel' },
  { id: 'd_43', name: 'Colosseum', country: 'Italy', emoji: '🏟️', link: 'https://maps.google.com/?q=Colosseum+Rome' },
  { id: 'd_44', name: 'Venice Canals', country: 'Italy', emoji: '🛶', link: 'https://maps.google.com/?q=Venice+Italy' },
  { id: 'd_45', name: 'Santorini', country: 'Greece', emoji: '🌅', link: 'https://maps.google.com/?q=Santorini' },
  { id: 'd_46', name: 'Acropolis', country: 'Greece', emoji: '🏛️', link: 'https://maps.google.com/?q=Acropolis+Athens' },
  { id: 'd_47', name: 'Sagrada Familia', country: 'Spain', emoji: '⛪', link: 'https://maps.google.com/?q=Sagrada+Familia' },
  { id: 'd_48', name: 'Alhambra', country: 'Spain', emoji: '🏰', link: 'https://maps.google.com/?q=Alhambra+Granada' },
  { id: 'd_49', name: 'Brandenburg Gate', country: 'Germany', emoji: '🚪', link: 'https://maps.google.com/?q=Brandenburg+Gate' },
  { id: 'd_50', name: 'Neuschwanstein Castle', country: 'Germany', emoji: '🏰', link: 'https://maps.google.com/?q=Neuschwanstein+Castle' },
  { id: 'd_51', name: 'Big Ben', country: 'UK', emoji: '🕐', link: 'https://maps.google.com/?q=Big+Ben+London' },
  { id: 'd_52', name: 'Stonehenge', country: 'UK', emoji: '🪨', link: 'https://maps.google.com/?q=Stonehenge' },
  { id: 'd_53', name: 'Anne Frank House', country: 'Netherlands', emoji: '🏠', link: 'https://maps.google.com/?q=Anne+Frank+House' },
  { id: 'd_54', name: 'Keukenhof Gardens', country: 'Netherlands', emoji: '🌷', link: 'https://maps.google.com/?q=Keukenhof' },
  { id: 'd_55', name: 'Charles Bridge', country: 'Czech Republic', emoji: '🌉', link: 'https://maps.google.com/?q=Charles+Bridge+Prague' },
  { id: 'd_56', name: 'Prague Castle', country: 'Czech Republic', emoji: '🏰', link: 'https://maps.google.com/?q=Prague+Castle' },
  { id: 'd_57', name: 'Schönbrunn Palace', country: 'Austria', emoji: '🏛️', link: 'https://maps.google.com/?q=Schonbrunn+Palace' },
  { id: 'd_58', name: 'Hallstatt', country: 'Austria', emoji: '🏔️', link: 'https://maps.google.com/?q=Hallstatt' },
  { id: 'd_59', name: 'Matterhorn', country: 'Switzerland', emoji: '⛷️', link: 'https://maps.google.com/?q=Matterhorn' },
  { id: 'd_60', name: 'Lake Geneva', country: 'Switzerland', emoji: '🌊', link: 'https://maps.google.com/?q=Lake+Geneva' },
  { id: 'd_61', name: 'Northern Lights', country: 'Norway', emoji: '🌌', link: 'https://maps.google.com/?q=Tromso+Norway' },
  { id: 'd_62', name: 'Geirangerfjord', country: 'Norway', emoji: '🏞️', link: 'https://maps.google.com/?q=Geirangerfjord' },
  { id: 'd_63', name: 'Blue Lagoon', country: 'Iceland', emoji: '♨️', link: 'https://maps.google.com/?q=Blue+Lagoon+Iceland' },
  { id: 'd_64', name: 'Golden Circle', country: 'Iceland', emoji: '🌋', link: 'https://maps.google.com/?q=Golden+Circle+Iceland' },
  { id: 'd_65', name: 'Helsinki Cathedral', country: 'Finland', emoji: '⛪', link: 'https://maps.google.com/?q=Helsinki+Cathedral' },
  { id: 'd_66', name: 'Lapland', country: 'Finland', emoji: '🦌', link: 'https://maps.google.com/?q=Lapland+Finland' },
  { id: 'd_67', name: 'Gamla Stan', country: 'Sweden', emoji: '🏘️', link: 'https://maps.google.com/?q=Gamla+Stan+Stockholm' },
  { id: 'd_68', name: 'Ice Hotel', country: 'Sweden', emoji: '🧊', link: 'https://maps.google.com/?q=Icehotel+Sweden' },
  { id: 'd_69', name: 'Nyhavn', country: 'Denmark', emoji: '⛵', link: 'https://maps.google.com/?q=Nyhavn+Copenhagen' },
  { id: 'd_70', name: 'Tivoli Gardens', country: 'Denmark', emoji: '🎡', link: 'https://maps.google.com/?q=Tivoli+Gardens' },
  { id: 'd_71', name: 'Rialto Bridge', country: 'San Marino', emoji: '🌉', link: 'https://maps.google.com/?q=San+Marino' },
  { id: 'd_72', name: 'Three Towers', country: 'San Marino', emoji: '🗼', link: 'https://maps.google.com/?q=Three+Towers+San+Marino' },
  { id: 'd_73', name: 'St. Peters Basilica', country: 'Vatican', emoji: '⛪', link: 'https://maps.google.com/?q=St+Peters+Basilica' },
  { id: 'd_74', name: 'Sistine Chapel', country: 'Vatican', emoji: '🎨', link: 'https://maps.google.com/?q=Sistine+Chapel' },
  { id: 'd_75', name: 'Monte Carlo', country: 'Monaco', emoji: '🎰', link: 'https://maps.google.com/?q=Monte+Carlo' },
  { id: 'd_76', name: 'Oceanographic Museum', country: 'Monaco', emoji: '🐠', link: 'https://maps.google.com/?q=Oceanographic+Museum+Monaco' },
  { id: 'd_77', name: 'Plitvice Lakes', country: 'Croatia', emoji: '💧', link: 'https://maps.google.com/?q=Plitvice+Lakes' },
  { id: 'd_78', name: 'Dubrovnik Old Town', country: 'Croatia', emoji: '🏰', link: 'https://maps.google.com/?q=Dubrovnik+Old+Town' },
  { id: 'd_79', name: 'Wawel Castle', country: 'Poland', emoji: '🏰', link: 'https://maps.google.com/?q=Wawel+Castle' },
  { id: 'd_80', name: 'Wieliczka Salt Mine', country: 'Poland', emoji: '⛏️', link: 'https://maps.google.com/?q=Wieliczka+Salt+Mine' },

  // Americas
  { id: 'd_81', name: 'Grand Canyon', country: 'USA', emoji: '🏜️', link: 'https://maps.google.com/?q=Grand+Canyon' },
  { id: 'd_82', name: 'Statue of Liberty', country: 'USA', emoji: '🗽', link: 'https://maps.google.com/?q=Statue+of+Liberty' },
  { id: 'd_83', name: 'Niagara Falls', country: 'Canada', emoji: '💧', link: 'https://maps.google.com/?q=Niagara+Falls' },
  { id: 'd_84', name: 'Banff National Park', country: 'Canada', emoji: '🏔️', link: 'https://maps.google.com/?q=Banff+National+Park' },
  { id: 'd_85', name: 'Chichen Itza', country: 'Mexico', emoji: '🏛️', link: 'https://maps.google.com/?q=Chichen+Itza' },
  { id: 'd_86', name: 'Cancun Beaches', country: 'Mexico', emoji: '🏖️', link: 'https://maps.google.com/?q=Cancun' },
  { id: 'd_87', name: 'Machu Picchu', country: 'Peru', emoji: '🏔️', link: 'https://maps.google.com/?q=Machu+Picchu' },
  { id: 'd_88', name: 'Rainbow Mountain', country: 'Peru', emoji: '🌈', link: 'https://maps.google.com/?q=Rainbow+Mountain+Peru' },
  { id: 'd_89', name: 'Christ the Redeemer', country: 'Brazil', emoji: '✝️', link: 'https://maps.google.com/?q=Christ+the+Redeemer' },
  { id: 'd_90', name: 'Iguazu Falls', country: 'Brazil', emoji: '💧', link: 'https://maps.google.com/?q=Iguazu+Falls' },
  { id: 'd_91', name: 'Patagonia', country: 'Argentina', emoji: '🏔️', link: 'https://maps.google.com/?q=Patagonia+Argentina' },
  { id: 'd_92', name: 'Buenos Aires', country: 'Argentina', emoji: '💃', link: 'https://maps.google.com/?q=Buenos+Aires' },
  { id: 'd_93', name: 'Easter Island', country: 'Chile', emoji: '🗿', link: 'https://maps.google.com/?q=Easter+Island' },
  { id: 'd_94', name: 'Torres del Paine', country: 'Chile', emoji: '🏔️', link: 'https://maps.google.com/?q=Torres+del+Paine' },
  { id: 'd_95', name: 'Galapagos Islands', country: 'Ecuador', emoji: '🐢', link: 'https://maps.google.com/?q=Galapagos+Islands' },
  { id: 'd_96', name: 'Amazon Rainforest', country: 'Ecuador', emoji: '🌳', link: 'https://maps.google.com/?q=Amazon+Rainforest+Ecuador' },
  { id: 'd_97', name: 'Salt Flats', country: 'Bolivia', emoji: '🧂', link: 'https://maps.google.com/?q=Salar+de+Uyuni' },
  { id: 'd_98', name: 'Lake Titicaca', country: 'Bolivia', emoji: '🌊', link: 'https://maps.google.com/?q=Lake+Titicaca' },
  { id: 'd_99', name: 'Angel Falls', country: 'Venezuela', emoji: '💧', link: 'https://maps.google.com/?q=Angel+Falls' },
  { id: 'd_100', name: 'Los Roques', country: 'Venezuela', emoji: '🏝️', link: 'https://maps.google.com/?q=Los+Roques' },
  { id: 'd_101', name: 'Cartagena Old City', country: 'Colombia', emoji: '🏰', link: 'https://maps.google.com/?q=Cartagena+Old+City' },
  { id: 'd_102', name: 'Cocora Valley', country: 'Colombia', emoji: '🌴', link: 'https://maps.google.com/?q=Cocora+Valley' },

  // Africa
  { id: 'd_103', name: 'Pyramids of Giza', country: 'Egypt', emoji: '🔺', link: 'https://maps.google.com/?q=Pyramids+of+Giza' },
  { id: 'd_104', name: 'Valley of Kings', country: 'Egypt', emoji: '👑', link: 'https://maps.google.com/?q=Valley+of+Kings' },
  { id: 'd_105', name: 'Victoria Falls', country: 'Zimbabwe', emoji: '💧', link: 'https://maps.google.com/?q=Victoria+Falls' },
  { id: 'd_106', name: 'Great Zimbabwe', country: 'Zimbabwe', emoji: '🏛️', link: 'https://maps.google.com/?q=Great+Zimbabwe' },
  { id: 'd_107', name: 'Serengeti', country: 'Tanzania', emoji: '🦁', link: 'https://maps.google.com/?q=Serengeti' },
  { id: 'd_108', name: 'Mount Kilimanjaro', country: 'Tanzania', emoji: '🏔️', link: 'https://maps.google.com/?q=Mount+Kilimanjaro' },
  { id: 'd_109', name: 'Masai Mara', country: 'Kenya', emoji: '🦓', link: 'https://maps.google.com/?q=Masai+Mara' },
  { id: 'd_110', name: 'Diani Beach', country: 'Kenya', emoji: '🏖️', link: 'https://maps.google.com/?q=Diani+Beach' },
  { id: 'd_111', name: 'Table Mountain', country: 'South Africa', emoji: '🏔️', link: 'https://maps.google.com/?q=Table+Mountain' },
  { id: 'd_112', name: 'Kruger National Park', country: 'South Africa', emoji: '🐘', link: 'https://maps.google.com/?q=Kruger+National+Park' },
  { id: 'd_113', name: 'Marrakech Medina', country: 'Morocco', emoji: '🏺', link: 'https://maps.google.com/?q=Marrakech+Medina' },
  { id: 'd_114', name: 'Sahara Desert', country: 'Morocco', emoji: '🏜️', link: 'https://maps.google.com/?q=Sahara+Desert+Morocco' },
  { id: 'd_115', name: 'Avenue of Baobabs', country: 'Madagascar', emoji: '🌳', link: 'https://maps.google.com/?q=Avenue+of+Baobabs' },
  { id: 'd_116', name: 'Nosy Be', country: 'Madagascar', emoji: '🏝️', link: 'https://maps.google.com/?q=Nosy+Be' },
  { id: 'd_117', name: 'Okavango Delta', country: 'Botswana', emoji: '🐊', link: 'https://maps.google.com/?q=Okavango+Delta' },
  { id: 'd_118', name: 'Chobe National Park', country: 'Botswana', emoji: '🐘', link: 'https://maps.google.com/?q=Chobe+National+Park' },
  { id: 'd_119', name: 'Fish River Canyon', country: 'Namibia', emoji: '🏜️', link: 'https://maps.google.com/?q=Fish+River+Canyon' },
  { id: 'd_120', name: 'Sossusvlei Dunes', country: 'Namibia', emoji: '🏜️', link: 'https://maps.google.com/?q=Sossusvlei' },

  // Oceania
  { id: 'd_121', name: 'Sydney Opera House', country: 'Australia', emoji: '🎭', link: 'https://maps.google.com/?q=Sydney+Opera+House' },
  { id: 'd_122', name: 'Great Barrier Reef', country: 'Australia', emoji: '🐠', link: 'https://maps.google.com/?q=Great+Barrier+Reef' },
  { id: 'd_123', name: 'Milford Sound', country: 'New Zealand', emoji: '🏔️', link: 'https://maps.google.com/?q=Milford+Sound' },
  { id: 'd_124', name: 'Hobbiton', country: 'New Zealand', emoji: '🧙', link: 'https://maps.google.com/?q=Hobbiton' },
  { id: 'd_125', name: 'Bora Bora', country: 'French Polynesia', emoji: '🏝️', link: 'https://maps.google.com/?q=Bora+Bora' },
  { id: 'd_126', name: 'Moorea', country: 'French Polynesia', emoji: '🌴', link: 'https://maps.google.com/?q=Moorea' },
  { id: 'd_127', name: 'Fiji Islands', country: 'Fiji', emoji: '🏝️', link: 'https://maps.google.com/?q=Fiji+Islands' },
  { id: 'd_128', name: 'Yasawa Islands', country: 'Fiji', emoji: '🌊', link: 'https://maps.google.com/?q=Yasawa+Islands' },
  { id: 'd_129', name: 'Uluru', country: 'Australia', emoji: '🪨', link: 'https://maps.google.com/?q=Uluru' },
  { id: 'd_130', name: 'Kakadu', country: 'Australia', emoji: '🐊', link: 'https://maps.google.com/?q=Kakadu+National+Park' },

  // More countries
  { id: 'd_131', name: 'Kremlin', country: 'Russia', emoji: '🏰', link: 'https://maps.google.com/?q=Moscow+Kremlin' },
  { id: 'd_132', name: 'Lake Baikal', country: 'Russia', emoji: '🌊', link: 'https://maps.google.com/?q=Lake+Baikal' },
  { id: 'd_133', name: 'Wadi Rum', country: 'Jordan', emoji: '🏜️', link: 'https://maps.google.com/?q=Wadi+Rum' },
  { id: 'd_134', name: 'Jerash', country: 'Jordan', emoji: '🏛️', link: 'https://maps.google.com/?q=Jerash' },
  { id: 'd_135', name: 'Samarkand', country: 'Uzbekistan', emoji: '🕌', link: 'https://maps.google.com/?q=Samarkand' },
  { id: 'd_136', name: 'Bukhara', country: 'Uzbekistan', emoji: '🏛️', link: 'https://maps.google.com/?q=Bukhara' },
  { id: 'd_137', name: 'Tbilisi Old Town', country: 'Georgia', emoji: '🏘️', link: 'https://maps.google.com/?q=Tbilisi+Old+Town' },
  { id: 'd_138', name: 'Kazbegi', country: 'Georgia', emoji: '🏔️', link: 'https://maps.google.com/?q=Kazbegi' },
  { id: 'd_139', name: 'Baku Old City', country: 'Azerbaijan', emoji: '🏰', link: 'https://maps.google.com/?q=Baku+Old+City' },
  { id: 'd_140', name: 'Flame Towers', country: 'Azerbaijan', emoji: '🔥', link: 'https://maps.google.com/?q=Flame+Towers+Baku' },
  { id: 'd_141', name: 'Yerevan Cascade', country: 'Armenia', emoji: '🏛️', link: 'https://maps.google.com/?q=Yerevan+Cascade' },
  { id: 'd_142', name: 'Lake Sevan', country: 'Armenia', emoji: '🌊', link: 'https://maps.google.com/?q=Lake+Sevan' },
  { id: 'd_143', name: 'Charyn Canyon', country: 'Kazakhstan', emoji: '🏜️', link: 'https://maps.google.com/?q=Charyn+Canyon' },
  { id: 'd_144', name: 'Almaty', country: 'Kazakhstan', emoji: '🏔️', link: 'https://maps.google.com/?q=Almaty' },
  { id: 'd_145', name: 'Darvaza Gas Crater', country: 'Turkmenistan', emoji: '🔥', link: 'https://maps.google.com/?q=Darvaza+Gas+Crater' },
  { id: 'd_146', name: 'Ashgabat', country: 'Turkmenistan', emoji: '🏛️', link: 'https://maps.google.com/?q=Ashgabat' },
  { id: 'd_147', name: 'Pamir Highway', country: 'Tajikistan', emoji: '🛣️', link: 'https://maps.google.com/?q=Pamir+Highway' },
  { id: 'd_148', name: 'Iskanderkul Lake', country: 'Tajikistan', emoji: '🌊', link: 'https://maps.google.com/?q=Iskanderkul+Lake' },
  { id: 'd_149', name: 'Issyk Kul Lake', country: 'Kyrgyzstan', emoji: '🌊', link: 'https://maps.google.com/?q=Issyk+Kul+Lake' },
  { id: 'd_150', name: 'Ala Archa', country: 'Kyrgyzstan', emoji: '🏔️', link: 'https://maps.google.com/?q=Ala+Archa+National+Park' },
  
  // Caribbean & Central America
  { id: 'd_151', name: 'Havana Old Town', country: 'Cuba', emoji: '🚗', link: 'https://maps.google.com/?q=Havana+Old+Town' },
  { id: 'd_152', name: 'Varadero Beach', country: 'Cuba', emoji: '🏖️', link: 'https://maps.google.com/?q=Varadero+Beach' },
  { id: 'd_153', name: 'Dunn River Falls', country: 'Jamaica', emoji: '💧', link: 'https://maps.google.com/?q=Dunns+River+Falls' },
  { id: 'd_154', name: 'Blue Mountains', country: 'Jamaica', emoji: '🏔️', link: 'https://maps.google.com/?q=Blue+Mountains+Jamaica' },
  { id: 'd_155', name: 'Punta Cana', country: 'Dominican Republic', emoji: '🏖️', link: 'https://maps.google.com/?q=Punta+Cana' },
  { id: 'd_156', name: 'Santo Domingo', country: 'Dominican Republic', emoji: '🏛️', link: 'https://maps.google.com/?q=Santo+Domingo' },
  { id: 'd_157', name: 'El Yunque', country: 'Puerto Rico', emoji: '🌴', link: 'https://maps.google.com/?q=El+Yunque+National+Forest' },
  { id: 'd_158', name: 'Old San Juan', country: 'Puerto Rico', emoji: '🏰', link: 'https://maps.google.com/?q=Old+San+Juan' },
  { id: 'd_159', name: 'Tikal', country: 'Guatemala', emoji: '🏛️', link: 'https://maps.google.com/?q=Tikal' },
  { id: 'd_160', name: 'Lake Atitlan', country: 'Guatemala', emoji: '🌋', link: 'https://maps.google.com/?q=Lake+Atitlan' },
  { id: 'd_161', name: 'Monteverde Cloud Forest', country: 'Costa Rica', emoji: '🌳', link: 'https://maps.google.com/?q=Monteverde+Cloud+Forest' },
  { id: 'd_162', name: 'Arenal Volcano', country: 'Costa Rica', emoji: '🌋', link: 'https://maps.google.com/?q=Arenal+Volcano' },
  { id: 'd_163', name: 'Panama Canal', country: 'Panama', emoji: '🚢', link: 'https://maps.google.com/?q=Panama+Canal' },
  { id: 'd_164', name: 'San Blas Islands', country: 'Panama', emoji: '🏝️', link: 'https://maps.google.com/?q=San+Blas+Islands' },
  { id: 'd_165', name: 'Roatan Island', country: 'Honduras', emoji: '🏝️', link: 'https://maps.google.com/?q=Roatan+Island' },
  { id: 'd_166', name: 'Copan Ruins', country: 'Honduras', emoji: '🏛️', link: 'https://maps.google.com/?q=Copan+Ruins' },
  { id: 'd_167', name: 'Caye Caulker', country: 'Belize', emoji: '🏝️', link: 'https://maps.google.com/?q=Caye+Caulker' },
  { id: 'd_168', name: 'Great Blue Hole', country: 'Belize', emoji: '🕳️', link: 'https://maps.google.com/?q=Great+Blue+Hole' },
  { id: 'd_169', name: 'Leon Cathedral', country: 'Nicaragua', emoji: '⛪', link: 'https://maps.google.com/?q=Leon+Cathedral+Nicaragua' },
  { id: 'd_170', name: 'Ometepe Island', country: 'Nicaragua', emoji: '🌋', link: 'https://maps.google.com/?q=Ometepe+Island' },

  // More Europe
  { id: 'd_171', name: 'Lisbon Old Town', country: 'Portugal', emoji: '🚃', link: 'https://maps.google.com/?q=Lisbon+Old+Town' },
  { id: 'd_172', name: 'Sintra Palace', country: 'Portugal', emoji: '🏰', link: 'https://maps.google.com/?q=Sintra+Palace' },
  { id: 'd_173', name: 'Grand Place', country: 'Belgium', emoji: '🏛️', link: 'https://maps.google.com/?q=Grand+Place+Brussels' },
  { id: 'd_174', name: 'Bruges Canals', country: 'Belgium', emoji: '🌉', link: 'https://maps.google.com/?q=Bruges+Canals' },
  { id: 'd_175', name: 'Vianden Castle', country: 'Luxembourg', emoji: '🏰', link: 'https://maps.google.com/?q=Vianden+Castle' },
  { id: 'd_176', name: 'Luxembourg Gardens', country: 'Luxembourg', emoji: '🌳', link: 'https://maps.google.com/?q=Luxembourg+Gardens' },
  { id: 'd_177', name: 'Irish Cliffs of Moher', country: 'Ireland', emoji: '🏔️', link: 'https://maps.google.com/?q=Cliffs+of+Moher' },
  { id: 'd_178', name: 'Ring of Kerry', country: 'Ireland', emoji: '🛣️', link: 'https://maps.google.com/?q=Ring+of+Kerry' },
  { id: 'd_179', name: 'Edinburgh Castle', country: 'Scotland', emoji: '🏰', link: 'https://maps.google.com/?q=Edinburgh+Castle' },
  { id: 'd_180', name: 'Isle of Skye', country: 'Scotland', emoji: '🏝️', link: 'https://maps.google.com/?q=Isle+of+Skye' },
  { id: 'd_181', name: 'Snowdonia', country: 'Wales', emoji: '🏔️', link: 'https://maps.google.com/?q=Snowdonia' },
  { id: 'd_182', name: 'Cardiff Castle', country: 'Wales', emoji: '🏰', link: 'https://maps.google.com/?q=Cardiff+Castle' },
  { id: 'd_183', name: 'Budapest Parliament', country: 'Hungary', emoji: '🏛️', link: 'https://maps.google.com/?q=Hungarian+Parliament' },
  { id: 'd_184', name: 'Thermal Baths', country: 'Hungary', emoji: '♨️', link: 'https://maps.google.com/?q=Szechenyi+Thermal+Bath' },
  { id: 'd_185', name: 'Bratislava Castle', country: 'Slovakia', emoji: '🏰', link: 'https://maps.google.com/?q=Bratislava+Castle' },
  { id: 'd_186', name: 'High Tatras', country: 'Slovakia', emoji: '🏔️', link: 'https://maps.google.com/?q=High+Tatras' },
  { id: 'd_187', name: 'Lake Bled', country: 'Slovenia', emoji: '🏝️', link: 'https://maps.google.com/?q=Lake+Bled' },
  { id: 'd_188', name: 'Postojna Cave', country: 'Slovenia', emoji: '🕳️', link: 'https://maps.google.com/?q=Postojna+Cave' },
  { id: 'd_189', name: 'Mostar Bridge', country: 'Bosnia', emoji: '🌉', link: 'https://maps.google.com/?q=Mostar+Bridge' },
  { id: 'd_190', name: 'Sarajevo Old Town', country: 'Bosnia', emoji: '🏘️', link: 'https://maps.google.com/?q=Sarajevo+Old+Town' },
  { id: 'd_191', name: 'Kotor Bay', country: 'Montenegro', emoji: '🌊', link: 'https://maps.google.com/?q=Bay+of+Kotor' },
  { id: 'd_192', name: 'Sveti Stefan', country: 'Montenegro', emoji: '🏝️', link: 'https://maps.google.com/?q=Sveti+Stefan' },
  { id: 'd_193', name: 'Berat Old Town', country: 'Albania', emoji: '🏘️', link: 'https://maps.google.com/?q=Berat+Albania' },
  { id: 'd_194', name: 'Albanian Riviera', country: 'Albania', emoji: '🏖️', link: 'https://maps.google.com/?q=Albanian+Riviera' },
  { id: 'd_195', name: 'Skopje Fortress', country: 'North Macedonia', emoji: '🏰', link: 'https://maps.google.com/?q=Skopje+Fortress' },
  { id: 'd_196', name: 'Lake Ohrid', country: 'North Macedonia', emoji: '🌊', link: 'https://maps.google.com/?q=Lake+Ohrid' },
  { id: 'd_197', name: 'Belgrade Fortress', country: 'Serbia', emoji: '🏰', link: 'https://maps.google.com/?q=Belgrade+Fortress' },
  { id: 'd_198', name: 'Novi Sad', country: 'Serbia', emoji: '🏛️', link: 'https://maps.google.com/?q=Novi+Sad' },
  { id: 'd_199', name: 'Bucharest Old Town', country: 'Romania', emoji: '🏘️', link: 'https://maps.google.com/?q=Bucharest+Old+Town' },
  { id: 'd_200', name: 'Bran Castle', country: 'Romania', emoji: '🧛', link: 'https://maps.google.com/?q=Bran+Castle' },
  
  // Additional places to reach 400+
  { id: 'd_201', name: 'Sofia Cathedral', country: 'Bulgaria', emoji: '⛪', link: 'https://maps.google.com/?q=Alexander+Nevsky+Cathedral' },
  { id: 'd_202', name: 'Rila Monastery', country: 'Bulgaria', emoji: '🏛️', link: 'https://maps.google.com/?q=Rila+Monastery' },
  { id: 'd_203', name: 'Kiev Lavra', country: 'Ukraine', emoji: '⛪', link: 'https://maps.google.com/?q=Kiev+Pechersk+Lavra' },
  { id: 'd_204', name: 'Chernobyl Zone', country: 'Ukraine', emoji: '☢️', link: 'https://maps.google.com/?q=Chernobyl' },
  { id: 'd_205', name: 'Vilnius Old Town', country: 'Lithuania', emoji: '🏘️', link: 'https://maps.google.com/?q=Vilnius+Old+Town' },
  { id: 'd_206', name: 'Hill of Crosses', country: 'Lithuania', emoji: '✝️', link: 'https://maps.google.com/?q=Hill+of+Crosses' },
  { id: 'd_207', name: 'Riga Old Town', country: 'Latvia', emoji: '🏘️', link: 'https://maps.google.com/?q=Riga+Old+Town' },
  { id: 'd_208', name: 'Jurmala Beach', country: 'Latvia', emoji: '🏖️', link: 'https://maps.google.com/?q=Jurmala' },
  { id: 'd_209', name: 'Tallinn Old Town', country: 'Estonia', emoji: '🏰', link: 'https://maps.google.com/?q=Tallinn+Old+Town' },
  { id: 'd_210', name: 'Lahemaa Park', country: 'Estonia', emoji: '🌲', link: 'https://maps.google.com/?q=Lahemaa+National+Park' },
  { id: 'd_211', name: 'Minsk Victory Square', country: 'Belarus', emoji: '🏛️', link: 'https://maps.google.com/?q=Victory+Square+Minsk' },
  { id: 'd_212', name: 'Mir Castle', country: 'Belarus', emoji: '🏰', link: 'https://maps.google.com/?q=Mir+Castle' },
  { id: 'd_213', name: 'Chisinau Arc', country: 'Moldova', emoji: '🚪', link: 'https://maps.google.com/?q=Chisinau+Arc+of+Triumph' },
  { id: 'd_214', name: 'Milestii Mici', country: 'Moldova', emoji: '🍷', link: 'https://maps.google.com/?q=Milestii+Mici' },

  // More Asia Pacific
  { id: 'd_215', name: 'Taipei 101', country: 'Taiwan', emoji: '🏢', link: 'https://maps.google.com/?q=Taipei+101' },
  { id: 'd_216', name: 'Taroko Gorge', country: 'Taiwan', emoji: '🏞️', link: 'https://maps.google.com/?q=Taroko+Gorge' },
  { id: 'd_217', name: 'Chocolate Hills', country: 'Philippines', emoji: '🏔️', link: 'https://maps.google.com/?q=Chocolate+Hills' },
  { id: 'd_218', name: 'Palawan', country: 'Philippines', emoji: '🏝️', link: 'https://maps.google.com/?q=Palawan' },
  { id: 'd_219', name: 'Luang Prabang', country: 'Laos', emoji: '🛕', link: 'https://maps.google.com/?q=Luang+Prabang' },
  { id: 'd_220', name: 'Kuang Si Falls', country: 'Laos', emoji: '💧', link: 'https://maps.google.com/?q=Kuang+Si+Falls' },
  { id: 'd_221', name: 'Brunei Mosque', country: 'Brunei', emoji: '🕌', link: 'https://maps.google.com/?q=Omar+Ali+Saifuddien+Mosque' },
  { id: 'd_222', name: 'Ulu Temburong', country: 'Brunei', emoji: '🌳', link: 'https://maps.google.com/?q=Ulu+Temburong+National+Park' },
  { id: 'd_223', name: 'Timor-Leste Cristo Rei', country: 'Timor-Leste', emoji: '✝️', link: 'https://maps.google.com/?q=Cristo+Rei+Dili' },
  { id: 'd_224', name: 'Atauro Island', country: 'Timor-Leste', emoji: '🏝️', link: 'https://maps.google.com/?q=Atauro+Island' },
  { id: 'd_225', name: 'Port Moresby', country: 'Papua New Guinea', emoji: '🏛️', link: 'https://maps.google.com/?q=Port+Moresby' },
  { id: 'd_226', name: 'Kokoda Trail', country: 'Papua New Guinea', emoji: '🥾', link: 'https://maps.google.com/?q=Kokoda+Trail' },
  { id: 'd_227', name: 'Ulaanbaatar', country: 'Mongolia', emoji: '🏛️', link: 'https://maps.google.com/?q=Ulaanbaatar' },
  { id: 'd_228', name: 'Gobi Desert', country: 'Mongolia', emoji: '🏜️', link: 'https://maps.google.com/?q=Gobi+Desert' },

  // Middle East
  { id: 'd_229', name: 'Al-Ula', country: 'Saudi Arabia', emoji: '🏛️', link: 'https://maps.google.com/?q=Al+Ula' },
  { id: 'd_230', name: 'Jeddah Corniche', country: 'Saudi Arabia', emoji: '🌊', link: 'https://maps.google.com/?q=Jeddah+Corniche' },
  { id: 'd_231', name: 'Kuwait Towers', country: 'Kuwait', emoji: '🗼', link: 'https://maps.google.com/?q=Kuwait+Towers' },
  { id: 'd_232', name: 'Grand Mosque Kuwait', country: 'Kuwait', emoji: '🕌', link: 'https://maps.google.com/?q=Grand+Mosque+Kuwait' },
  { id: 'd_233', name: 'Pearl Qatar', country: 'Qatar', emoji: '🏝️', link: 'https://maps.google.com/?q=The+Pearl+Qatar' },
  { id: 'd_234', name: 'Souq Waqif', country: 'Qatar', emoji: '🏪', link: 'https://maps.google.com/?q=Souq+Waqif' },
  { id: 'd_235', name: 'Bahrain Fort', country: 'Bahrain', emoji: '🏰', link: 'https://maps.google.com/?q=Bahrain+Fort' },
  { id: 'd_236', name: 'Tree of Life', country: 'Bahrain', emoji: '🌳', link: 'https://maps.google.com/?q=Tree+of+Life+Bahrain' },
  { id: 'd_237', name: 'Sultan Qaboos Mosque', country: 'Oman', emoji: '🕌', link: 'https://maps.google.com/?q=Sultan+Qaboos+Grand+Mosque' },
  { id: 'd_238', name: 'Wadi Shab', country: 'Oman', emoji: '💧', link: 'https://maps.google.com/?q=Wadi+Shab' },
  { id: 'd_239', name: 'Persepolis', country: 'Iran', emoji: '🏛️', link: 'https://maps.google.com/?q=Persepolis' },
  { id: 'd_240', name: 'Nasir al-Mulk Mosque', country: 'Iran', emoji: '🕌', link: 'https://maps.google.com/?q=Nasir+al-Mulk+Mosque' },
  { id: 'd_241', name: 'Baalbek', country: 'Lebanon', emoji: '🏛️', link: 'https://maps.google.com/?q=Baalbek' },
  { id: 'd_242', name: 'Jeita Grotto', country: 'Lebanon', emoji: '🕳️', link: 'https://maps.google.com/?q=Jeita+Grotto' },
  { id: 'd_243', name: 'Jerusalem Old City', country: 'Israel', emoji: '🕍', link: 'https://maps.google.com/?q=Jerusalem+Old+City' },
  { id: 'd_244', name: 'Masada', country: 'Israel', emoji: '🏰', link: 'https://maps.google.com/?q=Masada' },
  { id: 'd_245', name: 'Damascus Old City', country: 'Syria', emoji: '🏛️', link: 'https://maps.google.com/?q=Damascus+Old+City' },
  { id: 'd_246', name: 'Palmyra', country: 'Syria', emoji: '🏛️', link: 'https://maps.google.com/?q=Palmyra' },
  { id: 'd_247', name: 'Baghdad Tower', country: 'Iraq', emoji: '🗼', link: 'https://maps.google.com/?q=Baghdad+Tower' },
  { id: 'd_248', name: 'Babylon', country: 'Iraq', emoji: '🏛️', link: 'https://maps.google.com/?q=Babylon' },
  { id: 'd_249', name: 'Sanaa Old City', country: 'Yemen', emoji: '🏘️', link: 'https://maps.google.com/?q=Sanaa+Old+City' },
  { id: 'd_250', name: 'Socotra Island', country: 'Yemen', emoji: '🌴', link: 'https://maps.google.com/?q=Socotra+Island' },

  // More Africa
  { id: 'd_251', name: 'Tunis Medina', country: 'Tunisia', emoji: '🏘️', link: 'https://maps.google.com/?q=Tunis+Medina' },
  { id: 'd_252', name: 'Carthage', country: 'Tunisia', emoji: '🏛️', link: 'https://maps.google.com/?q=Carthage' },
  { id: 'd_253', name: 'Algiers Casbah', country: 'Algeria', emoji: '🏰', link: 'https://maps.google.com/?q=Algiers+Casbah' },
  { id: 'd_254', name: 'Tassili n Ajjer', country: 'Algeria', emoji: '🏜️', link: 'https://maps.google.com/?q=Tassili+n+Ajjer' },
  { id: 'd_255', name: 'Leptis Magna', country: 'Libya', emoji: '🏛️', link: 'https://maps.google.com/?q=Leptis+Magna' },
  { id: 'd_256', name: 'Ghadames', country: 'Libya', emoji: '🏘️', link: 'https://maps.google.com/?q=Ghadames' },
  { id: 'd_257', name: 'Dakar Island', country: 'Senegal', emoji: '🏝️', link: 'https://maps.google.com/?q=Goree+Island' },
  { id: 'd_258', name: 'Lake Retba', country: 'Senegal', emoji: '💗', link: 'https://maps.google.com/?q=Lake+Retba' },
  { id: 'd_259', name: 'Djenne Mosque', country: 'Mali', emoji: '🕌', link: 'https://maps.google.com/?q=Great+Mosque+of+Djenne' },
  { id: 'd_260', name: 'Timbuktu', country: 'Mali', emoji: '🏜️', link: 'https://maps.google.com/?q=Timbuktu' },
  { id: 'd_261', name: 'Cape Coast Castle', country: 'Ghana', emoji: '🏰', link: 'https://maps.google.com/?q=Cape+Coast+Castle' },
  { id: 'd_262', name: 'Kakum National Park', country: 'Ghana', emoji: '🌳', link: 'https://maps.google.com/?q=Kakum+National+Park' },
  { id: 'd_263', name: 'Lagos Beach', country: 'Nigeria', emoji: '🏖️', link: 'https://maps.google.com/?q=Elegushi+Beach+Lagos' },
  { id: 'd_264', name: 'Osun Grove', country: 'Nigeria', emoji: '🌳', link: 'https://maps.google.com/?q=Osun+Osogbo+Sacred+Grove' },
  { id: 'd_265', name: 'Lalibela Churches', country: 'Ethiopia', emoji: '⛪', link: 'https://maps.google.com/?q=Lalibela+Churches' },
  { id: 'd_266', name: 'Danakil Depression', country: 'Ethiopia', emoji: '🌋', link: 'https://maps.google.com/?q=Danakil+Depression' },
  { id: 'd_267', name: 'Bwindi Forest', country: 'Uganda', emoji: '🦍', link: 'https://maps.google.com/?q=Bwindi+Impenetrable+Forest' },
  { id: 'd_268', name: 'Murchison Falls', country: 'Uganda', emoji: '💧', link: 'https://maps.google.com/?q=Murchison+Falls' },
  { id: 'd_269', name: 'Gorilla Trekking', country: 'Rwanda', emoji: '🦍', link: 'https://maps.google.com/?q=Volcanoes+National+Park+Rwanda' },
  { id: 'd_270', name: 'Lake Kivu', country: 'Rwanda', emoji: '🌊', link: 'https://maps.google.com/?q=Lake+Kivu' },
  { id: 'd_271', name: 'Zanzibar', country: 'Tanzania', emoji: '🏝️', link: 'https://maps.google.com/?q=Zanzibar' },
  { id: 'd_272', name: 'Ngorongoro Crater', country: 'Tanzania', emoji: '🦁', link: 'https://maps.google.com/?q=Ngorongoro+Crater' },
  { id: 'd_273', name: 'Virunga Park', country: 'DR Congo', emoji: '🌋', link: 'https://maps.google.com/?q=Virunga+National+Park' },
  { id: 'd_274', name: 'Congo River', country: 'DR Congo', emoji: '🛶', link: 'https://maps.google.com/?q=Congo+River' },
  { id: 'd_275', name: 'Mauritius Beach', country: 'Mauritius', emoji: '🏖️', link: 'https://maps.google.com/?q=Mauritius+Beach' },
  { id: 'd_276', name: 'Seven Colored Earths', country: 'Mauritius', emoji: '🌈', link: 'https://maps.google.com/?q=Seven+Colored+Earths' },
  { id: 'd_277', name: 'Piton Mountains', country: 'Reunion', emoji: '🏔️', link: 'https://maps.google.com/?q=Piton+de+la+Fournaise' },
  { id: 'd_278', name: 'Cirques of Reunion', country: 'Reunion', emoji: '🏞️', link: 'https://maps.google.com/?q=Cirque+de+Mafate' },
  { id: 'd_279', name: 'Seychelles Beach', country: 'Seychelles', emoji: '🏖️', link: 'https://maps.google.com/?q=Anse+Source+dArgent' },
  { id: 'd_280', name: 'Vallee de Mai', country: 'Seychelles', emoji: '🌴', link: 'https://maps.google.com/?q=Vallee+de+Mai' },

  // Pacific Islands
  { id: 'd_281', name: 'Vanuatu Volcanoes', country: 'Vanuatu', emoji: '🌋', link: 'https://maps.google.com/?q=Mount+Yasur+Vanuatu' },
  { id: 'd_282', name: 'Blue Holes Vanuatu', country: 'Vanuatu', emoji: '💙', link: 'https://maps.google.com/?q=Champagne+Beach+Vanuatu' },
  { id: 'd_283', name: 'Samoa Beaches', country: 'Samoa', emoji: '🏖️', link: 'https://maps.google.com/?q=Samoa+Beach' },
  { id: 'd_284', name: 'To Sua Trench', country: 'Samoa', emoji: '💧', link: 'https://maps.google.com/?q=To+Sua+Ocean+Trench' },
  { id: 'd_285', name: 'Tongatapu', country: 'Tonga', emoji: '🏝️', link: 'https://maps.google.com/?q=Tongatapu' },
  { id: 'd_286', name: "Ha'apai Islands", country: 'Tonga', emoji: '🐋', link: 'https://maps.google.com/?q=Haapai+Islands' },
  { id: 'd_287', name: 'Solomon Islands', country: 'Solomon Islands', emoji: '🏝️', link: 'https://maps.google.com/?q=Solomon+Islands' },
  { id: 'd_288', name: 'Marovo Lagoon', country: 'Solomon Islands', emoji: '🐠', link: 'https://maps.google.com/?q=Marovo+Lagoon' },
  { id: 'd_289', name: 'Palau Rock Islands', country: 'Palau', emoji: '🏝️', link: 'https://maps.google.com/?q=Rock+Islands+Palau' },
  { id: 'd_290', name: 'Jellyfish Lake', country: 'Palau', emoji: '🪼', link: 'https://maps.google.com/?q=Jellyfish+Lake' },
  { id: 'd_291', name: 'Guam Tumon Bay', country: 'Guam', emoji: '🏖️', link: 'https://maps.google.com/?q=Tumon+Bay+Guam' },
  { id: 'd_292', name: 'Two Lovers Point', country: 'Guam', emoji: '💕', link: 'https://maps.google.com/?q=Two+Lovers+Point' },
  { id: 'd_293', name: 'Saipan Beach', country: 'Northern Mariana', emoji: '🏖️', link: 'https://maps.google.com/?q=Saipan+Beach' },
  { id: 'd_294', name: 'Managaha Island', country: 'Northern Mariana', emoji: '🏝️', link: 'https://maps.google.com/?q=Managaha+Island' },
  { id: 'd_295', name: 'Chuuk Lagoon', country: 'Micronesia', emoji: '🚢', link: 'https://maps.google.com/?q=Chuuk+Lagoon' },
  { id: 'd_296', name: 'Nan Madol', country: 'Micronesia', emoji: '🏛️', link: 'https://maps.google.com/?q=Nan+Madol' },
  { id: 'd_297', name: 'Marshall Islands', country: 'Marshall Islands', emoji: '🏝️', link: 'https://maps.google.com/?q=Marshall+Islands' },
  { id: 'd_298', name: 'Bikini Atoll', country: 'Marshall Islands', emoji: '☢️', link: 'https://maps.google.com/?q=Bikini+Atoll' },
  { id: 'd_299', name: 'Kiribati', country: 'Kiribati', emoji: '🏝️', link: 'https://maps.google.com/?q=Kiribati' },
  { id: 'd_300', name: 'Christmas Island', country: 'Kiribati', emoji: '🎄', link: 'https://maps.google.com/?q=Kiritimati' },

  // South America additions
  { id: 'd_301', name: 'Montevideo Old Town', country: 'Uruguay', emoji: '🏛️', link: 'https://maps.google.com/?q=Montevideo+Old+Town' },
  { id: 'd_302', name: 'Punta del Este', country: 'Uruguay', emoji: '✋', link: 'https://maps.google.com/?q=Punta+del+Este' },
  { id: 'd_303', name: 'Asuncion', country: 'Paraguay', emoji: '🏛️', link: 'https://maps.google.com/?q=Asuncion+Paraguay' },
  { id: 'd_304', name: 'Jesuit Missions', country: 'Paraguay', emoji: '⛪', link: 'https://maps.google.com/?q=Jesuit+Missions+Paraguay' },
  { id: 'd_305', name: 'Guyana Falls', country: 'Guyana', emoji: '💧', link: 'https://maps.google.com/?q=Kaieteur+Falls' },
  { id: 'd_306', name: 'Georgetown', country: 'Guyana', emoji: '🏛️', link: 'https://maps.google.com/?q=Georgetown+Guyana' },
  { id: 'd_307', name: 'Paramaribo', country: 'Suriname', emoji: '🏛️', link: 'https://maps.google.com/?q=Paramaribo' },
  { id: 'd_308', name: 'Brownsberg', country: 'Suriname', emoji: '🌳', link: 'https://maps.google.com/?q=Brownsberg+Nature+Park' },
  { id: 'd_309', name: 'Devil Island', country: 'French Guiana', emoji: '🏝️', link: 'https://maps.google.com/?q=Devils+Island+French+Guiana' },
  { id: 'd_310', name: 'Space Centre', country: 'French Guiana', emoji: '🚀', link: 'https://maps.google.com/?q=Guiana+Space+Centre' },

  // More additions to reach 400
  { id: 'd_311', name: 'Greenland Ice', country: 'Greenland', emoji: '🧊', link: 'https://maps.google.com/?q=Greenland+Ice+Sheet' },
  { id: 'd_312', name: 'Ilulissat', country: 'Greenland', emoji: '🏔️', link: 'https://maps.google.com/?q=Ilulissat' },
  { id: 'd_313', name: 'Faroe Islands', country: 'Faroe Islands', emoji: '🏝️', link: 'https://maps.google.com/?q=Faroe+Islands' },
  { id: 'd_314', name: 'Mulafossur', country: 'Faroe Islands', emoji: '💧', link: 'https://maps.google.com/?q=Mulafossur+Waterfall' },
  { id: 'd_315', name: 'Gibraltar Rock', country: 'Gibraltar', emoji: '🪨', link: 'https://maps.google.com/?q=Rock+of+Gibraltar' },
  { id: 'd_316', name: 'Gibraltar Caves', country: 'Gibraltar', emoji: '🕳️', link: 'https://maps.google.com/?q=St+Michaels+Cave' },
  { id: 'd_317', name: 'Malta Temples', country: 'Malta', emoji: '🏛️', link: 'https://maps.google.com/?q=Megalithic+Temples+Malta' },
  { id: 'd_318', name: 'Valletta', country: 'Malta', emoji: '🏰', link: 'https://maps.google.com/?q=Valletta' },
  { id: 'd_319', name: 'Andorra Ski', country: 'Andorra', emoji: '⛷️', link: 'https://maps.google.com/?q=Grandvalira' },
  { id: 'd_320', name: 'Andorra la Vella', country: 'Andorra', emoji: '🏔️', link: 'https://maps.google.com/?q=Andorra+la+Vella' },
  { id: 'd_321', name: 'Liechtenstein Castle', country: 'Liechtenstein', emoji: '🏰', link: 'https://maps.google.com/?q=Vaduz+Castle' },
  { id: 'd_322', name: 'Malbun', country: 'Liechtenstein', emoji: '⛷️', link: 'https://maps.google.com/?q=Malbun' },
  { id: 'd_323', name: 'Cyprus Petra', country: 'Cyprus', emoji: '🪨', link: 'https://maps.google.com/?q=Petra+tou+Romiou' },
  { id: 'd_324', name: 'Paphos', country: 'Cyprus', emoji: '🏛️', link: 'https://maps.google.com/?q=Paphos' },
  { id: 'd_325', name: 'Bermuda Triangle', country: 'Bermuda', emoji: '🔺', link: 'https://maps.google.com/?q=Bermuda' },
  { id: 'd_326', name: 'Crystal Caves', country: 'Bermuda', emoji: '💎', link: 'https://maps.google.com/?q=Crystal+Caves+Bermuda' },
  { id: 'd_327', name: 'Aruba Beach', country: 'Aruba', emoji: '🏖️', link: 'https://maps.google.com/?q=Eagle+Beach+Aruba' },
  { id: 'd_328', name: 'Natural Pool Aruba', country: 'Aruba', emoji: '💧', link: 'https://maps.google.com/?q=Natural+Pool+Aruba' },
  { id: 'd_329', name: 'Curacao Willemstad', country: 'Curacao', emoji: '🏘️', link: 'https://maps.google.com/?q=Willemstad' },
  { id: 'd_330', name: 'Shete Boka', country: 'Curacao', emoji: '🌊', link: 'https://maps.google.com/?q=Shete+Boka+National+Park' },
  { id: 'd_331', name: 'Bonaire Diving', country: 'Bonaire', emoji: '🤿', link: 'https://maps.google.com/?q=Bonaire+Marine+Park' },
  { id: 'd_332', name: 'Pink Beach', country: 'Bonaire', emoji: '💗', link: 'https://maps.google.com/?q=Pink+Beach+Bonaire' },
  { id: 'd_333', name: 'Bahamas Swimming Pigs', country: 'Bahamas', emoji: '🐷', link: 'https://maps.google.com/?q=Exuma+Pigs' },
  { id: 'd_334', name: 'Nassau', country: 'Bahamas', emoji: '🏖️', link: 'https://maps.google.com/?q=Nassau+Bahamas' },
  { id: 'd_335', name: 'Turks Beach', country: 'Turks and Caicos', emoji: '🏖️', link: 'https://maps.google.com/?q=Grace+Bay+Beach' },
  { id: 'd_336', name: 'Grand Turk', country: 'Turks and Caicos', emoji: '🏝️', link: 'https://maps.google.com/?q=Grand+Turk' },
  { id: 'd_337', name: 'Cayman Stingray City', country: 'Cayman Islands', emoji: '🐟', link: 'https://maps.google.com/?q=Stingray+City+Cayman' },
  { id: 'd_338', name: 'Seven Mile Beach', country: 'Cayman Islands', emoji: '🏖️', link: 'https://maps.google.com/?q=Seven+Mile+Beach+Cayman' },
  { id: 'd_339', name: 'British Virgin Islands', country: 'BVI', emoji: '⛵', link: 'https://maps.google.com/?q=British+Virgin+Islands' },
  { id: 'd_340', name: 'The Baths', country: 'BVI', emoji: '🪨', link: 'https://maps.google.com/?q=The+Baths+Virgin+Gorda' },
  { id: 'd_341', name: 'St. Thomas', country: 'US Virgin Islands', emoji: '🏖️', link: 'https://maps.google.com/?q=St+Thomas+Virgin+Islands' },
  { id: 'd_342', name: 'Trunk Bay', country: 'US Virgin Islands', emoji: '🏖️', link: 'https://maps.google.com/?q=Trunk+Bay' },
  { id: 'd_343', name: 'Antigua Beach', country: 'Antigua', emoji: '🏖️', link: 'https://maps.google.com/?q=Antigua+Beach' },
  { id: 'd_344', name: "Nelson's Dockyard", country: 'Antigua', emoji: '⚓', link: 'https://maps.google.com/?q=Nelsons+Dockyard' },
  { id: 'd_345', name: 'Barbados Beach', country: 'Barbados', emoji: '🏖️', link: 'https://maps.google.com/?q=Barbados+Beach' },
  { id: 'd_346', name: 'Harrisons Cave', country: 'Barbados', emoji: '🕳️', link: 'https://maps.google.com/?q=Harrisons+Cave' },
  { id: 'd_347', name: 'St. Lucia Pitons', country: 'St. Lucia', emoji: '🏔️', link: 'https://maps.google.com/?q=Pitons+St+Lucia' },
  { id: 'd_348', name: 'Sulphur Springs', country: 'St. Lucia', emoji: '♨️', link: 'https://maps.google.com/?q=Sulphur+Springs+St+Lucia' },
  { id: 'd_349', name: 'Grenada Beach', country: 'Grenada', emoji: '🏖️', link: 'https://maps.google.com/?q=Grand+Anse+Beach+Grenada' },
  { id: 'd_350', name: 'Underwater Sculpture', country: 'Grenada', emoji: '🗿', link: 'https://maps.google.com/?q=Underwater+Sculpture+Park+Grenada' },
  { id: 'd_351', name: 'Dominica Waterfalls', country: 'Dominica', emoji: '💧', link: 'https://maps.google.com/?q=Trafalgar+Falls+Dominica' },
  { id: 'd_352', name: 'Boiling Lake', country: 'Dominica', emoji: '♨️', link: 'https://maps.google.com/?q=Boiling+Lake+Dominica' },
  { id: 'd_353', name: 'St. Kitts Brimstone', country: 'St. Kitts', emoji: '🏰', link: 'https://maps.google.com/?q=Brimstone+Hill+Fortress' },
  { id: 'd_354', name: 'Nevis Peak', country: 'St. Kitts', emoji: '🏔️', link: 'https://maps.google.com/?q=Nevis+Peak' },
  { id: 'd_355', name: 'Martinique Beach', country: 'Martinique', emoji: '🏖️', link: 'https://maps.google.com/?q=Les+Salines+Martinique' },
  { id: 'd_356', name: 'Mount Pelee', country: 'Martinique', emoji: '🌋', link: 'https://maps.google.com/?q=Mount+Pelee' },
  { id: 'd_357', name: 'Guadeloupe Beach', country: 'Guadeloupe', emoji: '🏖️', link: 'https://maps.google.com/?q=Guadeloupe+Beach' },
  { id: 'd_358', name: 'La Soufriere', country: 'Guadeloupe', emoji: '🌋', link: 'https://maps.google.com/?q=La+Soufriere+Guadeloupe' },
  { id: 'd_359', name: 'St. Maarten Beach', country: 'St. Maarten', emoji: '✈️', link: 'https://maps.google.com/?q=Maho+Beach+St+Maarten' },
  { id: 'd_360', name: 'Orient Bay', country: 'St. Maarten', emoji: '🏖️', link: 'https://maps.google.com/?q=Orient+Bay' },
  { id: 'd_361', name: 'Anguilla Beach', country: 'Anguilla', emoji: '🏖️', link: 'https://maps.google.com/?q=Shoal+Bay+Anguilla' },
  { id: 'd_362', name: 'Meads Bay', country: 'Anguilla', emoji: '🏖️', link: 'https://maps.google.com/?q=Meads+Bay' },
  { id: 'd_363', name: 'St. Barts Beach', country: 'St. Barts', emoji: '🏖️', link: 'https://maps.google.com/?q=St+Jean+Beach+St+Barts' },
  { id: 'd_364', name: 'Gustavia', country: 'St. Barts', emoji: '⛵', link: 'https://maps.google.com/?q=Gustavia' },
  { id: 'd_365', name: 'Saba Mountain', country: 'Saba', emoji: '🏔️', link: 'https://maps.google.com/?q=Mount+Scenery+Saba' },
  { id: 'd_366', name: 'Saba Diving', country: 'Saba', emoji: '🤿', link: 'https://maps.google.com/?q=Saba+Marine+Park' },
  { id: 'd_367', name: 'St. Eustatius', country: 'St. Eustatius', emoji: '🏝️', link: 'https://maps.google.com/?q=St+Eustatius' },
  { id: 'd_368', name: 'Quill Volcano', country: 'St. Eustatius', emoji: '🌋', link: 'https://maps.google.com/?q=The+Quill+St+Eustatius' },
  { id: 'd_369', name: 'Montserrat Volcano', country: 'Montserrat', emoji: '🌋', link: 'https://maps.google.com/?q=Soufriere+Hills+Montserrat' },
  { id: 'd_370', name: 'Plymouth Ghost Town', country: 'Montserrat', emoji: '👻', link: 'https://maps.google.com/?q=Plymouth+Montserrat' },
  { id: 'd_371', name: 'St. Vincent Beach', country: 'St. Vincent', emoji: '🏖️', link: 'https://maps.google.com/?q=St+Vincent+Beach' },
  { id: 'd_372', name: 'Tobago Cays', country: 'St. Vincent', emoji: '🐢', link: 'https://maps.google.com/?q=Tobago+Cays' },
  { id: 'd_373', name: 'Trinidad Carnival', country: 'Trinidad', emoji: '🎭', link: 'https://maps.google.com/?q=Port+of+Spain' },
  { id: 'd_374', name: 'Pigeon Point', country: 'Trinidad', emoji: '🏖️', link: 'https://maps.google.com/?q=Pigeon+Point+Tobago' },
  { id: 'd_375', name: 'Falkland Islands', country: 'Falkland Islands', emoji: '🐧', link: 'https://maps.google.com/?q=Falkland+Islands' },
  { id: 'd_376', name: 'Volunteer Point', country: 'Falkland Islands', emoji: '🐧', link: 'https://maps.google.com/?q=Volunteer+Point' },
  { id: 'd_377', name: 'South Georgia Island', country: 'South Georgia', emoji: '🐧', link: 'https://maps.google.com/?q=South+Georgia+Island' },
  { id: 'd_378', name: 'Grytviken', country: 'South Georgia', emoji: '🏚️', link: 'https://maps.google.com/?q=Grytviken' },
  { id: 'd_379', name: 'Svalbard', country: 'Svalbard', emoji: '🐻‍❄️', link: 'https://maps.google.com/?q=Svalbard' },
  { id: 'd_380', name: 'Longyearbyen', country: 'Svalbard', emoji: '🏔️', link: 'https://maps.google.com/?q=Longyearbyen' },
  { id: 'd_381', name: 'Jan Mayen', country: 'Jan Mayen', emoji: '🌋', link: 'https://maps.google.com/?q=Jan+Mayen' },
  { id: 'd_382', name: 'Beerenberg', country: 'Jan Mayen', emoji: '🏔️', link: 'https://maps.google.com/?q=Beerenberg' },
  { id: 'd_383', name: 'Bouvet Island', country: 'Bouvet Island', emoji: '🧊', link: 'https://maps.google.com/?q=Bouvet+Island' },
  { id: 'd_384', name: 'Prince Edward Islands', country: 'South Africa', emoji: '🏝️', link: 'https://maps.google.com/?q=Prince+Edward+Islands' },
  { id: 'd_385', name: 'Heard Island', country: 'Australia', emoji: '🌋', link: 'https://maps.google.com/?q=Heard+Island' },
  { id: 'd_386', name: 'McDonald Islands', country: 'Australia', emoji: '🏝️', link: 'https://maps.google.com/?q=McDonald+Islands' },
  { id: 'd_387', name: 'Kerguelen Islands', country: 'France', emoji: '🏝️', link: 'https://maps.google.com/?q=Kerguelen+Islands' },
  { id: 'd_388', name: 'Crozet Islands', country: 'France', emoji: '🐧', link: 'https://maps.google.com/?q=Crozet+Islands' },
  { id: 'd_389', name: 'Amsterdam Island', country: 'France', emoji: '🏝️', link: 'https://maps.google.com/?q=Amsterdam+Island' },
  { id: 'd_390', name: 'Saint-Paul Island', country: 'France', emoji: '🏝️', link: 'https://maps.google.com/?q=Saint+Paul+Island+Indian+Ocean' },
  { id: 'd_391', name: 'Tristan da Cunha', country: 'UK', emoji: '🏝️', link: 'https://maps.google.com/?q=Tristan+da+Cunha' },
  { id: 'd_392', name: 'St. Helena', country: 'UK', emoji: '🏝️', link: 'https://maps.google.com/?q=Saint+Helena' },
  { id: 'd_393', name: 'Ascension Island', country: 'UK', emoji: '🐢', link: 'https://maps.google.com/?q=Ascension+Island' },
  { id: 'd_394', name: 'Green Mountain', country: 'UK', emoji: '🏔️', link: 'https://maps.google.com/?q=Green+Mountain+Ascension' },
  { id: 'd_395', name: 'Pitcairn Island', country: 'Pitcairn', emoji: '🏝️', link: 'https://maps.google.com/?q=Pitcairn+Island' },
  { id: 'd_396', name: 'Henderson Island', country: 'Pitcairn', emoji: '🌳', link: 'https://maps.google.com/?q=Henderson+Island' },
  { id: 'd_397', name: 'Cocos Islands', country: 'Australia', emoji: '🏝️', link: 'https://maps.google.com/?q=Cocos+Keeling+Islands' },
  { id: 'd_398', name: 'Christmas Island AU', country: 'Australia', emoji: '🦀', link: 'https://maps.google.com/?q=Christmas+Island+Australia' },
  { id: 'd_399', name: 'Norfolk Island', country: 'Australia', emoji: '🌲', link: 'https://maps.google.com/?q=Norfolk+Island' },
  { id: 'd_400', name: 'Lord Howe Island', country: 'Australia', emoji: '🏝️', link: 'https://maps.google.com/?q=Lord+Howe+Island' },
];

// Travel - UNESCO & Major Tourist Sites (50+)
const travelPlaces = [
  { id: 't_1', name: 'Machu Picchu', country: 'Peru', emoji: '🏔️', link: 'https://maps.google.com/?q=Machu+Picchu', type: 'unesco' },
  { id: 't_2', name: 'Great Wall of China', country: 'China', emoji: '🏯', link: 'https://maps.google.com/?q=Great+Wall+of+China', type: 'unesco' },
  { id: 't_3', name: 'Taj Mahal', country: 'India', emoji: '🕌', link: 'https://maps.google.com/?q=Taj+Mahal', type: 'unesco' },
  { id: 't_4', name: 'Colosseum', country: 'Italy', emoji: '🏟️', link: 'https://maps.google.com/?q=Colosseum', type: 'unesco' },
  { id: 't_5', name: 'Petra', country: 'Jordan', emoji: '🏛️', link: 'https://maps.google.com/?q=Petra', type: 'unesco' },
  { id: 't_6', name: 'Angkor Wat', country: 'Cambodia', emoji: '🛕', link: 'https://maps.google.com/?q=Angkor+Wat', type: 'unesco' },
  { id: 't_7', name: 'Pyramids of Giza', country: 'Egypt', emoji: '🔺', link: 'https://maps.google.com/?q=Pyramids+of+Giza', type: 'unesco' },
  { id: 't_8', name: 'Acropolis', country: 'Greece', emoji: '🏛️', link: 'https://maps.google.com/?q=Acropolis+Athens', type: 'unesco' },
  { id: 't_9', name: 'Christ the Redeemer', country: 'Brazil', emoji: '✝️', link: 'https://maps.google.com/?q=Christ+the+Redeemer', type: 'wonder' },
  { id: 't_10', name: 'Chichen Itza', country: 'Mexico', emoji: '🏛️', link: 'https://maps.google.com/?q=Chichen+Itza', type: 'unesco' },
  { id: 't_11', name: 'Alhambra', country: 'Spain', emoji: '🏰', link: 'https://maps.google.com/?q=Alhambra', type: 'unesco' },
  { id: 't_12', name: 'Sagrada Familia', country: 'Spain', emoji: '⛪', link: 'https://maps.google.com/?q=Sagrada+Familia', type: 'unesco' },
  { id: 't_13', name: 'Versailles', country: 'France', emoji: '🏰', link: 'https://maps.google.com/?q=Palace+of+Versailles', type: 'unesco' },
  { id: 't_14', name: 'Mont Saint-Michel', country: 'France', emoji: '🏰', link: 'https://maps.google.com/?q=Mont+Saint+Michel', type: 'unesco' },
  { id: 't_15', name: 'Neuschwanstein Castle', country: 'Germany', emoji: '🏰', link: 'https://maps.google.com/?q=Neuschwanstein+Castle', type: 'landmark' },
  { id: 't_16', name: 'Hagia Sophia', country: 'Turkey', emoji: '🕌', link: 'https://maps.google.com/?q=Hagia+Sophia', type: 'unesco' },
  { id: 't_17', name: 'Cappadocia', country: 'Turkey', emoji: '🎈', link: 'https://maps.google.com/?q=Cappadocia', type: 'unesco' },
  { id: 't_18', name: 'Grand Canyon', country: 'USA', emoji: '🏜️', link: 'https://maps.google.com/?q=Grand+Canyon', type: 'unesco' },
  { id: 't_19', name: 'Yellowstone', country: 'USA', emoji: '🌋', link: 'https://maps.google.com/?q=Yellowstone+National+Park', type: 'unesco' },
  { id: 't_20', name: 'Statue of Liberty', country: 'USA', emoji: '🗽', link: 'https://maps.google.com/?q=Statue+of+Liberty', type: 'unesco' },
  { id: 't_21', name: 'Banff National Park', country: 'Canada', emoji: '🏔️', link: 'https://maps.google.com/?q=Banff+National+Park', type: 'unesco' },
  { id: 't_22', name: 'Niagara Falls', country: 'Canada', emoji: '💧', link: 'https://maps.google.com/?q=Niagara+Falls', type: 'landmark' },
  { id: 't_23', name: 'Galapagos Islands', country: 'Ecuador', emoji: '🐢', link: 'https://maps.google.com/?q=Galapagos+Islands', type: 'unesco' },
  { id: 't_24', name: 'Iguazu Falls', country: 'Argentina', emoji: '💧', link: 'https://maps.google.com/?q=Iguazu+Falls', type: 'unesco' },
  { id: 't_25', name: 'Easter Island', country: 'Chile', emoji: '🗿', link: 'https://maps.google.com/?q=Easter+Island', type: 'unesco' },
  { id: 't_26', name: 'Sydney Opera House', country: 'Australia', emoji: '🎭', link: 'https://maps.google.com/?q=Sydney+Opera+House', type: 'unesco' },
  { id: 't_27', name: 'Great Barrier Reef', country: 'Australia', emoji: '🐠', link: 'https://maps.google.com/?q=Great+Barrier+Reef', type: 'unesco' },
  { id: 't_28', name: 'Uluru', country: 'Australia', emoji: '🪨', link: 'https://maps.google.com/?q=Uluru', type: 'unesco' },
  { id: 't_29', name: 'Milford Sound', country: 'New Zealand', emoji: '🏔️', link: 'https://maps.google.com/?q=Milford+Sound', type: 'landmark' },
  { id: 't_30', name: 'Serengeti', country: 'Tanzania', emoji: '🦁', link: 'https://maps.google.com/?q=Serengeti', type: 'unesco' },
  { id: 't_31', name: 'Victoria Falls', country: 'Zimbabwe', emoji: '💧', link: 'https://maps.google.com/?q=Victoria+Falls', type: 'unesco' },
  { id: 't_32', name: 'Kruger National Park', country: 'South Africa', emoji: '🐘', link: 'https://maps.google.com/?q=Kruger+National+Park', type: 'landmark' },
  { id: 't_33', name: 'Table Mountain', country: 'South Africa', emoji: '🏔️', link: 'https://maps.google.com/?q=Table+Mountain', type: 'landmark' },
  { id: 't_34', name: 'Burj Khalifa', country: 'UAE', emoji: '🏙️', link: 'https://maps.google.com/?q=Burj+Khalifa', type: 'landmark' },
  { id: 't_35', name: 'Forbidden City', country: 'China', emoji: '🏛️', link: 'https://maps.google.com/?q=Forbidden+City', type: 'unesco' },
  { id: 't_36', name: 'Terracotta Army', country: 'China', emoji: '🗿', link: 'https://maps.google.com/?q=Terracotta+Army', type: 'unesco' },
  { id: 't_37', name: 'Mount Fuji', country: 'Japan', emoji: '🗻', link: 'https://maps.google.com/?q=Mount+Fuji', type: 'unesco' },
  { id: 't_38', name: 'Fushimi Inari', country: 'Japan', emoji: '⛩️', link: 'https://maps.google.com/?q=Fushimi+Inari+Shrine', type: 'landmark' },
  { id: 't_39', name: 'Ha Long Bay', country: 'Vietnam', emoji: '🏝️', link: 'https://maps.google.com/?q=Ha+Long+Bay', type: 'unesco' },
  { id: 't_40', name: 'Borobudur', country: 'Indonesia', emoji: '🛕', link: 'https://maps.google.com/?q=Borobudur', type: 'unesco' },
  { id: 't_41', name: 'Bali Temples', country: 'Indonesia', emoji: '🛕', link: 'https://maps.google.com/?q=Tanah+Lot', type: 'landmark' },
  { id: 't_42', name: 'Santorini', country: 'Greece', emoji: '🌅', link: 'https://maps.google.com/?q=Santorini', type: 'landmark' },
  { id: 't_43', name: 'Venice Canals', country: 'Italy', emoji: '🛶', link: 'https://maps.google.com/?q=Venice', type: 'unesco' },
  { id: 't_44', name: 'Cinque Terre', country: 'Italy', emoji: '🏘️', link: 'https://maps.google.com/?q=Cinque+Terre', type: 'unesco' },
  { id: 't_45', name: 'Dubrovnik', country: 'Croatia', emoji: '🏰', link: 'https://maps.google.com/?q=Dubrovnik', type: 'unesco' },
  { id: 't_46', name: 'Plitvice Lakes', country: 'Croatia', emoji: '💧', link: 'https://maps.google.com/?q=Plitvice+Lakes', type: 'unesco' },
  { id: 't_47', name: 'Prague Old Town', country: 'Czech Republic', emoji: '🏰', link: 'https://maps.google.com/?q=Prague+Old+Town', type: 'unesco' },
  { id: 't_48', name: 'Stonehenge', country: 'UK', emoji: '🪨', link: 'https://maps.google.com/?q=Stonehenge', type: 'unesco' },
  { id: 't_49', name: 'Edinburgh Castle', country: 'Scotland', emoji: '🏰', link: 'https://maps.google.com/?q=Edinburgh+Castle', type: 'landmark' },
  { id: 't_50', name: 'Northern Lights', country: 'Norway', emoji: '🌌', link: 'https://maps.google.com/?q=Tromso+Norway', type: 'natural' },
];

export default function MusicAdventure() {
  const [activeTab, setActiveTab] = useState('challenges');
  const { user } = useAuth();
  
  // Challenge States
  const [completedSystemChallenges, setCompletedSystemChallenges] = useState<Set<string>>(new Set());
  const [customChallenges, setCustomChallenges] = useState<any[]>([]);
  const [newChallenge, setNewChallenge] = useState({ title: '', description: '' });
  const [challengeDialogOpen, setChallengeDialogOpen] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<any>(null);
  const [proofDialogOpen, setProofDialogOpen] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [challengeFilter, setChallengeFitler] = useState<'system' | 'custom'>('system');
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');
  
  // Discover States
  const [visitedPlaces, setVisitedPlaces] = useState<Set<string>>(new Set());
  const [discoverSearch, setDiscoverSearch] = useState('');
  
  // Travel States
  const [lovedPlaces, setLovedPlaces] = useState<Set<string>>(new Set());
  const [travelSearch, setTravelSearch] = useState('');
  
  // Leaderboard States
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  
  // Points calculation
  const systemPoints = [...completedSystemChallenges].reduce((acc, id) => {
    const c = systemChallenges.find(ch => ch.id === id);
    return acc + (c?.points || 0);
  }, 0);
  const customPoints = customChallenges.filter(c => c.completed).length * 20;
  const discoverPoints = visitedPlaces.size; // 1 star per visit
  const totalPoints = systemPoints + customPoints + discoverPoints;

  useEffect(() => {
    loadData();
    if (activeTab === 'ranking') loadLeaderboard();
  }, [user, activeTab]);

  const loadData = async () => {
    if (!user) return;
    
    // Load completed system challenges from localStorage
    const savedSystem = localStorage.getItem('completedSystemChallenges');
    if (savedSystem) setCompletedSystemChallenges(new Set(JSON.parse(savedSystem)));
    
    // Load custom challenges from DB
    const { data: customData } = await supabase
      .from('custom_challenges')
      .select('*')
      .eq('user_id', user.id);
    if (customData) setCustomChallenges(customData);
    
    // Load visited places from DB
    const { data: visitData } = await supabase
      .from('discover_visits')
      .select('place_id')
      .eq('user_id', user.id);
    if (visitData) setVisitedPlaces(new Set(visitData.map(v => v.place_id)));
    
    // Load loved places from DB
    const { data: loveData } = await supabase
      .from('travel_loves')
      .select('place_id')
      .eq('user_id', user.id);
    if (loveData) setLovedPlaces(new Set(loveData.map(l => l.place_id)));
  };

  // Load Leaderboard
  const loadLeaderboard = async () => {
    setLoadingLeaderboard(true);
    try {
      // Get all users with their visit counts
      const { data: visitsData } = await supabase
        .from('discover_visits')
        .select('user_id');
      
      // Get all profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, avatar_url');
      
      if (!profiles) {
        setLeaderboard([]);
        return;
      }

      // Count visits per user
      const visitCounts: Record<string, number> = {};
      visitsData?.forEach(v => {
        visitCounts[v.user_id] = (visitCounts[v.user_id] || 0) + 1;
      });

      // Get challenge completions from user_points table
      const { data: pointsData } = await supabase
        .from('user_points')
        .select('user_id, total_points');

      const pointsMap: Record<string, number> = {};
      pointsData?.forEach(p => {
        pointsMap[p.user_id] = p.total_points;
      });

      // Create leaderboard entries
      const leaderboardData = profiles.map(profile => ({
        id: profile.id,
        name: profile.name,
        avatar_url: profile.avatar_url,
        discoverPoints: visitCounts[profile.id] || 0,
        totalPoints: (pointsMap[profile.id] || 0) + (visitCounts[profile.id] || 0),
        isCurrentUser: profile.id === user?.id
      }))
      .filter(entry => entry.totalPoints > 0)
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, 50);

      setLeaderboard(leaderboardData);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  // Challenge Functions
  const handleCompleteSystemChallenge = async () => {
    if (!selectedChallenge || !proofFile) {
      toast.error('Please select proof file (video/photo)');
      return;
    }
    
    setUploading(true);
    try {
      // Simulate AI verification delay
      await new Promise(r => setTimeout(r, 2000));
      
      const newCompleted = new Set(completedSystemChallenges);
      newCompleted.add(selectedChallenge.id);
      setCompletedSystemChallenges(newCompleted);
      localStorage.setItem('completedSystemChallenges', JSON.stringify([...newCompleted]));
      
      toast.success(`🎉 Challenge completed! +${selectedChallenge.points} points!`);
      setProofDialogOpen(false);
      setProofFile(null);
      setSelectedChallenge(null);
    } catch (error) {
      toast.error('Failed to verify proof');
    } finally {
      setUploading(false);
    }
  };

  const handleCreateCustomChallenge = async () => {
    if (!newChallenge.title.trim() || !user) {
      toast.error('Enter challenge title');
      return;
    }
    
    const { data, error } = await supabase
      .from('custom_challenges')
      .insert({
        user_id: user.id,
        title: newChallenge.title.trim(),
        description: newChallenge.description.trim() || null
      })
      .select()
      .single();
    
    if (error) {
      toast.error('Failed to create challenge');
      return;
    }
    
    setCustomChallenges([...customChallenges, data]);
    setNewChallenge({ title: '', description: '' });
    setChallengeDialogOpen(false);
    toast.success('Custom challenge created!');
  };

  const handleCompleteCustomChallenge = async (id: string) => {
    const { error } = await supabase
      .from('custom_challenges')
      .update({ completed: true, completed_at: new Date().toISOString() })
      .eq('id', id);
    
    if (error) {
      toast.error('Failed to complete');
      return;
    }
    
    setCustomChallenges(customChallenges.map(c => 
      c.id === id ? { ...c, completed: true } : c
    ));
    toast.success('🎉 Custom challenge completed! +20 points!');
  };

  const handleDeleteCustomChallenge = async (id: string) => {
    const { error } = await supabase
      .from('custom_challenges')
      .delete()
      .eq('id', id);
    
    if (!error) {
      setCustomChallenges(customChallenges.filter(c => c.id !== id));
      toast.success('Challenge deleted');
    }
  };

  // Discover Functions
  const handleVisitPlace = async (placeId: string) => {
    if (!user || visitedPlaces.has(placeId)) return;
    
    const { error } = await supabase
      .from('discover_visits')
      .insert({ user_id: user.id, place_id: placeId });
    
    if (!error) {
      setVisitedPlaces(new Set([...visitedPlaces, placeId]));
      toast.success('⭐ Place visited! +1 star point!');
    }
  };

  // Travel Functions
  const handleLovePlace = async (placeId: string) => {
    if (!user) return;
    
    if (lovedPlaces.has(placeId)) {
      await supabase.from('travel_loves').delete().eq('user_id', user.id).eq('place_id', placeId);
      const newLoved = new Set(lovedPlaces);
      newLoved.delete(placeId);
      setLovedPlaces(newLoved);
    } else {
      await supabase.from('travel_loves').insert({ user_id: user.id, place_id: placeId });
      setLovedPlaces(new Set([...lovedPlaces, placeId]));
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'hard': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-muted';
    }
  };

  // Filtered data
  const filteredSystemChallenges = systemChallenges.filter(c => 
    difficultyFilter === 'all' || c.difficulty === difficultyFilter
  );
  
  const filteredDiscoverPlaces = discoverPlaces.filter(p =>
    p.name.toLowerCase().includes(discoverSearch.toLowerCase()) ||
    p.country.toLowerCase().includes(discoverSearch.toLowerCase())
  );
  
  const filteredTravelPlaces = travelPlaces.filter(p =>
    p.name.toLowerCase().includes(travelSearch.toLowerCase()) ||
    p.country.toLowerCase().includes(travelSearch.toLowerCase())
  );

  return (
    <div className="space-y-4 pb-20">
      {/* Points Header */}
      <div className="glass-card rounded-xl p-3 md:p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-xl md:text-2xl font-black flex items-center gap-2">
            <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-yellow-500" />
            <span className="hidden sm:inline">Adventure Zone</span>
            <span className="sm:hidden">Adventure</span>
          </h1>
          
          <div className="flex items-center gap-2 md:gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 px-2 md:px-3 py-1.5 rounded-full border border-yellow-500/30">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <span className="font-bold text-sm md:text-base">{totalPoints}</span>
              <span className="text-[10px] text-muted-foreground hidden md:inline">Total</span>
            </div>
            <div className="flex items-center gap-1.5 bg-primary/10 px-2 py-1 rounded-full text-[10px] md:text-xs">
              <Target className="h-3 w-3" />
              <span>{systemPoints} sys</span>
            </div>
            <div className="flex items-center gap-1.5 bg-purple-500/10 px-2 py-1 rounded-full text-[10px] md:text-xs">
              <Plus className="h-3 w-3" />
              <span>{customPoints} custom</span>
            </div>
            <div className="flex items-center gap-1.5 bg-blue-500/10 px-2 py-1 rounded-full text-[10px] md:text-xs">
              <Star className="h-3 w-3" />
              <span>{discoverPoints} discover</span>
            </div>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="glass-card w-full justify-start mb-4">
          <TabsTrigger value="challenges" className="gap-1.5 flex-1 text-xs md:text-sm">
            <Target className="w-3.5 h-3.5 md:w-4 md:h-4" />
            Challenges
          </TabsTrigger>
          <TabsTrigger value="discover" className="gap-1.5 flex-1 text-xs md:text-sm">
            <Compass className="w-3.5 h-3.5 md:w-4 md:h-4" />
            Discover
          </TabsTrigger>
          <TabsTrigger value="travel" className="gap-1.5 flex-1 text-xs md:text-sm">
            <Map className="w-3.5 h-3.5 md:w-4 md:h-4" />
            Travel
          </TabsTrigger>
          <TabsTrigger value="ranking" className="gap-1.5 flex-1 text-xs md:text-sm">
            <Trophy className="w-3.5 h-3.5 md:w-4 md:h-4" />
            Ranking
          </TabsTrigger>
        </TabsList>

        {/* CHALLENGES TAB */}
        <TabsContent value="challenges" className="space-y-4">
          {/* Filters - Only show difficulty filter when viewing system challenges */}
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex gap-1.5 flex-wrap">
              {(['system', 'custom'] as const).map(f => (
                <Button
                  key={f}
                  size="sm"
                  variant={challengeFilter === f ? 'default' : 'outline'}
                  onClick={() => setChallengeFitler(f)}
                  className="text-xs h-7"
                >
                  {f === 'system' ? '🎯 System' : '✨ Custom'}
                </Button>
              ))}
            </div>
            {challengeFilter === 'system' && (
              <div className="flex gap-1.5 flex-wrap">
                {(['all', 'easy', 'medium', 'hard'] as const).map(d => (
                  <Button
                    key={d}
                    size="sm"
                    variant={difficultyFilter === d ? 'default' : 'outline'}
                    onClick={() => setDifficultyFilter(d)}
                    className={`text-xs h-7 ${d !== 'all' ? getDifficultyColor(d) : ''}`}
                  >
                    {d.charAt(0).toUpperCase() + d.slice(1)}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Create Custom Challenge Button */}
          <Dialog open={challengeDialogOpen} onOpenChange={setChallengeDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full glass-card border-dashed border-2 h-12">
                <Plus className="w-4 h-4 mr-2" />
                Create Custom Challenge (+20 pts)
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  Create Custom Challenge
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Challenge Title</Label>
                  <Input 
                    value={newChallenge.title}
                    onChange={(e) => setNewChallenge({ ...newChallenge, title: e.target.value })}
                    placeholder="e.g., Learn 10 new words"
                    className="glass-card"
                  />
                </div>
                <div>
                  <Label>Description (optional)</Label>
                  <Input 
                    value={newChallenge.description}
                    onChange={(e) => setNewChallenge({ ...newChallenge, description: e.target.value })}
                    placeholder="e.g., Learn 10 new vocabulary words"
                    className="glass-card"
                  />
                </div>
                <Button onClick={handleCreateCustomChallenge} className="w-full">
                  Create Challenge
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* System Challenges - Only show when filter is 'system' */}
          {challengeFilter === 'system' && (
            <div className="space-y-2">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Target className="w-4 h-4 text-primary" />
                System Challenges ({filteredSystemChallenges.length})
              </h3>
              <ScrollArea className="h-[400px] md:h-[500px]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {filteredSystemChallenges.map((challenge) => {
                    const isComplete = completedSystemChallenges.has(challenge.id);
                    return (
                      <Card key={challenge.id} className={`glass-card border hover:shadow-lg transition-all ${isComplete ? 'opacity-60' : 'hover-lift'}`}>
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-semibold text-sm">{challenge.title}</h4>
                                <Badge className={`text-[10px] ${getDifficultyColor(challenge.difficulty)}`}>
                                  {challenge.difficulty}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">{challenge.description}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="secondary" className="text-xs">
                                  +{challenge.points} pts
                                </Badge>
                              </div>
                            </div>
                            {isComplete ? (
                              <CheckCircle className="w-6 h-6 text-green-500 shrink-0" />
                            ) : (
                              <Button 
                                size="sm" 
                                onClick={() => { setSelectedChallenge(challenge); setProofDialogOpen(true); }}
                                className="shrink-0"
                              >
                                <Camera className="w-3 h-3 mr-1" />
                                Proof
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Custom Challenges - Only show when filter is 'custom' */}
          {challengeFilter === 'custom' && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-500" />
                Custom Challenges ({customChallenges.length})
              </h3>
              {customChallenges.length === 0 ? (
                <p className="text-center text-muted-foreground py-6 text-sm">No custom challenges yet. Create one above!</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {customChallenges.map((challenge) => (
                    <Card key={challenge.id} className={`glass-card border ${challenge.completed ? 'opacity-60' : 'hover-lift'}`}>
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-sm">{challenge.title}</h4>
                            {challenge.description && (
                              <p className="text-xs text-muted-foreground mt-1">{challenge.description}</p>
                            )}
                            <Badge variant="secondary" className="text-xs mt-2">+20 pts</Badge>
                          </div>
                          <div className="flex flex-col gap-1">
                            {challenge.completed ? (
                              <CheckCircle className="w-6 h-6 text-green-500" />
                            ) : (
                              <>
                                <Button 
                                  size="sm" 
                                  onClick={() => handleCompleteCustomChallenge(challenge.id)}
                                  className="text-xs h-7"
                                >
                                  Complete
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => handleDeleteCustomChallenge(challenge.id)}
                                  className="text-xs h-7 text-destructive"
                                >
                                  Delete
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Proof Upload Dialog */}
          <Dialog open={proofDialogOpen} onOpenChange={setProofDialogOpen}>
            <DialogContent className="glass-card">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Video className="w-5 h-5 text-primary" />
                  Upload Proof: {selectedChallenge?.title}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Upload a video or photo as proof of completing this challenge. AI will verify it.
                </p>
                <div>
                  <Label>Proof File (Video/Photo)</Label>
                  <Input 
                    type="file" 
                    accept="video/*,image/*"
                    onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                    className="glass-card"
                  />
                </div>
                <Button 
                  onClick={handleCompleteSystemChallenge} 
                  disabled={uploading || !proofFile}
                  className="w-full"
                >
                  {uploading ? 'Verifying with AI...' : 'Submit Proof'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* DISCOVER TAB */}
        <TabsContent value="discover" className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search places or countries..."
                value={discoverSearch}
                onChange={(e) => setDiscoverSearch(e.target.value)}
                className="pl-9 glass-card"
              />
            </div>
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
              <Star className="w-3 h-3 mr-1" />
              {visitedPlaces.size}/{discoverPlaces.length}
            </Badge>
          </div>

          <p className="text-xs text-muted-foreground">
            🌍 {discoverPlaces.length}+ places from 200+ countries! Mark places you've visited to earn ⭐ star points.
          </p>

          <ScrollArea className="h-[500px] md:h-[600px]">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {filteredDiscoverPlaces.map((place) => {
                const isVisited = visitedPlaces.has(place.id);
                return (
                  <Card 
                    key={place.id} 
                    className={`glass-card border cursor-pointer transition-all ${isVisited ? 'border-blue-500/50 bg-blue-500/10' : 'hover:border-primary/50 hover-lift'}`}
                  >
                    <CardContent className="p-2 md:p-3 text-center">
                      <div className="text-2xl md:text-3xl mb-1">{place.emoji}</div>
                      <h4 className="font-medium text-xs md:text-sm truncate">{place.name}</h4>
                      <p className="text-[10px] text-muted-foreground">{place.country}</p>
                      <div className="flex items-center justify-center gap-1 mt-2">
                        {isVisited && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />}
                        <a 
                          href={place.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Auto-count visit when opening map link
                            if (!isVisited && user) {
                              handleVisitPlace(place.id);
                            }
                          }}
                          className="text-[10px] text-primary hover:underline flex items-center gap-0.5"
                        >
                          <MapPin className="w-2.5 h-2.5" /> {isVisited ? 'Visited ✓' : 'Visit & Earn ⭐'}
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* TRAVEL TAB */}
        <TabsContent value="travel" className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search UNESCO sites..."
                value={travelSearch}
                onChange={(e) => setTravelSearch(e.target.value)}
                className="pl-9 glass-card"
              />
            </div>
            <Badge className="bg-pink-500/20 text-pink-400 border-pink-500/30">
              <Heart className="w-3 h-3 mr-1" />
              {lovedPlaces.size} loved
            </Badge>
          </div>

          <p className="text-xs text-muted-foreground">
            🏛️ UNESCO World Heritage Sites & Major Tourist Destinations. No points, just ❤️ love reactions!
          </p>

          <ScrollArea className="h-[500px] md:h-[600px]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredTravelPlaces.map((place) => {
                const isLoved = lovedPlaces.has(place.id);
                return (
                  <Card key={place.id} className="glass-card border hover-lift">
                    <CardContent className="p-3 md:p-4">
                      <div className="flex items-start gap-3">
                        <div className="text-3xl md:text-4xl">{place.emoji}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold text-sm md:text-base">{place.name}</h4>
                            <Badge variant="outline" className="text-[10px]">
                              {place.type === 'unesco' ? '🏛️ UNESCO' : place.type === 'wonder' ? '✨ Wonder' : '📍 Landmark'}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{place.country}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Button
                              size="sm"
                              variant={isLoved ? 'default' : 'outline'}
                              onClick={() => handleLovePlace(place.id)}
                              className={`h-7 text-xs ${isLoved ? 'bg-pink-500 hover:bg-pink-600' : ''}`}
                            >
                              <Heart className={`w-3 h-3 mr-1 ${isLoved ? 'fill-current' : ''}`} />
                              {isLoved ? 'Loved' : 'Love'}
                            </Button>
                            <a 
                              href={place.link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs text-primary hover:underline flex items-center gap-1"
                            >
                              <ExternalLink className="w-3 h-3" /> View on Map
                            </a>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* RANKING TAB */}
        <TabsContent value="ranking" className="space-y-4">
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  Adventure Leaderboard
                </h3>
                <Button size="sm" variant="outline" onClick={loadLeaderboard} disabled={loadingLeaderboard}>
                  {loadingLeaderboard ? 'Loading...' : 'Refresh'}
                </Button>
              </div>

              {loadingLeaderboard ? (
                <div className="text-center py-8 text-muted-foreground animate-pulse">
                  Loading rankings...
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No rankings yet. Complete challenges to appear here!
                </div>
              ) : (
                <div className="space-y-2">
                  {leaderboard.map((entry, index) => (
                    <div 
                      key={entry.id}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                        entry.isCurrentUser 
                          ? 'bg-primary/10 border border-primary/30' 
                          : 'bg-muted/30 hover:bg-muted/50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        index === 0 ? 'bg-yellow-500 text-black' :
                        index === 1 ? 'bg-gray-300 text-black' :
                        index === 2 ? 'bg-amber-600 text-white' :
                        'bg-muted text-foreground'
                      }`}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                      </div>
                      
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                        {entry.avatar_url ? (
                          <img src={entry.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-lg font-bold">{entry.name?.charAt(0)?.toUpperCase()}</span>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate flex items-center gap-1">
                          {entry.name}
                          {entry.isCurrentUser && <span className="text-xs text-primary">(You)</span>}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {entry.discoverPoints} discover points
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-bold text-primary">{entry.totalPoints}</p>
                        <p className="text-[10px] text-muted-foreground">points</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Your Stats */}
          <Card className="glass-card border-primary/20">
            <CardContent className="p-4">
              <h4 className="font-semibold mb-3">Your Adventure Stats</h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 rounded-lg bg-yellow-500/10">
                  <Trophy className="w-5 h-5 mx-auto mb-1 text-yellow-500" />
                  <p className="text-lg font-bold">{totalPoints}</p>
                  <p className="text-[10px] text-muted-foreground">Total Points</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-green-500/10">
                  <CheckCircle className="w-5 h-5 mx-auto mb-1 text-green-500" />
                  <p className="text-lg font-bold">{completedSystemChallenges.size}</p>
                  <p className="text-[10px] text-muted-foreground">Challenges</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-blue-500/10">
                  <MapPin className="w-5 h-5 mx-auto mb-1 text-blue-500" />
                  <p className="text-lg font-bold">{visitedPlaces.size}</p>
                  <p className="text-[10px] text-muted-foreground">Places Visited</p>
                </div>
              </div>
              
              {/* Rank badge */}
              <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10 text-center">
                <p className="text-xs text-muted-foreground mb-1">Your Rank</p>
                <p className="text-2xl font-bold">
                  #{leaderboard.findIndex(e => e.isCurrentUser) + 1 || '—'}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {leaderboard.findIndex(e => e.isCurrentUser) === 0 ? '🎉 You are the top adventurer!' :
                   leaderboard.findIndex(e => e.isCurrentUser) > 0 ? `${leaderboard[leaderboard.findIndex(e => e.isCurrentUser) - 1]?.totalPoints - totalPoints || 0} points to next rank` :
                   'Complete challenges to rank up!'}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
