'use client';

import { useState, useRef, useCallback } from 'react';
import { MediaPlaceholder, MediaDisplay, UploadPlaceholder } from '@/components/media/MediaPlaceholder';
import { uploadMediaToS3, MediaUploadType } from '@/lib/api';

type MediaType = 'image' | 'video' | 'audio';
type ViewMode = 'grid' | 'list';

interface MediaItem {
  id: string;
  type: MediaType;
  name: string;
  url: string | null; // null = placeholder
  size: number | null;
  mimeType: string | null;
  uploadedAt: string | null;
  usedIn: string[]; // Where this media is used
}

// Demo/placeholder items - CodeCanyon style
const demoMediaItems: MediaItem[] = [
  { id: 'demo-1', type: 'image', name: 'Yoga Class Thumbnail', url: null, size: null, mimeType: null, uploadedAt: null, usedIn: ['Morning Yoga Class'] },
  { id: 'demo-2', type: 'video', name: 'Intro Video', url: null, size: null, mimeType: null, uploadedAt: null, usedIn: ['Homepage'] },
  { id: 'demo-3', type: 'image', name: 'Instructor Avatar', url: null, size: null, mimeType: null, uploadedAt: null, usedIn: ['Teacher Profile'] },
  { id: 'demo-4', type: 'audio', name: 'Meditation Audio', url: null, size: null, mimeType: null, uploadedAt: null, usedIn: ['Meditation Class'] },
  { id: 'demo-5', type: 'video', name: 'Pose Tutorial', url: null, size: null, mimeType: null, uploadedAt: null, usedIn: ['Warrior Pose'] },
  { id: 'demo-6', type: 'image', name: 'Program Cover', url: null, size: null, mimeType: null, uploadedAt: null, usedIn: ['30-Day Challenge'] },
  { id: 'demo-7', type: 'audio', name: 'Background Music', url: null, size: null, mimeType: null, uploadedAt: null, usedIn: ['Relaxation Class'] },
  { id: 'demo-8', type: 'image', name: 'Category Banner', url: null, size: null, mimeType: null, uploadedAt: null, usedIn: ['Hatha Yoga'] },
];

const typeIcons = {
  image: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  video: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  ),
  audio: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
    </svg>
  ),
};

const typeColors = {
  image: 'bg-blue-100 text-blue-700',
  video: 'bg-purple-100 text-purple-700',
  audio: 'bg-green-100 text-green-700',
};

