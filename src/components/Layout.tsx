import { Link, Outlet, useLocation } from "react-router-dom";
import { Menu, X, Instagram } from "lucide-react";
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
  { name: "Wedding Day", hoverName: "결혼", path: "/wedding-day" },
  { name: "Baby&Family", hoverName: "아기&가족", path: "/baby-family" },
  { name: "Moments", hoverName: "행사", path: "/moments" },
  { name: "Product", hoverName: "상품구성", path: "/product" },
  { name: "KakaoTalk Channel", hoverName: "카카오톡상담", path: "/faq" },
  { name: "Contact", hoverName: "연락", path: "/contact" },
];

export default function Layout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [kakaoUrl, setKakaoUrl] = useState("#");
  const [kakaoChannelId, setKakaoChannelId] = useState("");
  const location = useLocation();

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  // Load kakao channel URL from siteConfig
  useEffect(() => {
    getSiteConfig().then((cfg) => {
      if (cfg.kakao && cfg.kakao !== "#") setKakaoUrl(cfg.kakao);
      if (cfg.kakaoChannelId) setKakaoChannelId(cfg.kakaoChannelId);
    }).catch(() => { });
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
    <div
      className={`flex flex-col bg-white min-h-screen ${location.pathname === "/" ? "h-screen overflow-hidden" : ""}`}
      style={location.pathname === "/" ? { paddingTop: 0 } : undefined}
    >
      {/* Header */}
      <header
        className={`w-full px-6 md:px-12 flex flex-col items-center justify-center relative z-40 transition-all duration-300 fixed top-0 bg-white/90 backdrop-blur-md shadow-sm ${isScrolled ? "py-2" : "py-4 md:py-6"
          }`}
      >
        {/* Mobile Menu Toggle */}
        <button
          className={`md:hidden absolute left-6 text-gray-900 ${isScrolled ? "top-4" : "top-6"}`}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Logo */}
        <Link
          to="/"
          className={`text-center transition-all duration-300 ${isScrolled ? "mb-2" : "mb-4 md:mb-5"}`}
        >
          <h1
            className={`logo-font tracking-widest uppercase font-light text-black transition-all duration-300 ${isScrolled ? "text-2xl md:text-3xl" : "text-3xl md:text-5xl"}`}
          >
            commonmade
          </h1>
          <p
            className={`tracking-[0.3em] uppercase mt-2 text-gray-500 transition-all duration-300 ${isScrolled ? "text-[8px] md:text-[10px]" : "text-[10px] md:text-xs"}`}
          >
            photography
          </p>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center justify-center w-full relative max-w-6xl mx-auto">
          <nav className="flex items-center justify-center space-x-8 lg:space-x-12">
            {navLinks.map((link) => (
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
      </header>

      {/* Mobile Navigation Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center space-y-8 md:hidden">
          <button
            className="absolute top-10 left-6 text-gray-900"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={24} />
          </button>

          <div className="flex flex-col items-center space-y-6">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`group relative flex items-center justify-center text-sm uppercase tracking-widest ${location.pathname === link.path
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
          </div>

          <div className="flex items-center space-x-6 mt-8 pt-8 border-t border-gray-100 w-1/2 justify-center">
            <a
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-black transition-colors"
              aria-label="Instagram"
            >
              <Instagram size={24} />
            </a>
            <a
              href={kakaoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-black transition-colors"
              aria-label="KakaoTalk Channel"
            >
              <KakaoIcon size={29} />
            </a>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main
        className={`w-full max-w-[1600px] mx-auto px-4 md:px-8 lg:px-12 ${location.pathname === "/" ? "flex-1 flex flex-col justify-center min-h-0" : "flex-grow pt-8 pb-24"}`}
      >
        <Outlet />
      </main>

      {/* Footer */}
      <div
        className={`w-full ${location.pathname === "/" ? "flex-shrink-0" : ""}`}
      >
        <footer
          className={`w-full max-w-[1600px] mx-auto px-4 md:px-8 lg:px-12 border-t border-gray-200 flex flex-col items-center justify-center ${location.pathname === "/" ? "py-3 space-y-2" : "py-12 space-y-6"}`}
        >
          <div className="flex items-center space-x-4">
            <a
              href="#"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-black transition-colors"
              aria-label="Instagram"
            >
              <Instagram size={20} />
            </a>
            <a
              href={kakaoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-black transition-colors"
              aria-label="KakaoTalk Channel"
            >
              <KakaoIcon size={24} />
            </a>
          </div>
          <div className="text-[11px] md:text-xs text-gray-500 tracking-wide text-center">
            © 2019 by Commonmade Photography. Proudly created.
          </div>
        </footer>
      </div>

      <KakaoChatButton channelId={kakaoChannelId} />
    </div>
  );
}
