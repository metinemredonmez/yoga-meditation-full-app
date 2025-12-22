'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  IconVideo,
  IconClock,
  IconFlame,
  IconSearch,
  IconHeart,
  IconHeartFilled,
  IconPlayerPlay,
  IconFilter,
} from '@tabler/icons-react';
import { getClasses, getFavorites, toggleFavorite } from '@/lib/api';
import { canAccessPremiumContent } from '@/lib/auth';
import { PremiumBadge, PremiumLockIcon } from '@/components/ui/premium-badge';
import { PremiumModal } from '@/components/ui/premium-modal';
import { toast } from 'sonner';

interface YogaClass {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  duration: number;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  category?: string;
  instructor?: {
    name: string;
  };
  isFavorite?: boolean;
  isPremium?: boolean;
}

export default function StudentClassesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showFavoritesOnly = searchParams.get('favorites') === 'true';
  const [classes, setClasses] = useState<YogaClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);
  const userCanAccessPremium = canAccessPremiumContent();

  useEffect(() => {
    loadClasses();
  }, [showFavoritesOnly]);

  const loadClasses = async () => {
    try {
      setLoading(true);
      if (showFavoritesOnly) {
        const favoritesResponse = await getFavorites({ itemType: 'CLASS', limit: 50 });
        const favoriteItems = favoritesResponse.favorites || favoritesResponse.items || favoritesResponse.data || [];
        const classesFromFavorites = favoriteItems.map((fav: { item?: YogaClass; itemId: string }) => ({
          ...(fav.item || {}),
          id: fav.item?.id || fav.itemId,
          isFavorite: true,
        }));
        setClasses(classesFromFavorites);
      } else {
        const response = await getClasses({ limit: 50 });
        setClasses(response.data || response.classes || []);
      }
    } catch (error) {
      console.error('Failed to load classes:', error);
      toast.error('Dersler yuklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent, classId: string) => {
    e.stopPropagation();
    try {
      await toggleFavorite(classId, 'CLASS');
      setClasses(prev =>
        prev.map(c =>
          c.id === classId ? { ...c, isFavorite: !c.isFavorite } : c
        )
      );
      toast.success('Favoriler guncellendi');
    } catch (error) {
      toast.error('Favori guncellenemedi');
    }
  };

  const handleCardClick = (yogaClass: YogaClass) => {
    // If premium content and user doesn't have access, show modal
    if (yogaClass.isPremium && !userCanAccessPremium) {
      setPremiumModalOpen(true);
      return;
    }
    router.push(`/student/classes/${yogaClass.id}`);
  };

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'BEGINNER':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">Baslangic</Badge>;
      case 'INTERMEDIATE':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Orta</Badge>;
      case 'ADVANCED':
        return <Badge variant="secondary" className="bg-red-100 text-red-800">Ileri</Badge>;
      default:
        return <Badge variant="secondary">{difficulty}</Badge>;
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} dk`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours} sa ${mins} dk` : `${hours} sa`;
  };

  const filteredClasses = classes.filter(c => {
    const matchesSearch = !searchQuery ||
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDifficulty = !selectedDifficulty || c.difficulty === selectedDifficulty;
    return matchesSearch && matchesDifficulty;
  });

  return (
    <PageContainer scrollable>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {showFavoritesOnly ? 'Favori Derslerim' : 'Yoga Dersleri'}
          </h2>
          <p className="text-muted-foreground">
            {showFavoritesOnly
              ? 'Favorilere eklediginiz yoga dersleri.'
              : 'Tum yoga derslerini kesfet ve pratik yap.'}
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Ders ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={selectedDifficulty === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedDifficulty(null)}
            >
              Tumu
            </Button>
            <Button
              variant={selectedDifficulty === 'BEGINNER' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedDifficulty('BEGINNER')}
            >
              Baslangic
            </Button>
            <Button
              variant={selectedDifficulty === 'INTERMEDIATE' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedDifficulty('INTERMEDIATE')}
            >
              Orta
            </Button>
            <Button
              variant={selectedDifficulty === 'ADVANCED' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedDifficulty('ADVANCED')}
            >
              Ileri
            </Button>
          </div>
        </div>

        {/* Classes Grid */}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <Skeleton className="h-40 w-full rounded-t-lg" />
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredClasses.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredClasses.map((yogaClass) => {
              const isPremiumLocked = yogaClass.isPremium && !userCanAccessPremium;
              return (
              <Card
                key={yogaClass.id}
                className="overflow-hidden cursor-pointer hover:shadow-lg transition-all group"
                onClick={() => handleCardClick(yogaClass)}
              >
                <div className="relative h-40 bg-gradient-to-br from-purple-500 to-pink-500">
                  {yogaClass.thumbnailUrl ? (
                    <img
                      src={yogaClass.thumbnailUrl}
                      alt={yogaClass.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <IconVideo className="h-16 w-16 text-white/50" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <IconPlayerPlay className="h-12 w-12 text-white" />
                  </div>
                  {/* Premium Lock Icon */}
                  {isPremiumLocked && <PremiumLockIcon />}
                  <button
                    onClick={(e) => handleToggleFavorite(e, yogaClass.id)}
                    className="absolute top-2 right-2 p-2 rounded-full bg-black/30 hover:bg-black/50 transition-colors"
                  >
                    {yogaClass.isFavorite ? (
                      <IconHeartFilled className="h-5 w-5 text-red-500" />
                    ) : (
                      <IconHeart className="h-5 w-5 text-white" />
                    )}
                  </button>
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold line-clamp-1 group-hover:text-primary transition-colors">
                      {yogaClass.title}
                    </h3>
                    <div className="flex items-center gap-1">
                      {yogaClass.isPremium && <PremiumBadge size="sm" showText={false} />}
                      {getDifficultyBadge(yogaClass.difficulty)}
                    </div>
                  </div>
                  {yogaClass.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {yogaClass.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <IconClock className="h-4 w-4" />
                      {formatDuration(yogaClass.duration)}
                    </div>
                    {yogaClass.instructor && (
                      <div className="flex items-center gap-1">
                        <span>{yogaClass.instructor.name}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <IconVideo className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground text-center">
                {searchQuery || selectedDifficulty
                  ? 'Aramanizla eslesen ders bulunamadi.'
                  : 'Henuz ders bulunmuyor.'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Premium Modal */}
      <PremiumModal open={premiumModalOpen} onOpenChange={setPremiumModalOpen} />
    </PageContainer>
  );
}
