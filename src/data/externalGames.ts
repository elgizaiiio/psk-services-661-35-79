export interface ExternalGame {
  id: string;
  title: string;
  thumbnail: string;
  embedUrl: string;
  category: 'action' | 'racing' | 'puzzle' | 'sports' | 'casual' | 'arcade' | 'strategy';
  description: string;
  reward: number;
}

export const externalGames: ExternalGame[] = [
  // ألعاب ألغاز
  {
    id: '2048',
    title: '2048',
    thumbnail: '/lovable-uploads/5964f950-36a7-430c-a887-4eea91ad4973.png',
    embedUrl: 'https://fosiper.com/games/2048/',
    category: 'puzzle',
    description: 'اجمع الأرقام للوصول إلى 2048!',
    reward: 25
  },
  {
    id: 'hextris',
    title: 'Hextris',
    thumbnail: '/lovable-uploads/5964f950-36a7-430c-a887-4eea91ad4973.png',
    embedUrl: 'https://fosiper.com/games/hextris/',
    category: 'puzzle',
    description: 'تتريس سداسي سريع ومسبب للإدمان!',
    reward: 30
  },
  {
    id: 'eight-queens',
    title: 'Eight Queens',
    thumbnail: '/lovable-uploads/5964f950-36a7-430c-a887-4eea91ad4973.png',
    embedUrl: 'https://fosiper.com/games/eight-queens/',
    category: 'puzzle',
    description: 'ضع 8 ملكات على الشطرنج!',
    reward: 35
  },
  {
    id: 'twisty-polyhedra',
    title: 'Twisty Polyhedra',
    thumbnail: '/lovable-uploads/5964f950-36a7-430c-a887-4eea91ad4973.png',
    embedUrl: 'https://fosiper.com/games/twisty-polyhedra/',
    category: 'puzzle',
    description: 'مكعب روبيك ثلاثي الأبعاد!',
    reward: 40
  },
  
  // ألعاب أركيد
  {
    id: 'pacman',
    title: 'Pacman',
    thumbnail: '/lovable-uploads/5964f950-36a7-430c-a887-4eea91ad4973.png',
    embedUrl: 'https://fosiper.com/games/pacman/',
    category: 'arcade',
    description: 'باكمان الكلاسيكي!',
    reward: 30
  },
  {
    id: 'clumsy-bird',
    title: 'Clumsy Bird',
    thumbnail: '/lovable-uploads/5964f950-36a7-430c-a887-4eea91ad4973.png',
    embedUrl: 'https://fosiper.com/games/clumsy-bird/',
    category: 'arcade',
    description: 'طائر أخرق - مثل Flappy Bird!',
    reward: 25
  },
  {
    id: 'asteroids',
    title: 'Asteroids',
    thumbnail: '/lovable-uploads/5964f950-36a7-430c-a887-4eea91ad4973.png',
    embedUrl: 'https://fosiper.com/games/asteroids/',
    category: 'arcade',
    description: 'دمر الكويكبات في الفضاء!',
    reward: 25
  },
  {
    id: 'ns-shaft',
    title: 'NS-Shaft',
    thumbnail: '/lovable-uploads/5964f950-36a7-430c-a887-4eea91ad4973.png',
    embedUrl: 'https://fosiper.com/games/ns-shaft/',
    category: 'arcade',
    description: 'اقفز على المنصات واهبط!',
    reward: 20
  },
  {
    id: 'missile-game',
    title: 'Missile Game',
    thumbnail: '/lovable-uploads/5964f950-36a7-430c-a887-4eea91ad4973.png',
    embedUrl: 'https://fosiper.com/games/missile-game/',
    category: 'arcade',
    description: 'تفادي العقبات بالصاروخ!',
    reward: 25
  },
  {
    id: 'tower',
    title: 'Tower Game',
    thumbnail: '/lovable-uploads/5964f950-36a7-430c-a887-4eea91ad4973.png',
    embedUrl: 'https://fosiper.com/games/tower/',
    category: 'arcade',
    description: 'ابني أعلى برج ممكن!',
    reward: 20
  },
  
  // ألعاب سباقات
  {
    id: 'hexgl',
    title: 'HexGL',
    thumbnail: '/lovable-uploads/5964f950-36a7-430c-a887-4eea91ad4973.png',
    embedUrl: 'https://fosiper.com/games/hexgl/',
    category: 'racing',
    description: 'سباق فضائي 3D مذهل!',
    reward: 35
  },
  
  // ألعاب استراتيجية
  {
    id: 'chess',
    title: 'Chess',
    thumbnail: '/lovable-uploads/5964f950-36a7-430c-a887-4eea91ad4973.png',
    embedUrl: 'https://fosiper.com/games/chess/',
    category: 'strategy',
    description: 'لعبة الشطرنج الكلاسيكية!',
    reward: 30
  },
  {
    id: 'mah-jongg',
    title: 'Mah-jongg',
    thumbnail: '/lovable-uploads/5964f950-36a7-430c-a887-4eea91ad4973.png',
    embedUrl: 'https://fosiper.com/games/mah-jongg/',
    category: 'strategy',
    description: 'لعبة ماهجونج الصينية!',
    reward: 25
  },
  
  // ألعاب رياضية
  {
    id: 'pool',
    title: 'Pool Game',
    thumbnail: '/lovable-uploads/5964f950-36a7-430c-a887-4eea91ad4973.png',
    embedUrl: 'https://fosiper.com/games/pool/',
    category: 'sports',
    description: 'بلياردو كلاسيكي!',
    reward: 25
  },
  
  // ألعاب أكشن
  {
    id: 'dead-valley',
    title: 'Dead Valley',
    thumbnail: '/lovable-uploads/5964f950-36a7-430c-a887-4eea91ad4973.png',
    embedUrl: 'https://fosiper.com/games/dead-valley/',
    category: 'action',
    description: 'اهرب من الزومبي!',
    reward: 30
  },
  {
    id: 'underrun',
    title: 'Underrun',
    thumbnail: '/lovable-uploads/5964f950-36a7-430c-a887-4eea91ad4973.png',
    embedUrl: 'https://fosiper.com/games/underrun/',
    category: 'action',
    description: 'إطلاق نار من منظور علوي!',
    reward: 35
  },
  {
    id: 'fire-n-ice',
    title: 'Fire n Ice',
    thumbnail: '/lovable-uploads/5964f950-36a7-430c-a887-4eea91ad4973.png',
    embedUrl: 'https://fosiper.com/games/fire-n-ice/',
    category: 'action',
    description: 'مغامرة النار والجليد!',
    reward: 25
  },
  
  // ألعاب عادية
  {
    id: 'tap-tap-tap',
    title: 'Tap Tap Tap',
    thumbnail: '/lovable-uploads/5964f950-36a7-430c-a887-4eea91ad4973.png',
    embedUrl: 'https://fosiper.com/games/tap-tap-tap/',
    category: 'casual',
    description: 'انقر بأسرع ما يمكن!',
    reward: 15
  },
  {
    id: 'particle-clicker',
    title: 'Particle Clicker',
    thumbnail: '/lovable-uploads/5964f950-36a7-430c-a887-4eea91ad4973.png',
    embedUrl: 'https://fosiper.com/games/particle-clicker/',
    category: 'casual',
    description: 'اكتشف فيزياء الجسيمات!',
    reward: 20
  },
  {
    id: '3d-city',
    title: '3D City',
    thumbnail: '/lovable-uploads/5964f950-36a7-430c-a887-4eea91ad4973.png',
    embedUrl: 'https://fosiper.com/games/3d.city/',
    category: 'casual',
    description: 'ابني مدينتك ثلاثية الأبعاد!',
    reward: 25
  }
];

export const categories = [
  { id: 'all', label: 'الكل', emoji: '🎮' },
  { id: 'arcade', label: 'أركيد', emoji: '👾' },
  { id: 'puzzle', label: 'ألغاز', emoji: '🧩' },
  { id: 'action', label: 'أكشن', emoji: '🔫' },
  { id: 'racing', label: 'سباقات', emoji: '🚗' },
  { id: 'strategy', label: 'استراتيجية', emoji: '♟️' },
  { id: 'sports', label: 'رياضة', emoji: '🎱' },
  { id: 'casual', label: 'عادية', emoji: '🎯' }
];
