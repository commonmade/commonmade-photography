import { useState, useEffect, useRef } from "react";
import { getMainSlides, type MainSlide } from "../lib/firestoreService";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import { ArrowLeft, ArrowRight } from "lucide-react";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";

// 첫 번째 이미지를 브라우저가 미리 다운로드하도록 <link rel="preload"> 주입
function preloadImage(url: string) {
    if (!url) return;
    const id = "main-slide-preload";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "preload";
    link.as = "image";
    link.href = url;
    document.head.appendChild(link);
}

export default function MainSlider() {
    const [slides, setSlides] = useState<MainSlide[]>([]);
    const [loading, setLoading] = useState(true);
    const [imagesLoaded, setImagesLoaded] = useState<Record<string, boolean>>({});
    const loadedCountRef = useRef(0);

    useEffect(() => {
        getMainSlides().then((data) => {
            setSlides(data);
            setLoading(false);
            // 첫 번째 이미지 preload 주입
            if (data.length > 0) preloadImage(data[0].url);
        });
    }, []);

    const handleImageLoad = (id: string) => {
        setImagesLoaded((prev) => ({ ...prev, [id]: true }));
        loadedCountRef.current += 1;
    };

    // 로딩 중일 때: skeleton shimmer
    if (loading) {
        return (
            <div className="w-full h-[70vh] md:h-[80vh] bg-gray-100 animate-pulse" />
        );
    }

    if (slides.length === 0) {
        return (
            <div className="w-full h-[70vh] flex flex-col items-center justify-center text-center">
                <p className="text-gray-300 text-sm tracking-widest uppercase">등록된 메인 슬라이드가 없습니다</p>
                <p className="text-gray-400 text-xs mt-2">관리자 페이지에서 슬라이드 이미지를 추가해주세요</p>
            </div>
        );
    }

    return (
        <div className="relative w-full h-[70vh] md:h-[80vh] bg-gray-50 group">

            {slides.length > 1 && (
                <>
                    {/* Custom Navigation Buttons */}
                    <button className="custom-prev absolute top-1/2 left-4 md:left-8 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 bg-white/90 shadow-sm flex items-center justify-center hover:bg-white transition-colors cursor-pointer">
                        <ArrowLeft size={18} strokeWidth={1.5} className="text-black" />
                    </button>

                    <button className="custom-next absolute top-1/2 right-4 md:right-8 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 bg-white/90 shadow-sm flex items-center justify-center hover:bg-white transition-colors cursor-pointer">
                        <ArrowRight size={18} strokeWidth={1.5} className="text-black" />
                    </button>
                </>
            )}

            <Swiper
                modules={[Navigation, Autoplay]}
                speed={800}
                navigation={
                    slides.length > 1
                        ? {
                            nextEl: ".custom-next",
                            prevEl: ".custom-prev",
                        }
                        : false
                }
                loop={slides.length > 1}
                centeredSlides={true}
                slidesPerView="auto"
                spaceBetween={20}
                autoplay={
                    slides.length > 1
                        ? { delay: 4000, disableOnInteraction: false }
                        : false
                }
                className="w-full h-full !overflow-visible"
            >
                {slides.map((slide, index) => (
                    <SwiperSlide
                        key={slide.id}
                        className="w-[85%] sm:w-[75%] md:w-[65%] lg:w-[55%] h-full transition-all duration-300"
                    >
                        <div className="w-full h-full relative overflow-hidden">
                            {/* Skeleton shimmer — 이미지 로드 전에만 표시 */}
                            {!imagesLoaded[slide.id] && (
                                <div className="absolute inset-0 bg-gray-100 animate-pulse" />
                            )}
                            <img
                                src={slide.url}
                                alt={slide.filename || "Main slide"}
                                loading={index === 0 ? "eager" : "lazy"}
                                fetchPriority={index === 0 ? "high" : "auto"}
                                decoding={index === 0 ? "sync" : "async"}
                                onLoad={() => handleImageLoad(slide.id)}
                                className={`w-full h-full object-cover object-center rounded-sm transition-opacity duration-500 ${imagesLoaded[slide.id] ? "opacity-100" : "opacity-0"
                                    }`}
                            />
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>
        </div>
    );
}
