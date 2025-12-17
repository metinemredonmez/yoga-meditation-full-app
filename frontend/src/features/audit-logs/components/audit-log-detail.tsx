'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuditLogDetails, getEntityAuditHistory } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  IconArrowLeft,
  IconLoader2,
  IconUser,
  IconClock,
  IconMapPin,
  IconDeviceDesktop,
  IconHistory,
  IconPlus,
  IconEdit,
  IconTrash,
  IconBan,
  IconCheck,
  IconAlertTriangle,
} from '@tabler/icons-react';
import { format, formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

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

interface AuditLogDetailProps {
  id: string;
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-500/10 text-green-600 border-green-500/20',
  UPDATE: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  DELETE: 'bg-red-500/10 text-red-600 border-red-500/20',
  LOGIN: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  LOGOUT: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
  BAN: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  UNBAN: 'bg-teal-500/10 text-teal-600 border-teal-500/20',
  APPROVE: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  REJECT: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
};

const ACTION_ICONS: Record<string, React.ReactNode> = {
  CREATE: <IconPlus className='h-4 w-4' />,
  UPDATE: <IconEdit className='h-4 w-4' />,
  DELETE: <IconTrash className='h-4 w-4' />,
  LOGIN: <IconUser className='h-4 w-4' />,
  LOGOUT: <IconUser className='h-4 w-4' />,
  BAN: <IconBan className='h-4 w-4' />,
  UNBAN: <IconCheck className='h-4 w-4' />,
  APPROVE: <IconCheck className='h-4 w-4' />,
  REJECT: <IconAlertTriangle className='h-4 w-4' />,
};

export function AuditLogDetail({ id }: AuditLogDetailProps) {
  const router = useRouter();
  const [log, setLog] = useState<AuditLog | null>(null);
  const [relatedLogs, setRelatedLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogDetails();
  }, [id]);

  const loadLogDetails = async () => {
    setLoading(true);
    try {
      const data = await getAuditLogDetails(id);
      setLog(data.log);

      // Load related logs for the same entity
      if (data.log?.entityType && data.log?.entityId) {
        const historyData = await getEntityAuditHistory(data.log.entityType, data.log.entityId);
        setRelatedLogs((historyData.history || []).filter((l: AuditLog) => l.id !== id).slice(0, 10));
      }
    } catch (error) {
      console.error('Failed to load audit log details:', error);
    } finally {
      setLoading(false);
    }
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

  const getActionBadge = (action: string) => {
    const color = ACTION_COLORS[action] || 'bg-gray-500/10 text-gray-600';
    const icon = ACTION_ICONS[action];
    return (
      <Badge className={`${color} flex items-center gap-1.5 px-3 py-1 text-sm`}>
        {icon}
        {action}
      </Badge>
    );
  };

  const renderDetailsValue = (value: any): React.ReactNode => {
    if (value === null || value === undefined) {
      return <span className='text-muted-foreground italic'>null</span>;
    }
    if (typeof value === 'boolean') {
      return value ? (
        <Badge variant='outline' className='bg-green-500/10 text-green-600'>true</Badge>
      ) : (
        <Badge variant='outline' className='bg-red-500/10 text-red-600'>false</Badge>
      );
    }
    if (typeof value === 'object') {
      return (
        <pre className='text-xs bg-muted p-2 rounded overflow-auto max-w-md'>
          {JSON.stringify(value, null, 2)}
        </pre>
      );
    }
    return String(value);
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <IconLoader2 className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  if (!log) {
    return (
      <div className='flex flex-col items-center justify-center py-12'>
        <p className='text-muted-foreground mb-4'>Audit log not found</p>
        <Button onClick={() => router.push('/dashboard/audit-logs')}>
          <IconArrowLeft className='h-4 w-4 mr-2' />
          Back to Logs
        </Button>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center gap-4'>
        <Button variant='ghost' size='icon' onClick={() => router.push('/dashboard/audit-logs')}>
          <IconArrowLeft className='h-4 w-4' />
        </Button>
        <div className='flex-1'>
          <h2 className='text-2xl font-bold tracking-tight'>Audit Log Details</h2>
          <p className='text-muted-foreground'>Log ID: {log.id}</p>
        </div>
        {getActionBadge(log.action)}
      </div>

      <div className='grid gap-6 md:grid-cols-2'>
        {/* Main Info */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <IconUser className='h-5 w-5' />
              Admin Information
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex items-center gap-3'>
              <Avatar className='h-12 w-12'>
                <AvatarFallback>
                  {getInitials(log.adminName, log.adminEmail)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className='font-medium text-lg'>{log.adminName || 'Admin'}</p>
                <p className='text-sm text-muted-foreground'>{log.adminEmail}</p>
              </div>
            </div>
            <Separator />
            <div className='grid gap-3'>
              <div className='flex items-center gap-2'>
                <IconMapPin className='h-4 w-4 text-muted-foreground' />
                <span className='text-sm'>{log.ipAddress || 'Unknown IP'}</span>
              </div>
              <div className='flex items-center gap-2'>
                <IconDeviceDesktop className='h-4 w-4 text-muted-foreground' />
                <span className='text-sm text-muted-foreground truncate max-w-[300px]'>
                  {log.userAgent || 'Unknown User Agent'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Info */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <IconClock className='h-5 w-5' />
              Action Details
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid gap-3'>
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>Action</span>
                {getActionBadge(log.action)}
              </div>
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>Entity Type</span>
                <Badge variant='outline'>{log.entityType}</Badge>
              </div>
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>Entity ID</span>
                <code className='text-xs bg-muted px-2 py-1 rounded'>{log.entityId}</code>
              </div>
              <Separator />
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>Timestamp</span>
                <span className='text-sm'>
                  {format(new Date(log.createdAt), 'PPpp', { locale: tr })}
                </span>
              </div>
              <div className='flex justify-between'>
                <span className='text-muted-foreground'>Relative Time</span>
                <span className='text-sm text-muted-foreground'>
                  {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true, locale: tr })}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Details */}
      {log.details && Object.keys(log.details).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Change Details</CardTitle>
            <CardDescription>Detailed information about the changes made</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-[200px]'>Field</TableHead>
                  <TableHead>Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(log.details).map(([key, value]) => (
                  <TableRow key={key}>
                    <TableCell className='font-medium'>{key}</TableCell>
                    <TableCell>{renderDetailsValue(value)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Related Logs */}
      {relatedLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <IconHistory className='h-5 w-5' />
              Related Activity
            </CardTitle>
            <CardDescription>
              Other actions on this {log.entityType.toLowerCase()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Admin</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {relatedLogs.map((relatedLog) => (
                  <TableRow
                    key={relatedLog.id}
                    className='cursor-pointer hover:bg-muted/50'
                    onClick={() => router.push(`/dashboard/audit-logs/${relatedLog.id}`)}
                  >
                    <TableCell>
                      <div className='flex items-center gap-2'>
                        <Avatar className='h-6 w-6'>
                          <AvatarFallback className='text-xs'>
                            {getInitials(relatedLog.adminName, relatedLog.adminEmail)}
                          </AvatarFallback>
                        </Avatar>
                        <span className='text-sm'>{relatedLog.adminName || relatedLog.adminEmail}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getActionBadge(relatedLog.action)}</TableCell>
                    <TableCell className='text-sm text-muted-foreground'>
                      {formatDistanceToNow(new Date(relatedLog.createdAt), {
                        addSuffix: true,
                        locale: tr,
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
