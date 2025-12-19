'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  IconLoader2,
  IconPlus,
  IconEdit,
  IconTrash,
  IconGripVertical,
  IconEye,
  IconChevronUp,
  IconChevronDown,
  IconCheck,
  IconX,
} from '@tabler/icons-react';
import { toast } from 'sonner';
import { getOnboardingConfig, updateOnboardingConfig } from '@/lib/api';

interface OnboardingOption {
  value: string;
  label: string;
  labelEn?: string;
  icon?: string;
}

interface OnboardingStep {
  id: string;
  order: number;
  title: string;
  titleEn?: string;
  question: string;
  questionEn?: string;
  field: string;
  type: 'single-select' | 'multi-select' | 'text' | 'number' | 'time';
  options?: OnboardingOption[];
  required?: boolean;
  isActive: boolean;
}

interface OnboardingConfig {
  steps: OnboardingStep[];
  settings: {
    skipEnabled: boolean;
    showProgress: boolean;
    allowBack: boolean;
  };
}

const FIELD_OPTIONS = [
  { value: 'experienceLevel', label: 'Deneyim Seviyesi' },
  { value: 'goals', label: 'Hedefler' },
  { value: 'interests', label: 'İlgi Alanları' },
  { value: 'preferredTimes', label: 'Tercih Edilen Zamanlar' },
  { value: 'sessionDuration', label: 'Seans Süresi' },
  { value: 'reminders', label: 'Hatırlatıcılar' },
  { value: 'focusAreas', label: 'Odak Alanları' },
  { value: 'challenges', label: 'Zorluklar' },
  { value: 'custom', label: 'Özel Alan' },
];

const TYPE_OPTIONS = [
  { value: 'single-select', label: 'Tekli Seçim' },
  { value: 'multi-select', label: 'Çoklu Seçim' },
  { value: 'text', label: 'Metin' },
  { value: 'number', label: 'Sayı' },
  { value: 'time', label: 'Saat' },
];

const EMOJI_OPTIONS = ['🌱', '🌿', '🌳', '🎋', '😌', '😴', '🎯', '🧘', '🌊', '⚡', '💪', '🧠', '❤️', '🌟', '🔥', '🌈', '☀️', '🌙', '🍃', '💎'];

const DEFAULT_STEP: Omit<OnboardingStep, 'id' | 'order'> = {
  title: '',
  titleEn: '',
  question: '',
  questionEn: '',
  field: 'custom',
  type: 'single-select',
  options: [],
  required: true,
  isActive: true,
};

