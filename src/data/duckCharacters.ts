import { DuckCharacter } from '@/types/duck-characters';

const STICKER_BASE_URL = 'https://data.chpic.su/stickers/u/UtyaDuckFull';

export const duckCharacters: DuckCharacter[] = [
  {
    id: 'happy-duck',
    name: 'Happy Duck',
    nameAr: 'البطة السعيدة',
    personality: 'Cheerful & Optimistic',
    personalityAr: 'مرحة ومتفائلة',
    emoji: '🐤',
    color: '#FFD93D',
    mood: 'happy',
    description: 'Always spreading joy and positivity wherever she goes!',
    descriptionAr: 'دائماً تنشر الفرح والإيجابية أينما ذهبت!',
    rarity: 'common',
    stats: { power: 30, speed: 50, luck: 70 },
    stickerId: '001',
    stickerUrl: `${STICKER_BASE_URL}/UtyaDuckFull_001.webp`
  },
  {
    id: 'cool-duck',
    name: 'Cool Duck',
    nameAr: 'البطة الكول',
    personality: 'Stylish & Confident',
    personalityAr: 'أنيقة وواثقة',
    emoji: '😎',
    color: '#4ECDC4',
    mood: 'cool',
    description: 'The coolest duck in town with the best sunglasses!',
    descriptionAr: 'أروع بطة في المدينة مع أفضل نظارات شمسية!',
    rarity: 'rare',
    stats: { power: 45, speed: 65, luck: 55 },
    stickerId: '013',
    stickerUrl: `${STICKER_BASE_URL}/UtyaDuckFull_013.webp`
  },
  {
    id: 'nerd-duck',
    name: 'Nerd Duck',
    nameAr: 'البطة العبقرية',
    personality: 'Smart & Genius',
    personalityAr: 'ذكية وعبقرية',
    emoji: '🤓',
    color: '#9B59B6',
    mood: 'smart',
    description: 'Knows everything about everything. Ask her anything!',
    descriptionAr: 'تعرف كل شيء عن كل شيء. اسألها أي سؤال!',
    rarity: 'rare',
    stats: { power: 35, speed: 40, luck: 80 },
    stickerId: '015',
    stickerUrl: `${STICKER_BASE_URL}/UtyaDuckFull_015.webp`
  },
  {
    id: 'sleepy-duck',
    name: 'Sleepy Duck',
    nameAr: 'البطة النعسانة',
    personality: 'Lazy & Dreamy',
    personalityAr: 'كسولة وحالمة',
    emoji: '😴',
    color: '#A8E6CF',
    mood: 'sleepy',
    description: 'Zzzz... Just five more minutes... Zzzz...',
    descriptionAr: 'زززز... خمس دقائق كمان بس... زززز...',
    rarity: 'common',
    stats: { power: 20, speed: 15, luck: 60 },
    stickerId: '028',
    stickerUrl: `${STICKER_BASE_URL}/UtyaDuckFull_028.webp`
  },
  {
    id: 'party-duck',
    name: 'Party Duck',
    nameAr: 'بطة الحفلات',
    personality: 'Energetic & Fun',
    personalityAr: 'نشيطة ومرحة',
    emoji: '🎉',
    color: '#FF6B6B',
    mood: 'excited',
    description: 'Every day is a party day! Lets dance!',
    descriptionAr: 'كل يوم هو يوم حفلة! يلا نرقص!',
    rarity: 'epic',
    stats: { power: 55, speed: 80, luck: 65 },
    stickerId: '034',
    stickerUrl: `${STICKER_BASE_URL}/UtyaDuckFull_034.webp`
  },
  {
    id: 'angry-duck',
    name: 'Angry Duck',
    nameAr: 'البطة الغاضبة',
    personality: 'Fierce & Grumpy',
    personalityAr: 'شرسة وعصبية',
    emoji: '😠',
    color: '#E74C3C',
    mood: 'angry',
    description: 'Dont mess with this duck. She means business!',
    descriptionAr: 'لا تعبث مع هذه البطة. إنها جادة!',
    rarity: 'common',
    stats: { power: 85, speed: 60, luck: 25 },
    stickerId: '041',
    stickerUrl: `${STICKER_BASE_URL}/UtyaDuckFull_041.webp`
  },
  {
    id: 'love-duck',
    name: 'Love Duck',
    nameAr: 'بطة الحب',
    personality: 'Romantic & Sweet',
    personalityAr: 'رومانسية وحنونة',
    emoji: '🥰',
    color: '#FF69B4',
    mood: 'loving',
    description: 'Spreading love and hugs to everyone around!',
    descriptionAr: 'تنشر الحب والأحضان لكل من حولها!',
    rarity: 'rare',
    stats: { power: 25, speed: 45, luck: 90 },
    stickerId: '052',
    stickerUrl: `${STICKER_BASE_URL}/UtyaDuckFull_052.webp`
  },
  {
    id: 'rich-duck',
    name: 'Rich Duck',
    nameAr: 'البطة الثرية',
    personality: 'Wealthy & Lucky',
    personalityAr: 'ثرية ومحظوظة',
    emoji: '🤑',
    color: '#2ECC71',
    mood: 'greedy',
    description: 'Swimming in gold coins like a true boss!',
    descriptionAr: 'تسبح في العملات الذهبية مثل زعيمة حقيقية!',
    rarity: 'epic',
    stats: { power: 40, speed: 50, luck: 95 },
    stickerId: '067',
    stickerUrl: `${STICKER_BASE_URL}/UtyaDuckFull_067.webp`
  },
  {
    id: 'super-duck',
    name: 'Super Duck',
    nameAr: 'البطة الخارقة',
    personality: 'Heroic & Brave',
    personalityAr: 'بطلة وشجاعة',
    emoji: '🦸',
    color: '#3498DB',
    mood: 'heroic',
    description: 'Saving the world one quack at a time!',
    descriptionAr: 'تنقذ العالم بصوت واحد في كل مرة!',
    rarity: 'legendary',
    stats: { power: 95, speed: 90, luck: 75 },
    stickerId: '075',
    stickerUrl: `${STICKER_BASE_URL}/UtyaDuckFull_075.webp`
  },
  {
    id: 'wizard-duck',
    name: 'Wizard Duck',
    nameAr: 'البطة الساحرة',
    personality: 'Mystical & Wise',
    personalityAr: 'غامضة وحكيمة',
    emoji: '🧙',
    color: '#8E44AD',
    mood: 'mystical',
    description: 'Master of ancient duck magic and spells!',
    descriptionAr: 'سيدة سحر البط القديم والتعويذات!',
    rarity: 'legendary',
    stats: { power: 85, speed: 70, luck: 88 },
    stickerId: '082',
    stickerUrl: `${STICKER_BASE_URL}/UtyaDuckFull_082.webp`
  },
  {
    id: 'pirate-duck',
    name: 'Pirate Duck',
    nameAr: 'البطة القرصانة',
    personality: 'Adventurous & Bold',
    personalityAr: 'مغامرة وجريئة',
    emoji: '🏴‍☠️',
    color: '#34495E',
    mood: 'adventurous',
    description: 'Arrr! Searching for treasure across the seven seas!',
    descriptionAr: 'آرر! تبحث عن الكنز عبر البحار السبعة!',
    rarity: 'epic',
    stats: { power: 70, speed: 75, luck: 70 },
    stickerId: '089',
    stickerUrl: `${STICKER_BASE_URL}/UtyaDuckFull_089.webp`
  },
  {
    id: 'royal-duck',
    name: 'Royal Duck',
    nameAr: 'البطة الملكية',
    personality: 'Noble & Elegant',
    personalityAr: 'نبيلة وأنيقة',
    emoji: '👑',
    color: '#F39C12',
    mood: 'royal',
    description: 'Bow before the queen of all ducks!',
    descriptionAr: 'انحني أمام ملكة جميع البط!',
    rarity: 'legendary',
    stats: { power: 80, speed: 65, luck: 92 },
    stickerId: '096',
    stickerUrl: `${STICKER_BASE_URL}/UtyaDuckFull_096.webp`
  }
];

export const getRarityColor = (rarity: string): string => {
  switch (rarity) {
    case 'common': return 'from-gray-400 to-gray-600';
    case 'rare': return 'from-blue-400 to-blue-600';
    case 'epic': return 'from-purple-400 to-purple-600';
    case 'legendary': return 'from-yellow-400 to-amber-500';
    default: return 'from-gray-400 to-gray-600';
  }
};

export const getRarityBorder = (rarity: string): string => {
  switch (rarity) {
    case 'common': return 'border-gray-400';
    case 'rare': return 'border-blue-400';
    case 'epic': return 'border-purple-400';
    case 'legendary': return 'border-yellow-400';
    default: return 'border-gray-400';
  }
};

export const getRarityGlow = (rarity: string): string => {
  switch (rarity) {
    case 'common': return '';
    case 'rare': return 'shadow-blue-500/30';
    case 'epic': return 'shadow-purple-500/40';
    case 'legendary': return 'shadow-yellow-500/50 animate-pulse';
    default: return '';
  }
};
