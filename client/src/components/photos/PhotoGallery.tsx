import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Image as ImageIcon, Heart, Download, Trash2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { timeAgo, getInitials, generateAvatarColor } from '../../lib/utils';
import type { Photo } from '../../types';

interface PhotoGalleryProps {
  photos: Photo[];
  onRefresh: () => void;
}

export function PhotoUploader({ onUpload }: { onUpload: () => void }) {
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState('');
  const [preview, setPreview] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(acceptedFiles);
    const previews = acceptedFiles.map((f) => URL.createObjectURL(f));
    setPreview(previews);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.gif'] },
    maxSize: 10 * 1024 * 1024,
    maxFiles: 20,
  });

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    try {
      const formData = new FormData();
      files.forEach((f) => formData.append('photos', f));
      if (caption) formData.append('caption', caption);

      await api.post('/photos/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success(`${files.length} photo${files.length > 1 ? 's' : ''} uploaded! 📸`);
      setFiles([]);
      setPreview([]);
      setCaption('');
      onUpload();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="card mb-6">
      <h3 className="font-display text-lg font-bold text-dark mb-4 flex items-center gap-2">
        <Upload size={20} className="text-primary" />
        Upload Memories
      </h3>

      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
          isDragActive
            ? 'border-primary bg-primary-50'
            : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'
        }`}
      >
        <input {...getInputProps()} />
        <ImageIcon size={40} className="mx-auto text-gray-300 mb-3" />
        <p className="text-gray-500 text-sm">
          {isDragActive ? 'Drop your photos here!' : 'Drag & drop photos, or click to browse'}
        </p>
        <p className="text-gray-400 text-xs mt-1">JPG, PNG, WebP, HEIC — max 10MB each (up to 20)</p>
      </div>

      {preview.length > 0 && (
        <div className="mt-4">
          <div className="flex gap-2 flex-wrap mb-3">
            {preview.map((src, i) => (
              <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden group">
                <img src={src} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => {
                    setFiles((f) => f.filter((_, idx) => idx !== i));
                    setPreview((p) => p.filter((_, idx) => idx !== i));
                  }}
                  className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={12} className="text-white" />
                </button>
              </div>
            ))}
          </div>

          <input
            type="text"
            placeholder="Add a caption... (optional)"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="input-field mb-3"
          />

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleUpload}
            disabled={uploading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {uploading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Upload size={18} />
            )}
            {uploading ? 'Uploading...' : `Upload ${files.length} photo${files.length > 1 ? 's' : ''}`}
          </motion.button>
        </div>
      )}
    </div>
  );
}

export function PhotoGallery({ photos, onRefresh }: PhotoGalleryProps) {
  const user = useAuthStore((s) => s.user);
  const [lightbox, setLightbox] = useState<Photo | null>(null);
  const [downloading, setDownloading] = useState(false);

  const toggleLike = async (photoId: string) => {
    try {
      await api.post(`/photos/${photoId}/like`);
      onRefresh();
    } catch {
      toast.error('Failed to like photo');
    }
  };

  const deletePhoto = async (photoId: string) => {
    try {
      await api.delete(`/photos/${photoId}`);
      toast.success('Photo deleted');
      onRefresh();
    } catch {
      toast.error('Failed to delete');
    }
  };

  // Download a single photo by fetching the blob
  const downloadPhoto = async (photo: Photo, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (photo.url.startsWith('data:')) {
        // base64 data URL — create a link directly
        const a = document.createElement('a');
        a.href = photo.url;
        a.download = `photo_${photo.id}.jpg`;
        a.click();
      } else {
        const res = await fetch(photo.url);
        const blob = await res.blob();
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `photo_${photo.id}.jpg`;
        a.click();
        URL.revokeObjectURL(a.href);
      }
    } catch {
      toast.error('Download failed');
    }
  };

  // Download all as ZIP
  const downloadAll = async () => {
    setDownloading(true);
    try {
      const res = await api.get('/photos/download-all', { responseType: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([res.data], { type: 'application/zip' }));
      a.download = 'team-outing-photos.zip';
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success('All photos downloaded!');
    } catch {
      toast.error('Download failed');
    } finally {
      setDownloading(false);
    }
  };

  if (photos.length === 0) {
    return (
      <div className="text-center py-12">
        <ImageIcon size={48} className="mx-auto text-gray-300 mb-3" />
        <p className="text-gray-400">No photos yet — be the first to upload! 📸</p>
      </div>
    );
  }

  return (
    <>
      {/* Download All button */}
      {photos.length > 0 && (
        <div className="flex justify-end mb-4">
          <button
            onClick={downloadAll}
            disabled={downloading}
            className="flex items-center gap-2 px-4 py-2 bg-dark text-white rounded-2xl text-sm font-medium hover:bg-dark/80 transition-all disabled:opacity-50"
          >
            <Download size={16} />
            {downloading ? 'Preparing ZIP…' : `Download All (${photos.length})`}
          </button>
        </div>
      )}

      <div className="masonry-grid">
        {photos.map((photo) => (
          <motion.div
            key={photo.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl overflow-hidden shadow-card group cursor-pointer"
            onClick={() => setLightbox(photo)}
          >
            <div className="relative">
              <img
                src={photo.thumbnailUrl || photo.url}
                alt={photo.caption || 'Team photo'}
                className="w-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-white text-xs font-medium">{photo.uploader?.name}</p>
                <p className="text-white/70 text-xs">{timeAgo(photo.uploadedAt)}</p>
              </div>
            </div>
            <div className="p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); toggleLike(photo.id); }}
                  className={`flex items-center gap-1 text-sm transition-colors ${
                    photo.likedBy?.includes(user?.id || '') ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
                  }`}
                >
                  <Heart size={16} fill={photo.likedBy?.includes(user?.id || '') ? 'currentColor' : 'none'} />
                  <span>{photo.likes}</span>
                </button>
              </div>
              <div className="flex items-center gap-2">
                {/* Download individual photo — available to all */}
                <button
                  onClick={(e) => downloadPhoto(photo, e)}
                  className="text-gray-300 hover:text-primary transition-colors"
                  title="Download photo"
                >
                  <Download size={14} />
                </button>
                {/* Delete — own photo or admin */}
                {(user?.role === 'ADMIN' || photo.uploaderId === user?.id) && (
                  <button
                    onClick={(e) => { e.stopPropagation(); deletePhoto(photo.id); }}
                    className="text-gray-300 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
            {photo.caption && (
              <p className="px-3 pb-3 text-xs text-gray-500">{photo.caption}</p>
            )}
          </motion.div>
        ))}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setLightbox(null)}
          >
            <button className="absolute top-4 right-4 text-white/80 hover:text-white" onClick={() => setLightbox(null)}>
              <X size={28} />
            </button>
            <button
              className="absolute top-4 right-14 text-white/80 hover:text-white"
              onClick={(e) => downloadPhoto(lightbox, e)}
              title="Download this photo"
            >
              <Download size={22} />
            </button>
            <motion.img
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              src={lightbox.url}
              alt={lightbox.caption || ''}
              className="max-h-[85vh] max-w-[90vw] rounded-2xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute bottom-6 text-center text-white">
              {lightbox.caption && <p className="text-lg mb-1">{lightbox.caption}</p>}
              <p className="text-sm text-white/60">
                by {lightbox.uploader?.name} · {timeAgo(lightbox.uploadedAt)}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
