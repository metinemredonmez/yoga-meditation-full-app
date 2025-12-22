'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { IconSearch, IconDotsVertical, IconLoader2, IconUsers, IconMail, IconStar, IconCalendar } from '@tabler/icons-react';
import PageContainer from '@/components/layout/page-container';

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

  useEffect(() => { loadStudents(); }, [search]);

  const loadStudents = async () => {
    setLoading(true);
    try {
      setStudents([
        { id: '1', firstName: 'Ayşe', lastName: 'Yılmaz', email: 'ayse@example.com', avatarUrl: '', enrolledClasses: 12, completedClasses: 8, totalWatchTime: 14400, averageRating: 4.9, joinedAt: '2024-01-15', lastActiveAt: new Date().toISOString() },
        { id: '2', firstName: 'Mehmet', lastName: 'Kaya', email: 'mehmet@example.com', avatarUrl: '', enrolledClasses: 8, completedClasses: 5, totalWatchTime: 9000, averageRating: 4.7, joinedAt: '2024-02-20', lastActiveAt: new Date(Date.now() - 86400000).toISOString() },
        { id: '3', firstName: 'Zeynep', lastName: 'Demir', email: 'zeynep@example.com', avatarUrl: '', enrolledClasses: 15, completedClasses: 15, totalWatchTime: 27000, averageRating: 5.0, joinedAt: '2023-12-01', lastActiveAt: new Date().toISOString() },
        { id: '4', firstName: 'Ali', lastName: 'Çelik', email: 'ali@example.com', avatarUrl: '', enrolledClasses: 3, completedClasses: 1, totalWatchTime: 1800, averageRating: 4.5, joinedAt: '2024-03-10', lastActiveAt: new Date(Date.now() - 172800000).toISOString() },
      ]);
    } finally { setLoading(false); }
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><IconDotsVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem><IconMail className="mr-2 h-4 w-4" />Mesaj Gönder</DropdownMenuItem>
                          <DropdownMenuItem><IconUsers className="mr-2 h-4 w-4" />Profili Görüntüle</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
