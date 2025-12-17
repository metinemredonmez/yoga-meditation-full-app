'use client';

import { useEffect, useState } from 'react';
import { getClasses, deleteClass } from '@/lib/api';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { IconDotsVertical, IconEdit, IconTrash, IconPlus, IconSearch } from '@tabler/icons-react';
import { toast } from 'sonner';
import { ClassFormDialog } from './class-form-dialog';

interface ClassItem {
  id: string;
  title: string;
  description: string;
  level: string;
  durationMinutes: number;
  instructorId: string;
  instructor?: { firstName: string; lastName: string };
  isPublished: boolean;
  createdAt: string;
}

export function ClassesTable() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editClass, setEditClass] = useState<ClassItem | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    loadClasses();
  }, [page, search]);

  const loadClasses = async () => {
    setLoading(true);
    try {
      const data = await getClasses({ page, limit: 10, search: search || undefined });
      setClasses(data.classes || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (error) {
      toast.error('Failed to load classes');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteClass(deleteId);
      toast.success('Class deleted');
      loadClasses();
    } catch (error) {
      toast.error('Failed to delete class');
    } finally {
      setDeleteId(null);
    }
  };

  const getLevelBadge = (level: string) => {
    const colors: Record<string, string> = {
      BEGINNER: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-400/20 dark:text-green-400 dark:border-green-400/30',
      INTERMEDIATE: 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-400/20 dark:text-cyan-400 dark:border-cyan-400/30',
      ADVANCED: 'bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-400/20 dark:text-violet-400 dark:border-violet-400/30',
    };
    return colors[level] || 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-400/20 dark:text-gray-400 dark:border-gray-400/30';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-72">
          <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search classes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <IconPlus className="mr-2 h-4 w-4" />
          Add Class
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Instructor</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
                    <div className="h-12 animate-pulse bg-muted rounded" />
                  </TableCell>
                </TableRow>
              ))
            ) : classes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No classes found
                </TableCell>
              </TableRow>
            ) : (
              classes.map((cls) => (
                <TableRow key={cls.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{cls.title}</p>
                      <p className="text-sm text-muted-foreground truncate max-w-[250px]">
                        {cls.description}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {cls.instructor
                      ? `${cls.instructor.firstName} ${cls.instructor.lastName}`
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${getLevelBadge(cls.level)}`}>
                      {cls.level}
                    </span>
                  </TableCell>
                  <TableCell>{cls.durationMinutes} min</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                      cls.isPublished
                        ? 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-400/20 dark:text-cyan-400 dark:border-cyan-400/30'
                        : 'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-400/20 dark:text-pink-400 dark:border-pink-400/30'
                    }`}>
                      {cls.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <IconDotsVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditClass(cls)}>
                          <IconEdit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteId(cls.id)}
                        >
                          <IconTrash className="mr-2 h-4 w-4" />
                          Delete
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

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Class</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this class? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ClassFormDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={loadClasses}
      />

      <ClassFormDialog
        open={!!editClass}
        onOpenChange={(open) => !open && setEditClass(null)}
        classItem={editClass}
        onSuccess={loadClasses}
      />
    </div>
  );
}
