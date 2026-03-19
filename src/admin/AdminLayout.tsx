import React, { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import {
    Images,
    Settings,
    LogOut,
    Camera,
    Monitor,
    HelpCircle,
    Mail,
    MailOpen,
    Package,
    Home,
    Calendar,
    GripVertical
} from "lucide-react";
import { getSiteConfig, updateSiteConfig } from "../lib/firestoreService";

const defaultNavItems = [
    { to: "/admin/portfolio", label: "Portfolio 관리", icon: Images },
    { to: "/admin/venue", label: "Venue 관리", icon: Images },
    { to: "/admin/slides", label: "메인 슬라이드", icon: Monitor },
    { to: "/admin/home-manager", label: "About Us 관리", icon: Home },
    { to: "/admin/schedule", label: "스케줄 관리", icon: Calendar },
    { to: "/admin/faq", label: "FAQ 관리", icon: HelpCircle },
    { to: "/admin/contact-manager", label: "Contact 관리", icon: Mail },
    { to: "/admin/inquiry-manager", label: "문의 접수내역", icon: MailOpen },
    { to: "/admin/product-manager", label: "Product 관리", icon: Package },
    { to: "/admin/config", label: "사이트 설정", icon: Settings },
];

export default function AdminLayout() {
    const navigate = useNavigate();
    const [navItems, setNavItems] = useState(defaultNavItems);

    // Drag state
    const [dragIdx, setDragIdx] = useState<number | null>(null);
    const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

    useEffect(() => {
        loadMenuOrder();
    }, []);

    const loadMenuOrder = async () => {
        try {
            const config = await getSiteConfig();
            if (config.adminMenuOrder) {
                const savedOrder: string[] = JSON.parse(config.adminMenuOrder);
                // Sort navItems based on the savedOrder array of "to" values
                const sorted = [...defaultNavItems].sort((a, b) => {
                    const idxA = savedOrder.indexOf(a.to);
                    const idxB = savedOrder.indexOf(b.to);
                    if (idxA === -1 && idxB === -1) return 0;
                    if (idxA === -1) return 1;
                    if (idxB === -1) return -1;
                    return idxA - idxB;
                });
                setNavItems(sorted);
            }
        } catch (err) {
            console.error("Failed to load admin menu order:", err);
        }
    };

    const handleLogout = async () => {
        await signOut(auth);
        navigate("/admin/login");
    };

    const handleDragStart = (e: React.DragEvent, idx: number) => {
        setDragIdx(idx);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e: React.DragEvent, idx: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (dragIdx !== null && idx !== dragIdx) {
            setDragOverIdx(idx);
        }
    };

    const handleDragEnd = async () => {
        if (dragIdx === null || dragOverIdx === null || dragIdx === dragOverIdx) {
            setDragIdx(null);
            setDragOverIdx(null);
            return;
        }

        const newItems = [...navItems];
        const [moved] = newItems.splice(dragIdx, 1);
        newItems.splice(dragOverIdx, 0, moved);

        setNavItems(newItems);
        setDragIdx(null);
        setDragOverIdx(null);

        try {
            const orderArray = newItems.map(item => item.to);
            await updateSiteConfig("adminMenuOrder", JSON.stringify(orderArray));
        } catch (err) {
            console.error("Failed to save menu order:", err);
        }
    };

    return (
        <div className="min-h-screen flex bg-gray-50">
            {/* Sidebar */}
            <aside className="w-[280px] bg-white border-r border-gray-200 flex flex-col fixed h-full z-10 transition-all">
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
                <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
                    {navItems.map(({ to, label, icon: Icon }, idx) => {
                        const isDragging = dragIdx === idx;
                        const isOver = dragOverIdx === idx;

                        return (
                            <div
                                key={to}
                                draggable
                                onDragStart={(e) => handleDragStart(e, idx)}
                                onDragOver={(e) => handleDragOver(e, idx)}
                                onDragEnd={handleDragEnd}
                                onDragLeave={() => { if (dragOverIdx === idx) setDragOverIdx(null); }}
                                className={`flex items-center group
                                    ${isDragging ? "opacity-30 scale-[0.98]" : isOver ? "ring-2 ring-black rounded-lg scale-[1.01] bg-gray-50" : ""}
                                `}
                            >
                                <div className="text-gray-300 opacity-0 group-hover:opacity-100 cursor-grab hover:text-black transition-colors pl-1">
                                    <GripVertical size={14} />
                                </div>
                                <NavLink
                                    to={to}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 px-3 py-3 rounded-lg text-sm transition-colors flex-1 w-full ${isActive
                                            ? "bg-black text-white"
                                            : "text-gray-600 hover:bg-gray-100"
                                        }`
                                    }
                                >
                                    <Icon size={16} />
                                    <span className="tracking-wide select-none truncate">{label}</span>
                                </NavLink>
                            </div>
                        );
                    })}
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
            <main className="flex-1 ml-[280px] p-8 min-h-screen">
                <Outlet />
            </main>
        </div>
    );
}
