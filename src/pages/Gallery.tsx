import React, { useState, useEffect, useMemo, useCallback } from "react";
import { getAlbumsByCategory, getPhotosByAlbum, type Photo, type Album } from "../lib/firestoreService";
import { ArrowLeft, ArrowRight, X } from "lucide-react";

// Hook to preload image aspect ratios so we can confidently group by landscape vs portrait
function useAspectRatios(photos: Photo[]) {
  const [aspectRatios, setAspectRatios] = useState<Record<string, number>>({});

  useEffect(() => {
    if (photos.length === 0) {
      setAspectRatios({});
      return;
    }

    const newRatios: Record<string, number> = {};
    let loadedCount = 0;

    photos.forEach(photo => {
      const img = new Image();
      img.src = photo.url;
      img.onload = () => {
        newRatios[photo.id] = img.naturalWidth / img.naturalHeight;
        loadedCount++;
        if (loadedCount === photos.length) {
          setAspectRatios(prev => ({ ...prev, ...newRatios }));
        }
      };
      img.onerror = () => {
        // Fallback for broken images or errors
        newRatios[photo.id] = 1.5; // Default to landscape
        loadedCount++;
        if (loadedCount === photos.length) {
          setAspectRatios(prev => ({ ...prev, ...newRatios }));
        }
      };
    });
  }, [photos]);

  return aspectRatios;
}

// Layout Algorithm: Smart Justified Row Packer
// To ensure there are NO blank spaces and NO awkwardly stretched single portraits,
// this groups photos by aiming for a "Target Row Width Ratio" instead of strict counts.
function packPhotosIntoPerfectRows(photos: Photo[], ratios: Record<string, number>) {
  const rows = [];
  let currentRow: Photo[] = [];
  let currentRatioSum = 0;

  // Tweak these to change how many photos fit per row
  // A standard landscape photo ratio is ~1.5
  // A standard portrait photo ratio is ~0.66

  // If we want rows to typically have 1-2 photos, an ideal row ratio sum is around 1.5 to 2.0
  const idealRowRatioSum = 1.9;

  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    const ratio = ratios[photo.id] || 1.5;

    currentRow.push(photo);
    currentRatioSum += ratio;

    // Decide if we should break the row here
    // We break if adding another photo would make it way too wide, OR if it's already "wide enough"
    let shouldBreak = false;

    // Look ahead to see if adding the next photo overshoots terribly
    if (i < photos.length - 1) {
      const nextRatio = ratios[photos[i + 1].id] || 1.5;
      if (currentRatioSum >= idealRowRatioSum || (currentRatioSum + nextRatio > idealRowRatioSum * 1.5)) {
        shouldBreak = true;
      }
    } else {
      // Last photo always breaks
      shouldBreak = true;
    }

    if (shouldBreak) {
      // The larger the ratio sum, the shorter the target height needs to be to make it fit max-width
      // Base height 500, divided by the actual density of the row
      const calculatedHeight = Math.min(600, Math.max(250, 700 / currentRatioSum));

      rows.push({
        size: currentRow.length,
        items: currentRow,
        targetHeight: calculatedHeight
      });

      currentRow = [];
      currentRatioSum = 0;
    }
  }

  return rows;
}

interface GalleryProps {
  category: string;
  categorySlug: string;
}

