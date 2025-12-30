// Cache utilities for localStorage and performance optimization

const CACHE_PREFIX = 'bolt_cache_';
const COMPLETED_TASKS_KEY = 'bolt_completed_tasks';

// Cache expiry times
export const CACHE_EXPIRY = {
  tasks: 5 * 60 * 1000, // 5 minutes
  characters: 10 * 60 * 1000, // 10 minutes
  challenges: 5 * 60 * 1000, // 5 minutes
  achievements: 10 * 60 * 1000, // 10 minutes
  default: 24 * 60 * 60 * 1000, // 24 hours
};

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

// Cache object with get/set methods
export const cache = {
  set: <T>(key: string, data: T, expiryMs: number = CACHE_EXPIRY.default): void => {
    try {
      const item: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        expiry: expiryMs,
      };
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(item));
    } catch (error) {
      clearExpiredCache();
    }
  },

  get: <T>(key: string): T | null => {
    try {
      const item = localStorage.getItem(CACHE_PREFIX + key);
      if (!item) return null;

      const cached: CacheItem<T> = JSON.parse(item);
      const isExpired = Date.now() - cached.timestamp > cached.expiry;

      if (isExpired) {
        localStorage.removeItem(CACHE_PREFIX + key);
        return null;
      }

      return cached.data;
    } catch {
      return null;
    }
  },

  remove: (key: string): void => {
    try {
      localStorage.removeItem(CACHE_PREFIX + key);
    } catch (e) {
      console.warn('Cache remove failed:', e);
    }
  },

  clear: (): void => {
    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX));
      keys.forEach(k => localStorage.removeItem(k));
    } catch (e) {
      console.warn('Cache clear failed:', e);
    }
  },
};

// Completed tasks storage (permanent, never expires)
export const completedTasksStorage = {
  get: (): Set<string> => {
    try {
      const raw = localStorage.getItem(COMPLETED_TASKS_KEY);
      if (!raw) return new Set();
      return new Set(JSON.parse(raw));
    } catch (e) {
      return new Set();
    }
  },

  add: (taskId: string): void => {
    try {
      const completed = completedTasksStorage.get();
      completed.add(taskId);
      localStorage.setItem(COMPLETED_TASKS_KEY, JSON.stringify([...completed]));
    } catch (e) {
      console.warn('Failed to save completed task:', e);
    }
  },

  remove: (taskId: string): void => {
    try {
      const completed = completedTasksStorage.get();
      completed.delete(taskId);
      localStorage.setItem(COMPLETED_TASKS_KEY, JSON.stringify([...completed]));
    } catch (e) {
      console.warn('Failed to remove completed task:', e);
    }
  },

  has: (taskId: string): boolean => {
    return completedTasksStorage.get().has(taskId);
  },

  sync: (taskIds: string[]): void => {
    try {
      const current = completedTasksStorage.get();
      taskIds.forEach(id => current.add(id));
      localStorage.setItem(COMPLETED_TASKS_KEY, JSON.stringify([...current]));
    } catch (e) {
      console.warn('Failed to sync completed tasks:', e);
    }
  },
};

// Legacy exports for backwards compatibility
export function setCache<T>(key: string, data: T, expiryMs: number = CACHE_EXPIRY.default): void {
  cache.set(key, data, expiryMs);
}

export function getCache<T>(key: string): T | null {
  return cache.get<T>(key);
}

// Clear expired cache items
export function clearExpiredCache(): void {
  const keys = Object.keys(localStorage);
  const now = Date.now();

  keys.forEach((key) => {
    if (key.startsWith(CACHE_PREFIX)) {
      try {
        const item = localStorage.getItem(key);
        if (item) {
          const cached = JSON.parse(item);
          if (now - cached.timestamp > cached.expiry) {
            localStorage.removeItem(key);
          }
        }
      } catch {
        localStorage.removeItem(key);
      }
    }
  });
}

// Clear all cache
export function clearAllCache(): void {
  cache.clear();
}

// Preload and cache images
export async function preloadImages(urls: string[]): Promise<void> {
  const promises = urls.map((url) => {
    return new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => resolve();
      img.src = url;
    });
  });
  await Promise.all(promises);
}

// Register service worker
export async function registerServiceWorker(): Promise<void> {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });
      console.log('SW registered:', registration.scope);
    } catch (error) {
      console.log('SW registration failed:', error);
    }
  }
}

// Prefetch critical resources
export function prefetchResources(urls: string[]): void {
  urls.forEach((url) => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = url;
    document.head.appendChild(link);
  });
}

// Image lazy loading with IntersectionObserver
export function setupLazyImages(): void {
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
              observer.unobserve(img);
            }
          }
        });
      },
      { rootMargin: '50px' }
    );

    document.querySelectorAll('img[data-src]').forEach((img) => {
      observer.observe(img);
    });
  }
}
