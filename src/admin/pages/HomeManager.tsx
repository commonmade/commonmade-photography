import React, { useState, useEffect, useRef } from "react";
import {
    getHomeContent,
    updateHomeContent,
    uploadHomeImage,
    type HomeContent,
} from "../../lib/firestoreService";
import { Check, Loader, Upload, Image as ImageIcon } from "lucide-react";
import { compressImage } from "../../lib/imageCompression";

const DEFAULT: HomeContent = {
    quote: "",
    body: "",
    closing1: "",
    closing2: "",
    imageUrl: "",
};

export default function HomeManager() {
    const [content, setContent] = useState<HomeContent>(DEFAULT);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        getHomeContent()
            .then(setContent)
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        await updateHomeContent(content);
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleImageUpload = async (file: File) => {
        setUploading(true);
        setUploadProgress(0);
        try {
            const compressedFile = await compressImage(file);
            const url = await uploadHomeImage(compressedFile, (p) => setUploadProgress(p));
            setContent((prev) => ({ ...prev, imageUrl: url }));
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleImageUpload(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith("image/")) handleImageUpload(file);
    };

    if (loading) {
        return (
            <div className="flex justify-center py-16">
                <div className="w-6 h-6 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-xl font-light tracking-widest uppercase text-black">About Us 페이지 관리</h1>
                <p className="text-sm text-gray-400 mt-1">About Us 페이지에 표시될 소개 텍스트와 이미지를 설정합니다</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl">
                {/* Text Content */}
                <div className="bg-white border border-gray-200 rounded-xl p-8 space-y-6">
                    <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-2">텍스트 내용</h2>

                    {/* Quote */}
                    <div>
                        <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">
                            메인 인용구 <span className="text-gray-300">(큰따옴표로 표시됩니다)</span>
                        </label>
                        <input
                            type="text"
                            placeholder='예: 기억을 감성으로, 순간을 이야기로'
                            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
                            value={content.quote}
                            onChange={(e) => setContent({ ...content, quote: e.target.value })}
                        />
                    </div>

                    {/* Body */}
                    <div>
                        <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">
                            본문 텍스트 <span className="text-gray-300">(줄바꿈 가능, **굵게** 지원)</span>
                        </label>
                        <textarea
                            rows={10}
                            placeholder={"예:\nCommonmade는 2019년,\n사랑이 시작되는 그 순간을 기록하고 싶은 마음으로 시작되었습니다.\n\n**1만 쌍 이상의 신랑·신부님의 소중한 순간**을 함께하며 정성스럽게 담아왔습니다."}
                            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors resize-none"
                            value={content.body}
                            onChange={(e) => setContent({ ...content, body: e.target.value })}
                        />
                    </div>

                    {/* Closing lines */}
                    <div>
                        <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">
                            마무리 문구 1 <span className="text-gray-300">(작은 글씨)</span>
                        </label>
                        <input
                            type="text"
                            placeholder='예: 지금의 순간을'
                            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
                            value={content.closing1}
                            onChange={(e) => setContent({ ...content, closing1: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">
                            마무리 문구 2 <span className="text-gray-300">(굵은 글씨)</span>
                        </label>
                        <input
                            type="text"
                            placeholder='예: 오래 기억할 수 있도록 commonmade가 함께할게요.'
                            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
                            value={content.closing2}
                            onChange={(e) => setContent({ ...content, closing2: e.target.value })}
                        />
                    </div>
                </div>

                {/* Image Upload */}
                <div className="space-y-4">
                    <div className="bg-white border border-gray-200 rounded-xl p-8">
                        <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-6">우측 이미지</h2>

                        {/* Drop zone */}
                        <div
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors p-8 mb-4"
                        >
                            {uploading ? (
                                <div className="text-center">
                                    <Loader size={24} className="animate-spin text-gray-400 mx-auto mb-3" />
                                    <p className="text-xs text-gray-400">{Math.round(uploadProgress)}% 업로드 중...</p>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <Upload size={24} className="text-gray-300 mx-auto mb-3" />
                                    <p className="text-xs text-gray-400 mb-1">클릭하거나 이미지를 드래그하세요</p>
                                    <p className="text-[10px] text-gray-300">JPG, PNG, WEBP</p>
                                </div>
                            )}
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileChange}
                        />

                        {/* Direct URL input */}
                        <div>
                            <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">
                                또는 이미지 URL 직접 입력
                            </label>
                            <input
                                type="text"
                                placeholder="https://..."
                                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
                                value={content.imageUrl}
                                onChange={(e) => setContent({ ...content, imageUrl: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Preview */}
                    {content.imageUrl ? (
                        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                                <ImageIcon size={13} className="text-gray-400" />
                                <span className="text-[10px] uppercase tracking-widest text-gray-400">미리보기</span>
                            </div>
                            <img
                                src={content.imageUrl}
                                alt="preview"
                                className="w-full object-cover max-h-64"
                                onError={(e) => (e.currentTarget.style.display = "none")}
                            />
                        </div>
                    ) : null}
                </div>
            </div>

            {/* Save button */}
            <div className="mt-8 flex items-center gap-4 max-w-5xl">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-black text-white px-8 py-3 text-xs uppercase tracking-widest hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                    {saving ? <Loader size={14} className="animate-spin" /> : saved ? <Check size={14} /> : null}
                    {saving ? "저장 중..." : saved ? "저장됨!" : "저장"}
                </button>
            </div>

            {/* Live Preview hint */}
            <div className="mt-6 max-w-5xl">
                <a
                    href="/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-gray-400 hover:text-black transition-colors"
                >
                    ↗ About Us 페이지에서 미리보기
                </a>
            </div>
        </div>
    );
}
