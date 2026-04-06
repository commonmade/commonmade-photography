import { Link, Outlet, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import KakaoChatButton from "./KakaoChatButton";
import { useState, useEffect } from "react";
import { getSiteConfig } from "../lib/firestoreService";

// KakaoTalk 카카오채널 아이콘 — 현재 아이콘과 사이즈/스타일 동일
function KakaoIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <ellipse cx="12" cy="11" rx="9" ry="7.5" />
      <path d="M7.5 17.5 L5.5 21.5 L10 18.5" />
      <text
        x="12" y="13"
        textAnchor="middle"
        stroke="none"
        fill="currentColor"
        fontSize="5"
        fontWeight="800"
        fontFamily="sans-serif"
        letterSpacing="0.4"
      >
        TALK
      </text>
    </svg>
  );
}

const navLinks = [
  { name: "ABOUT US", hoverName: "그날의 기록", path: "/about" },
  { name: "Portfolio", hoverName: "본식 스냅", path: "/portfolio" },
  { name: "Venue", hoverName: "장소", path: "/venue" },
  { name: "Product", hoverName: "상품구성", path: "/product" },
  { name: "F&Q", hoverName: "자주묻는질문", path: "/faq" },
  { name: "Contact", hoverName: "연락", path: "/contact" },
];

export default function Layout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [kakaoUrl, setKakaoUrl] = useState("https://open.kakao.com/o/sF6Jm5ji");
  const location = useLocation();

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  // Load kakao channel URL from siteConfig
  useEffect(() => {
    // Force the new open chat URL
    setKakaoUrl("https://open.kakao.com/o/sF6Jm5ji");
  }, []);

  // Handle scroll effect for sticky header
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="flex flex-col bg-white min-h-screen overflow-x-hidden">
      {/* Header */}
      <header
        className={`w-full px-6 md:px-12 flex flex-col items-center justify-center relative z-40 transition-all duration-300 fixed top-0 bg-white/90 backdrop-blur-md shadow-sm py-0`}
      >
        {/* Mobile Menu Toggle */}
        <button
          className={`md:hidden absolute left-6 text-gray-900 z-50 ${isScrolled ? "top-4" : "top-6"}`}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Desktop Header Layout: Left Nav - Logo - Right Nav */}
        <div className="hidden md:flex items-center justify-center w-full max-w-[1400px] mx-auto">
          {/* Left Nav */}
          <nav className="flex items-center space-x-6 lg:space-x-10 mt-10 md:mt-16">
            {navLinks.slice(0, 3).map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`group relative flex items-center justify-center text-[11px] lg:text-xs uppercase tracking-widest transition-colors duration-300 ${location.pathname === link.path
                  ? "text-black font-medium"
                  : "text-gray-500"
                  }`}
              >
                <span className="block group-hover:opacity-0 transition-opacity duration-300">
                  {link.name}
                </span>
                <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 text-gray-400 transition-opacity duration-300 whitespace-nowrap">
                  {link.hoverName}
                </span>
              </Link>
            ))}
          </nav>

          {/* Central Logo */}
          <Link
            to="/"
            className={`flex items-center justify-center transition-all duration-300 mx-8 lg:mx-16 mb-0`}
          >
            <img
              src="/logo.png"
              alt="그날의 기록 PHOTOGRAPHY"
              className={`object-contain transition-all duration-300 -mt-12 -mb-6 md:-mt-20 md:-mb-10 h-[240px] md:h-[300px]`}
            />
          </Link>

          {/* Right Nav */}
          <nav className="flex items-center space-x-6 lg:space-x-10 mt-10 md:mt-16">
            {navLinks.slice(3, 6).map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`group relative flex items-center justify-center text-[11px] lg:text-xs uppercase tracking-widest transition-colors duration-300 ${location.pathname === link.path
                  ? "text-black font-medium"
                  : "text-gray-500"
                  }`}
              >
                <span className="block group-hover:opacity-0 transition-opacity duration-300">
                  {link.name}
                </span>
                <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 text-gray-400 transition-opacity duration-300 whitespace-nowrap">
                  {link.hoverName}
                </span>
              </Link>
            ))}
          </nav>
        </div>

        {/* Mobile Logo (Visible only on mobile) */}
        <div className="md:hidden flex flex-col items-center justify-center w-full relative">
          <Link
            to="/"
            className={`flex items-center justify-center transition-all duration-300 mb-0`}
          >
            <img
              src="/logo.png"
              alt="그날의 기록 PHOTOGRAPHY"
              className={`object-contain transition-all duration-300 -my-6 h-[240px]`}
            />
          </Link>
        </div>
      </header>

      {/* Mobile Navigation Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[200] bg-white flex flex-col items-center justify-start pt-[15vh] space-y-10 md:hidden animate-in fade-in slide-in-from-top-4 duration-300">
          <button
            className="absolute top-10 left-6 text-gray-900 p-2 hover:bg-gray-100 rounded-full transition-colors"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={28} strokeWidth={1.5} />
          </button>

          <div className="flex flex-col items-center space-y-7 w-full px-12">
            {navLinks.map((link, index) => (
              <Link
                key={link.name}
                to={link.path}
                style={{ animationDelay: `${index * 50}ms` }}
                className={`flex items-center justify-center text-base uppercase tracking-[0.3em] font-light py-1 w-full border-b border-gray-50 transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 ${location.pathname === link.path
                  ? "text-black font-medium border-black/10"
                  : "text-gray-900 hover:text-black"
                  }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="pt-2 flex flex-col items-center">
            <img
              src="/logo.png"
              alt="그날의 기록 PHOTOGRAPHY"
              className="h-[240px] object-contain -my-6 mb-0"
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className={`w-full flex-grow ${location.pathname === "/" || location.pathname === "/portfolio" ? "px-0 max-w-none pt-0 mt-0 pb-8" : "max-w-[1600px] mx-auto px-4 md:px-8 lg:px-12 pt-8 pb-24"}`}>
        <Outlet />
      </main>

      {/* Footer */}
      <div
        className={`w-full ${location.pathname === "/" ? "flex-shrink-0" : ""}`}
      >
        <footer
          className={`w-full max-w-[1600px] mx-auto px-4 md:px-8 lg:px-12 border-t border-gray-200 flex flex-col items-center justify-center ${location.pathname === "/" ? "py-3 space-y-2" : "py-12 space-y-6"}`}
        >

          <div className="text-[11px] md:text-xs text-gray-500 tracking-wide text-center">
            © 2026 ThatDayRecord Photography. Proudly created.
          </div>
        </footer>
      </div>

      <KakaoChatButton chatUrl={kakaoUrl} />
    </div>
  );
}
