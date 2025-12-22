'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { IconCalendar, IconChevronLeft, IconChevronRight, IconBroadcast, IconVideo, IconUsers, IconClock } from '@tabler/icons-react';
import PageContainer from '@/components/layout/page-container';

interface CalendarEvent {
  id: string;
  title: string;
  type: 'live' | 'class' | 'workshop';
  date: Date;
  duration: number;
  participants?: number;
  status: 'upcoming' | 'live' | 'completed';
}

const eventTypeColors: Record<string, string> = {
  live: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700',
  class: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',
  workshop: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700',
};

const eventTypeLabels: Record<string, string> = { live: 'Canlı', class: 'Ders', workshop: 'Workshop' };

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  useEffect(() => {
    // Mock events
    const today = new Date();
    setEvents([
      { id: '1', title: 'Sabah Yoga Akışı', type: 'live', date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 9, 0), duration: 60, participants: 45, status: 'upcoming' },
      { id: '2', title: 'Akşam Meditasyonu', type: 'live', date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 3, 20, 0), duration: 30, participants: 12, status: 'upcoming' },
      { id: '3', title: 'Pilates Workshop', type: 'workshop', date: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7, 14, 0), duration: 120, participants: 30, status: 'upcoming' },
      { id: '4', title: 'Nefes Çalışması', type: 'class', date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2, 10, 0), duration: 45, participants: 28, status: 'completed' },
    ]);
  }, []);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    return { daysInMonth, startingDay };
  };

  const { daysInMonth, startingDay } = getDaysInMonth(currentDate);

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const getEventsForDay = (day: number) => {
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.getDate() === day &&
             eventDate.getMonth() === currentDate.getMonth() &&
             eventDate.getFullYear() === currentDate.getFullYear();
    });
  };

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() &&
           currentDate.getMonth() === today.getMonth() &&
           currentDate.getFullYear() === today.getFullYear();
  };

  const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  const dayNames = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

  // Upcoming events
  const upcomingEvents = events.filter(e => e.status === 'upcoming').sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, 5);

  return (
    <PageContainer>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <IconCalendar className="h-5 w-5" />
                Takvim
              </CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={prevMonth}>
                  <IconChevronLeft className="h-4 w-4" />
                </Button>
                <span className="font-medium min-w-[140px] text-center">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </span>
                <Button variant="outline" size="icon" onClick={nextMonth}>
                  <IconChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map(day => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells for days before the first day of the month */}
              {Array.from({ length: startingDay }, (_, i) => (
                <div key={`empty-${i}`} className="h-24 p-1 bg-muted/30 rounded-lg" />
              ))}

              {/* Days of the month */}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const dayEvents = getEventsForDay(day);
                return (
                  <div
                    key={day}
                    className={`h-24 p-1 rounded-lg border ${isToday(day) ? 'border-primary bg-primary/5' : 'border-border'}`}
                  >
                    <div className={`text-sm font-medium mb-1 ${isToday(day) ? 'text-primary' : ''}`}>
                      {day}
                    </div>
                    <div className="space-y-1">
                      {dayEvents.slice(0, 2).map(event => (
                        <div
                          key={event.id}
                          className={`text-xs px-1 py-0.5 rounded truncate border ${eventTypeColors[event.type]}`}
                        >
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-xs text-muted-foreground">
                          +{dayEvents.length - 2} daha
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader>
            <CardTitle>Yaklaşan Etkinlikler</CardTitle>
            <CardDescription>Gelecek 7 gün içindeki programınız</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Yaklaşan etkinlik yok
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingEvents.map(event => (
                  <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg border">
                    <div className={`p-2 rounded-lg ${event.type === 'live' ? 'bg-red-100 dark:bg-red-900/30' : event.type === 'class' ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-purple-100 dark:bg-purple-900/30'}`}>
                      {event.type === 'live' ? <IconBroadcast className="h-5 w-5" /> : <IconVideo className="h-5 w-5" />}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{event.title}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                        <IconCalendar className="h-4 w-4" />
                        {event.date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                        <IconClock className="h-4 w-4 ml-2" />
                        {event.date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs">
                          {eventTypeLabels[event.type]}
                        </Badge>
                        {event.participants && (
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <IconUsers className="h-3 w-3" />
                            {event.participants} katılımcı
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
