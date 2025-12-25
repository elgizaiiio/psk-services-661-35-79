export interface ExternalGame {
  id: string;
  title: string;
  thumbnail: string;
  embedUrl: string;
  category: 'action' | 'racing' | 'puzzle' | 'sports' | 'casual' | 'adventure' | 'simulation';
  description: string;
  reward: number;
}

export const externalGames: ExternalGame[] = [
  // ألعاب أكشن
  {
    id: 'gta-simulator',
    title: 'GTA Simulator',
    thumbnail: 'https://www.onlinegames.io/media/posts/416/responsive/GTA-Simulator-xs.jpg',
    embedUrl: 'https://www.onlinegames.io/games/2023/unity2/gta-simulator/index.html',
    category: 'action',
    description: 'استكشف المدينة مثل GTA!',
    reward: 30
  },
  {
    id: 'cs-online',
    title: 'CS Online',
    thumbnail: 'https://www.onlinegames.io/media/posts/434/responsive/CS-Online-xs.jpg',
    embedUrl: 'https://www.onlinegames.io/games/2023/unity2/cs-online/index.html',
    category: 'action',
    description: 'لعبة إطلاق نار متعددة اللاعبين!',
    reward: 35
  },
  {
    id: 'masked-special-forces',
    title: 'Masked Special Forces',
    thumbnail: 'https://www.onlinegames.io/media/posts/310/responsive/Masked-Special-Forces-FPS-xs.jpg',
    embedUrl: 'https://www.onlinegames.io/games/2022/unity2/masked-special-forces/index.html',
    category: 'action',
    description: 'معارك FPS مع تخصيص كامل!',
    reward: 30
  },
  {
    id: 'stickman-gta-city',
    title: 'Stickman GTA City',
    thumbnail: 'https://www.onlinegames.io/media/posts/900/responsive/stickman-gta-city-free-xs.jpg',
    embedUrl: 'https://cloud.onlinegames.io/games/2024/unity3/stickman-gta-city/index-og.html',
    category: 'action',
    description: 'GTA بأسلوب Stickman!',
    reward: 25
  },
  
  // ألعاب سباقات
  {
    id: 'drift-king',
    title: 'Drift King',
    thumbnail: 'https://www.onlinegames.io/media/posts/729/responsive/Drift-King-xs.jpg',
    embedUrl: 'https://www.onlinegames.io/games/2024/unity/drift-king/index.html',
    category: 'racing',
    description: 'ملك الدريفت مع 10 سيارات!',
    reward: 25
  },
  {
    id: 'drift-hunters-pro',
    title: 'Drift Hunters Pro',
    thumbnail: 'https://www.onlinegames.io/media/posts/397/responsive/Drift-Hunters-Pro-xs.jpg',
    embedUrl: 'https://www.onlinegames.io/games/2023/unity/drift-hunters-pro/index.html',
    category: 'racing',
    description: 'سباقات دريفت 3D احترافية!',
    reward: 30
  },
  {
    id: 'madalin-stunt-cars',
    title: 'Madalin Stunt Cars Pro',
    thumbnail: 'https://www.onlinegames.io/media/posts/401/responsive/Madalin-Stunt-Cars-Pro-Game-xs.jpg',
    embedUrl: 'https://www.onlinegames.io/games/2023/unity/madalin-stunt-cars-pro/index.html',
    category: 'racing',
    description: 'سيارات فاخرة وحركات جنونية!',
    reward: 25
  },
  {
    id: 'highway-traffic',
    title: 'Highway Traffic',
    thumbnail: 'https://www.onlinegames.io/media/posts/32/responsive/Highway-Traffic-2-xs.jpg',
    embedUrl: 'https://www.onlinegames.io/games/2022/unity/highway-traffic/index.html',
    category: 'racing',
    description: 'تجنب السيارات على الطريق السريع!',
    reward: 20
  },
  {
    id: 'burnout-city',
    title: 'Burnout City',
    thumbnail: 'https://www.onlinegames.io/media/posts/861/responsive/burnoutcity-xs.jpg',
    embedUrl: 'https://cloud.onlinegames.io/games/2024/unity/burnout-city/index-og.html',
    category: 'racing',
    description: 'مدينة الليل والدريفت!',
    reward: 25
  },
  
  // ألعاب مغامرة
  {
    id: 'cubecraft-survival',
    title: 'CubeCraft Survival',
    thumbnail: 'https://www.onlinegames.io/media/posts/1113/responsive/cubecraft-survival-xs.webp',
    embedUrl: 'https://cloud.onlinegames.io/games/2025/unity4/cubecraft-survival/index-og.html',
    category: 'adventure',
    description: 'مثل Minecraft - بناء واستكشاف!',
    reward: 30
  },
  
  // ألعاب محاكاة
  {
    id: 'real-flight-simulator',
    title: 'Real Flight Simulator',
    thumbnail: 'https://www.onlinegames.io/media/posts/342/responsive/Real-Flight-Simulator-2-xs.jpg',
    embedUrl: 'https://cloud.onlinegames.io/games/2023/unity2/real-flight-simulator/index.html',
    category: 'simulation',
    description: 'قيادة طائرات واقعية!',
    reward: 20
  },
  
  // ألعاب رياضة
  {
    id: 'basket-hoop',
    title: 'Basket Hoop',
    thumbnail: 'https://www.onlinegames.io/media/posts/843/responsive/Basket-Hoop-xs.jpg',
    embedUrl: 'https://cloud.onlinegames.io/games/2024/construct/311/basket-hoop/index-og.html',
    category: 'sports',
    description: 'كرة سلة بسيطة وممتعة!',
    reward: 15
  },
  
  // ألعاب عادية
  {
    id: 'stickman-parkour',
    title: 'Stickman Parkour',
    thumbnail: 'https://www.onlinegames.io/media/posts/871/responsive/stickman-parkour-OG-xs.jpg',
    embedUrl: 'https://cloud.onlinegames.io/games/2024/construct/219/stickman-parkour/index-og.html',
    category: 'casual',
    description: 'باركور مع Stickman!',
    reward: 15
  },
  {
    id: 'get-on-top',
    title: 'Get On Top',
    thumbnail: 'https://www.onlinegames.io/media/posts/697/responsive/Get-on-Top-xs.jpg',
    embedUrl: 'https://www.onlinegames.io/games/2024/code/6/get-on-top/index.html',
    category: 'casual',
    description: 'لاعبين 2 - مصارعة مضحكة!',
    reward: 20
  }
];

export const categories = [
  { id: 'all', label: 'الكل', emoji: '🎮' },
  { id: 'action', label: 'أكشن', emoji: '🔫' },
  { id: 'racing', label: 'سباقات', emoji: '🚗' },
  { id: 'adventure', label: 'مغامرة', emoji: '⚔️' },
  { id: 'sports', label: 'رياضة', emoji: '⚽' },
  { id: 'casual', label: 'عادية', emoji: '🎯' },
  { id: 'simulation', label: 'محاكاة', emoji: '✈️' }
];