export function OnboardingConfigManager() {
  const [config, setConfig] = useState<OnboardingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Dialogs
  const [stepDialog, setStepDialog] = useState(false);
  const [optionDialog, setOptionDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [previewDialog, setPreviewDialog] = useState(false);

  // Edit states
  const [editingStep, setEditingStep] = useState<OnboardingStep | null>(null);
  const [editingStepIndex, setEditingStepIndex] = useState<number | null>(null);
  const [editingOption, setEditingOption] = useState<OnboardingOption | null>(null);
  const [editingOptionIndex, setEditingOptionIndex] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'step' | 'option'; index: number; optionIndex?: number } | null>(null);

  // Preview state
  const [previewStep, setPreviewStep] = useState(0);

  const loadConfig = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getOnboardingConfig();
      setConfig(data || {
        steps: [],
        settings: {
          skipEnabled: true,
          showProgress: true,
          allowBack: true,
        },
      });
    } catch (error) {
      console.error('Failed to load config:', error);
      // Set default config if API fails
      setConfig({
        steps: [],
        settings: {
          skipEnabled: true,
          showProgress: true,
          allowBack: true,
        },
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    try {
      await updateOnboardingConfig(config);
      toast.success('Yapılandırma kaydedildi');
    } catch (error) {
      toast.error('Kaydetme başarısız');
    } finally {
      setSaving(false);
    }
  };

  const handleAddStep = () => {
    setEditingStep({
      ...DEFAULT_STEP,
      id: `step_${Date.now()}`,
      order: (config?.steps.length || 0) + 1,
    });
    setEditingStepIndex(null);
    setStepDialog(true);
  };

  const handleEditStep = (step: OnboardingStep, index: number) => {
    setEditingStep({ ...step });
    setEditingStepIndex(index);
    setStepDialog(true);
  };

  const handleSaveStep = () => {
    if (!config || !editingStep) return;

    const newSteps = [...config.steps];
    if (editingStepIndex !== null) {
      newSteps[editingStepIndex] = editingStep;
    } else {
      newSteps.push(editingStep);
    }

    setConfig({ ...config, steps: newSteps });
    setStepDialog(false);
    setEditingStep(null);
    setEditingStepIndex(null);
  };

  const handleDeleteStep = (index: number) => {
    setDeleteTarget({ type: 'step', index });
    setDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (!config || !deleteTarget) return;

    if (deleteTarget.type === 'step') {
      const newSteps = config.steps.filter((_, i) => i !== deleteTarget.index);
      // Reorder
      newSteps.forEach((step, i) => {
        step.order = i + 1;
      });
      setConfig({ ...config, steps: newSteps });
    } else if (deleteTarget.type === 'option' && editingStep) {
      const newOptions = editingStep.options?.filter((_, i) => i !== deleteTarget.optionIndex) || [];
      setEditingStep({ ...editingStep, options: newOptions });
    }

    setDeleteDialog(false);
    setDeleteTarget(null);
  };

  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    if (!config) return;

    const newSteps = [...config.steps];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newSteps.length) return;

    [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
    newSteps.forEach((step, i) => {
      step.order = i + 1;
    });

    setConfig({ ...config, steps: newSteps });
  };

  const handleAddOption = () => {
    setEditingOption({ value: '', label: '', labelEn: '', icon: '' });
    setEditingOptionIndex(null);
    setOptionDialog(true);
  };

  const handleEditOption = (option: OnboardingOption, index: number) => {
    setEditingOption({ ...option });
    setEditingOptionIndex(index);
    setOptionDialog(true);
  };

  const handleSaveOption = () => {
    if (!editingStep || !editingOption) return;

    const newOptions = [...(editingStep.options || [])];
    if (editingOptionIndex !== null) {
      newOptions[editingOptionIndex] = editingOption;
    } else {
      newOptions.push(editingOption);
    }

    setEditingStep({ ...editingStep, options: newOptions });
    setOptionDialog(false);
    setEditingOption(null);
    setEditingOptionIndex(null);
  };

  const handleDeleteOption = (optionIndex: number) => {
    setDeleteTarget({ type: 'option', index: -1, optionIndex });
    setDeleteDialog(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <IconLoader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle>Genel Ayarlar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6">
            <div className="flex items-center justify-between">
              <Label>Atlamaya İzin Ver</Label>
              <Switch
                checked={config?.settings.skipEnabled || false}
                onCheckedChange={(checked) =>
                  setConfig(config ? {
                    ...config,
                    settings: { ...config.settings, skipEnabled: checked },
                  } : null)
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>İlerleme Göster</Label>
              <Switch
                checked={config?.settings.showProgress || false}
                onCheckedChange={(checked) =>
                  setConfig(config ? {
                    ...config,
                    settings: { ...config.settings, showProgress: checked },
                  } : null)
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Geri Dönmeye İzin Ver</Label>
              <Switch
                checked={config?.settings.allowBack || false}
                onCheckedChange={(checked) =>
                  setConfig(config ? {
                    ...config,
                    settings: { ...config.settings, allowBack: checked },
                  } : null)
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Steps Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Onboarding Adımları</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setPreviewDialog(true)}>
              <IconEye className="h-4 w-4 mr-2" />
              Önizle
            </Button>
            <Button onClick={handleAddStep}>
              <IconPlus className="h-4 w-4 mr-2" />
              Adım Ekle
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {config?.steps.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Henüz adım eklenmemiş. &quot;Adım Ekle&quot; butonuna tıklayın.
            </div>
          ) : (
            <div className="space-y-3">
              {config?.steps.map((step, index) => (
                <div
                  key={step.id}
                  className="flex items-center gap-4 p-4 border rounded-lg bg-card"
                >
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleMoveStep(index, 'up')}
                      disabled={index === 0}
                    >
                      <IconChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleMoveStep(index, 'down')}
                      disabled={index === config.steps.length - 1}
                    >
                      <IconChevronDown className="h-4 w-4" />
                    </Button>
                  </div>

                  <IconGripVertical className="h-5 w-5 text-muted-foreground" />

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{step.order}</Badge>
                      <span className="font-medium">{step.title}</span>
                      {!step.isActive && (
                        <Badge variant="secondary">Pasif</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {step.question}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">
                        {TYPE_OPTIONS.find((t) => t.value === step.type)?.label}
                      </Badge>
                      <Badge variant="outline">
                        {FIELD_OPTIONS.find((f) => f.value === step.field)?.label}
                      </Badge>
                      {step.options && step.options.length > 0 && (
                        <Badge variant="outline">
                          {step.options.length} seçenek
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditStep(step, index)}
                    >
                      <IconEdit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => handleDeleteStep(index)}
                    >
                      <IconTrash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <IconLoader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <IconCheck className="h-4 w-4 mr-2" />
          )}
          Kaydet
        </Button>
      </div>

      {/* Step Dialog */}
      <Dialog open={stepDialog} onOpenChange={setStepDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingStepIndex !== null ? 'Adımı Düzenle' : 'Yeni Adım'}
            </DialogTitle>
          </DialogHeader>

          {editingStep && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Başlık (TR)</Label>
                  <Input
                    value={editingStep.title}
                    onChange={(e) =>
                      setEditingStep({ ...editingStep, title: e.target.value })
                    }
                    placeholder="Deneyim Seviyesi"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Başlık (EN)</Label>
                  <Input
                    value={editingStep.titleEn || ''}
                    onChange={(e) =>
                      setEditingStep({ ...editingStep, titleEn: e.target.value })
                    }
                    placeholder="Experience Level"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Soru (TR)</Label>
                  <Textarea
                    value={editingStep.question}
                    onChange={(e) =>
                      setEditingStep({ ...editingStep, question: e.target.value })
                    }
                    placeholder="Yoga ve meditasyon deneyiminiz nedir?"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Soru (EN)</Label>
                  <Textarea
                    value={editingStep.questionEn || ''}
                    onChange={(e) =>
                      setEditingStep({ ...editingStep, questionEn: e.target.value })
                    }
                    placeholder="What is your yoga and meditation experience?"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Alan</Label>
                  <Select
                    value={editingStep.field}
                    onValueChange={(value) =>
                      setEditingStep({ ...editingStep, field: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FIELD_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tip</Label>
                  <Select
                    value={editingStep.type}
                    onValueChange={(value: any) =>
                      setEditingStep({ ...editingStep, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editingStep.required || false}
                    onCheckedChange={(checked) =>
                      setEditingStep({ ...editingStep, required: checked })
                    }
                  />
                  <Label>Zorunlu</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editingStep.isActive}
                    onCheckedChange={(checked) =>
                      setEditingStep({ ...editingStep, isActive: checked })
                    }
                  />
                  <Label>Aktif</Label>
                </div>
              </div>

              {/* Options Section */}
              {(editingStep.type === 'single-select' || editingStep.type === 'multi-select') && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Seçenekler</Label>
                    <Button variant="outline" size="sm" onClick={handleAddOption}>
                      <IconPlus className="h-3 w-3 mr-1" />
                      Seçenek Ekle
                    </Button>
                  </div>

                  {editingStep.options && editingStep.options.length > 0 ? (
                    <div className="space-y-2">
                      {editingStep.options.map((option, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 p-3 border rounded bg-muted/50"
                        >
                          <span className="text-xl">{option.icon || '📌'}</span>
                          <div className="flex-1">
                            <p className="font-medium">{option.label}</p>
                            <p className="text-xs text-muted-foreground">
                              {option.value}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEditOption(option, idx)}
                          >
                            <IconEdit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDeleteOption(idx)}
                          >
                            <IconTrash className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Henüz seçenek eklenmemiş
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setStepDialog(false)}>
              İptal
            </Button>
            <Button onClick={handleSaveStep}>Kaydet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Option Dialog */}
      <Dialog open={optionDialog} onOpenChange={setOptionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingOptionIndex !== null ? 'Seçeneği Düzenle' : 'Yeni Seçenek'}
            </DialogTitle>
          </DialogHeader>

          {editingOption && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Değer (value)</Label>
                <Input
                  value={editingOption.value}
                  onChange={(e) =>
                    setEditingOption({ ...editingOption, value: e.target.value })
                  }
                  placeholder="BEGINNER"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Etiket (TR)</Label>
                  <Input
                    value={editingOption.label}
                    onChange={(e) =>
                      setEditingOption({ ...editingOption, label: e.target.value })
                    }
                    placeholder="Yeni Başlıyorum"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Etiket (EN)</Label>
                  <Input
                    value={editingOption.labelEn || ''}
                    onChange={(e) =>
                      setEditingOption({ ...editingOption, labelEn: e.target.value })
                    }
                    placeholder="Beginner"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>İkon</Label>
                <div className="flex flex-wrap gap-2">
                  {EMOJI_OPTIONS.map((emoji) => (
                    <Button
                      key={emoji}
                      variant={editingOption.icon === emoji ? 'default' : 'outline'}
                      size="icon"
                      className="text-lg"
                      onClick={() =>
                        setEditingOption({ ...editingOption, icon: emoji })
                      }
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOptionDialog(false)}>
              İptal
            </Button>
            <Button onClick={handleSaveOption}>Kaydet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Silme Onayı</AlertDialogTitle>
            <AlertDialogDescription>
              Bu {deleteTarget?.type === 'step' ? 'adımı' : 'seçeneği'} silmek
              istediğinize emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Preview Dialog */}
      <Dialog open={previewDialog} onOpenChange={setPreviewDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Onboarding Önizleme</DialogTitle>
            <DialogDescription>
              Kullanıcının göreceği akışın önizlemesi
            </DialogDescription>
          </DialogHeader>

          {config && config.steps.length > 0 && (
            <div className="space-y-6 py-4">
              {config.settings.showProgress && (
                <div className="flex gap-1">
                  {config.steps.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-1 flex-1 rounded ${
                        idx <= previewStep ? 'bg-primary' : 'bg-muted'
                      }`}
                    />
                  ))}
                </div>
              )}

              <div className="text-center space-y-4">
                <h3 className="text-lg font-semibold">
                  {config.steps[previewStep]?.title}
                </h3>
                <p className="text-muted-foreground">
                  {config.steps[previewStep]?.question}
                </p>

                {config.steps[previewStep]?.options && (
                  <div className="grid gap-2 mt-4">
                    {config.steps[previewStep].options?.map((option, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        className="justify-start h-auto py-3 px-4"
                      >
                        <span className="text-xl mr-3">{option.icon}</span>
                        <span>{option.label}</span>
                      </Button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-between">
                <Button
                  variant="ghost"
                  onClick={() => setPreviewStep(Math.max(0, previewStep - 1))}
                  disabled={previewStep === 0 || !config.settings.allowBack}
                >
                  Geri
                </Button>
                <div className="text-sm text-muted-foreground">
                  {previewStep + 1} / {config.steps.length}
                </div>
                <Button
                  onClick={() =>
                    setPreviewStep(
                      Math.min(config.steps.length - 1, previewStep + 1)
                    )
                  }
                  disabled={previewStep === config.steps.length - 1}
                >
                  İleri
                </Button>
              </div>
            </div>
          )}

          {(!config || config.steps.length === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              Önizlenecek adım yok
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
