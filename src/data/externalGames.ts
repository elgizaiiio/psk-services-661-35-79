// Game thumbnail imports
import game2048 from '@/assets/games/2048.png';
import gameHextris from '@/assets/games/hextris.png';
import gameChess from '@/assets/games/chess.png';
import gamePacman from '@/assets/games/pacman.png';
import gameClumsyBird from '@/assets/games/clumsy-bird.png';
import gameAsteroids from '@/assets/games/asteroids.png';
import gameHexgl from '@/assets/games/hexgl.png';
import gamePool from '@/assets/games/pool.png';
import gameDeadValley from '@/assets/games/dead-valley.png';
import gameUnderrun from '@/assets/games/underrun.png';
import gameFireNIce from '@/assets/games/fire-n-ice.png';
import gameTower from '@/assets/games/tower.png';
import gameMissile from '@/assets/games/missile.png';
import gameNsShaft from '@/assets/games/ns-shaft.png';
import gameEightQueens from '@/assets/games/eight-queens.png';
import gameTwistyPolyhedra from '@/assets/games/twisty-polyhedra.png';
import gameMahJongg from '@/assets/games/mah-jongg.png';
import gameTapTapTap from '@/assets/games/tap-tap-tap.png';
import gameParticleClicker from '@/assets/games/particle-clicker.png';
import game3dCity from '@/assets/games/3d-city.png';
import gameSurvevIo from '@/assets/games/survev-io.png';

export interface ExternalGame {
  id: string;
  title: string;
  thumbnail: string;
  embedUrl: string;
  category: 'action' | 'racing' | 'puzzle' | 'sports' | 'casual' | 'arcade' | 'strategy' | 'battle-royale';
  description: string;
  reward: number;
}

