import React, { useState, useEffect } from "react";
import { MapPin, Phone, Mail, Instagram } from "lucide-react";
import { addInquiry, getPageContent } from "../lib/firestoreService";

// KakaoTalk 카카오채널 아이콘 (현재 아이콘 스타일 맞춤)
function KakaoIcon({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* speech bubble outline */}
      <ellipse cx="12" cy="11" rx="9" ry="7.5" />
      {/* tail */}
      <path d="M7 17.5 L5 21 L9.5 18.5" />
      {/* TALK text — simplified as three short lines */}
      <text
        x="12"
        y="13"
        textAnchor="middle"
        stroke="none"
        fill="currentColor"
        fontSize="5"
        fontWeight="700"
        fontFamily="sans-serif"
        letterSpacing="0.3"
      >
        TALK
      </text>
    </svg>
  );
}

const DEFAULTS = {
  subtitle: "",
  address: "123 Photography Lane\nCreative District, Seoul\nSouth Korea",
  phone: "+82 10 1234 5678",
  email: "commonmade@naver.com",
  instagram: "@commonmade_photography",
  kakao: "commonmade",
  form_title: "Send an Inquiry",
  form_subtitle:
    "Please fill out the form below to inquire about our availability and pricing.",
};

export default function Contact() {
  const [content, setContent] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    date: "",
    category: "",
    location: "",
    message: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await addInquiry(formData);
      setSubmitted(true);
      setFormData({
        name: "",
        phone: "",
        email: "",
        date: "",
        category: "",
        location: "",
        message: "",
      });
      setTimeout(() => setSubmitted(false), 5000);
    } catch (error) {
      console.error("Error submitting inquiry:", error);
      alert("Failed to submit inquiry. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    getPageContent("contact")
      .then((data) => {
        if (Object.keys(data).length > 0) {
          setContent({
            subtitle: String(data.subtitle ?? DEFAULTS.subtitle),
            address: String(data.address ?? DEFAULTS.address),
            phone: String(data.phone ?? DEFAULTS.phone),
            email: String(data.email ?? DEFAULTS.email),
            instagram: String(data.instagram ?? DEFAULTS.instagram),
            kakao: String(data.kakao ?? DEFAULTS.kakao),
            form_title: String(data.form_title ?? DEFAULTS.form_title),
            form_subtitle: String(data.form_subtitle ?? DEFAULTS.form_subtitle),
          });
        }
      })
      .catch(() => { })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-40">
        <div className="w-7 h-7 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto animate-in fade-in duration-1000 px-4 md:px-8">
      <div className="text-center mb-16 md:mb-24">
        <h2 className="logo-font text-sm md:text-lg tracking-widest uppercase font-light text-black">
          CONTACT
        </h2>
        <div className="w-12 h-[1px] bg-gray-300 mx-auto mt-8" />
        {content.subtitle && content.subtitle !== "We would love to hear from you. Get in touch with us for any inquiries." && (
          <p className="mt-8 text-sm text-gray-500 uppercase tracking-widest max-w-xl mx-auto leading-relaxed">
            {content.subtitle}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 mb-24">
        {/* Contact Info */}
        <div className="flex flex-col space-y-12">
          <div className="flex items-start space-x-6">
            <MapPin className="text-gray-400 mt-1" size={24} />
            <div>
              <h3 className="text-xs uppercase tracking-[0.2em] text-gray-900 mb-2 font-medium">
                Studio Address
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed whitespace-pre-line">
                {content.address}
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-6">
            <Phone className="text-gray-400 mt-1" size={24} />
            <div>
              <h3 className="text-xs uppercase tracking-[0.2em] text-gray-900 mb-2 font-medium">
                Phone
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">{content.phone}</p>
            </div>
          </div>

          <div className="flex items-start space-x-6">
            <Mail className="text-gray-400 mt-1" size={24} />
            <div>
              <h3 className="text-xs uppercase tracking-[0.2em] text-gray-900 mb-2 font-medium">
                Email
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">{content.email}</p>
            </div>
          </div>

          <div className="flex items-start space-x-6">
            <Instagram className="text-gray-400 mt-1" size={24} />
            <div>
              <h3 className="text-xs uppercase tracking-[0.2em] text-gray-900 mb-2 font-medium">
                Instagram
              </h3>
              <a
                href="#"
                className="text-sm text-gray-500 leading-relaxed hover:text-black transition-colors"
              >
                {content.instagram}
              </a>
            </div>
          </div>

          <div className="flex items-start space-x-6">
            <span className="text-gray-400 mt-1"><KakaoIcon size={29} /></span>
            <div>
              <h3 className="text-xs uppercase tracking-[0.2em] text-gray-900 mb-2 font-medium">
                KakaoTalk Channel
              </h3>
              <a
                href={`https://pf.kakao.com/_${content.kakao}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-500 leading-relaxed hover:text-black transition-colors"
              >
                {content.kakao}
              </a>
            </div>
          </div>
        </div>

        {/* Inquiry Form */}
        <div className="w-full">
          <div className="mb-12">
            <h3 className="text-xl tracking-widest uppercase font-light text-black">
              {content.form_title}
            </h3>
            <p className="mt-4 text-sm text-gray-500 uppercase tracking-widest leading-relaxed">
              {content.form_subtitle}
            </p>
          </div>

          <form className="space-y-8" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label
                  htmlFor="name"
                  className="block text-xs uppercase tracking-widest text-gray-500 mb-2"
                >
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  className="w-full border-b border-gray-300 py-2 focus:outline-none focus:border-black transition-colors bg-transparent text-sm"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="phone"
                  className="block text-xs uppercase tracking-widest text-gray-500 mb-2"
                >
                  Phone
                </label>
                <input
                  type="tel"
                  id="phone"
                  className="w-full border-b border-gray-300 py-2 focus:outline-none focus:border-black transition-colors bg-transparent text-sm"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-xs uppercase tracking-widest text-gray-500 mb-2"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                className="w-full border-b border-gray-300 py-2 focus:outline-none focus:border-black transition-colors bg-transparent text-sm"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label
                  htmlFor="date"
                  className="block text-xs uppercase tracking-widest text-gray-500 mb-2"
                >
                  Event Date
                </label>
                <input
                  type="date"
                  id="date"
                  className="w-full border-b border-gray-300 py-2 focus:outline-none focus:border-black transition-colors bg-transparent text-sm text-gray-700"
                  value={formData.date}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <label
                  htmlFor="category"
                  className="block text-xs uppercase tracking-widest text-gray-500 mb-2"
                >
                  Category
                </label>
                <select
                  id="category"
                  className="w-full border-b border-gray-300 py-2 focus:outline-none focus:border-black transition-colors bg-transparent text-sm text-gray-700 appearance-none"
                  value={formData.category}
                  onChange={handleInputChange}
                >
                  <option value="">Select a category</option>
                  <option value="wedding">Wedding Day</option>
                  <option value="baby">Baby &amp; Family</option>
                  <option value="moments">Moments</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="location"
                className="block text-xs uppercase tracking-widest text-gray-500 mb-2"
              >
                Location / Venue
              </label>
              <input
                type="text"
                id="location"
                className="w-full border-b border-gray-300 py-2 focus:outline-none focus:border-black transition-colors bg-transparent text-sm"
                value={formData.location}
                onChange={handleInputChange}
              />
            </div>

            <div>
              <label
                htmlFor="message"
                className="block text-xs uppercase tracking-widest text-gray-500 mb-2"
              >
                Message
              </label>
              <textarea
                id="message"
                rows={5}
                className="w-full border-b border-gray-300 py-2 focus:outline-none focus:border-black transition-colors bg-transparent text-sm resize-none"
                placeholder="Tell us more about your event..."
                value={formData.message}
                onChange={handleInputChange}
              />
            </div>

            <div className="pt-8 text-center md:text-left">
              <button
                type="submit"
                disabled={submitting}
                className="bg-[#3d3d3d] text-white px-12 py-4 text-xs uppercase tracking-[0.2em] hover:bg-[#2a2a2a] transition-colors duration-300 disabled:opacity-50"
              >
                {submitting ? "Submitting..." : "Submit Inquiry"}
              </button>
              {submitted && (
                <p className="mt-4 text-sm text-green-600 animate-in fade-in">
                  문의가 성공적으로 전달되었습니다. 감사합니다.
                </p>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
