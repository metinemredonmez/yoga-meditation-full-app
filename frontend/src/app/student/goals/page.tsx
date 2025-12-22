'use client';

import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { IconTarget, IconPlus, IconTrophy, IconChartLine } from '@tabler/icons-react';

export default function StudentGoalsPage() {
  return (
    <PageContainer scrollable>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Hedeflerim</h2>
            <p className="text-muted-foreground">
              Kisisel hedeflerinizi belirleyin ve takip edin.
            </p>
          </div>
          <Button disabled>
            <IconPlus className="h-4 w-4 mr-2" />
            Yeni Hedef
          </Button>
        </div>

        {/* Goal Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktif Hedefler</CardTitle>
              <IconTarget className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Devam eden</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tamamlanan</CardTitle>
              <IconTrophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Basarili hedef</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ilerleme</CardTitle>
              <IconChartLine className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0%</div>
              <p className="text-xs text-muted-foreground">Ortalama</p>
            </CardContent>
          </Card>
        </div>

        {/* Sample Goal Card (for UI reference) */}
        <Card className="opacity-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Ornek Hedef: Haftada 3 Ders</CardTitle>
              <span className="text-sm text-muted-foreground">0/3</span>
            </div>
            <CardDescription>Bu hafta 3 yoga dersi tamamla</CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={0} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              Bu bir ornek hedeftir. Mobil uygulamadan hedef olusturabilirsiniz.
            </p>
          </CardContent>
        </Card>

        {/* Empty State */}
        <Card>
          <CardHeader>
            <CardTitle>Hedefleriniz</CardTitle>
            <CardDescription>Henuz hedef belirlemediniz</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <IconTarget className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground text-center max-w-md">
              Mobil uygulamadan kisisel hedefler belirleyerek yoga yolculugunuzda
              motivasyonunuzu yuksek tutun.
            </p>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
