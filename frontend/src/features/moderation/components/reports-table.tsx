'use client';
import { useEffect, useState, useCallback } from 'react';
import { getModerationReports, reviewReport, resolveReport } from '@/lib/api';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  IconDots, IconLoader2, IconSearch, IconEye, IconCheck, IconX, IconAlertTriangle,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface Report {
  id: string;
  type: string;
  reason: string;
  status: string;
  reporterEmail: string;
  reportedUserEmail: string;
  contentType: string;
  contentId: string;
  contentPreview: string;
  createdAt: string;
}

export function ReportsTable() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedReports, setSelectedReports] = useState<string[]>([]);

  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [reportToResolve, setReportToResolve] = useState<Report | null>(null);
  const [resolveAction, setResolveAction] = useState('');
  const [resolveNote, setResolveNote] = useState('');

  const loadReports = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 10 };
      if (search) params.search = search;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (typeFilter !== 'all') params.type = typeFilter;

      const data = await getModerationReports(params);
      setReports(data.reports || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalCount(data.pagination?.total || 0);
    } catch (error) {
      console.error('Failed to load reports:', error);
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, typeFilter]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleReview = async (report: Report) => {
    try {
      await reviewReport(report.id);
      toast.success('Report marked as under review');
      loadReports();
    } catch (error) {
      console.error('Failed to review report:', error);
      toast.error('Failed to update report');
    }
  };

  const handleResolve = async () => {
    if (!reportToResolve || !resolveAction) return;
    try {
      await resolveReport(reportToResolve.id, resolveAction, resolveNote);
      toast.success('Report resolved');
      loadReports();
    } catch (error) {
      console.error('Failed to resolve report:', error);
      toast.error('Failed to resolve report');
    } finally {
      setResolveDialogOpen(false);
      setReportToResolve(null);
      setResolveAction('');
      setResolveNote('');
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedReports((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedReports.length === reports.length) {
      setSelectedReports([]);
    } else {
      setSelectedReports(reports.map((r) => r.id));
    }
  };

  const getStatusBadgeColor = (status: string | null | undefined) => {
    if (!status) return 'bg-gray-500/10 text-gray-500';
    switch (status.toUpperCase()) {
      case 'PENDING': return 'bg-yellow-500/10 text-yellow-500';
      case 'UNDER_REVIEW': return 'bg-blue-500/10 text-blue-500';
      case 'RESOLVED': return 'bg-green-500/10 text-green-500';
      case 'DISMISSED': return 'bg-gray-500/10 text-gray-500';
      default: return 'bg-gray-500/10 text-gray-500';
    }
  };

  const getTypeBadgeColor = (type: string | null | undefined) => {
    if (!type) return 'bg-gray-500/10 text-gray-500';
    switch (type.toUpperCase()) {
      case 'SPAM': return 'bg-orange-500/10 text-orange-500';
      case 'HARASSMENT': return 'bg-red-500/10 text-red-500';
      case 'INAPPROPRIATE': return 'bg-purple-500/10 text-purple-500';
      case 'COPYRIGHT': return 'bg-blue-500/10 text-blue-500';
      default: return 'bg-gray-500/10 text-gray-500';
    }
  };

  return (
    <div className='space-y-4'>
      <div className='flex flex-col sm:flex-row gap-4'>
        <div className='relative flex-1'>
          <IconSearch className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='Search reports...'
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className='pl-9'
          />
        </div>
        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
          <SelectTrigger className='w-[150px]'>
            <SelectValue placeholder='Type' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Types</SelectItem>
            <SelectItem value='SPAM'>Spam</SelectItem>
            <SelectItem value='HARASSMENT'>Harassment</SelectItem>
            <SelectItem value='INAPPROPRIATE'>Inappropriate</SelectItem>
            <SelectItem value='COPYRIGHT'>Copyright</SelectItem>
            <SelectItem value='OTHER'>Other</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className='w-[150px]'>
            <SelectValue placeholder='Status' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Status</SelectItem>
            <SelectItem value='PENDING'>Pending</SelectItem>
            <SelectItem value='UNDER_REVIEW'>Under Review</SelectItem>
            <SelectItem value='RESOLVED'>Resolved</SelectItem>
            <SelectItem value='DISMISSED'>Dismissed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-[40px]'>
                <Checkbox
                  checked={selectedReports.length === reports.length && reports.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Content</TableHead>
              <TableHead>Reporter</TableHead>
              <TableHead>Reported User</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className='w-[70px]'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className='text-center py-8'>
                  <IconLoader2 className='h-6 w-6 animate-spin mx-auto' />
                </TableCell>
              </TableRow>
            ) : reports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className='text-center py-8 text-muted-foreground'>
                  No reports found
                </TableCell>
              </TableRow>
            ) : (
              reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedReports.includes(report.id)}
                      onCheckedChange={() => toggleSelect(report.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Badge className={getTypeBadgeColor(report.type)}>{report.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className='max-w-[200px]'>
                      <p className='text-sm font-medium truncate'>{report.contentType}</p>
                      <p className='text-xs text-muted-foreground truncate'>{report.contentPreview || report.reason}</p>
                    </div>
                  </TableCell>
                  <TableCell className='text-sm'>{report.reporterEmail}</TableCell>
                  <TableCell className='text-sm'>{report.reportedUserEmail}</TableCell>
                  <TableCell>
                    <Badge className={getStatusBadgeColor(report.status)}>{report.status.replace('_', ' ')}</Badge>
                  </TableCell>
                  <TableCell className='text-sm text-muted-foreground'>
                    {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant='ghost' size='icon'>
                          <IconDots className='h-4 w-4' />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='end'>
                        {report.status === 'PENDING' && (
                          <DropdownMenuItem onClick={() => handleReview(report)}>
                            <IconEye className='mr-2 h-4 w-4' />
                            Mark Under Review
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => {
                            setReportToResolve(report);
                            setResolveDialogOpen(true);
                          }}
                        >
                          <IconCheck className='mr-2 h-4 w-4' />
                          Resolve
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className='flex items-center justify-between'>
        <p className='text-sm text-muted-foreground'>
          {selectedReports.length > 0 ? `${selectedReports.length} selected · ` : ''}
          Showing {reports.length} of {totalCount} reports
        </p>
        <div className='flex gap-2'>
          <Button variant='outline' size='sm' onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
            Previous
          </Button>
          <Button variant='outline' size='sm' onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
            Next
          </Button>
        </div>
      </div>

      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Report</DialogTitle>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <label className='text-sm font-medium'>Action</label>
              <Select value={resolveAction} onValueChange={setResolveAction}>
                <SelectTrigger>
                  <SelectValue placeholder='Select action' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='WARN_USER'>Warn User</SelectItem>
                  <SelectItem value='BAN_USER'>Ban User</SelectItem>
                  <SelectItem value='DELETE_CONTENT'>Delete Content</SelectItem>
                  <SelectItem value='DISMISS'>Dismiss Report</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <label className='text-sm font-medium'>Note (optional)</label>
              <Textarea
                placeholder='Add a note about this resolution...'
                value={resolveNote}
                onChange={(e) => setResolveNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setResolveDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleResolve} disabled={!resolveAction}>Resolve</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
