'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { IconSearch, IconLoader2, IconUsers, IconStar, IconCalendar, IconMail, IconClock, IconBook } from '@tabler/icons-react';
import PageContainer from '@/components/layout/page-container';
import api from '@/lib/api';
import { toast } from 'sonner';

interface MyStudent {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
  enrolledClasses: number;
  completedClasses: number;
  totalWatchTime: number;
  averageRating: number;
  joinedAt: string;
  lastActiveAt: string;
}

export default function MyStudentsPage() {
  const [students, setStudents] = useState<MyStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [profileDialog, setProfileDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<MyStudent | null>(null);

  const handleViewProfile = (student: MyStudent) => {
    setSelectedStudent(student);
    setProfileDialog(true);
  };

  useEffect(() => { loadStudents(); }, [search]);

  const loadStudents = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/instructor/students', {
        params: { search: search || undefined }
      });

      // API returns {success, items} directly, not {success, data: {items}}
      const items = response.data.data?.items || response.data.items || [];
      if (response.data.success && items.length > 0) {
        const mappedStudents = items.map((s: any) => {
          // API returns 'name' as combined name, split it
          const nameParts = (s.name || '').split(' ');
          const firstName = s.firstName || nameParts[0] || 'Anonim';
          const lastName = s.lastName || nameParts.slice(1).join(' ') || '';
          return {
            id: s.id,
            firstName,
            lastName,
            email: s.email || '',
            avatarUrl: '',
            enrolledClasses: s.enrolledClasses || s.bookingCount || 1,
            completedClasses: s.completedClasses || s.classesCompleted || 0,
            totalWatchTime: s.totalWatchTime || 0,
            averageRating: s.averageRating || 0,
            joinedAt: s.joinedAt || s.createdAt || new Date().toISOString(),
            lastActiveAt: s.lastActiveAt || s.lastActive || s.createdAt || new Date().toISOString(),
          };
        });
        setStudents(mappedStudents);
      }
    } catch (error) {
      console.error('Error loading students:', error);
      toast.error('Öğrenci listesi yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    return `${hours} saat`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  };

  return (
    <PageContainer>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2"><IconUsers className="h-5 w-5" />Öğrencilerim</CardTitle>
              <CardDescription>Derslerinize kayıtlı öğrencileri görüntüleyin</CardDescription>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">{students.length} Öğrenci</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Öğrenci ara..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Öğrenci</TableHead>
                  <TableHead>Kayıtlı Ders</TableHead>
                  <TableHead>Tamamlanan</TableHead>
                  <TableHead>İzleme Süresi</TableHead>
                  <TableHead>Verdiği Puan</TableHead>
                  <TableHead>Katılım</TableHead>
                  <TableHead>Son Aktif</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8"><IconLoader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
                ) : students.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Henüz öğrenciniz yok</TableCell></TableRow>
                ) : students.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={s.avatarUrl} />
                          <AvatarFallback>{getInitials(s.firstName, s.lastName)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{s.firstName} {s.lastName}</div>
                          <div className="text-sm text-muted-foreground">{s.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{s.enrolledClasses}</TableCell>
                    <TableCell>{s.completedClasses}</TableCell>
                    <TableCell>{formatDuration(s.totalWatchTime)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <IconStar className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        {s.averageRating.toFixed(1)}
                      </div>
                    </TableCell>
                    <TableCell><div className="flex items-center gap-1"><IconCalendar className="h-4 w-4" />{formatDate(s.joinedAt)}</div></TableCell>
                    <TableCell>{formatDate(s.lastActiveAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => handleViewProfile(s)}>
                        <IconUsers className="mr-2 h-4 w-4" />Profili Görüntüle
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Student Profile Dialog */}
      <Dialog open={profileDialog} onOpenChange={setProfileDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Öğrenci Profili</DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-6">
              {/* Profile Header */}
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedStudent.avatarUrl} />
                  <AvatarFallback className="text-lg">{getInitials(selectedStudent.firstName, selectedStudent.lastName)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{selectedStudent.firstName} {selectedStudent.lastName}</h3>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <IconMail className="h-4 w-4" />
                    <span className="text-sm">{selectedStudent.email}</span>
                  </div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <IconBook className="h-5 w-5 text-blue-500" />
                      <div>
                        <div className="text-2xl font-bold">{selectedStudent.enrolledClasses}</div>
                        <div className="text-xs text-muted-foreground">Kayıtlı Ders</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <IconStar className="h-5 w-5 text-green-500" />
                      <div>
                        <div className="text-2xl font-bold">{selectedStudent.completedClasses}</div>
                        <div className="text-xs text-muted-foreground">Tamamlanan</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <IconClock className="h-5 w-5 text-orange-500" />
                      <div>
                        <div className="text-2xl font-bold">{formatDuration(selectedStudent.totalWatchTime)}</div>
                        <div className="text-xs text-muted-foreground">İzleme Süresi</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <IconStar className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                      <div>
                        <div className="text-2xl font-bold">{selectedStudent.averageRating.toFixed(1)}</div>
                        <div className="text-xs text-muted-foreground">Verdiği Puan</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Dates */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Katılım Tarihi:</span>
                  <span>{formatDate(selectedStudent.joinedAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Son Aktif:</span>
                  <span>{formatDate(selectedStudent.lastActiveAt)}</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