export const externalGames: ExternalGame[] = [
  // ألعاب باتل رويال
  {
    id: 'survev-io',
    title: 'Survev.io Battle Royale',
    thumbnail: gameSurvevIo,
    embedUrl: 'https://survev.io',
    category: 'battle-royale',
    description: 'باتل رويال 2D - كن آخر الناجين من 50 لاعب!',
    reward: 50
  },
  
  // ألعاب ألغاز
  {
    id: '2048',
    title: '2048',
    thumbnail: game2048,
    embedUrl: 'https://fosiper.com/games/2048/',
    category: 'puzzle',
    description: 'اجمع الأرقام للوصول إلى 2048!',
    reward: 25
  },
  {
    id: 'hextris',
    title: 'Hextris',
    thumbnail: gameHextris,
    embedUrl: 'https://fosiper.com/games/hextris/',
    category: 'puzzle',
    description: 'تتريس سداسي سريع ومسبب للإدمان!',
    reward: 30
  },
  {
    id: 'eight-queens',
    title: 'Eight Queens',
    thumbnail: gameEightQueens,
    embedUrl: 'https://fosiper.com/games/eight-queens/',
    category: 'puzzle',
    description: 'ضع 8 ملكات على الشطرنج!',
    reward: 35
  },
  {
    id: 'twisty-polyhedra',
    title: 'Twisty Polyhedra',
    thumbnail: gameTwistyPolyhedra,
    embedUrl: 'https://fosiper.com/games/twisty-polyhedra/',
    category: 'puzzle',
    description: 'مكعب روبيك ثلاثي الأبعاد!',
    reward: 40
  },
  
  // ألعاب أركيد
  {
    id: 'pacman',
    title: 'Pacman',
    thumbnail: gamePacman,
    embedUrl: 'https://fosiper.com/games/pacman/',
    category: 'arcade',
    description: 'باكمان الكلاسيكي!',
    reward: 30
  },
  {
    id: 'clumsy-bird',
    title: 'Clumsy Bird',
    thumbnail: gameClumsyBird,
    embedUrl: 'https://fosiper.com/games/clumsy-bird/',
    category: 'arcade',
    description: 'طائر أخرق - مثل Flappy Bird!',
    reward: 25
  },
  {
    id: 'asteroids',
    title: 'Asteroids',
    thumbnail: gameAsteroids,
    embedUrl: 'https://fosiper.com/games/asteroids/',
    category: 'arcade',
    description: 'دمر الكويكبات في الفضاء!',
    reward: 25
  },
  {
    id: 'ns-shaft',
    title: 'NS-Shaft',
    thumbnail: gameNsShaft,
    embedUrl: 'https://fosiper.com/games/ns-shaft/',
    category: 'arcade',
    description: 'اقفز على المنصات واهبط!',
    reward: 20
  },
  {
    id: 'missile-game',
    title: 'Missile Game',
    thumbnail: gameMissile,
    embedUrl: 'https://fosiper.com/games/missile-game/',
    category: 'arcade',
    description: 'تفادي العقبات بالصاروخ!',
    reward: 25
  },
  {
    id: 'tower',
    title: 'Tower Game',
    thumbnail: gameTower,
    embedUrl: 'https://fosiper.com/games/tower/',
    category: 'arcade',
    description: 'ابني أعلى برج ممكن!',
    reward: 20
  },
  
  // ألعاب سباقات
  {
    id: 'hexgl',
    title: 'HexGL',
    thumbnail: gameHexgl,
    embedUrl: 'https://fosiper.com/games/hexgl/',
    category: 'racing',
    description: 'سباق فضائي 3D مذهل!',
    reward: 35
  },
  
  // ألعاب استراتيجية
  {
    id: 'chess',
    title: 'Chess',
    thumbnail: gameChess,
    embedUrl: 'https://fosiper.com/games/chess/',
    category: 'strategy',
    description: 'لعبة الشطرنج الكلاسيكية!',
    reward: 30
  },
  {
    id: 'mah-jongg',
    title: 'Mah-jongg',
    thumbnail: gameMahJongg,
    embedUrl: 'https://fosiper.com/games/mah-jongg/',
    category: 'strategy',
    description: 'لعبة ماهجونج الصينية!',
    reward: 25
  },
  
  // ألعاب رياضية
  {
    id: 'pool',
    title: 'Pool Game',
    thumbnail: gamePool,
    embedUrl: 'https://fosiper.com/games/pool/',
    category: 'sports',
    description: 'بلياردو كلاسيكي!',
    reward: 25
  },
  
  // ألعاب أكشن
  {
    id: 'dead-valley',
    title: 'Dead Valley',
    thumbnail: gameDeadValley,
    embedUrl: 'https://fosiper.com/games/dead-valley/',
    category: 'action',
    description: 'اهرب من الزومبي!',
    reward: 30
  },
  {
    id: 'underrun',
    title: 'Underrun',
    thumbnail: gameUnderrun,
    embedUrl: 'https://fosiper.com/games/underrun/',
    category: 'action',
    description: 'إطلاق نار من منظور علوي!',
    reward: 35
  },
  {
    id: 'fire-n-ice',
    title: 'Fire n Ice',
    thumbnail: gameFireNIce,
    embedUrl: 'https://fosiper.com/games/fire-n-ice/',
    category: 'action',
    description: 'مغامرة النار والجليد!',
    reward: 25
  },
  
  // ألعاب عادية
  {
    id: 'tap-tap-tap',
    title: 'Tap Tap Tap',
    thumbnail: gameTapTapTap,
    embedUrl: 'https://fosiper.com/games/tap-tap-tap/',
    category: 'casual',
    description: 'انقر بأسرع ما يمكن!',
    reward: 15
  },
  {
    id: 'particle-clicker',
    title: 'Particle Clicker',
    thumbnail: gameParticleClicker,
    embedUrl: 'https://fosiper.com/games/particle-clicker/',
    category: 'casual',
    description: 'اكتشف فيزياء الجسيمات!',
    reward: 20
  },
  {
    id: '3d-city',
    title: '3D City',
    thumbnail: game3dCity,
    embedUrl: 'https://fosiper.com/games/3d.city/',
    category: 'casual',
    description: 'ابني مدينتك ثلاثية الأبعاد!',
    reward: 25
  }
];

export const categories = [
  { id: 'all', label: 'الكل', emoji: '🎮' },
  { id: 'battle-royale', label: 'باتل رويال', emoji: '🎯' },
  { id: 'arcade', label: 'أركيد', emoji: '👾' },
  { id: 'puzzle', label: 'ألغاز', emoji: '🧩' },
  { id: 'action', label: 'أكشن', emoji: '🔫' },
  { id: 'racing', label: 'سباقات', emoji: '🚗' },
  { id: 'strategy', label: 'استراتيجية', emoji: '♟️' },
  { id: 'sports', label: 'رياضة', emoji: '🎱' },
  { id: 'casual', label: 'عادية', emoji: '🎯' }
];
