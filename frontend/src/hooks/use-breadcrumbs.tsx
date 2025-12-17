'use client';

import { usePathname } from 'next/navigation';
import { useMemo } from 'react';

type BreadcrumbItem = {
  title: string;
  link: string;
};

// Segment title mappings for Turkish/English labels
const segmentTitles: Record<string, string> = {
  'dashboard': 'Dashboard',
  'overview': 'Genel Bakış',
  'users': 'Kullanıcılar',
  'instructors': 'Eğitmenler',
  'programs': 'Programlar',
  'classes': 'Dersler',
  'poses': 'Pozlar',
  'challenges': 'Meydan Okumalar',
  'subscriptions': 'Abonelikler',
  'payments': 'Ödemeler',
  'notifications': 'Bildirimler',
  'settings': 'Ayarlar',
  'profile': 'Profil',
  'analytics': 'Analitik',
  'moderation': 'Moderasyon',
  'live-streams': 'Canlı Yayınlar',
  'audit-logs': 'Denetim Kayıtları',
  'community': 'Topluluk',
  'categories': 'Kategoriler',
  'topics': 'Konular',
  'reports': 'Raporlar',
  'gamification': 'Oyunlaştırma',
  'achievements': 'Başarımlar',
  'quests': 'Görevler',
  'leaderboard': 'Lider Tablosu',
  'shop': 'Mağaza',
  'daily-rewards': 'Günlük Ödüller',
  'podcasts': 'Podcastler',
  'edit': 'Düzenle',
  'new': 'Yeni',
  'create': 'Oluştur',
};

// Get a readable title for a path segment
function getSegmentTitle(segment: string): string {
  // Check if it's a UUID or numeric ID
  if (/^[0-9a-f-]{36}$/i.test(segment) || /^\d+$/.test(segment)) {
    return 'Detay';
  }
  return segmentTitles[segment.toLowerCase()] || segment.charAt(0).toUpperCase() + segment.slice(1);
}

export function useBreadcrumbs() {
  const pathname = usePathname();

  const breadcrumbs = useMemo(() => {
    // Generate breadcrumbs from the path with proper titles
    const segments = pathname.split('/').filter(Boolean);

    // Skip [[...profile]] style catch-all routes
    const filteredSegments = segments.filter(seg => !seg.startsWith('[['));

    return filteredSegments.map((segment, index) => {
      const path = `/${filteredSegments.slice(0, index + 1).join('/')}`;
      return {
        title: getSegmentTitle(segment),
        link: path
      };
    });
  }, [pathname]);

  return breadcrumbs;
}

export type { BreadcrumbItem };
