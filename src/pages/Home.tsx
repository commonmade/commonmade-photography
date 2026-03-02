import { useState, useEffect } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { getMainSlides, type MainSlide } from "../lib/firestoreService";

const fallbackImages = [
  "https://picsum.photos/seed/home1/1600/990",
  "https://picsum.photos/seed/home2/1600/990",
  "https://picsum.photos/seed/home3/1600/990",
];

export default function Home() {
  const [slides, setSlides] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMainSlides()
      .then((data: MainSlide[]) => {
        if (data.length > 0) {
          setSlides(data.map((s) => s.url));
        } else {
          setSlides(fallbackImages);
        }
      })
      .catch(() => setSlides(fallbackImages))
      .finally(() => setLoading(false));
  }, []);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  useEffect(() => {
    if (slides.length === 0) return;
    const timer = setInterval(nextSlide, 2000);
    return () => clearInterval(timer);
  }, [slides.length]);

  if (loading || slides.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative flex items-center justify-center overflow-hidden animate-in fade-in duration-1000 bg-white">
      <div className="w-full h-full relative flex items-center justify-center bg-white">
        {slides.map((img, index) => {
          let position = "translate-x-[150%] opacity-0 scale-90";
          let zIndex = 0;

          if (index === currentIndex) {
            position = "translate-x-0 opacity-100 scale-100";
            zIndex = 20;
          } else if (index === (currentIndex - 1 + slides.length) % slides.length) {
            position = "-translate-x-[102.5%] opacity-60 scale-95";
            zIndex = 10;
          } else if (index === (currentIndex + 1) % slides.length) {
            position = "translate-x-[102.5%] opacity-60 scale-95";
            zIndex = 10;
          }

          return (
            <div
              key={index}
              className={`absolute w-[95%] md:w-[75%] lg:w-[65%] h-full transition-all duration-700 ease-in-out flex items-center justify-center ${position}`}
              style={{ zIndex }}
            >
              <img
                loading="lazy"
                decoding="async"
                src={img}
                alt={`Slide ${index + 1}`}
                className="w-full h-full object-cover md:object-contain"
              />
            </div>
          );
        })}
      </div>

      <button
        onClick={prevSlide}
        className="absolute left-4 md:left-12 z-30 bg-white/80 hover:bg-white p-3 md:p-4 transition-colors duration-300 shadow-sm"
        aria-label="Previous slide"
      >
        <ArrowLeft size={20} className="text-black" />
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-4 md:right-12 z-30 bg-white/80 hover:bg-white p-3 md:p-4 transition-colors duration-300 shadow-sm"
        aria-label="Next slide"
      >
        <ArrowRight size={20} className="text-black" />
      </button>
    </div>
  );
}
