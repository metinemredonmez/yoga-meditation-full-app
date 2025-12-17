'use client';
import { useState } from 'react';
import { createExport } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { IconDownload, IconLoader2 } from '@tabler/icons-react';
import { toast } from 'sonner';

const EXPORT_TYPES = [
  { value: 'users', label: 'Users Data' },
  { value: 'subscriptions', label: 'Subscriptions' },
  { value: 'payments', label: 'Payment History' },
  { value: 'content', label: 'Content Analytics' },
  { value: 'reports', label: 'Moderation Reports' },
];

const DATE_RANGES = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: '1y', label: 'Last year' },
  { value: 'all', label: 'All time' },
];

const FORMATS = [
  { value: 'csv', label: 'CSV' },
  { value: 'xlsx', label: 'Excel (XLSX)' },
  { value: 'pdf', label: 'PDF Report' },
];

export function ExportPanel() {
  const [exportType, setExportType] = useState('users');
  const [dateRange, setDateRange] = useState('30d');
  const [format, setFormat] = useState('csv');
  const [includeCharts, setIncludeCharts] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const result = await createExport({
        type: exportType,
        dateRange,
        format,
        includeCharts: format === 'pdf' ? includeCharts : false,
      });

      if (result.downloadUrl) {
        window.open(result.downloadUrl, '_blank');
        toast.success('Export ready! Download starting...');
      } else {
        toast.success('Export job created. You will be notified when ready.');
      }
    } catch (error) {
      console.error('Failed to create export:', error);
      toast.error('Failed to create export');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Export Data</CardTitle>
        <CardDescription>Download reports and analytics data</CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='grid gap-4 md:grid-cols-3'>
          <div className='space-y-2'>
            <Label>Data Type</Label>
            <Select value={exportType} onValueChange={setExportType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXPORT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-2'>
            <Label>Date Range</Label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATE_RANGES.map((range) => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-2'>
            <Label>Format</Label>
            <Select value={format} onValueChange={setFormat}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FORMATS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {format === 'pdf' && (
          <div className='flex items-center space-x-2'>
            <Checkbox
              id='includeCharts'
              checked={includeCharts}
              onCheckedChange={(checked) => setIncludeCharts(checked as boolean)}
            />
            <label htmlFor='includeCharts' className='text-sm'>
              Include charts and visualizations
            </label>
          </div>
        )}

        <Button onClick={handleExport} disabled={loading} className='w-full'>
          {loading ? (
            <IconLoader2 className='mr-2 h-4 w-4 animate-spin' />
          ) : (
            <IconDownload className='mr-2 h-4 w-4' />
          )}
          Export Data
        </Button>
      </CardContent>
    </Card>
  );
}
