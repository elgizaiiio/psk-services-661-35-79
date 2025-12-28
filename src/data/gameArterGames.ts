export interface GameArterGame {
  id: string;
  title: string;
  titleAr: string;
  thumbnail: string;
  embedUrl: string;
  category: 'fps' | 'idle' | 'puzzle' | 'strategy' | 'sports' | 'action' | '3d' | 'casual';
  description: string;
  descriptionAr: string;
  reward: number;
}

export const gameArterGames: GameArterGame[] = [
  {
    id: 'pepecoin-miner',
    title: 'Pepecoin Miner Idle Simulator',
    titleAr: 'محاكي تعدين بيبي كوين',
    thumbnail: 'https://img.gamedistribution.com/c6a8f3c3c5c04e6f9c8c8c8c8c8c8c8c.512x512.jpg',
    embedUrl: 'https://www.gamearter.com/game/pepecoin-miner/',
    category: 'idle',
    description: 'Mine crypto coins in this idle simulator',
    descriptionAr: 'اجمع العملات في هذا المحاكي',
    reward: 15
  },
  {
    id: 'counter-craft-2',
    title: 'Counter Craft Modern Warfare 2',
    titleAr: 'كاونتر كرافت 2',
    thumbnail: 'https://img.gamedistribution.com/fps-game-thumb.jpg',
    embedUrl: 'https://www.gamearter.com/game/counter-craft-modern-warfare-2/',
    category: 'fps',
    description: 'First person shooter action game',
    descriptionAr: 'لعبة تصويب من منظور الشخص الأول',
    reward: 20
  },
  {
    id: 'poppy-strike-5',
    title: 'Poppy Strike 5',
    titleAr: 'بوبي سترايك 5',
    thumbnail: 'https://img.gamedistribution.com/poppy-strike.jpg',
    embedUrl: 'https://www.gamearter.com/game/poppy-strike-5/',
    category: 'fps',
    description: 'Action packed FPS game',
    descriptionAr: 'لعبة أكشن تصويب',
    reward: 18
  },
  {
    id: 'zombies-idle-defense',
    title: 'Zombies Idle Defense Tycoon',
    titleAr: 'دفاع الزومبي',
    thumbnail: 'https://img.gamedistribution.com/zombie-defense.jpg',
    embedUrl: 'https://www.gamearter.com/game/zombies-idle-defense-tycoon/',
    category: 'strategy',
    description: 'Defend against zombie hordes',
    descriptionAr: 'دافع ضد جحافل الزومبي',
    reward: 15
  },
  {
    id: 'dino-runner-3d',
    title: 'Dino Runner 3D',
    titleAr: 'ديناصور الركض 3D',
    thumbnail: 'https://img.gamedistribution.com/dino-runner.jpg',
    embedUrl: 'https://www.gamearter.com/game/dino-runner-3d/',
    category: '3d',
    description: '3D endless runner with dinosaurs',
    descriptionAr: 'لعبة ركض لا نهائية ثلاثية الأبعاد',
    reward: 12
  },
  {
    id: 'boxing-legend-2077',
    title: 'Boxing Legend Simulator 2077',
    titleAr: 'أسطورة الملاكمة 2077',
    thumbnail: 'https://img.gamedistribution.com/boxing-legend.jpg',
    embedUrl: 'https://www.gamearter.com/game/boxing-legend-simulator-2077/',
    category: 'sports',
    description: 'Become a boxing champion',
    descriptionAr: 'كن بطل الملاكمة',
    reward: 16
  },
  {
    id: 'stickman-airplane',
    title: 'Stickman Airplane',
    titleAr: 'طائرة ستيكمان',
    thumbnail: 'https://img.gamedistribution.com/stickman-plane.jpg',
    embedUrl: 'https://www.gamearter.com/game/stickman-airplane/',
    category: '3d',
    description: 'Fly stickman airplanes',
    descriptionAr: 'قُد طائرات ستيكمان',
    reward: 14
  },
  {
    id: 'geometry-parkour',
    title: 'Geometry Parkour',
    titleAr: 'باركور هندسي',
    thumbnail: 'https://img.gamedistribution.com/geometry-parkour.jpg',
    embedUrl: 'https://www.gamearter.com/game/geometry-parkour/',
    category: 'action',
    description: 'Parkour through geometric obstacles',
    descriptionAr: 'اقفز عبر العقبات الهندسية',
    reward: 13
  },
  {
    id: 'fruit-bounce',
    title: 'Fruit Bounce',
    titleAr: 'ارتداد الفواكه',
    thumbnail: 'https://img.gamedistribution.com/fruit-bounce.jpg',
    embedUrl: 'https://www.gamearter.com/game/fruit-bounce/',
    category: 'casual',
    description: 'Bounce fruits to score points',
    descriptionAr: 'اقذف الفواكه للحصول على نقاط',
    reward: 10
  },
  {
    id: 'woody-hexa',
    title: 'Woody Hexa Puzzle',
    titleAr: 'لغز وودي السداسي',
    thumbnail: 'https://img.gamedistribution.com/woody-hexa.jpg',
    embedUrl: 'https://www.gamearter.com/game/woody-hexa/',
    category: 'puzzle',
    description: 'Hexagonal wood block puzzle',
    descriptionAr: 'لغز الكتل الخشبية السداسية',
    reward: 12
  },
  {
    id: 'number-bubble-shooter',
    title: 'Number Bubble Shooter',
    titleAr: 'رماية فقاعات الأرقام',
    thumbnail: 'https://img.gamedistribution.com/number-bubble.jpg',
    embedUrl: 'https://www.gamearter.com/game/number-bubble-shooter/',
    category: 'puzzle',
    description: 'Shoot bubbles with numbers',
    descriptionAr: 'أطلق الفقاعات بالأرقام',
    reward: 11
  },
  {
    id: 'mythinsects-tower-defense',
    title: 'Mythinsects Tower Defense',
    titleAr: 'دفاع أبراج الحشرات',
    thumbnail: 'https://img.gamedistribution.com/mythinsects.jpg',
    embedUrl: 'https://www.gamearter.com/game/mythinsects-tower-defense/',
    category: 'strategy',
    description: 'Tower defense with mythical insects',
    descriptionAr: 'دفاع الأبراج مع الحشرات الأسطورية',
    reward: 15
  },
  {
    id: 'heart-forge',
    title: 'Heart Forge',
    titleAr: 'صياغة القلوب',
    thumbnail: 'https://img.gamedistribution.com/heart-forge.jpg',
    embedUrl: 'https://www.gamearter.com/game/heart-forge/',
    category: 'strategy',
    description: 'Strategic heart forging game',
    descriptionAr: 'لعبة استراتيجية لصياغة القلوب',
    reward: 14
  },
  {
    id: 'stickman-jump',
    title: 'Stickman Jump',
    titleAr: 'قفز ستيكمان',
    thumbnail: 'https://img.gamedistribution.com/stickman-jump.jpg',
    embedUrl: 'https://www.gamearter.com/game/stickman-jump/',
    category: 'action',
    description: 'Jump and climb with stickman',
    descriptionAr: 'اقفز وتسلق مع ستيكمان',
    reward: 10
  },
  {
    id: 'doodle-dash',
    title: 'Doodle Dash',
    titleAr: 'داش الرسم',
    thumbnail: 'https://img.gamedistribution.com/doodle-dash.jpg',
    embedUrl: 'https://www.gamearter.com/game/doodle-dash/',
    category: 'action',
    description: 'Fast paced doodle running game',
    descriptionAr: 'لعبة ركض سريعة',
    reward: 11
  },
  {
    id: 'labubu-shooter',
    title: 'Labubu Shooter',
    titleAr: 'لابوبو شوتر',
    thumbnail: 'https://img.gamedistribution.com/labubu-shooter.jpg',
    embedUrl: 'https://www.gamearter.com/game/labubu-shooter/',
    category: 'action',
    description: 'Shoot and destroy enemies',
    descriptionAr: 'أطلق ودمر الأعداء',
    reward: 13
  },
  {
    id: 'shark-tralalero',
    title: 'Shark Tralalero Tralala',
    titleAr: 'سمكة القرش ترالاليرو',
    thumbnail: 'https://img.gamedistribution.com/shark-tralalero.jpg',
    embedUrl: 'https://www.gamearter.com/game/shark-tralalero-tralala/',
    category: 'casual',
    description: 'Fun shark adventure game',
    descriptionAr: 'لعبة مغامرات القرش الممتعة',
    reward: 12
  },
  {
    id: 'globe-quiz',
    title: 'Globe Quiz',
    titleAr: 'اختبار الكرة الأرضية',
    thumbnail: 'https://img.gamedistribution.com/globe-quiz.jpg',
    embedUrl: 'https://www.gamearter.com/game/globe-quiz/',
    category: 'puzzle',
    description: 'Test your geography knowledge',
    descriptionAr: 'اختبر معلوماتك الجغرافية',
    reward: 14
  },
  {
    id: 'draw-logic-puzzle',
    title: 'Draw Logic Puzzle',
    titleAr: 'لغز الرسم المنطقي',
    thumbnail: 'https://img.gamedistribution.com/draw-logic.jpg',
    embedUrl: 'https://www.gamearter.com/game/draw-logic-puzzle/',
    category: 'puzzle',
    description: 'Draw to solve logic puzzles',
    descriptionAr: 'ارسم لحل الألغاز المنطقية',
    reward: 13
  },
  {
    id: 'pixel-combat',
    title: 'Pixel Combat Multiplayer',
    titleAr: 'قتال البكسل',
    thumbnail: 'https://img.gamedistribution.com/pixel-combat.jpg',
    embedUrl: 'https://www.gamearter.com/game/pixel-combat-multiplayer/',
    category: 'fps',
    description: 'Multiplayer pixel shooter',
    descriptionAr: 'لعبة تصويب بكسل متعددة اللاعبين',
    reward: 18
  },
  {
    id: 'idle-mining-empire',
    title: 'Idle Mining Empire',
    titleAr: 'إمبراطورية التعدين',
    thumbnail: 'https://img.gamedistribution.com/idle-mining.jpg',
    embedUrl: 'https://www.gamearter.com/game/idle-mining-empire/',
    category: 'idle',
    description: 'Build your mining empire',
    descriptionAr: 'ابنِ إمبراطورية التعدين الخاصة بك',
    reward: 15
  },
  {
    id: 'car-racing-3d',
    title: 'Car Racing 3D',
    titleAr: 'سباق السيارات 3D',
    thumbnail: 'https://img.gamedistribution.com/car-racing.jpg',
    embedUrl: 'https://www.gamearter.com/game/car-racing-3d/',
    category: '3d',
    description: '3D car racing action',
    descriptionAr: 'سباق سيارات ثلاثي الأبعاد',
    reward: 16
  },
  {
    id: 'merge-master',
    title: 'Merge Master',
    titleAr: 'سيد الدمج',
    thumbnail: 'https://img.gamedistribution.com/merge-master.jpg',
    embedUrl: 'https://www.gamearter.com/game/merge-master/',
    category: 'casual',
    description: 'Merge items to grow stronger',
    descriptionAr: 'ادمج العناصر لتصبح أقوى',
    reward: 11
  },
  {
    id: 'soccer-skills',
    title: 'Soccer Skills World Cup',
    titleAr: 'مهارات كرة القدم',
    thumbnail: 'https://img.gamedistribution.com/soccer-skills.jpg',
    embedUrl: 'https://www.gamearter.com/game/soccer-skills-world-cup/',
    category: 'sports',
    description: 'World cup soccer game',
    descriptionAr: 'لعبة كأس العالم لكرة القدم',
    reward: 15
  }
];

export const gameArterCategories = [
  { id: 'all', label: 'الكل', labelEn: 'All', emoji: '🎮' },
  { id: 'fps', label: 'تصويب', labelEn: 'FPS', emoji: '🔫' },
  { id: 'idle', label: 'خاملة', labelEn: 'Idle', emoji: '⏰' },
  { id: 'puzzle', label: 'ألغاز', labelEn: 'Puzzle', emoji: '🧩' },
  { id: 'strategy', label: 'استراتيجية', labelEn: 'Strategy', emoji: '♟️' },
  { id: 'sports', label: 'رياضة', labelEn: 'Sports', emoji: '⚽' },
  { id: 'action', label: 'أكشن', labelEn: 'Action', emoji: '💥' },
  { id: '3d', label: '3D', labelEn: '3D', emoji: '🎲' },
  { id: 'casual', label: 'عادية', labelEn: 'Casual', emoji: '🎯' }
];
