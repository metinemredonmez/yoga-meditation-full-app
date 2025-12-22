'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { IconCrown, IconCheck } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';

interface PremiumModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PremiumModal({ open, onOpenChange }: PremiumModalProps) {
  const router = useRouter();

  const features = [
    'Tum yoga derslerine sinirsiz erisim',
    'Ozel meditasyon programlari',
    'Ileri seviye poz kutuphanesi',
    'Kisisellestirilmis antrenman planlari',
    'Reklamsiz deneyim',
    'Cevrimdisi indirme ozelligi',
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-r from-amber-500 to-yellow-500 p-4 rounded-full">
              <IconCrown className="h-10 w-10 text-white" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl">Premium Gerekli</DialogTitle>
          <DialogDescription className="text-center">
            Bu icerigi izlemek icin Premium uyelik gereklidir.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-2">
                <IconCheck className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>

          <div className="pt-4 space-y-2">
            <Button
              className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600"
              onClick={() => {
                onOpenChange(false);
                router.push('/student/billing');
              }}
            >
              <IconCrown className="h-5 w-5 mr-2" />
              Premium&apos;a Yukselt
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => onOpenChange(false)}
            >
              Simdilik Vazgec
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
