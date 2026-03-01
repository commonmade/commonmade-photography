import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAlbumsByCategory, type Album } from "../lib/firestoreService";

interface GalleryProps {
  category: string;
  categorySlug: string;
}

export default function Gallery({ category, categorySlug }: GalleryProps) {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);

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
  const showGrayscale = isWeddingDay || isMoments;

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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 lg:gap-8 px-8 md:px-24 lg:px-40 max-w-[1280px] mx-auto">
          {albums.map((album) => (
            <Link
              to={`/${categorySlug}/${album.id}`}
              key={album.id}
              className="group cursor-pointer flex flex-col"
            >
              <div className="overflow-hidden bg-gray-50 relative aspect-[4/5]">
                {album.coverImageUrl ? (
                  <img
                    loading="lazy"
                    decoding="async"
                    src={album.coverImageUrl}
                    alt={album.title}
                    className={`w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 ${showGrayscale ? "grayscale" : ""}`}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <span className="text-gray-300 text-xs uppercase tracking-widest">No Cover</span>
                  </div>
                )}

                {showHoverOverlay ? (
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-colors duration-500 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100">
                    <h3 className="text-white text-lg font-medium tracking-widest uppercase mb-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                      {album.title}
                    </h3>
                    <p className="text-white/80 text-xs tracking-[0.2em] uppercase transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 delay-75">
                      {album.location}
                    </p>
                    <div className="w-8 h-[1px] bg-white/50 mt-4 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 delay-100"></div>
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500"></div>
                )}
              </div>

              {!showHoverOverlay && (
                <div className="text-center mt-6">
                  <h3 className="text-sm font-medium tracking-widest uppercase text-black mb-2">
                    {album.title}
                  </h3>
                  <p className="text-[10px] text-gray-500 tracking-[0.2em] uppercase">
                    {album.subtitle}
                  </p>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
