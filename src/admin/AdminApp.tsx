import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../lib/firebase";
import AdminLogin from "./pages/AdminLogin";
import AdminLayout from "./AdminLayout";
import GalleryManager from "./pages/GalleryManager";
import SlideManager from "./pages/SlideManager";
import SiteConfigPage from "./pages/SiteConfigPage";
import FaqManager from "./pages/FaqManager";
import ContactManager from "./pages/ContactManager";
import ProductManager from "./pages/ProductManager";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null | "loading">("loading");

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => setUser(u));
        return unsub;
    }, []);

    if (user === "loading") {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!user) return <Navigate to="/admin/login" replace />;
    return <>{children}</>;
}

export default function AdminApp() {
    return (
        <Routes>
            <Route path="login" element={<AdminLogin />} />
            <Route
                path="*"
                element={
                    <ProtectedRoute>
                        <AdminLayout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<Navigate to="/admin/gallery" replace />} />
                <Route path="gallery" element={<GalleryManager />} />
                <Route path="slides" element={<SlideManager />} />
                <Route path="faq" element={<FaqManager />} />
                <Route path="contact-manager" element={<ContactManager />} />
                <Route path="product-manager" element={<ProductManager />} />
                <Route path="config" element={<SiteConfigPage />} />
            </Route>
        </Routes>
    );
}
