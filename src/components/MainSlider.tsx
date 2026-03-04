import { useState, useEffect } from "react";
import { getMainSlides, type MainSlide } from "../lib/firestoreService";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import { ArrowLeft, ArrowRight } from "lucide-react";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";

export default function MainSlider() {
    const [slides, setSlides] = useState<MainSlide[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getMainSlides().then((data) => {
            setSlides(data);
            setLoading(false);
        });
    }, []);

    if (loading) {
        return (
            <div className="w-full h-[70vh] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
            </div>
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
        <div className="relative w-full h-[70vh] md:h-[80vh] bg-white animate-in fade-in duration-1000 group">

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
                spaceBetween={20} // Adjust gap slightly for better peeking
                autoplay={
                    slides.length > 1
                        ? { delay: 4000, disableOnInteraction: false }
                        : false
                }
                className="w-full h-full !overflow-visible"
            >
                {slides.map((slide) => (
                    <SwiperSlide
                        key={slide.id}
                        className="w-[85%] sm:w-[75%] md:w-[65%] lg:w-[55%] h-full transition-all duration-300"
                    >
                        <div className="w-full h-full relative">
                            <img
                                src={slide.url}
                                alt={slide.filename || "Main slide"}
                                className="w-full h-full object-cover object-center rounded-sm" // Optional: slight rounded corners for aesthetics
                            />
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>
        </div>
    );
}
