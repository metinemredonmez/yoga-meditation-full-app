'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  IconLayoutGrid,
  IconClock,
  IconCalendar,
  IconSearch,
  IconHeart,
  IconHeartFilled,
  IconChevronRight,
  IconTrophy,
} from '@tabler/icons-react';
import { getPrograms, getFavorites, toggleFavorite } from '@/lib/api';
import { canAccessPremiumContent } from '@/lib/auth';
import { PremiumBadge, PremiumLockIcon } from '@/components/ui/premium-badge';
import { PremiumModal } from '@/components/ui/premium-modal';
import { toast } from 'sonner';

interface Program {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  duration: number;
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  classCount?: number;
  totalDuration?: number;
  progress?: number;
  isFavorite?: boolean;
  isPremium?: boolean;
}

export default function StudentProgramsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showFavoritesOnly = searchParams.get('favorites') === 'true';
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);
  const userCanAccessPremium = canAccessPremiumContent();

  useEffect(() => {
    loadPrograms();
  }, [showFavoritesOnly]);

  const loadPrograms = async () => {
    try {
      setLoading(true);
      if (showFavoritesOnly) {
        const favoritesResponse = await getFavorites({ itemType: 'PROGRAM', limit: 50 });
        const favoriteItems = favoritesResponse.favorites || favoritesResponse.items || favoritesResponse.data || [];
        const programsFromFavorites = favoriteItems.map((fav: { item?: Program; itemId: string }) => ({
          ...(fav.item || {}),
          id: fav.item?.id || fav.itemId,
          isFavorite: true,
        }));
        setPrograms(programsFromFavorites);
      } else {
        const response = await getPrograms({ limit: 50 });
        setPrograms(response.data || response.programs || []);
      }
    } catch (error) {
      console.error('Failed to load programs:', error);
      toast.error('Programlar yuklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent, programId: string) => {
    e.stopPropagation();
    try {
      await toggleFavorite(programId, 'PROGRAM');
      setPrograms(prev =>
        prev.map(p =>
          p.id === programId ? { ...p, isFavorite: !p.isFavorite } : p
        )
      );
      toast.success('Favoriler guncellendi');
    } catch (error) {
      toast.error('Favori guncellenemedi');
    }
  };

  const handleCardClick = (program: Program) => {
    if (program.isPremium && !userCanAccessPremium) {
      setPremiumModalOpen(true);
      return;
    }
    router.push(`/student/programs/${program.id}`);
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

  const filteredPrograms = programs.filter(p => {
    const matchesSearch = !searchQuery ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDifficulty = !selectedDifficulty || p.difficulty === selectedDifficulty;
    return matchesSearch && matchesDifficulty;
  });

  return (
    <PageContainer scrollable>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {showFavoritesOnly ? 'Favori Programlarim' : 'Programlar'}
          </h2>
          <p className="text-muted-foreground">
            {showFavoritesOnly
              ? 'Favorilere eklediginiz yoga programlari.'
              : 'Hedeflerine uygun yoga programlarini kesfet.'}
          </p>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Program ara..."
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

        {/* Programs Grid */}
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
        ) : filteredPrograms.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredPrograms.map((program) => {
              const isPremiumLocked = program.isPremium && !userCanAccessPremium;
              return (
              <Card
                key={program.id}
                className="overflow-hidden cursor-pointer hover:shadow-lg transition-all group"
                onClick={() => handleCardClick(program)}
              >
                <div className="relative h-40 bg-gradient-to-br from-blue-500 to-cyan-500">
                  {program.thumbnailUrl ? (
                    <img
                      src={program.thumbnailUrl}
                      alt={program.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <IconLayoutGrid className="h-16 w-16 text-white/50" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <IconChevronRight className="h-12 w-12 text-white" />
                  </div>
                  {/* Premium Lock Icon */}
                  {isPremiumLocked && <PremiumLockIcon />}
                  <button
                    onClick={(e) => handleToggleFavorite(e, program.id)}
                    className="absolute top-2 right-2 p-2 rounded-full bg-black/30 hover:bg-black/50 transition-colors"
                  >
                    {program.isFavorite ? (
                      <IconHeartFilled className="h-5 w-5 text-red-500" />
                    ) : (
                      <IconHeart className="h-5 w-5 text-white" />
                    )}
                  </button>
                  {program.progress !== undefined && program.progress > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 px-3 py-1">
                      <div className="flex items-center gap-2">
                        <Progress value={program.progress} className="h-1.5 flex-1" />
                        <span className="text-xs text-white">%{program.progress}</span>
                      </div>
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold line-clamp-1 group-hover:text-primary transition-colors">
                      {program.title}
                    </h3>
                    <div className="flex items-center gap-1">
                      {program.isPremium && <PremiumBadge size="sm" showText={false} />}
                      {getDifficultyBadge(program.difficulty)}
                    </div>
                  </div>
                  {program.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {program.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {program.classCount && (
                      <div className="flex items-center gap-1">
                        <IconCalendar className="h-4 w-4" />
                        {program.classCount} ders
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <IconClock className="h-4 w-4" />
                      {formatDuration(program.totalDuration || program.duration)}
                    </div>
                  </div>
                </CardContent>
              </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <IconLayoutGrid className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground text-center">
                {searchQuery || selectedDifficulty
                  ? 'Aramanizla eslesen program bulunamadi.'
                  : 'Henuz program bulunmuyor.'}
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
