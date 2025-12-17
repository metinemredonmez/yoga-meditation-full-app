'use client';

import { useState } from 'react';

interface Program {
  id: string;
  title: string;
  description: string;
  duration: number;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'ALL';
  classCount: number;
  enrollments: number;
  completions: number;
  status: 'PUBLISHED' | 'DRAFT';
  isFree: boolean;
  price?: number;
}

const mockPrograms: Program[] = [
  { id: '1', title: '30 Günlük Yoga Challenge', description: 'Her gün yoga yaparak dönüşümünüzü başlatın', duration: 30, level: 'BEGINNER', classCount: 30, enrollments: 2450, completions: 890, status: 'PUBLISHED', isFree: false, price: 149 },
  { id: '2', title: 'Stres Azaltma Programı', description: 'Günlük stresi azaltmak için özel program', duration: 14, level: 'ALL', classCount: 14, enrollments: 1890, completions: 1200, status: 'PUBLISHED', isFree: true },
  { id: '3', title: 'Esneklik Geliştirme', description: '21 günde esnekliğinizi artırın', duration: 21, level: 'INTERMEDIATE', classCount: 21, enrollments: 980, completions: 450, status: 'PUBLISHED', isFree: false, price: 99 },
  { id: '4', title: 'Sabah Rutini', description: 'Güne enerjik başlamak için 7 günlük program', duration: 7, level: 'BEGINNER', classCount: 7, enrollments: 3200, completions: 2100, status: 'PUBLISHED', isFree: true },
  { id: '5', title: 'İleri Seviye Asana', description: 'Zorlu pozlar için hazırlık programı', duration: 28, level: 'ADVANCED', classCount: 28, enrollments: 0, completions: 0, status: 'DRAFT', isFree: false, price: 199 },
];

const levelColors = {
  BEGINNER: 'bg-green-100 text-green-700',
  INTERMEDIATE: 'bg-yellow-100 text-yellow-700',
  ADVANCED: 'bg-red-100 text-red-700',
  ALL: 'bg-blue-100 text-blue-700',
};

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>(mockPrograms);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPrograms = programs.filter(program =>
    program.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Programlar</h1>
          <p className="text-gray-500 mt-1">Yoga programlarını yönetin</p>
        </div>
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
          + Yeni Program
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-sm text-gray-500">Toplam Program</p>
          <p className="text-2xl font-bold text-gray-900">{programs.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-sm text-gray-500">Toplam Kayıt</p>
          <p className="text-2xl font-bold text-indigo-600">
            {programs.reduce((sum, p) => sum + p.enrollments, 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-sm text-gray-500">Tamamlama</p>
          <p className="text-2xl font-bold text-green-600">
            {programs.reduce((sum, p) => sum + p.completions, 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-sm text-gray-500">Tamamlama Oranı</p>
          <p className="text-2xl font-bold text-purple-600">
            {Math.round(
              (programs.reduce((sum, p) => sum + p.completions, 0) /
                programs.reduce((sum, p) => sum + p.enrollments, 0)) *
                100
            )}%
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <input
          type="text"
          placeholder="Program ara..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {/* Programs List */}
      <div className="space-y-4">
        {filteredPrograms.map((program) => (
          <div key={program.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{program.title}</h3>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${levelColors[program.level]}`}>
                    {program.level === 'BEGINNER' ? 'Başlangıç' :
                     program.level === 'INTERMEDIATE' ? 'Orta' :
                     program.level === 'ADVANCED' ? 'İleri' : 'Tüm Seviyeler'}
                  </span>
                  {program.isFree ? (
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-700">
                      Ücretsiz
                    </span>
                  ) : (
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-700">
                      ₺{program.price}
                    </span>
                  )}
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    program.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {program.status === 'PUBLISHED' ? 'Yayında' : 'Taslak'}
                  </span>
                </div>
                <p className="text-gray-500 mb-4">{program.description}</p>
                <div className="flex items-center gap-6 text-sm text-gray-500">
                  <span>📅 {program.duration} gün</span>
                  <span>🧘 {program.classCount} ders</span>
                  <span>👥 {program.enrollments.toLocaleString()} kayıt</span>
                  <span>✅ {program.completions.toLocaleString()} tamamlama</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2 text-sm text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100">
                  Düzenle
                </button>
                <button className="px-4 py-2 text-sm text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100">
                  Dersleri Yönet
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
