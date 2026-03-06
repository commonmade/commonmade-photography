import React, { useState, useEffect, useCallback, useMemo } from "react";
import { getAlbumsByCategory, getPhotosByAlbum, type Photo, type Album } from "../lib/firestoreService";
import { ArrowLeft, ArrowRight, X } from "lucide-react";

// Hook to preload image aspect ratios
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
                newRatios[photo.id] = 1.5;
                loadedCount++;
                if (loadedCount === photos.length) {
                    setAspectRatios(prev => ({ ...prev, ...newRatios }));
                }
            };
        });
    }, [photos]);

    return aspectRatios;
}

// Layout Algorithm: Strict 2-column or 1-column builder for Venue Details
// Allows 1 Landscape alone, or combinations of 2 items (P+P, L+P, P+L)
function chunkPhotosForVenue(photos: Photo[], ratios: Record<string, number>) {
    const rows = [];
    let i = 0;

    while (i < photos.length) {
        let take = 1;
        const currentRatio = ratios[photos[i].id] || 1.5;

        // If the current photo is landscape (ratio > 1.2), there is a chance it wants to be alone
        // But the user requested "2행 형태 기본 유지해줘" (Keep mostly 2 columns)
        // If it's a portrait (<1.2), we ALWAYS try to take 2 so portraits aren't alone.
        if (i < photos.length - 1) {
            const nextRatio = ratios[photos[i + 1].id] || 1.5;

            if (currentRatio < 1.1 || nextRatio < 1.1) {
                // If either this one or next one is portrait, group them to complete a 2-col row
                take = 2;
            } else {
                // If both are landscapes, we can still group them to make L+L, 
                // but if we want a full width L, we can just leave take=1.
                // Let's bias towards taking 2 unless it results in extreme squishing
                if (currentRatio + nextRatio > 3.2) {
                    // Two very wide panoramas -> let them be single wide images
                    take = 1;
                } else {
                    take = 2;
                }
            }
        }

        rows.push(photos.slice(i, i + take));
        i += take;
    }

    return rows;
}

interface VenueGalleryProps {
    category: string;
    categorySlug: string;
}

export default function VenueGallery({ category, categorySlug }: VenueGalleryProps) {
    const [albums, setAlbums] = useState<Album[]>([]);
    const [loading, setLoading] = useState(true);

    // Album Detail View States
    const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
    const [lightboxPhotos, setLightboxPhotos] = useState<Photo[]>([]);
    const [lightboxLoading, setLightboxLoading] = useState(false);

    // Fullscreen Photo Lightbox States
    const [fullscreenPhotoIndex, setFullscreenPhotoIndex] = useState<number | null>(null);

    // Mobile Touch Hover State
    const [activeMobileId, setActiveMobileId] = useState<string | null>(null);

    const emptyPhotos = useMemo(() => [], []);
    const lightboxRatios = useAspectRatios(selectedAlbum ? lightboxPhotos : emptyPhotos);

    useEffect(() => {
        setLoading(true);
        getAlbumsByCategory(categorySlug)
            .then(setAlbums)
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

    const nextFullscreen = useCallback(() => {
        setFullscreenPhotoIndex((prev) =>
            prev === null ? null : (prev + 1) % lightboxPhotos.length
        );
    }, [lightboxPhotos.length]);

    const prevFullscreen = useCallback(() => {
        setFullscreenPhotoIndex((prev) =>
            prev === null ? null : (prev - 1 + lightboxPhotos.length) % lightboxPhotos.length
        );
    }, [lightboxPhotos.length]);

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

            {/* Album Grid */}
            {!loading && (
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

            {/* Album Detail Scroll View Overlay */}
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
                                {/* Desktop/Tablet View: Mathematical Strict Rows (Max 2 columns) */}
                                <div className="hidden md:flex flex-col gap-[2px] md:gap-[4px] w-full max-w-5xl mx-auto">
                                    {(() => {
                                        const rows = chunkPhotosForVenue(lightboxPhotos, lightboxRatios);
                                        let photoIndexCounter = 0;

                                        return rows.map((rowPhotos, rowIndex) => {
                                            const currentRowIndex = photoIndexCounter;
                                            photoIndexCounter += rowPhotos.length;

                                            return (
                                                <div key={`row-${rowIndex}`} className="flex flex-row gap-[2px] md:gap-[4px] w-full items-stretch">
                                                    {rowPhotos.map((photo: Photo, localIndex: number) => {
                                                        const ratio = lightboxRatios[photo.id] || 1.5;
                                                        return (
                                                            <VenueGalleryItem
                                                                key={photo.id}
                                                                photo={photo}
                                                                preloadedRatio={ratio}
                                                                onOpenLightbox={() => setFullscreenPhotoIndex(currentRowIndex + localIndex)}
                                                            />
                                                        );
                                                    })}
                                                </div>
                                            );
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

            {/* Fullscreen Photo Lightbox */}
            {fullscreenPhotoIndex !== null && lightboxPhotos[fullscreenPhotoIndex] && (
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
                            src={lightboxPhotos[fullscreenPhotoIndex].url}
                            alt=""
                            className="max-w-[90vw] md:max-w-[85vw] max-h-[85vh] object-contain select-none shadow-sm animate-in zoom-in-95 duration-500"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-black/40 text-[10px] tracking-[0.2em] font-light">
                        {fullscreenPhotoIndex + 1} / {lightboxPhotos.length}
                    </div>
                </div>
            )}
        </div>
    );
}

interface VenueGalleryItemProps {
    photo: Photo;
    preloadedRatio: number;
    onOpenLightbox: () => void;
    key?: React.Key;
}

function VenueGalleryItem({ photo, preloadedRatio, onOpenLightbox }: VenueGalleryItemProps) {
    const [aspectRatio, setAspectRatio] = useState<number>(preloadedRatio);

    return (
        <div
            className="relative group cursor-zoom-in overflow-hidden bg-gray-50 flex-shrink-0"
            style={{
                flexGrow: aspectRatio * 1000,
                flexBasis: 0,
                minWidth: 0
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
