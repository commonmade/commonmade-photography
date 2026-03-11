import React, { useState, useEffect, useMemo, useCallback } from "react";
import { getAlbumsByCategory, getPhotosByAlbum, type Photo } from "../lib/firestoreService";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { motion } from "framer-motion";
import { fadeUpVariant, staggerContainer } from "../lib/animations";

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

// Layout Algorithm: Dynamic Row Builder
// Targets 4 items/row or natural combos like 3 Landscapes (L+L+L).
function chunkPhotosOptimal(photos: Photo[], ratios: Record<string, number>) {
    const rows = [];
    let i = 0;
    // Target ratio sum of 4.2 perfectly matches 3 Landscapes (~4.5) or 2 Landscape + 2 Portrait (~4.34)
    const TARGET_RATIO = 4.2;

    while (i < photos.length) {
        let minScore = Infinity;
        let bestTake = 1;
        let sum = 0;

        for (let j = 1; j <= 5; j++) {
            if (i + j - 1 >= photos.length) break;

            sum += ratios[photos[i + j - 1].id] || 1.5;
            const diff = Math.abs(sum - TARGET_RATIO);

            // Penalize sequences to strongly favor standard 4 items or natural 3 items
            let penalty = 0;
            if (j === 1) penalty = 5.0;      // Avoid 1-item rows
            else if (j === 2) penalty = 3.0; // Avoid 2-item rows
            else if (j === 3) penalty = 0.5; // Natural for 3 Landscapes (L+L+L)
            else if (j === 4) penalty = 0.0; // Ideal standard 4 items
            else if (j >= 5) penalty = 1.5;  // Discourage 5 items

            const score = diff + penalty;

            if (score < minScore) {
                minScore = score;
                bestTake = j;
            }
        }

        rows.push(photos.slice(i, i + bestTake));
        i += bestTake;
    }

    return rows;
}

interface PortfolioGalleryProps {
    category: string;
}

