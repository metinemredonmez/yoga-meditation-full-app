'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { IconSearch, IconLoader2, IconStar, IconStarFilled, IconMessageCircle, IconVideo, IconHeadphones } from '@tabler/icons-react';
import PageContainer from '@/components/layout/page-container';

interface MyReview {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  contentType: 'CLASS' | 'MEDITATION' | 'PROGRAM';
  contentTitle: string;
  rating: number;
  comment: string;
  reply?: string;
  createdAt: string;
}

const contentTypeLabels: Record<string, string> = { CLASS: 'Ders', MEDITATION: 'Meditasyon', PROGRAM: 'Program' };
const contentTypeIcons: Record<string, React.ElementType> = { CLASS: IconVideo, MEDITATION: IconHeadphones, PROGRAM: IconVideo };

export default function MyReviewsPage() {
  const [reviews, setReviews] = useState<MyReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [replyDialog, setReplyDialog] = useState(false);
  const [selectedReview, setSelectedReview] = useState<MyReview | null>(null);
  const [replyText, setReplyText] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadReviews(); }, [search]);

  const loadReviews = async () => {
    setLoading(true);
    try {
      setReviews([
        { id: '1', userId: '1', userName: 'Ayşe Yılmaz', userAvatar: '', contentType: 'CLASS', contentTitle: 'Sabah Yoga Akışı', rating: 5, comment: 'Harika bir ders! Çok faydalı ve rahatlatıcı.', createdAt: new Date(Date.now() - 86400000).toISOString() },
        { id: '2', userId: '2', userName: 'Mehmet Kaya', userAvatar: '', contentType: 'MEDITATION', contentTitle: 'Derin Uyku Meditasyonu', rating: 4, comment: 'Güzel bir meditasyon ama biraz daha uzun olabilirdi.', reply: 'Teşekkürler! Daha uzun versiyonlar üzerinde çalışıyorum.', createdAt: new Date(Date.now() - 172800000).toISOString() },
        { id: '3', userId: '3', userName: 'Zeynep Demir', userAvatar: '', contentType: 'PROGRAM', contentTitle: '30 Günde Yoga Temelleri', rating: 5, comment: 'Bu programı herkese tavsiye ederim! Harika bir başlangıç.', createdAt: new Date(Date.now() - 259200000).toISOString() },
        { id: '4', userId: '4', userName: 'Ali Çelik', userAvatar: '', contentType: 'CLASS', contentTitle: 'Power Vinyasa', rating: 3, comment: 'Zorluk seviyesi benim için biraz yüksekti.', createdAt: new Date(Date.now() - 345600000).toISOString() },
      ]);
    } finally { setLoading(false); }
  };

  const handleReply = (review: MyReview) => {
    setSelectedReview(review);
    setReplyText(review.reply || '');
    setReplyDialog(true);
  };

  const handleSaveReply = async () => {
    if (!replyText.trim()) return;
    setSaving(true);
    try {
      await new Promise(r => setTimeout(r, 1000));
      setReplyDialog(false);
      loadReviews();
    } finally { setSaving(false); }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          star <= rating
            ? <IconStarFilled key={star} className="h-4 w-4 text-yellow-500" />
            : <IconStar key={star} className="h-4 w-4 text-gray-300" />
        ))}
      </div>
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Calculate stats
  const averageRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;
  const repliedCount = reviews.filter(r => r.reply).length;

  return (
    <PageContainer>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{reviews.length}</div>
            <div className="text-sm text-muted-foreground">Toplam Değerlendirme</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold flex items-center gap-2">
              <IconStarFilled className="h-6 w-6 text-yellow-500" />
              {averageRating.toFixed(1)}
            </div>
            <div className="text-sm text-muted-foreground">Ortalama Puan</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{repliedCount}</div>
            <div className="text-sm text-muted-foreground">Yanıtlanan</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{reviews.length - repliedCount}</div>
            <div className="text-sm text-muted-foreground">Yanıt Bekleyen</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><IconStar className="h-5 w-5" />Değerlendirmeler</CardTitle>
              <CardDescription>İçeriklerinize gelen değerlendirmeleri yönetin</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Ara..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8"><IconLoader2 className="h-6 w-6 animate-spin" /></div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Henüz değerlendirme yok</div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => {
                const ContentIcon = contentTypeIcons[review.contentType];
                return (
                  <Card key={review.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={review.userAvatar} />
                            <AvatarFallback>{getInitials(review.userName)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{review.userName}</span>
                              {renderStars(review.rating)}
                              <span className="text-sm text-muted-foreground">{formatDate(review.createdAt)}</span>
                            </div>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="flex items-center gap-1">
                                <ContentIcon className="h-3 w-3" />
                                {contentTypeLabels[review.contentType]}
                              </Badge>
                              <span className="text-sm text-muted-foreground">{review.contentTitle}</span>
                            </div>
                            <p className="text-sm">{review.comment}</p>
                            {review.reply && (
                              <div className="mt-3 pl-4 border-l-2 border-primary/30">
                                <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">Yanıtınız:</span> {review.reply}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => handleReply(review)}>
                          <IconMessageCircle className="h-4 w-4 mr-1" />
                          {review.reply ? 'Düzenle' : 'Yanıtla'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={replyDialog} onOpenChange={setReplyDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Değerlendirmeyi Yanıtla</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {selectedReview && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{selectedReview.userName}</span>
                  {renderStars(selectedReview.rating)}
                </div>
                <p className="text-sm">{selectedReview.comment}</p>
              </div>
            )}
            <div className="grid gap-2">
              <Textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Yanıtınızı yazın..." rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReplyDialog(false)}>İptal</Button>
            <Button onClick={handleSaveReply} disabled={saving || !replyText.trim()}>
              {saving && <IconLoader2 className="mr-2 h-4 w-4 animate-spin" />}
              Yanıtla
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
