import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import { Images, Settings, LogOut, Camera, Monitor, HelpCircle, Mail, MailOpen, Package, Home } from "lucide-react";

const navItems = [
    { to: "/admin/portfolio", label: "Portfolio 관리", icon: Images },
    { to: "/admin/venue", label: "Venue 관리", icon: Images },
    { to: "/admin/slides", label: "메인 슬라이드", icon: Monitor },
    { to: "/admin/home-manager", label: "About Us 관리", icon: Home },
    { to: "/admin/faq", label: "FAQ 관리", icon: HelpCircle },
    { to: "/admin/contact-manager", label: "Contact 관리", icon: Mail },
    { to: "/admin/inquiry-manager", label: "문의 접수내역", icon: MailOpen },
    { to: "/admin/product-manager", label: "Product 관리", icon: Package },
    { to: "/admin/config", label: "사이트 설정", icon: Settings },
];

export default function AdminLayout() {
    const navigate = useNavigate();

    const handleLogout = async () => {
        await signOut(auth);
        navigate("/admin/login");
    };

    return (
        <div className="min-h-screen flex bg-gray-50">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full z-10">
                {/* Logo */}
                <div className="px-6 py-8 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <Camera size={20} className="text-gray-800" />
                        <div>
                            <p className="text-xs font-semibold tracking-widest uppercase text-black">
                                commonmade
                            </p>
                            <p className="text-[10px] text-gray-400 tracking-widest">
                                Admin Dashboard
                            </p>
                        </div>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-4 py-6 space-y-1">
                    {navItems.map(({ to, label, icon: Icon }) => (
                        <NavLink
                            key={to}
                            to={to}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors ${isActive
                                    ? "bg-black text-white"
                                    : "text-gray-600 hover:bg-gray-100"
                                }`
                            }
                        >
                            <Icon size={16} />
                            <span className="tracking-wide">{label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* Logout */}
                <div className="px-4 py-6 border-t border-gray-100">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-gray-500 hover:bg-gray-100 w-full transition-colors"
                    >
                        <LogOut size={16} />
                        <span>로그아웃</span>
                    </button>
                    <a
                        href="/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-4 py-3 rounded-lg text-xs text-gray-400 hover:text-black transition-colors mt-1"
                    >
                        ↗ 사이트 보기
                    </a>
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 ml-64 p-8 min-h-screen">
                <Outlet />
            </main>
        </div>
    );
}
