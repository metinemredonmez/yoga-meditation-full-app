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
  IconYoga,
  IconSearch,
  IconHeart,
  IconHeartFilled,
  IconChevronRight,
  IconStretching,
} from '@tabler/icons-react';
import { getPoses, getFavorites, toggleFavorite } from '@/lib/api';
import { canAccessPremiumContent } from '@/lib/auth';
import { PremiumBadge, PremiumLockIcon } from '@/components/ui/premium-badge';
import { PremiumModal } from '@/components/ui/premium-modal';
import { toast } from 'sonner';

interface Pose {
  id: string;
  name: string;
  sanskritName?: string;
  description?: string;
  imageUrl?: string;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  category?: string;
  benefits?: string[];
  isFavorite?: boolean;
  isPremium?: boolean;
}

export default function StudentPosesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showFavoritesOnly = searchParams.get('favorites') === 'true';
  const [poses, setPoses] = useState<Pose[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);
  const userCanAccessPremium = canAccessPremiumContent();

  useEffect(() => {
    loadPoses();
  }, [showFavoritesOnly]);

  const loadPoses = async () => {
    try {
      setLoading(true);
      if (showFavoritesOnly) {
        const favoritesResponse = await getFavorites({ itemType: 'POSE', limit: 100 });
        const favoriteItems = favoritesResponse.favorites || favoritesResponse.items || favoritesResponse.data || [];
        const posesFromFavorites = favoriteItems.map((fav: { item?: Pose; itemId: string }) => ({
          ...(fav.item || {}),
          id: fav.item?.id || fav.itemId,
          isFavorite: true,
        }));
        setPoses(posesFromFavorites);
      } else {
        const response = await getPoses({ limit: 100 });
        setPoses(response.data || response.poses || []);
      }
    } catch (error) {
      console.error('Failed to load poses:', error);
      toast.error('Pozlar yuklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent, poseId: string) => {
    e.stopPropagation();
    try {
      await toggleFavorite(poseId, 'POSE');
      setPoses(prev =>
        prev.map(p =>
          p.id === poseId ? { ...p, isFavorite: !p.isFavorite } : p
        )
      );
      toast.success('Favoriler guncellendi');
    } catch (error) {
      toast.error('Favori guncellenemedi');
    }
  };

  const handleCardClick = (pose: Pose) => {
    if (pose.isPremium && !userCanAccessPremium) {
      setPremiumModalOpen(true);
      return;
    }
    router.push(`/student/poses/${pose.id}`);
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

  const filteredPoses = poses.filter(p => {
    const matchesSearch = !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sanskritName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDifficulty = !selectedDifficulty || p.difficulty === selectedDifficulty;
    return matchesSearch && matchesDifficulty;
  });

  return (
    <PageContainer scrollable>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {showFavoritesOnly ? 'Favori Pozlarim' : 'Yoga Pozlari'}
          </h2>
          <p className="text-muted-foreground">
            {showFavoritesOnly
              ? 'Favorilere eklediginiz yoga pozlari.'
              : 'Tum yoga pozlarini kesfet ve tekniklerini ogren.'}
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Poz ara..."
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

        {/* Poses Grid */}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Card key={i}>
                <Skeleton className="h-32 w-full rounded-t-lg" />
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredPoses.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {filteredPoses.map((pose) => {
              const isPremiumLocked = pose.isPremium && !userCanAccessPremium;
              return (
              <Card
                key={pose.id}
                className="overflow-hidden cursor-pointer hover:shadow-lg transition-all group"
                onClick={() => handleCardClick(pose)}
              >
                <div className="relative h-32 bg-gradient-to-br from-amber-500 to-orange-500">
                  {pose.imageUrl ? (
                    <img
                      src={pose.imageUrl}
                      alt={pose.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <IconYoga className="h-12 w-12 text-white/50" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <IconChevronRight className="h-10 w-10 text-white" />
                  </div>
                  {/* Premium Lock Icon */}
                  {isPremiumLocked && <PremiumLockIcon size="sm" />}
                  <button
                    onClick={(e) => handleToggleFavorite(e, pose.id)}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/30 hover:bg-black/50 transition-colors"
                  >
                    {pose.isFavorite ? (
                      <IconHeartFilled className="h-4 w-4 text-red-500" />
                    ) : (
                      <IconHeart className="h-4 w-4 text-white" />
                    )}
                  </button>
                </div>
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">
                        {pose.name}
                      </h3>
                      {pose.sanskritName && (
                        <p className="text-xs text-muted-foreground italic">
                          {pose.sanskritName}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {pose.isPremium && <PremiumBadge size="sm" showText={false} />}
                      {getDifficultyBadge(pose.difficulty)}
                    </div>
                  </div>
                  {pose.category && (
                    <Badge variant="outline" className="text-xs mt-1">
                      {pose.category}
                    </Badge>
                  )}
                </CardContent>
              </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <IconYoga className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground text-center">
                {searchQuery || selectedDifficulty
                  ? 'Aramanizla eslesen poz bulunamadi.'
                  : 'Henuz poz bulunmuyor.'}
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
