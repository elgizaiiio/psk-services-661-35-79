export interface ExternalGame {
  id: string;
  title: string;
  thumbnail: string;
  embedUrl: string;
  category: 'action' | 'racing' | 'puzzle' | 'sports' | 'casual' | 'arcade';
  description: string;
  reward: number;
}

export const externalGames: ExternalGame[] = [
  // ألعاب ألغاز
  {
    id: '2048',
    title: '2048',
    thumbnail: 'https://play2048.co/meta/apple-touch-icon.png',
    embedUrl: 'https://play2048.co/',
    category: 'puzzle',
    description: 'اجمع الأرقام للوصول إلى 2048!',
    reward: 25
  },
  {
    id: 'hextris',
    title: 'Hextris',
    thumbnail: 'https://hextris.io/images/hextris.png',
    embedUrl: 'https://hextris.io/',
    category: 'puzzle',
    description: 'تتريس سداسي سريع ومسبب للإدمان!',
    reward: 30
  },
  {
    id: '0hh1',
    title: '0h h1',
    thumbnail: 'https://0hh1.com/icon512.png',
    embedUrl: 'https://0hh1.com/',
    category: 'puzzle',
    description: 'ألغاز منطقية ثنائية أنيقة!',
    reward: 20
  },
  {
    id: '0hn0',
    title: '0h n0',
    thumbnail: 'https://0hn0.com/icon512.png',
    embedUrl: 'https://0hn0.com/',
    category: 'puzzle',
    description: 'ألغاز أرقام تحتاج للتفكير!',
    reward: 20
  },
  {
    id: 'cube-composer',
    title: 'Cube Composer',
    thumbnail: 'https://david-peter.de/cube-composer/img/icon.png',
    embedUrl: 'https://david-peter.de/cube-composer/',
    category: 'puzzle',
    description: 'ألغاز مكعبات ملونة!',
    reward: 25
  },
  
  // ألعاب سباقات
  {
    id: 'hexgl',
    title: 'HexGL',
    thumbnail: 'https://hexgl.bkcore.com/play/css/title.png',
    embedUrl: 'https://hexgl.bkcore.com/play/',
    category: 'racing',
    description: 'سباق فضائي 3D مثل F-Zero!',
    reward: 35
  },
  
  // ألعاب أركيد
  {
    id: 'astray',
    title: 'Astray',
    thumbnail: 'https://wwwtyro.github.io/Astray/favicon.ico',
    embedUrl: 'https://wwwtyro.github.io/Astray/',
    category: 'arcade',
    description: 'متاهة 3D - حرك الكرة للخروج!',
    reward: 25
  },
  {
    id: 'snake',
    title: 'Snake',
    thumbnail: 'https://snake-pwa.github.io/favicon.ico',
    embedUrl: 'https://snake-pwa.github.io/',
    category: 'arcade',
    description: 'لعبة الثعبان الكلاسيكية!',
    reward: 15
  },
  {
    id: 'flappy-2048',
    title: 'Flappy 2048',
    thumbnail: 'https://hczhcz.github.io/Flappy-2048/favicon.ico',
    embedUrl: 'https://hczhcz.github.io/Flappy-2048/',
    category: 'arcade',
    description: 'Flappy Bird + 2048 معاً!',
    reward: 30
  },
  {
    id: 'tetris',
    title: 'Tetris',
    thumbnail: 'https://aerolab.github.io/blockrain.js/favicon.ico',
    embedUrl: 'https://aerolab.github.io/blockrain.js/',
    category: 'arcade',
    description: 'تتريس الكلاسيكي!',
    reward: 20
  },
  
  // ألعاب عادية
  {
    id: 'solitaire',
    title: 'Solitaire',
    thumbnail: 'https://vue-solitaire.netlify.app/favicon.ico',
    embedUrl: 'https://vue-solitaire.netlify.app/',
    category: 'casual',
    description: 'سوليتير الورق الكلاسيكية!',
    reward: 15
  },
  {
    id: 'memory-game',
    title: 'Memory Game',
    thumbnail: 'https://pwa-memory-game.surge.sh/favicon.ico',
    embedUrl: 'https://pwa-memory-game.surge.sh/',
    category: 'casual',
    description: 'اختبر ذاكرتك!',
    reward: 20
  }
];

export const categories = [
  { id: 'all', label: 'الكل', emoji: '🎮' },
  { id: 'puzzle', label: 'ألغاز', emoji: '🧩' },
  { id: 'racing', label: 'سباقات', emoji: '🚗' },
  { id: 'arcade', label: 'أركيد', emoji: '👾' },
  { id: 'casual', label: 'عادية', emoji: '🎯' }
];