export default function PortfolioGallery({ category }: PortfolioGalleryProps) {
    const [allPhotos, setAllPhotos] = useState<Photo[]>([]);
    const [loading, setLoading] = useState(true);
    const [fullscreenPhotoIndex, setFullscreenPhotoIndex] = useState<number | null>(null);

    const emptyPhotos = useMemo(() => [], []);
    const portfolioRatios = useAspectRatios(allPhotos.length > 0 ? allPhotos : emptyPhotos);

    useEffect(() => {
        setLoading(true);
        getAlbumsByCategory("portfolio")
            .then(async (fetchedAlbums) => {
                const photoPromises = fetchedAlbums.map(album => getPhotosByAlbum(album.id));
                const photosArrays = await Promise.all(photoPromises);
                setAllPhotos(photosArrays.flat());
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const closeFullscreen = () => {
        setFullscreenPhotoIndex(null);
        setDragProgress(0);
    };

    const nextFullscreen = useCallback(() => {
        setFullscreenPhotoIndex((prev) =>
            prev === null ? null : (prev + 1) % allPhotos.length
        );
        setDragProgress(0);
    }, [allPhotos.length]);

    const prevFullscreen = useCallback(() => {
        setFullscreenPhotoIndex((prev) =>
            prev === null ? null : (prev - 1 + allPhotos.length) % allPhotos.length
        );
        setDragProgress(0);
    }, [allPhotos.length]);

    const [dragProgress, setDragProgress] = useState(0);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (fullscreenPhotoIndex !== null) {
                if (e.key === "Escape") closeFullscreen();
                if (e.key === "ArrowRight") nextFullscreen();
                if (e.key === "ArrowLeft") prevFullscreen();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [fullscreenPhotoIndex, nextFullscreen, prevFullscreen]);

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="w-full"
        >
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

            {!loading && (
                <div className="px-0 w-full pb-24">
                    {allPhotos.length === 0 ? (
                        <div className="text-center py-32 text-gray-400 text-sm tracking-widest uppercase">
                            No photos in portfolio yet
                        </div>
                    ) : (
                        <>
                            {/* Desktop View: Mathematical Strict Rows (Margins = Zero) */}
                            <motion.div
                                variants={staggerContainer}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true, amount: 0.1 }}
                                className="hidden md:flex flex-col gap-[2px] md:gap-[4px] w-full max-w-[1600px] mx-auto pb-24"
                            >
                                {(() => {
                                    const rows = chunkPhotosOptimal(allPhotos, portfolioRatios);
                                    let photoIndexCounter = 0;

                                    return rows.map((rowPhotos, rowIndex) => {
                                        const currentRowIndex = photoIndexCounter;
                                        photoIndexCounter += rowPhotos.length;

                                        return (
                                            <motion.div
                                                variants={fadeUpVariant}
                                                key={`row-${rowIndex}`}
                                                className="flex flex-row gap-[2px] md:gap-[4px] w-full items-stretch"
                                            >
                                                {rowPhotos.map((photo: Photo, localIndex: number) => {
                                                    const ratio = portfolioRatios[photo.id] || 1.5;
                                                    return (
                                                        <PortfolioItem
                                                            key={photo.id}
                                                            photo={photo}
                                                            preloadedRatio={ratio}
                                                            onOpenLightbox={() => setFullscreenPhotoIndex(currentRowIndex + localIndex)}
                                                        />
                                                    );
                                                })}
                                            </motion.div>
                                        );
                                    });
                                })()}
                            </motion.div>

                            {/* Mobile View: 1-column Stack (Original aspect ratio) */}
                            <motion.div
                                variants={staggerContainer}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true, amount: 0.1 }}
                                className="flex flex-col md:hidden gap-[2px]"
                            >
                                {allPhotos.map((photo: Photo, i: number) => (
                                    <motion.div
                                        variants={fadeUpVariant}
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
                                    </motion.div>
                                ))}
                            </motion.div>
                        </>
                    )}
                </div>
            )}

            {/* Fullscreen Photo Lightbox */}
            {fullscreenPhotoIndex !== null && allPhotos[fullscreenPhotoIndex] && (
                <div className="fixed inset-0 z-[150] bg-white/90 backdrop-blur-md flex flex-col animate-in fade-in duration-300 overflow-hidden" onClick={closeFullscreen}>
                    <button onClick={(e) => { e.stopPropagation(); closeFullscreen(); }} className="absolute top-4 right-4 md:top-6 md:right-6 flex items-center justify-center w-[44px] h-[34px] text-black border border-black/80 hover:bg-black/5 rounded-sm transition-all z-[170]"><X size={26} strokeWidth={1.2} /></button>

                    <div className="absolute top-0 left-0 w-1/4 h-full z-[160] cursor-w-resize hidden md:flex items-center justify-start group" onClick={(e) => { e.stopPropagation(); prevFullscreen(); }}>
                        <button className="p-4 text-black/20 lg:group-hover:text-black/60 transition-colors ml-2 md:ml-6"><ArrowLeft size={36} strokeWidth={1.5} /></button>
                    </div>
                    <div className="absolute top-0 right-0 w-1/4 h-full z-[160] cursor-e-resize hidden md:flex items-center justify-end group" onClick={(e) => { e.stopPropagation(); nextFullscreen(); }}>
                        <button className="p-4 text-black/20 lg:group-hover:text-black/60 transition-colors mr-2 md:mr-6"><ArrowRight size={36} strokeWidth={1.5} /></button>
                    </div>

                    <div className="flex-1 flex items-center justify-center p-0 md:p-12 w-full h-full relative touch-none">
                        <motion.img
                            key={fullscreenPhotoIndex}
                            src={allPhotos[fullscreenPhotoIndex].url}
                            alt=""
                            drag="x"
                            dragConstraints={{ left: 0, right: 0 }}
                            dragElastic={0.6}
                            onDrag={(e, info) => setDragProgress(info.offset.x)}
                            onDragEnd={(e, info) => {
                                const swipe = info.offset.x;
                                const threshold = window.innerWidth * 0.2;
                                if (swipe < -threshold) nextFullscreen();
                                else if (swipe > threshold) prevFullscreen();
                                else setDragProgress(0);
                            }}
                            initial={{ opacity: 0, x: dragProgress > 0 ? -100 : 100 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: dragProgress > 0 ? 100 : -100 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="max-w-full md:max-w-[85vw] max-h-[90vh] md:max-h-[85vh] object-contain select-none shadow-sm cursor-grab active:cursor-grabbing"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-black/40 text-[10px] tracking-[0.2em] font-light z-[160]">
                        {fullscreenPhotoIndex + 1} / {allPhotos.length}
                    </div>
                </div>
            )}
        </motion.div>
    );
}

interface PortfolioItemProps {
    photo: Photo;
    preloadedRatio: number;
    onOpenLightbox: () => void;
    key?: React.Key;
}

function PortfolioItem({ photo, preloadedRatio, onOpenLightbox }: PortfolioItemProps) {
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
