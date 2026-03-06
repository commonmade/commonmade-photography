import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import MainSlider from "./components/MainSlider";
import PortfolioGallery from "./pages/PortfolioGallery";
import VenueGallery from "./pages/VenueGallery";
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
          <Route index element={<MainSlider />} />
          <Route path="about" element={<Home />} />
          <Route path="portfolio" element={<PortfolioGallery category="Portfolio" />} />
          <Route path="venue" element={<VenueGallery category="Venue" categorySlug="venue" />} />
          <Route path="product" element={<Product />} />
          <Route path="faq" element={<FAQ />} />
          <Route path="contact" element={<Contact />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
