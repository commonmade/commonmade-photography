import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { getPhotosByAlbum, getAlbumById, type Photo, type Album } from "../lib/firestoreService";

export default function AlbumDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [album, setAlbum] = useState<Album | null>(null);
  const [images, setImages] = useState<Photo[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [aspectRatios, setAspectRatios] = useState<Record<string, number>>({});

  const handleImageLoad = useCallback((id: string, e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight } = e.currentTarget;
    if (naturalWidth && naturalHeight) {
      setAspectRatios((prev) => ({ ...prev, [id]: naturalWidth / naturalHeight }));
    }
  }, []);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([getAlbumById(id), getPhotosByAlbum(id)])
      .then(([albumData, photos]) => {
        setAlbum(albumData);
        setImages(photos);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const nextSlide = useCallback(() => {
    setSelectedIndex((prev) =>
      prev === null ? null : (prev + 1) % images.length
    );
  }, [images.length]);

  const prevSlide = useCallback(() => {
    setSelectedIndex((prev) =>
      prev === null ? null : (prev - 1 + images.length) % images.length
    );
  }, [images.length]);

  useEffect(() => {
    if (selectedIndex === null) return;
    const timer = setInterval(nextSlide, 4000);
    return () => clearInterval(timer);
  }, [selectedIndex, nextSlide]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedIndex === null) return;
      if (e.key === "Escape") setSelectedIndex(null);
      if (e.key === "ArrowRight") nextSlide();
      if (e.key === "ArrowLeft") prevSlide();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, nextSlide, prevSlide]);

  return (
    <div className="w-full animate-in fade-in duration-1000">
      <div className="mb-12 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-xs uppercase tracking-widest text-gray-500 hover:text-black transition-colors"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to Gallery
        </button>
      </div>

      {album && (
        <div className="text-center mb-16 md:mb-24">
          <h2 className="logo-font text-2xl md:text-4xl tracking-widest uppercase font-light text-black">
            {album.title}
          </h2>
          {album.location && (
            <p className="text-xs text-gray-400 tracking-[0.3em] uppercase mt-4">
              {album.location}
            </p>
          )}
          <div className="w-12 h-[1px] bg-gray-300 mx-auto mt-8"></div>
        </div>
      )}

      {loading && (
        <div className="flex justify-center items-center py-32">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin"></div>
        </div>
      )}

      {!loading && images.length === 0 && (
        <div className="text-center py-32 text-gray-400 text-sm tracking-widest uppercase">
          No photos in this album yet
        </div>
      )}

      {/* Masonry Grid (CSS Columns) */}
      {!loading && images.length > 0 && (
        <div className="columns-2 gap-1 md:gap-2 max-w-[1080px] mx-auto w-full pb-10">
          {images.map((img, idx) => (
            <div
              key={img.id}
              className="break-inside-avoid relative group overflow-hidden bg-gray-50 cursor-pointer mb-1 md:mb-2"
              onClick={() => setSelectedIndex(idx)}
            >
              <img
                loading="lazy"
                decoding="async"
                src={img.url}
                alt={`Photo ${idx + 1}`}
                className="w-full h-auto object-cover block transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500" />
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {selectedIndex !== null && (
        <div className="fixed inset-0 z-[100] bg-white/95 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-300">
          <button
            onClick={() => setSelectedIndex(null)}
            className="absolute top-6 right-6 z-[110] p-2 text-black hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={32} strokeWidth={1} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); prevSlide(); }}
            className="absolute left-4 md:left-12 z-[110] p-4 text-black hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft size={32} strokeWidth={1} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); nextSlide(); }}
            className="absolute right-4 md:right-12 z-[110] p-4 text-black hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowRight size={32} strokeWidth={1} />
          </button>
          <div
            className="w-full h-full p-4 md:p-16 flex items-center justify-center"
            onClick={() => setSelectedIndex(null)}
          >
            <img
              loading="lazy"
              decoding="async"
              key={selectedIndex}
              src={images[selectedIndex].url}
              alt={`Slide ${selectedIndex + 1}`}
              className="max-w-full max-h-full object-contain shadow-2xl animate-in fade-in zoom-in-95 duration-500"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-sm tracking-widest text-gray-500 font-light">
            {selectedIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </div>
  );
}
