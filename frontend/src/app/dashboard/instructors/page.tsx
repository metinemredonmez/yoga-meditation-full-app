'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  getInstructors,
  approveInstructor,
  rejectInstructor,
} from '@/lib/api';

interface InstructorUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  avatarUrl: string | null;
}

interface InstructorDocument {
  id: string;
  name?: string;
  fileName?: string;
  url?: string;
  fileUrl?: string;
  type?: string;
  uploadedAt?: string;
}

interface Instructor {
  id: string;
  userId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  tier: string;
  bio: string | null;
  experience: string | null;
  certifications: string | null;
  specializations: string | null;
  rejectionReason: string | null;
  createdAt: string;
  approvedAt?: string | null;
  documentsDeadline?: string | null;
  documents?: InstructorDocument[];
  user?: InstructorUser;
  // Alternative fields if user is nested differently
  email?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string | null;
}

// Helper to get user info from instructor (handles different API response formats)
const getInstructorUser = (instructor: Instructor): InstructorUser => {
  if (instructor.user) {
    return instructor.user;
  }
  return {
    id: instructor.userId,
    email: instructor.email || '',
    firstName: instructor.firstName || '',
    lastName: instructor.lastName || '',
    phoneNumber: instructor.phoneNumber || null,
    avatarUrl: null,
  };
};

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  SUSPENDED: 'bg-gray-100 text-gray-700',
};

const statusLabels: Record<string, string> = {
  PENDING: 'Beklemede',
  APPROVED: 'Onaylandi',
  REJECTED: 'Reddedildi',
  SUSPENDED: 'Askiya Alindi',
};

