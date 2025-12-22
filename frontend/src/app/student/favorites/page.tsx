'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IconHeart, IconVideo, IconYoga, IconLayoutGrid, IconChevronRight } from '@tabler/icons-react';
import { getFavoriteCounts, getFavorites } from '@/lib/api';

interface FavoriteCounts {
  programs: number;
  poses: number;
  classes: number;
  total: number;
}

interface FavoriteItem {
  id: string;
  itemId: string;
  itemType: 'CLASS' | 'PROGRAM' | 'POSE';
  createdAt: string;
  item?: {
    id: string;
    title?: string;
    name?: string;
    description?: string;
    thumbnailUrl?: string;
    duration?: number;
  };
}

export default function StudentFavoritesPage() {
  const router = useRouter();
  const [counts, setCounts] = useState<FavoriteCounts | null>(null);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  const navigateToCategory = (category: string) => {
    switch (category) {
      case 'class':
        router.push('/student/classes?favorites=true');
        break;
      case 'program':
        router.push('/student/programs?favorites=true');
        break;
      case 'pose':
        router.push('/student/poses?favorites=true');
        break;
      default:
        setActiveTab(category);
    }
  };

  const navigateToItem = (favorite: FavoriteItem) => {
    switch (favorite.itemType) {
      case 'CLASS':
        router.push(`/student/classes/${favorite.itemId}`);
        break;
      case 'PROGRAM':
        router.push(`/student/programs/${favorite.itemId}`);
        break;
      case 'POSE':
        router.push(`/student/poses/${favorite.itemId}`);
        break;
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [countsRes, favoritesRes] = await Promise.allSettled([
        getFavoriteCounts(),
        getFavorites({ limit: 50 }),
      ]);

      if (countsRes.status === 'fulfilled') {
        setCounts(countsRes.value.counts || countsRes.value);
      }
      if (favoritesRes.status === 'fulfilled') {
        setFavorites(favoritesRes.value.favorites || favoritesRes.value.items || favoritesRes.value.data || []);
      }
    } catch (error) {
      console.error('Failed to load favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFavorites = activeTab === 'all'
    ? favorites
    : favorites.filter(f => f.itemType === activeTab.toUpperCase());

  const getItemTitle = (item: FavoriteItem) => {
    return item.item?.title || item.item?.name || `Icerik #${item.itemId.slice(0, 8)}`;
  };

  const getItemTypeLabel = (type: string) => {
    switch (type) {
      case 'CLASS': return 'Ders';
      case 'PROGRAM': return 'Program';
      case 'POSE': return 'Poz';
      default: return type;
    }
  };

  return (
    <PageContainer scrollable>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Favorilerim</h2>
          <p className="text-muted-foreground">
            Begendiginiz ve kaydettiginiz icerikler burada listelenir.
          </p>
        </div>

        {/* Category Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card
            className="cursor-pointer transition-all hover:border-primary/50 hover:shadow-md group"
            onClick={() => navigateToCategory('class')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Yoga Dersleri</CardTitle>
              <IconVideo className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">{counts?.classes || 0}</div>
                    <p className="text-xs text-muted-foreground">Favori ders</p>
                  </div>
                  <IconChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              )}
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer transition-all hover:border-primary/50 hover:shadow-md group"
            onClick={() => navigateToCategory('program')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Programlar</CardTitle>
              <IconLayoutGrid className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">{counts?.programs || 0}</div>
                    <p className="text-xs text-muted-foreground">Favori program</p>
                  </div>
                  <IconChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              )}
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer transition-all hover:border-primary/50 hover:shadow-md group"
            onClick={() => navigateToCategory('pose')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pozlar</CardTitle>
              <IconYoga className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">{counts?.poses || 0}</div>
                    <p className="text-xs text-muted-foreground">Favori poz</p>
                  </div>
                  <IconChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              )}
            </CardContent>
          </Card>

          <Card
            className={`cursor-pointer transition-all hover:shadow-md ${activeTab === 'all' ? 'border-primary' : 'hover:border-primary/50'}`}
            onClick={() => setActiveTab('all')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam</CardTitle>
              <IconHeart className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{counts?.total || 0}</div>
                  <p className="text-xs text-muted-foreground">Toplam favori</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Favorites List */}
        <Card>
          <CardHeader>
            <CardTitle>Favori Icerikleriniz</CardTitle>
            <CardDescription>
              {activeTab === 'all' ? 'Tum favorileriniz' : `Favori ${getItemTypeLabel(activeTab.toUpperCase()).toLowerCase()}lariniz`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredFavorites.length > 0 ? (
              <div className="space-y-3">
                {filteredFavorites.map((favorite) => (
                  <div
                    key={favorite.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-all cursor-pointer group"
                    onClick={() => navigateToItem(favorite)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        {favorite.itemType === 'CLASS' && <IconVideo className="h-6 w-6 text-primary" />}
                        {favorite.itemType === 'PROGRAM' && <IconLayoutGrid className="h-6 w-6 text-primary" />}
                        {favorite.itemType === 'POSE' && <IconYoga className="h-6 w-6 text-primary" />}
                      </div>
                      <div>
                        <p className="font-medium group-hover:text-primary transition-colors">{getItemTitle(favorite)}</p>
                        <p className="text-sm text-muted-foreground">
                          {getItemTypeLabel(favorite.itemType)} - {new Date(favorite.createdAt).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <IconHeart className="h-5 w-5 text-red-500 fill-red-500" />
                      <IconChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <IconHeart className="h-16 w-16 text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground text-center max-w-md">
                  {activeTab === 'all'
                    ? 'Mobil uygulamada begendiginiz icerikleri favorilere ekleyerek buradan kolayca erisebilirsiniz.'
                    : `Henuz favori ${getItemTypeLabel(activeTab.toUpperCase()).toLowerCase()} eklemediniz.`
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