export default function MediaPage() {
  const [mediaItems, setMediaItems] = useState<MediaItem[]>(demoMediaItems);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filterType, setFilterType] = useState<MediaType | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [uploadType, setUploadType] = useState<MediaType>('image');
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter media items
  const filteredItems = mediaItems.filter((item) => {
    const matchesType = filterType === 'all' || item.type === filterType;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  // Stats
  const stats = {
    total: mediaItems.length,
    images: mediaItems.filter((i) => i.type === 'image').length,
    videos: mediaItems.filter((i) => i.type === 'video').length,
    audio: mediaItems.filter((i) => i.type === 'audio').length,
    placeholders: mediaItems.filter((i) => i.url === null).length,
    uploaded: mediaItems.filter((i) => i.url !== null).length,
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    // Determine type from file
    let type: MediaType = 'image';
    let apiType: MediaUploadType = 'image';
    if (file.type.startsWith('video/')) {
      type = 'video';
      apiType = 'video';
    } else if (file.type.startsWith('audio/')) {
      type = 'audio';
      apiType = 'podcast';
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // Upload to S3 via API
      const { fileUrl, key } = await uploadMediaToS3(file, apiType, (progress) => {
        setUploadProgress(progress);
      });

      // Add new media item with real S3 URL
      const newItem: MediaItem = {
        id: key,
        type,
        name: file.name,
        url: fileUrl,
        size: file.size,
        mimeType: file.type,
        uploadedAt: new Date().toISOString(),
        usedIn: [],
      };

      setMediaItems((prev) => [newItem, ...prev]);
      setShowUploadModal(false);
    } catch (error) {
      console.error('Upload failed:', error);
      // Fallback to local blob URL for demo purposes
      const newItem: MediaItem = {
        id: `media-${Date.now()}`,
        type,
        name: file.name,
        url: URL.createObjectURL(file),
        size: file.size,
        mimeType: file.type,
        uploadedAt: new Date().toISOString(),
        usedIn: [],
      };
      setMediaItems((prev) => [newItem, ...prev]);
      setShowUploadModal(false);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleReplaceMedia = (item: MediaItem) => {
    setSelectedItem(item);
    setUploadType(item.type);
    fileInputRef.current?.click();
  };

  const handleDeleteMedia = (item: MediaItem) => {
    if (item.url === null) {
      // Can't delete placeholder
      return;
    }
    setMediaItems((prev) => prev.map((i) =>
      i.id === item.id ? { ...i, url: null, size: null, uploadedAt: null } : i
    ));
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Media Library</h1>
          <p className="text-gray-600 mt-1">Manage images, videos, and audio files</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          Upload Media
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-500">Total Items</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-blue-600">{stats.images}</div>
          <div className="text-sm text-gray-500">Images</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-purple-600">{stats.videos}</div>
          <div className="text-sm text-gray-500">Videos</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-green-600">{stats.audio}</div>
          <div className="text-sm text-gray-500">Audio</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-orange-600">{stats.placeholders}</div>
          <div className="text-sm text-gray-500">Placeholders</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-2xl font-bold text-emerald-600">{stats.uploaded}</div>
          <div className="text-sm text-gray-500">Uploaded</div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="flex-1 min-w-64">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search media..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterType === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilterType('image')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
              filterType === 'image' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {typeIcons.image}
            Images
          </button>
          <button
            onClick={() => setFilterType('video')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
              filterType === 'video' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {typeIcons.video}
            Videos
          </button>
          <button
            onClick={() => setFilterType('audio')}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
              filterType === 'audio' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {typeIcons.audio}
            Audio
          </button>
        </div>

        <div className="flex items-center gap-1 border border-gray-300 rounded-lg p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded ${viewMode === 'grid' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded ${viewMode === 'list' ? 'bg-indigo-100 text-indigo-600' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Media Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow group"
            >
              <div className="relative aspect-video">
                <MediaDisplay
                  type={item.type}
                  src={item.url}
                  alt={item.name}
                  size="lg"
                  className="w-full h-full"
                />
                {item.url === null && (
                  <div className="absolute top-2 right-2 px-2 py-1 bg-orange-500 text-white text-xs rounded-full">
                    Placeholder
                  </div>
                )}
                {/* Hover Actions */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => handleReplaceMedia(item)}
                    className="p-2 bg-white rounded-full hover:bg-gray-100"
                    title="Replace"
                  >
                    <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </button>
                  {item.url && (
                    <button
                      onClick={() => handleDeleteMedia(item)}
                      className="p-2 bg-white rounded-full hover:bg-gray-100"
                      title="Remove (revert to placeholder)"
                    >
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              <div className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-medium text-gray-900 truncate text-sm">{item.name}</h3>
                    <p className="text-xs text-gray-500">{formatFileSize(item.size)}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[item.type]}`}>
                    {item.type}
                  </span>
                </div>
                {item.usedIn.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {item.usedIn.slice(0, 2).map((use, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                        {use}
                      </span>
                    ))}
                    {item.usedIn.length > 2 && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                        +{item.usedIn.length - 2}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Preview</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Used In</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="w-16 h-12 rounded overflow-hidden">
                      <MediaDisplay type={item.type} src={item.url} alt={item.name} size="sm" />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900">{item.name}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${typeColors[item.type]}`}>
                      {typeIcons[item.type]}
                      {item.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {formatFileSize(item.size)}
                  </td>
                  <td className="px-4 py-3">
                    {item.url ? (
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Uploaded</span>
                    ) : (
                      <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">Placeholder</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {item.usedIn.slice(0, 2).map((use, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                          {use}
                        </span>
                      ))}
                      {item.usedIn.length > 2 && (
                        <span className="text-xs text-gray-500">+{item.usedIn.length - 2}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleReplaceMedia(item)}
                        className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                        title="Replace"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                      </button>
                      {item.url && (
                        <button
                          onClick={() => handleDeleteMedia(item)}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Remove"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No media found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'Try a different search term' : 'Get started by uploading some media'}
          </p>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={uploadType === 'image' ? 'image/*' : uploadType === 'video' ? 'video/*' : 'audio/*'}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Upload Media</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1 text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {/* Media Type Selection */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setUploadType('image')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                    uploadType === 'image' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {typeIcons.image}
                  Image
                </button>
                <button
                  onClick={() => setUploadType('video')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                    uploadType === 'video' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {typeIcons.video}
                  Video
                </button>
                <button
                  onClick={() => setUploadType('audio')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                    uploadType === 'audio' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {typeIcons.audio}
                  Audio
                </button>
              </div>

              {/* Drop Zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  dragOver
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
                }`}
              >
                {uploading ? (
                  <div className="space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-full bg-indigo-100 flex items-center justify-center">
                      <svg className="w-8 h-8 text-indigo-600 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    </div>
                    <div className="text-sm text-gray-600">Uploading... {uploadProgress}%</div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <UploadPlaceholder type={uploadType} size="lg" className="mx-auto mb-4 w-24 h-24" />
                    <p className="text-gray-600">
                      <span className="font-medium text-indigo-600">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {uploadType === 'image' && 'PNG, JPG, GIF up to 10MB'}
                      {uploadType === 'video' && 'MP4, MOV, AVI up to 500MB'}
                      {uploadType === 'audio' && 'MP3, WAV, AAC up to 50MB'}
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 p-4 border-t border-gray-200">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