export default function InstructorsPage() {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('PENDING');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Modal states
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchInstructors = async () => {
    try {
      setLoading(true);
      const params: Record<string, string | number> = {
        page: currentPage,
        limit: 20,
      };
      if (filterStatus !== 'all') {
        params.status = filterStatus;
      }

      const response = await getInstructors(params);
      setInstructors(response.data?.items || response.data || []);
      setTotalPages(response.data?.pagination?.totalPages || 1);
      setTotal(response.data?.pagination?.total || response.data?.length || 0);
    } catch (error) {
      console.error('Failed to fetch instructors:', error);
      toast.error('Egitmenler yuklenemedi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstructors();
  }, [currentPage, filterStatus]);

  const handleApprove = async (instructor: Instructor) => {
    try {
      setSubmitting(true);
      await approveInstructor(instructor.id);
      const user = getInstructorUser(instructor);
      toast.success(`${user.firstName} ${user.lastName} onaylandi!`);
      fetchInstructors();
      setShowDetailModal(false);
    } catch (error) {
      console.error('Approve error:', error);
      toast.error('Onaylama basarisiz');
    } finally {
      setSubmitting(false);
    }
  };

  const openRejectModal = (instructor: Instructor) => {
    setSelectedInstructor(instructor);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleReject = async () => {
    if (!selectedInstructor) return;
    if (!rejectReason.trim()) {
      toast.error('Lutfen red sebebini girin');
      return;
    }

    try {
      setSubmitting(true);
      await rejectInstructor(selectedInstructor.id, rejectReason);
      const user = getInstructorUser(selectedInstructor);
      toast.success(`${user.firstName} ${user.lastName} reddedildi`);
      setShowRejectModal(false);
      setShowDetailModal(false);
      fetchInstructors();
    } catch (error) {
      console.error('Reject error:', error);
      toast.error('Red islemi basarisiz');
    } finally {
      setSubmitting(false);
    }
  };

  const openDetailModal = (instructor: Instructor) => {
    setSelectedInstructor(instructor);
    setShowDetailModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const pendingCount = instructors.filter(i => i.status === 'PENDING').length;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Egitmen Basvurulari</h1>
          <p className="text-gray-500 mt-1">
            Egitmen basvurularini inceleyin ve onaylayin ({total} basvuru)
          </p>
        </div>
        {filterStatus === 'PENDING' && pendingCount > 0 && (
          <div className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg font-medium">
            {pendingCount} bekleyen basvuru
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { setFilterStatus('PENDING'); setCurrentPage(1); }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterStatus === 'PENDING'
                ? 'bg-yellow-100 text-yellow-700 border-2 border-yellow-300'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Bekleyenler
          </button>
          <button
            onClick={() => { setFilterStatus('APPROVED'); setCurrentPage(1); }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterStatus === 'APPROVED'
                ? 'bg-green-100 text-green-700 border-2 border-green-300'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Onaylananlar
          </button>
          <button
            onClick={() => { setFilterStatus('REJECTED'); setCurrentPage(1); }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterStatus === 'REJECTED'
                ? 'bg-red-100 text-red-700 border-2 border-red-300'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Reddedilenler
          </button>
          <button
            onClick={() => { setFilterStatus('all'); setCurrentPage(1); }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterStatus === 'all'
                ? 'bg-indigo-100 text-indigo-700 border-2 border-indigo-300'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Tumu
          </button>
        </div>
      </div>

      {/* Instructors Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : instructors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
            <p className="text-gray-500">
              {filterStatus === 'PENDING' ? 'Bekleyen egitmen basvurusu yok' : 'Egitmen bulunamadi'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Egitmen
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Iletisim
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Basvuru Tarihi
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Islemler
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {instructors.map((instructor) => {
                  const user = getInstructorUser(instructor);
                  return (
                  <tr key={instructor.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold">
                          {user.firstName?.[0] || ''}{user.lastName?.[0] || ''}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {instructor.specializations || 'Uzmanlik belirtilmemis'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{user.email}</div>
                      <div className="text-sm text-gray-500">{user.phoneNumber || '-'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[instructor.status]}`}>
                        {statusLabels[instructor.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(instructor.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openDetailModal(instructor)}
                          className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors"
                        >
                          Detay
                        </button>
                        {instructor.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleApprove(instructor)}
                              disabled={submitting}
                              className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                              Onayla
                            </button>
                            <button
                              onClick={() => openRejectModal(instructor)}
                              className="px-3 py-1 bg-red-100 text-red-700 text-sm rounded hover:bg-red-200 transition-colors"
                            >
                              Reddet
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Sayfa {currentPage} / {totalPages} ({total} basvuru)
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-200 rounded text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Onceki
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-200 rounded text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sonraki
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedInstructor && (() => {
        const selectedUser = getInstructorUser(selectedInstructor);
        return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Egitmen Basvuru Detayi</h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* User Info */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xl font-semibold">
                  {selectedUser.firstName?.[0] || ''}{selectedUser.lastName?.[0] || ''}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {selectedUser.firstName} {selectedUser.lastName}
                  </h3>
                  <p className="text-gray-500">{selectedUser.email}</p>
                  {selectedUser.phoneNumber && (
                    <p className="text-gray-500">{selectedUser.phoneNumber}</p>
                  )}
                </div>
                <div className="ml-auto">
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${statusColors[selectedInstructor.status]}`}>
                    {statusLabels[selectedInstructor.status]}
                  </span>
                </div>
              </div>

              {/* Professional Info */}
              <div className="grid gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Deneyim</label>
                  <div className="p-3 bg-gray-50 rounded-lg text-gray-700">
                    {selectedInstructor.experience || 'Belirtilmemis'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sertifikalar</label>
                  <div className="p-3 bg-gray-50 rounded-lg text-gray-700">
                    {selectedInstructor.certifications || 'Belirtilmemis'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Uzmanlik Alanlari</label>
                  <div className="p-3 bg-gray-50 rounded-lg text-gray-700">
                    {selectedInstructor.specializations || 'Belirtilmemis'}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hakkinda</label>
                  <div className="p-3 bg-gray-50 rounded-lg text-gray-700">
                    {selectedInstructor.bio || 'Belirtilmemis'}
                  </div>
                </div>

                {/* Belgeler Bolumu */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Belgeler (Sertifikalar, Diplomalar, vs.)
                    {selectedInstructor.status === 'APPROVED' && !selectedInstructor.documents?.length && (
                      <span className="ml-2 text-xs text-orange-600 font-normal">
                        - Egitmenin 14 gun icinde yuklemesi gerekiyor
                      </span>
                    )}
                  </label>
                  <div className="p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                    {selectedInstructor.documents && selectedInstructor.documents.length > 0 ? (
                      <div className="space-y-2">
                        {selectedInstructor.documents.map((doc, index) => (
                          <div key={doc.id || index} className="flex items-center justify-between p-3 bg-white rounded-lg border hover:border-indigo-200 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
                                <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{doc.name || doc.fileName || `Belge ${index + 1}`}</p>
                                {doc.type && <p className="text-xs text-gray-500">{doc.type}</p>}
                                {doc.uploadedAt && (
                                  <p className="text-xs text-gray-400">
                                    Yuklendi: {new Date(doc.uploadedAt).toLocaleDateString('tr-TR')}
                                  </p>
                                )}
                              </div>
                            </div>
                            <a
                              href={doc.url || doc.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                            >
                              Goruntule
                            </a>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-sm text-gray-500 mb-1">
                          {selectedInstructor.status === 'PENDING'
                            ? 'Egitmen henuz onaylanmadi.'
                            : selectedInstructor.status === 'APPROVED'
                            ? 'Egitmen henuz belge yuklemedi.'
                            : 'Belge bulunamadi.'
                          }
                        </p>
                        <p className="text-xs text-gray-400">
                          {selectedInstructor.status === 'PENDING'
                            ? 'Onaylandiktan sonra belgelerini yukleyebilir.'
                            : selectedInstructor.status === 'APPROVED'
                            ? 'Egitmen panelinden belgelerini yuklemesi bekleniyor.'
                            : ''
                          }
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {selectedInstructor.rejectionReason && (
                  <div>
                    <label className="block text-sm font-medium text-red-700 mb-1">Red Sebebi</label>
                    <div className="p-3 bg-red-50 rounded-lg text-red-700">
                      {selectedInstructor.rejectionReason}
                    </div>
                  </div>
                )}
              </div>

              <div className="text-sm text-gray-500">
                Basvuru Tarihi: {formatDate(selectedInstructor.createdAt)}
              </div>
            </div>

            {/* Actions */}
            {selectedInstructor.status === 'PENDING' && (
              <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                <button
                  onClick={() => openRejectModal(selectedInstructor)}
                  className="px-4 py-2 border border-red-200 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Reddet
                </button>
                <button
                  onClick={() => handleApprove(selectedInstructor)}
                  disabled={submitting}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Onaylaniyor...' : 'Onayla'}
                </button>
              </div>
            )}
          </div>
        </div>
        );
      })()}

      {/* Reject Modal */}
      {showRejectModal && selectedInstructor && (() => {
        const rejectUser = getInstructorUser(selectedInstructor);
        return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Basvuruyu Reddet</h2>
            <p className="text-gray-600 mb-4">
              <strong>{rejectUser.firstName} {rejectUser.lastName}</strong> basvurusunu reddetmek uzeresiniz.
            </p>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Red Sebebi <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Basvurunun neden reddedildigini aciklayin..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Iptal
              </button>
              <button
                onClick={handleReject}
                disabled={submitting || !rejectReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Reddediliyor...' : 'Reddet'}
              </button>
            </div>
          </div>
        </div>
        );
      })()}
    </div>
  );
}
