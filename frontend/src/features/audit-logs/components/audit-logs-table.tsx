'use client';

import { useEffect, useState, useCallback } from 'react';
import { getAuditLogs, getAuditStats, exportAuditLogs } from '@/lib/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  IconLoader2,
  IconSearch,
  IconEye,
  IconUser,
  IconSettings,
  IconTrash,
  IconEdit,
  IconPlus,
  IconShield,
  IconBan,
  IconCheck,
  IconAlertTriangle,
  IconCalendar,
  IconActivity,
  IconDownload,
  IconFilter,
  IconFilterOff,
} from '@tabler/icons-react';
import { formatDistanceToNow, format, subDays } from 'date-fns';
import { tr } from 'date-fns/locale';
import Link from 'next/link';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AuditLog {
  id: string;
  adminId: string;
  adminEmail?: string;
  adminName?: string;
  action: string;
  entityType: string;
  entityId: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

interface AuditStats {
  totalLogs: number;
  actionCounts: Record<string, number>;
  topAdmins: Array<{ adminId: string; count: number }>;
  recentActivity: number;
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-500/10 text-green-600',
  UPDATE: 'bg-blue-500/10 text-blue-600',
  DELETE: 'bg-red-500/10 text-red-600',
  LOGIN: 'bg-purple-500/10 text-purple-600',
  LOGOUT: 'bg-gray-500/10 text-gray-600',
  BAN: 'bg-orange-500/10 text-orange-600',
  UNBAN: 'bg-teal-500/10 text-teal-600',
  APPROVE: 'bg-emerald-500/10 text-emerald-600',
  REJECT: 'bg-rose-500/10 text-rose-600',
  EXPORT: 'bg-indigo-500/10 text-indigo-600',
};

const ACTION_ICONS: Record<string, React.ReactNode> = {
  CREATE: <IconPlus className='h-3 w-3' />,
  UPDATE: <IconEdit className='h-3 w-3' />,
  DELETE: <IconTrash className='h-3 w-3' />,
  LOGIN: <IconUser className='h-3 w-3' />,
  LOGOUT: <IconUser className='h-3 w-3' />,
  BAN: <IconBan className='h-3 w-3' />,
  UNBAN: <IconCheck className='h-3 w-3' />,
  APPROVE: <IconCheck className='h-3 w-3' />,
  REJECT: <IconAlertTriangle className='h-3 w-3' />,
};

const ENTITY_TYPES = [
  'USER',
  'PROGRAM',
  'CLASS',
  'POSE',
  'CHALLENGE',
  'INSTRUCTOR',
  'SUBSCRIPTION',
  'PAYMENT',
  'REPORT',
  'SETTINGS',
];

const ACTIONS = [
  'CREATE',
  'UPDATE',
  'DELETE',
  'LOGIN',
  'LOGOUT',
  'BAN',
  'UNBAN',
  'APPROVE',
  'REJECT',
  'EXPORT',
];

export function AuditLogsTable() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const hasFilters = actionFilter !== 'all' || entityFilter !== 'all' || dateRange.from || dateRange.to;

  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (actionFilter !== 'all') params.action = actionFilter;
      if (entityFilter !== 'all') params.entityType = entityFilter;
      if (dateRange.from) params.startDate = dateRange.from.toISOString();
      if (dateRange.to) params.endDate = dateRange.to.toISOString();

      const data = await getAuditLogs(params);
      setLogs(data.logs || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalCount(data.pagination?.total || 0);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter, entityFilter, dateRange]);

  const loadStats = async () => {
    try {
      const data = await getAuditStats(30);
      setStats(data.stats);
    } catch (error) {
      console.error('Failed to load audit stats:', error);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params: Record<string, string> = {};
      if (actionFilter !== 'all') params.action = actionFilter;
      if (entityFilter !== 'all') params.entityType = entityFilter;
      if (dateRange.from) params.startDate = dateRange.from.toISOString();
      if (dateRange.to) params.endDate = dateRange.to.toISOString();

      const data = await exportAuditLogs(params);

      // Create downloadable JSON file
      const blob = new Blob([JSON.stringify(data.logs, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${data.count} audit logs`);
    } catch (error) {
      console.error('Failed to export audit logs:', error);
      toast.error('Failed to export audit logs');
    } finally {
      setExporting(false);
    }
  };

  const clearFilters = () => {
    setActionFilter('all');
    setEntityFilter('all');
    setDateRange({});
    setPage(1);
  };

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  useEffect(() => {
    loadStats();
  }, []);

  const getActionBadge = (action: string) => {
    const color = ACTION_COLORS[action] || 'bg-gray-500/10 text-gray-600';
    const icon = ACTION_ICONS[action];
    return (
      <Badge className={`${color} flex items-center gap-1`}>
        {icon}
        {action}
      </Badge>
    );
  };

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      const parts = name.split(' ');
      return parts.length >= 2
        ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
        : name.substring(0, 2).toUpperCase();
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return 'AD';
  };

  const filteredLogs = logs.filter((log) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      log.adminEmail?.toLowerCase().includes(searchLower) ||
      log.adminName?.toLowerCase().includes(searchLower) ||
      log.entityType.toLowerCase().includes(searchLower) ||
      log.entityId.toLowerCase().includes(searchLower) ||
      log.action.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className='space-y-6'>
      {/* Stats Cards */}
      {stats && (
        <div className='grid gap-4 md:grid-cols-4'>
          <Card>
            <CardHeader className='pb-2'>
              <CardDescription className='flex items-center gap-2'>
                <IconActivity className='h-4 w-4' />
                Total Actions
              </CardDescription>
              <CardTitle className='text-2xl'>{stats.totalLogs?.toLocaleString()}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className='pb-2'>
              <CardDescription className='flex items-center gap-2'>
                <IconCalendar className='h-4 w-4' />
                Last 24h
              </CardDescription>
              <CardTitle className='text-2xl'>{stats.recentActivity?.toLocaleString() || 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className='pb-2'>
              <CardDescription className='flex items-center gap-2'>
                <IconPlus className='h-4 w-4' />
                Creates
              </CardDescription>
              <CardTitle className='text-2xl'>{stats.actionCounts?.CREATE?.toLocaleString() || 0}</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className='pb-2'>
              <CardDescription className='flex items-center gap-2'>
                <IconTrash className='h-4 w-4' />
                Deletes
              </CardDescription>
              <CardTitle className='text-2xl'>{stats.actionCounts?.DELETE?.toLocaleString() || 0}</CardTitle>
            </CardHeader>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className='flex flex-col gap-4'>
        <div className='flex flex-col sm:flex-row gap-4'>
          <div className='relative flex-1'>
            <IconSearch className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
            <Input
              placeholder='Search logs...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='pl-9'
            />
          </div>
          <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(1); }}>
            <SelectTrigger className='w-[150px]'>
              <SelectValue placeholder='Action' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Actions</SelectItem>
              {ACTIONS.map((action) => (
                <SelectItem key={action} value={action}>{action}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={entityFilter} onValueChange={(v) => { setEntityFilter(v); setPage(1); }}>
            <SelectTrigger className='w-[150px]'>
              <SelectValue placeholder='Entity' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Entities</SelectItem>
              {ENTITY_TYPES.map((entity) => (
                <SelectItem key={entity} value={entity}>{entity}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant='outline'
                className={cn(
                  'w-[200px] justify-start text-left font-normal',
                  !dateRange.from && 'text-muted-foreground'
                )}
              >
                <IconCalendar className='mr-2 h-4 w-4' />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, 'LLL dd')} - {format(dateRange.to, 'LLL dd')}
                    </>
                  ) : (
                    format(dateRange.from, 'LLL dd, y')
                  )
                ) : (
                  'Date range'
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className='w-auto p-0' align='start'>
              <Calendar
                initialFocus
                mode='range'
                defaultMonth={dateRange.from}
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range) => {
                  setDateRange({ from: range?.from, to: range?.to });
                  setPage(1);
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            {hasFilters && (
              <Button variant='ghost' size='sm' onClick={clearFilters}>
                <IconFilterOff className='h-4 w-4 mr-1' />
                Clear filters
              </Button>
            )}
            {hasFilters && (
              <Badge variant='secondary'>
                {totalCount} results
              </Badge>
            )}
          </div>
          <Button
            variant='outline'
            size='sm'
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? (
              <IconLoader2 className='h-4 w-4 mr-1 animate-spin' />
            ) : (
              <IconDownload className='h-4 w-4 mr-1' />
            )}
            Export
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Admin</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Entity ID</TableHead>
              <TableHead>IP Address</TableHead>
              <TableHead>Time</TableHead>
              <TableHead className='w-[70px]'>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className='text-center py-8'>
                  <IconLoader2 className='h-6 w-6 animate-spin mx-auto' />
                </TableCell>
              </TableRow>
            ) : filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className='text-center py-8 text-muted-foreground'>
                  No audit logs found
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div className='flex items-center gap-2'>
                      <Avatar className='h-7 w-7'>
                        <AvatarFallback className='text-xs'>
                          {getInitials(log.adminName, log.adminEmail)}
                        </AvatarFallback>
                      </Avatar>
                      <div className='text-sm'>
                        <p className='font-medium'>{log.adminName || 'Admin'}</p>
                        <p className='text-xs text-muted-foreground'>{log.adminEmail}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getActionBadge(log.action)}</TableCell>
                  <TableCell>
                    <Badge variant='outline'>{log.entityType}</Badge>
                  </TableCell>
                  <TableCell className='font-mono text-xs text-muted-foreground'>
                    {log.entityId.substring(0, 8)}...
                  </TableCell>
                  <TableCell className='text-sm text-muted-foreground'>
                    {log.ipAddress || '-'}
                  </TableCell>
                  <TableCell className='text-sm text-muted-foreground'>
                    {formatDistanceToNow(new Date(log.createdAt), {
                      addSuffix: true,
                      locale: tr,
                    })}
                  </TableCell>
                  <TableCell>
                    <Link href={`/dashboard/audit-logs/${log.id}`}>
                      <Button variant='ghost' size='icon'>
                        <IconEye className='h-4 w-4' />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className='flex items-center justify-between'>
        <p className='text-sm text-muted-foreground'>
          Showing {filteredLogs.length} of {totalCount} logs
        </p>
        <div className='flex gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
