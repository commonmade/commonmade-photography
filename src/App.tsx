import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Gallery from "./pages/Gallery";
import AlbumDetail from "./pages/AlbumDetail";
import Product from "./pages/Product";
import FAQ from "./pages/FAQ";
import Contact from "./pages/Contact";
import AdminApp from "./admin/AdminApp";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 관리자 페이지 */}
        <Route path="/admin/*" element={<AdminApp />} />

        {/* 일반 사이트 */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="wedding-day" element={<Gallery category="Wedding Day" categorySlug="wedding-day" />} />
          <Route path="wedding-day/:id" element={<AlbumDetail />} />
          <Route path="baby-family" element={<Gallery category="Baby & Family" categorySlug="baby-family" />} />
          <Route path="baby-family/:id" element={<AlbumDetail />} />
          <Route path="moments" element={<Gallery category="Moments" categorySlug="moments" />} />
          <Route path="moments/:id" element={<AlbumDetail />} />
          <Route path="product" element={<Product />} />
          <Route path="faq" element={<FAQ />} />
          <Route path="contact" element={<Contact />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
