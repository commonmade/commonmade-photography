import { useState, useEffect, useCallback } from "react";
import { getAlbumsByCategory, getPhotosByAlbum, type Album, type Photo } from "../lib/firestoreService";
import { ArrowLeft, ArrowRight, X } from "lucide-react";

interface GalleryProps {
  category: string;
  categorySlug: string;
}

export default function Gallery({ category, categorySlug }: GalleryProps) {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);

  // Lightbox States
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [lightboxPhotos, setLightboxPhotos] = useState<Photo[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [lightboxLoading, setLightboxLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    getAlbumsByCategory(categorySlug)
      .then(setAlbums)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [categorySlug]);

  const isWeddingDay = categorySlug === "wedding-day";
  const isBabyFamily = categorySlug === "baby-family";
  const isMoments = categorySlug === "moments";
  const showHoverOverlay = isWeddingDay || isBabyFamily || isMoments;

  // --- Lightbox Handlers ---
  const closeLightbox = useCallback(() => {
    setSelectedAlbum(null);
    setLightboxIndex(null);
    setLightboxPhotos([]);
  }, []);

  const openLightbox = async (album: Album) => {
    setSelectedAlbum(album);
    setLightboxLoading(true);
    setLightboxIndex(0); // Show loading spinner initially
    try {
      const photos = await getPhotosByAlbum(album.id);
      setLightboxPhotos(photos);
    } catch (e) {
      console.error("Failed to load photos for album", e);
    } finally {
      setLightboxLoading(false);
    }
  };

  const nextSlide = useCallback(() => {
    setLightboxIndex((prev) =>
      prev === null ? null : (prev + 1) % lightboxPhotos.length
    );
  }, [lightboxPhotos.length]);

  const prevSlide = useCallback(() => {
    setLightboxIndex((prev) =>
      prev === null ? null : (prev - 1 + lightboxPhotos.length) % lightboxPhotos.length
    );
  }, [lightboxPhotos.length]);

  // Slideshow timer
  useEffect(() => {
    if (lightboxIndex === null || lightboxPhotos.length === 0) return;
    const timer = setInterval(nextSlide, 4000);
    return () => clearInterval(timer);
  }, [lightboxIndex, lightboxPhotos.length, nextSlide]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") nextSlide();
      if (e.key === "ArrowLeft") prevSlide();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, nextSlide, prevSlide, closeLightbox]);

  return (
    <div className="w-full animate-in fade-in duration-1000">
      <div className="text-center mb-16 md:mb-24">
        <h2 className="logo-font text-sm md:text-lg tracking-widest uppercase font-light text-black">
          {category}
        </h2>
        <div className="w-12 h-[1px] bg-gray-300 mx-auto mt-8"></div>
      </div>

      {loading && (
        <div className="flex justify-center items-center py-32">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin"></div>
        </div>
      )}

      {!loading && albums.length === 0 && (
        <div className="text-center py-32 text-gray-400 text-sm tracking-widest uppercase">
          No albums yet
        </div>
      )}

      {!loading && albums.length > 0 && (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-1 md:gap-2 px-1 md:px-8 max-w-[1600px] mx-auto pb-24 space-y-1 md:space-y-2">
          {albums.map((album) => (
            <div
              key={album.id}
              onClick={() => openLightbox(album)}
              className="group cursor-pointer flex flex-col break-inside-avoid relative mb-1 md:mb-2"
            >
              <div className="overflow-hidden bg-gray-50 relative w-full inline-block">
                {album.coverImageUrl ? (
                  <img
                    loading="lazy"
                    decoding="async"
                    src={album.coverImageUrl}
                    alt={album.title}
                    className="w-full h-auto object-cover block transition-transform duration-1000 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full aspect-square bg-gray-100 flex items-center justify-center">
                    <span className="text-gray-300 text-xs uppercase tracking-widest">No Cover</span>
                  </div>
                )}

                {showHoverOverlay ? (
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors duration-500 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 p-4 text-center">
                    <h3 className="text-white text-base md:text-lg font-medium tracking-widest uppercase mb-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                      {album.title}
                    </h3>
                    <p className="text-white/80 text-[10px] md:text-xs tracking-[0.2em] uppercase transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 delay-75">
                      {album.location}
                    </p>
                    <div className="w-8 h-[1px] bg-white/50 mt-4 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 delay-100"></div>
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500"></div>
                )}
              </div>

              {!showHoverOverlay && (
                <div className="text-center mt-4 mb-2">
                  <h3 className="text-sm font-medium tracking-widest uppercase text-black mb-1">
                    {album.title}
                  </h3>
                  <p className="text-[10px] text-gray-500 tracking-[0.2em] uppercase">
                    {album.subtitle}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Overlay */}
      {selectedAlbum !== null && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in fade-in duration-300">

          {/* Lightbox Header / Controls */}
          <div className="absolute top-0 left-0 w-full p-4 md:p-6 flex justify-between items-center z-[110] bg-gradient-to-b from-white w-full">
            <div className="flex flex-col">
              <h3 className="logo-font text-lg md:text-xl tracking-widest uppercase text-black">
                {selectedAlbum.title}
              </h3>
              {selectedAlbum.location && (
                <p className="text-[10px] text-gray-400 tracking-[0.2em] uppercase mt-1">
                  {selectedAlbum.location}
                </p>
              )}
            </div>
            <button
              onClick={closeLightbox}
              className="p-2 text-black hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close Lightbox"
            >
              <X size={28} strokeWidth={1.5} />
            </button>
          </div>

          {/* Lightbox Content Zone */}
          <div
            className="flex-1 w-full h-full relative flex items-center justify-center pt-20 pb-4 md:py-20 px-4 md:px-16"
            onClick={closeLightbox}
          >
            {lightboxLoading ? (
              <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin"></div>
            ) : lightboxPhotos.length === 0 ? (
              <div className="text-gray-400 text-sm tracking-widest uppercase">No photos in this album</div>
            ) : lightboxIndex !== null ? (
              <>
                {/* Left / Right Nav Buttons */}
                <button
                  onClick={(e) => { e.stopPropagation(); prevSlide(); }}
                  className="absolute left-2 md:left-8 z-[110] p-3 text-black hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ArrowLeft size={28} strokeWidth={1} />
                </button>

                <img
                  loading="lazy"
                  decoding="async"
                  key={lightboxIndex}
                  src={lightboxPhotos[lightboxIndex].url}
                  alt={`Slide ${lightboxIndex + 1}`}
                  className="max-w-full max-h-[85vh] object-contain shadow-sm animate-in fade-in zoom-in-95 duration-500"
                  onClick={(e) => e.stopPropagation()}
                />

                <button
                  onClick={(e) => { e.stopPropagation(); nextSlide(); }}
                  className="absolute right-2 md:right-8 z-[110] p-3 text-black hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ArrowRight size={28} strokeWidth={1} />
                </button>

                {/* Counter */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] tracking-widest text-gray-400 font-light">
                  {lightboxIndex + 1} / {lightboxPhotos.length}
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
