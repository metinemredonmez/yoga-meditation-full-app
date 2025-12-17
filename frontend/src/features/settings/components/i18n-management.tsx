'use client';
import { useEffect, useState } from 'react';
import { getLanguages, getTranslations, updateTranslation } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { IconLoader2, IconCheck, IconSearch } from '@tabler/icons-react';
import { toast } from 'sonner';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  isDefault: boolean;
  isActive: boolean;
}

interface Translation {
  key: string;
  values: Record<string, string>;
  category: string;
}

export function I18nManagement() {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLang, setSelectedLang] = useState('tr');
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState<string | null>(null);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (translations.length > 0) {
      const values: Record<string, string> = {};
      translations.forEach((t) => {
        values[t.key] = t.values[selectedLang] || '';
      });
      setEditedValues(values);
    }
  }, [selectedLang, translations]);

  const loadData = async () => {
    try {
      const [langsData, transData] = await Promise.all([
        getLanguages(),
        getTranslations(),
      ]);
      setLanguages(langsData);
      setTranslations(transData);
    } catch (error) {
      console.error('Failed to load i18n data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (key: string) => {
    setSaving(key);
    try {
      await updateTranslation(key, { [selectedLang]: editedValues[key] });
      toast.success('Translation updated');
      setTranslations(translations.map(t =>
        t.key === key ? { ...t, values: { ...t.values, [selectedLang]: editedValues[key] } } : t
      ));
    } catch (error) {
      console.error('Failed to update translation:', error);
      toast.error('Failed to update translation');
    } finally {
      setSaving(null);
    }
  };

  const filteredTranslations = translations.filter((t) =>
    t.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.values[selectedLang] || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedTranslations = filteredTranslations.reduce((acc, t) => {
    if (!acc[t.category]) acc[t.category] = [];
    acc[t.category].push(t);
    return acc;
  }, {} as Record<string, Translation[]>);

  if (loading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <IconLoader2 className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle>Languages</CardTitle>
          <CardDescription>Available languages for your application</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex flex-wrap gap-2'>
            {languages.map((lang) => (
              <Badge
                key={lang.code}
                variant={lang.isActive ? 'default' : 'outline'}
                className='text-sm py-1 px-3'
              >
                {lang.nativeName} ({lang.code})
                {lang.isDefault && <span className='ml-1 text-xs'>(Default)</span>}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle>Translations</CardTitle>
              <CardDescription>Manage translation keys and values</CardDescription>
            </div>
            <div className='flex items-center gap-4'>
              <div className='relative'>
                <IconSearch className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                <Input
                  placeholder='Search translations...'
                  className='pl-9 w-64'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={selectedLang} onValueChange={setSelectedLang}>
                <SelectTrigger className='w-40'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languages.filter(l => l.isActive).map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.nativeName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {Object.entries(groupedTranslations).map(([category, categoryTranslations]) => (
            <div key={category} className='mb-6 last:mb-0'>
              <h4 className='font-medium mb-3 capitalize'>{category.replace(/_/g, ' ')}</h4>
              <div className='space-y-3'>
                {categoryTranslations.map((translation) => (
                  <div key={translation.key} className='flex items-center gap-3 p-3 bg-muted/50 rounded-lg'>
                    <div className='w-1/3'>
                      <code className='text-xs'>{translation.key}</code>
                    </div>
                    <div className='flex-1 flex items-center gap-2'>
                      <Input
                        value={editedValues[translation.key] || ''}
                        onChange={(e) => setEditedValues({ ...editedValues, [translation.key]: e.target.value })}
                        placeholder={`Enter ${selectedLang} translation...`}
                      />
                      <Button
                        size='sm'
                        onClick={() => handleSave(translation.key)}
                        disabled={saving === translation.key || editedValues[translation.key] === translation.values[selectedLang]}
                      >
                        {saving === translation.key ? <IconLoader2 className='h-4 w-4 animate-spin' /> : <IconCheck className='h-4 w-4' />}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {filteredTranslations.length === 0 && (
            <p className='text-center text-muted-foreground py-8'>No translations found</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
