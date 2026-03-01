import React, { useState, useEffect, useRef, useCallback } from "react";
import {
    getMainSlides,
    uploadMainSlide,
    deleteMainSlide,
    updateMainSlideOrder,
    type MainSlide,
} from "../../lib/firestoreService";
import { compressImage } from "../../lib/imageCompression";
import { Trash2, Loader, ImagePlus, Upload, GripVertical, X, Check } from "lucide-react";

export default function SlideManager() {
    const [slides, setSlides] = useState<MainSlide[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState<{ name: string; progress: number }[]>([]);
    const [draggingFile, setDraggingFile] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    // 드래그 순서 변경 상태
    const [dragIdx, setDragIdx] = useState<number | null>(null);
    const [overIdx, setOverIdx] = useState<number | null>(null);

    // 삭제 확인 상태
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const loadSlides = useCallback(async () => {
        const data = await getMainSlides();
        setSlides(data);
        setLoading(false);
    }, []);

    useEffect(() => {
        loadSlides();
    }, [loadSlides]);

    // ─── 파일 업로드 ───
    const handleFiles = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        const fileArr = Array.from(files).filter((f) => f.type.startsWith("image/"));
        if (fileArr.length === 0) return;

        setUploading(fileArr.map((f) => ({ name: f.name, progress: 0 })));
        let order = slides.length;

        for (let i = 0; i < fileArr.length; i++) {
            try {
                const originalFile = fileArr[i];
                const compressedFile = await compressImage(originalFile);
                await uploadMainSlide(compressedFile, order++, (p) => {
                    setUploading((prev) =>
                        prev.map((u, idx) => (idx === i ? { ...u, progress: Math.round(p) } : u))
                    );
                });
            } catch (err) {
                console.error("슬라이드 업로드 실패:", err);
            }
        }

        setUploading([]);
        await loadSlides();
        if (inputRef.current) inputRef.current.value = "";
    };

    const requestDelete = (slideId: string) => {
        setDeletingId(slideId);
    };

    const cancelDelete = () => {
        setDeletingId(null);
    };

    const confirmDelete = async (slide: MainSlide) => {
        setDeletingId(null);
        try {
            await deleteMainSlide(slide.id, slide.url);
            await loadSlides();
        } catch (err) {
            console.error("슬라이드 삭제 실패:", err);
        }
    };

    const onFileDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDraggingFile(false);
        // 파일 드롭인지 확인 (슬라이드 순서 드래그와 구분)
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
        }
    };

    // ─── 드래그 순서 변경 ───
    const handleDragStart = (e: React.DragEvent, idx: number) => {
        setDragIdx(idx);
        e.dataTransfer.effectAllowed = "move";
        // 드래그 이미지를 약간 투명하게
        if (e.currentTarget instanceof HTMLElement) {
            e.dataTransfer.setDragImage(e.currentTarget, 50, 50);
        }
    };

    const handleDragOver = (e: React.DragEvent, idx: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (dragIdx !== null && idx !== dragIdx) {
            setOverIdx(idx);
        }
    };

    const handleDragEnd = async () => {
        if (dragIdx === null || overIdx === null || dragIdx === overIdx) {
            setDragIdx(null);
            setOverIdx(null);
            return;
        }

        // 로컬에서 먼저 순서 변경 (즉각적인 UI 반영)
        const newSlides = [...slides];
        const [movedItem] = newSlides.splice(dragIdx, 1);
        newSlides.splice(overIdx, 0, movedItem);
        setSlides(newSlides);
        setDragIdx(null);
        setOverIdx(null);

        // Firestore에 순서 저장
        try {
            const promises = newSlides.map((slide, i) =>
                updateMainSlideOrder(slide.id, i)
            );
            await Promise.all(promises);
        } catch (err) {
            console.error("순서 저장 실패:", err);
            await loadSlides(); // 실패시 원래 순서로 복원
        }
    };

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-xl font-light tracking-widest uppercase text-black">메인 슬라이드</h1>
                <p className="text-sm text-gray-400 mt-1">홈 화면에 표시되는 슬라이드 사진을 관리합니다</p>
            </div>

            {/* 업로드 드래그드롭 영역 */}
            <div className="mb-8">
                <div
                    className={`border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer ${draggingFile
                        ? "border-black bg-gray-50 scale-[1.01]"
                        : "border-gray-200 hover:border-gray-400 hover:bg-gray-50"
                        }`}
                    onDragOver={(e) => {
                        e.preventDefault();
                        // 파일 드래그만 반응 (슬라이드 순서 드래그 무시)
                        if (e.dataTransfer.types.includes("Files")) {
                            setDraggingFile(true);
                        }
                    }}
                    onDragLeave={() => setDraggingFile(false)}
                    onDrop={onFileDrop}
                    onClick={() => inputRef.current?.click()}
                >
                    <input
                        ref={inputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFiles(e.target.files)}
                    />
                    <ImagePlus size={32} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-sm text-gray-400">
                        <span className="font-medium text-black">슬라이드 사진 추가</span> — 클릭하거나 드래그하세요
                    </p>
                    <p className="text-xs text-gray-300 mt-1">가로가 긴 사진 (16:9 또는 4:3)을 권장합니다</p>
                    <div className="mt-4">
                        <button
                            type="button"
                            className="inline-flex items-center gap-2 bg-black text-white px-5 py-2 text-xs uppercase tracking-widest hover:bg-gray-800 transition-colors"
                            onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                        >
                            <Upload size={13} />
                            사진 선택
                        </button>
                    </div>
                </div>

                {/* 업로드 진행률 */}
                {uploading.length > 0 && (
                    <div className="mt-3 space-y-2">
                        {uploading.map((f, i) => (
                            <div key={i} className="flex items-center gap-3 text-xs text-gray-500">
                                <Loader size={12} className="animate-spin flex-shrink-0" />
                                <span className="flex-1 truncate">{f.name}</span>
                                <div className="w-24 bg-gray-100 rounded-full h-1.5">
                                    <div className="bg-black h-1.5 rounded-full transition-all" style={{ width: `${f.progress}%` }} />
                                </div>
                                <span className="w-8 text-right">{f.progress}%</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* 슬라이드 목록 (드래그로 순서 변경) */}
            {loading ? (
                <div className="flex justify-center py-16">
                    <div className="w-6 h-6 border-2 border-gray-300 border-t-black rounded-full animate-spin"></div>
                </div>
            ) : slides.length === 0 ? (
                <div className="text-center py-16">
                    <p className="text-gray-300 text-sm uppercase tracking-widest mb-2">슬라이드가 없습니다</p>
                    <p className="text-xs text-gray-300">위에서 사진을 업로드하면 메인 화면에 슬라이드로 표시됩니다</p>
                </div>
            ) : (
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest">
                            {slides.length}장의 슬라이드
                        </p>
                        <p className="text-[10px] text-gray-300 uppercase tracking-widest">
                            드래그하여 순서를 변경하세요
                        </p>
                    </div>

                    <div className="space-y-2">
                        {slides.map((slide, idx) => {
                            const isDragging = dragIdx === idx;
                            const isOver = overIdx === idx;

                            return (
                                <div
                                    key={slide.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, idx)}
                                    onDragOver={(e) => handleDragOver(e, idx)}
                                    onDragEnd={handleDragEnd}
                                    onDragLeave={() => { if (overIdx === idx) setOverIdx(null); }}
                                    className={`flex items-center gap-4 p-3 rounded-xl border transition-all select-none ${isDragging
                                        ? "opacity-40 border-gray-300 bg-gray-100 scale-[0.98]"
                                        : isOver
                                            ? "border-black bg-gray-50 shadow-md"
                                            : "border-gray-200 bg-white hover:border-gray-300"
                                        }`}
                                    style={{ cursor: "grab" }}
                                >
                                    {/* 드래그 핸들 */}
                                    <div className="flex-shrink-0 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing">
                                        <GripVertical size={18} />
                                    </div>

                                    {/* 순서 번호 */}
                                    <div className="flex-shrink-0 w-7 h-7 bg-black text-white text-[10px] font-medium rounded-lg flex items-center justify-center">
                                        {idx + 1}
                                    </div>

                                    {/* 썸네일 */}
                                    <div className="w-32 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                        <img
                                            src={slide.url}
                                            alt={`슬라이드 ${idx + 1}`}
                                            className="w-full h-full object-cover"
                                            draggable={false}
                                        />
                                    </div>

                                    {/* 파일명 */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-gray-500 truncate">{slide.filename}</p>
                                        <p className="text-[10px] text-gray-300 mt-0.5">슬라이드 #{idx + 1}</p>
                                    </div>

                                    {/* 삭제 버튼 */}
                                    {deletingId === slide.id ? (
                                        <div className="flex items-center gap-1 flex-shrink-0" draggable={false} onMouseDown={(e) => e.stopPropagation()} onDragStart={(e) => { e.stopPropagation(); e.preventDefault(); }}>
                                            <span className="text-[10px] text-red-500 mr-1">삭제?</span>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); confirmDelete(slide); }}
                                                className="p-1.5 text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                                                title="확인"
                                            >
                                                <Check size={14} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); cancelDelete(); }}
                                                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                title="취소"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            draggable={false}
                                            onDragStart={(e) => { e.stopPropagation(); e.preventDefault(); }}
                                            onMouseDown={(e) => e.stopPropagation()}
                                            onClick={(e) => { e.stopPropagation(); requestDelete(slide.id); }}
                                            className="flex-shrink-0 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            title="삭제"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* 미리보기 */}
                    <div className="mt-8 border border-gray-200 rounded-xl p-6 bg-white">
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-4">슬라이드 미리보기</p>
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            {slides.map((slide, idx) => (
                                <div
                                    key={slide.id}
                                    className="flex-shrink-0 w-40 aspect-[16/10] rounded-lg overflow-hidden bg-gray-100 relative"
                                >
                                    <img src={slide.url} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
                                    <div className="absolute bottom-1 left-1 bg-black/70 text-white text-[8px] px-1.5 py-0.5 rounded font-medium">
                                        {idx + 1}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