export default function Gallery({ category, categorySlug }: GalleryProps) {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [allPhotos, setAllPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);

  // Album Detail View States (For non-portfolio categories like Venue)
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [lightboxPhotos, setLightboxPhotos] = useState<Photo[]>([]);
  const [lightboxLoading, setLightboxLoading] = useState(false);

  // Fullscreen Photo Lightbox States
  const [fullscreenPhotoIndex, setFullscreenPhotoIndex] = useState<number | null>(null);

  // Mobile Touch Hover State
  const [activeMobileId, setActiveMobileId] = useState<string | null>(null);

  const isPortfolio = categorySlug === "portfolio";

  // Preload ratios for main portfolio
  const portfolioRatios = useAspectRatios(isPortfolio ? allPhotos : []);

  useEffect(() => {
    setLoading(true);
    getAlbumsByCategory(categorySlug)
      .then(async (fetchedAlbums) => {
        setAlbums(fetchedAlbums);

        // If portfolio, aggregate all photos into one view
        if (categorySlug === "portfolio") {
          const photoPromises = fetchedAlbums.map(album => getPhotosByAlbum(album.id));
          const photosArrays = await Promise.all(photoPromises);
          // Flatten and sort by original album order/created if possible, 
          // but for now just flatten
          const flatPhotos = photosArrays.flat();
          setAllPhotos(flatPhotos);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [categorySlug]);

  // --- Click Handlers ---
  const handleAlbumClick = (e: React.MouseEvent, album: Album) => {
    e.stopPropagation();
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    if (isTouch) {
      if (activeMobileId !== album.id) {
        setActiveMobileId(album.id);
        return;
      }
    }
    openDetailView(album);
  };

  useEffect(() => {
    const handleGlobalClick = () => setActiveMobileId(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // --- Detail View Handlers ---
  const closeDetailView = useCallback(() => {
    setSelectedAlbum(null);
    setLightboxPhotos([]);
    setActiveMobileId(null);
  }, []);

  const openDetailView = async (album: Album) => {
    setSelectedAlbum(album);
    setLightboxLoading(true);
    try {
      const photos = await getPhotosByAlbum(album.id);
      setLightboxPhotos(photos);
    } catch (e) {
      console.error("Failed to load photos for album", e);
    } finally {
      setLightboxLoading(false);
    }
  };

  // --- Fullscreen Lightbox Handlers ---
  const closeFullscreen = () => setFullscreenPhotoIndex(null);

  const currentPhotoSet = isPortfolio ? allPhotos : lightboxPhotos;

  const nextFullscreen = useCallback(() => {
    setFullscreenPhotoIndex((prev) =>
      prev === null ? null : (prev + 1) % currentPhotoSet.length
    );
  }, [currentPhotoSet.length]);

  const prevFullscreen = useCallback(() => {
    setFullscreenPhotoIndex((prev) =>
      prev === null ? null : (prev - 1 + currentPhotoSet.length) % currentPhotoSet.length
    );
  }, [currentPhotoSet.length]);

  const lightboxRatios = useAspectRatios(selectedAlbum ? lightboxPhotos : []);

  // Use body padding to prevent scroll when modal is open
  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (fullscreenPhotoIndex !== null) {
        if (e.key === "Escape") closeFullscreen();
        if (e.key === "ArrowRight") nextFullscreen();
        if (e.key === "ArrowLeft") prevFullscreen();
      } else if (selectedAlbum !== null) {
        if (e.key === "Escape") closeDetailView();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [fullscreenPhotoIndex, selectedAlbum, nextFullscreen, prevFullscreen, closeDetailView]);

  return (
    <div className="w-full animate-in fade-in duration-1000" onClick={() => setActiveMobileId(null)}>
      <div className="text-center mb-16 md:mb-24 px-4">
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

      {/* Portfolio View (Responsive: 4-item Desktop Justified / 2-column Mobile Portrait) */}
      {!loading && isPortfolio && (
        <div className="px-0 w-full pb-24">
          {allPhotos.length === 0 ? (
            <div className="text-center py-32 text-gray-400 text-sm tracking-widest uppercase">
              No photos in portfolio yet
            </div>
          ) : (
            <>
              {/* Desktop View: Perfectly Packed Justified Gallery */}
              <div className="hidden md:flex flex-wrap gap-1 md:gap-[6px] w-full max-w-[1600px] mx-auto pb-24 after:content-[''] after:flex-grow-[10] after:min-w-[40%]">
                {(() => {
                  const rows = packPhotosIntoPerfectRows(allPhotos, portfolioRatios);
                  let photoIndexCounter = 0; // to keep track of absolute index for lightbox

                  return rows.map((row) => {
                    const rowElements = row.items.map((photo: Photo, localIndex: number) => {
                      const absoluteIndex = photoIndexCounter++;
                      return (
                        <PortfolioItem
                          key={photo.id}
                          photo={photo}
                          targetRowHeight={row.targetHeight}
                          onOpenLightbox={() => setFullscreenPhotoIndex(absoluteIndex)}
                        />
                      );
                    });
                    return rowElements;
                  });
                })()}
              </div>

              {/* Mobile View: 1-column Stack (Original aspect ratio) */}
              <div className="flex flex-col md:hidden gap-0">
                {allPhotos.map((photo: Photo, i: number) => (
                  <div
                    key={photo.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setFullscreenPhotoIndex(i);
                    }}
                    className="relative w-full overflow-hidden bg-gray-50 cursor-zoom-in"
                  >
                    <img
                      loading="lazy"
                      src={photo.url}
                      alt=""
                      className="w-full h-auto block"
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Venue/Other Categories View (Album Grid) */}
      {!loading && !isPortfolio && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-6 px-4 md:px-0 max-w-5xl mx-auto pb-32">
          {albums.length === 0 ? (
            <div className="text-center py-32 text-gray-400 text-sm tracking-widest uppercase col-span-1 md:col-span-2">
              No albums yet
            </div>
          ) : (
            albums.map((album, index) => {
              const isMobileActive = activeMobileId === album.id;
              const bgOverlayClass = isMobileActive
                ? "bg-black/60 opacity-100"
                : "bg-black/0 opacity-0 lg:group-hover:bg-black/60 lg:group-hover:opacity-100";
              const transformClass = isMobileActive
                ? "translate-y-0"
                : "translate-y-4 lg:group-hover:translate-y-0";

              return (
                <div
                  key={album.id}
                  onClick={(e) => handleAlbumClick(e, album)}
                  className="group cursor-pointer relative overflow-hidden bg-gray-50 aspect-[3/4]"
                >
                  <div className="w-full h-full relative">
                    {album.coverImageUrl ? (
                      <img
                        loading={index < 4 ? "eager" : "lazy"}
                        fetchPriority={index < 4 ? "high" : "auto"}
                        src={album.coverImageUrl}
                        alt={album.title}
                        className="w-full h-full object-cover block transition-transform duration-1000 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <span className="text-gray-300 text-xs uppercase tracking-widest">No Cover</span>
                      </div>
                    )}
                    <div className={`absolute inset-0 transition-all duration-500 flex flex-col items-center justify-center p-4 text-center ${bgOverlayClass}`}>
                      <h3 className={`text-white text-base md:text-lg font-medium tracking-widest uppercase mb-2 transform transition-transform duration-500 ${transformClass}`}>
                        {album.title}
                      </h3>
                      <p className={`text-white/80 text-[10px] md:text-xs tracking-[0.2em] uppercase transform transition-transform duration-500 delay-75 ${transformClass}`}>
                        {album.location}
                      </p>
                      <div className={`w-8 h-[1px] bg-white/50 mt-4 transform transition-transform duration-500 delay-100 ${transformClass}`}></div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Album Detail Scroll View Overlay (For non-Portfolio) */}
      {selectedAlbum !== null && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col overflow-y-auto animate-in fade-in duration-300">
          <div className="sticky top-0 left-0 w-full p-4 md:p-6 flex justify-between items-center z-[110] bg-white/95 backdrop-blur-sm shadow-sm">
            <div className="flex flex-col">
              <h3 className="logo-font text-lg md:text-xl tracking-widest uppercase text-black">{selectedAlbum.title}</h3>
              {selectedAlbum.location && <p className="text-[10px] text-gray-400 tracking-[0.2em] uppercase mt-1">{selectedAlbum.location}</p>}
            </div>
            <button onClick={closeDetailView} className="p-2 text-black hover:bg-gray-100 rounded-full transition-colors"><X size={28} strokeWidth={1.5} /></button>
          </div>
          <div className="flex-1 w-full pt-8 pb-32 px-4 md:px-8 max-w-[1200px] mx-auto min-h-screen">
            {lightboxLoading ? (
              <div className="flex justify-center items-center py-32"><div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin"></div></div>
            ) : (
              <>
                {/* Desktop/Tablet View: Perfectly Packed Justified Gallery */}
                <div className="hidden md:flex flex-wrap gap-[6px] w-full max-w-5xl mx-auto after:content-[''] after:flex-grow-[10] after:min-w-[40%]">
                  {(() => {
                    const rows = packPhotosIntoPerfectRows(lightboxPhotos, lightboxRatios);
                    let photoIndexCounter = 0;

                    return rows.map((row) => {
                      const rowElements = row.items.map((photo: Photo, localIndex: number) => {
                        const absoluteIndex = photoIndexCounter++;
                        return (
                          <PortfolioItem
                            key={photo.id}
                            photo={photo}
                            targetRowHeight={row.targetHeight}
                            onOpenLightbox={() => setFullscreenPhotoIndex(absoluteIndex)}
                          />
                        );
                      });
                      return rowElements;
                    });
                  })()}
                </div>

                {/* Mobile View: 1-column Stack */}
                <div className="flex flex-col md:hidden gap-[2px] cursor-zoom-in w-full max-w-5xl mx-auto">
                  {lightboxPhotos.map((photo, i) => (
                    <img
                      key={photo.id}
                      loading="lazy"
                      src={photo.url}
                      alt=""
                      onClick={(e) => { e.stopPropagation(); setFullscreenPhotoIndex(i); }}
                      className="w-full h-auto object-cover mb-[2px] shadow-sm bg-gray-50 hover:opacity-95 transition-opacity duration-300 break-inside-avoid"
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Fullscreen Photo Lightbox (Unified for both Portfolio and Albums) */}
      {fullscreenPhotoIndex !== null && currentPhotoSet[fullscreenPhotoIndex] && (
        <div className="fixed inset-0 z-[150] bg-white/70 backdrop-blur-sm flex flex-col animate-in fade-in duration-300" onClick={closeFullscreen}>
          <button onClick={(e) => { e.stopPropagation(); closeFullscreen(); }} className="absolute top-4 right-4 md:top-6 md:right-6 flex items-center justify-center w-[44px] h-[34px] text-black border border-black/80 hover:bg-black/5 rounded-sm transition-all z-[160]"><X size={26} strokeWidth={1.2} /></button>

          <div className="absolute top-0 left-0 w-1/4 h-full z-[155] cursor-w-resize flex items-center justify-start group" onClick={(e) => { e.stopPropagation(); prevFullscreen(); }}>
            <button className="p-4 text-black/20 lg:group-hover:text-black/60 transition-colors ml-2 md:ml-6"><ArrowLeft size={36} strokeWidth={1.5} /></button>
          </div>
          <div className="absolute top-0 right-0 w-1/4 h-full z-[155] cursor-e-resize flex items-center justify-end group" onClick={(e) => { e.stopPropagation(); nextFullscreen(); }}>
            <button className="p-4 text-black/20 lg:group-hover:text-black/60 transition-colors mr-2 md:mr-6"><ArrowRight size={36} strokeWidth={1.5} /></button>
          </div>

          <div className="flex-1 flex items-center justify-center p-6 md:p-12 w-full h-full">
            <img
              key={fullscreenPhotoIndex}
              src={currentPhotoSet[fullscreenPhotoIndex].url}
              alt=""
              className="max-w-[90vw] md:max-w-[85vw] max-h-[85vh] object-contain select-none shadow-sm animate-in zoom-in-95 duration-500"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-black/40 text-[10px] tracking-[0.2em] font-light">
            {fullscreenPhotoIndex + 1} / {currentPhotoSet.length}
          </div>
        </div>
      )}
    </div>
  );
}

interface PortfolioItemProps {
  photo: Photo;
  targetRowHeight: number;
  onOpenLightbox: () => void;
  key?: React.Key;
}

function PortfolioItem({ photo, targetRowHeight, onOpenLightbox }: PortfolioItemProps) {
  // Start with a standard landscape ratio fallback
  const [aspectRatio, setAspectRatio] = useState<number>(1.5);

  return (
    <div
      className={`relative group cursor-zoom-in overflow-hidden bg-gray-50 flex-shrink-0`}
      // Let flex-grow handle all sizing cleanly. No max-widths.
      style={{
        flexGrow: aspectRatio * 10,
        flexBasis: `${aspectRatio * targetRowHeight}px`
      }}
      onClick={onOpenLightbox}
    >
      <div className="w-full relative block" style={{ paddingBottom: `${(1 / aspectRatio) * 100}%` }}>
        <img
          loading="lazy"
          src={photo.url}
          alt=""
          onLoad={(e) => {
            const img = e.target as HTMLImageElement;
            if (img.naturalHeight > 0) {
              setAspectRatio(img.naturalWidth / img.naturalHeight);
            }
          }}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500" />
      </div>
    </div>
  );
}


