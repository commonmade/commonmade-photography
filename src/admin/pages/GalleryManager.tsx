import React, { useState, useEffect, useRef, useCallback } from "react";
import {
    getAlbumsByCategory,
    createAlbum,
    updateAlbum,
    deleteAlbum,
    getPhotosByAlbum,
    uploadPhoto,
    deletePhoto,
    updatePhotoOrder,
    updateAlbumOrder,
    type Album,
    type Photo,
} from "../../lib/firestoreService";
import { compressImage } from "../../lib/imageCompression";
import { Trash2, Plus, Upload, ChevronDown, ChevronRight, Edit2, Check, X, Loader, ImagePlus, GripVertical } from "lucide-react";

const CATEGORIES = [
    { slug: "wedding-day", name: "Wedding Day" },
    { slug: "baby-family", name: "Baby & Family" },
    { slug: "moments", name: "Moments" },
];

// 앨범별 업로드 드래그드롭 영역
function PhotoUploadZone({
    albumId,
    currentPhotoCount,
    onUploadComplete,
}: {
    albumId: string;
    currentPhotoCount: number;
    onUploadComplete: () => void;
}) {
    const [dragging, setDragging] = useState(false);
    const [uploadingFiles, setUploadingFiles] = useState<{ name: string; progress: number }[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFiles = useCallback(async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        const fileArr = Array.from(files).filter((f) => f.type.startsWith("image/"));
        if (fileArr.length === 0) return;

        // 진행률 초기화
        setUploadingFiles(fileArr.map((f) => ({ name: f.name, progress: 0 })));

        let order = currentPhotoCount;
        for (let i = 0; i < fileArr.length; i++) {
            const originalFile = fileArr[i];
            try {
                const compressedFile = await compressImage(originalFile);
                await uploadPhoto(albumId, compressedFile, order++, (p) => {
                    setUploadingFiles((prev) =>
                        prev.map((u, idx) => (idx === i ? { ...u, progress: Math.round(p) } : u))
                    );
                });
            } catch (err) {
                console.error("Upload failed:", err);
            }
        }

        setUploadingFiles([]);
        onUploadComplete();

        // 입력 초기화
        if (inputRef.current) inputRef.current.value = "";
    }, [albumId, currentPhotoCount, onUploadComplete]);

    const onDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setDragging(false);
            handleFiles(e.dataTransfer.files);
        },
        [handleFiles]
    );

    return (
        <div className="mb-4">
            {/* 드래그드롭 영역 */}
            <div
                className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${dragging
                    ? "border-black bg-gray-50 scale-[1.01]"
                    : "border-gray-200 hover:border-gray-400 hover:bg-gray-50"
                    }`}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
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
                <ImagePlus size={28} className="mx-auto mb-3 text-gray-300" />
                <p className="text-sm text-gray-400">
                    <span className="font-medium text-black">사진을 선택</span>하거나 여기에 드래그하세요
                </p>
                <p className="text-xs text-gray-300 mt-1">JPG, PNG, WEBP 등 이미지 파일 여러 장 동시 업로드 가능</p>
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
            {uploadingFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                    {uploadingFiles.map((f, i) => (
                        <div key={i} className="flex items-center gap-3 text-xs text-gray-500">
                            <Loader size={12} className="animate-spin flex-shrink-0" />
                            <span className="flex-1 truncate">{f.name}</span>
                            <div className="w-24 bg-gray-100 rounded-full h-1.5">
                                <div
                                    className="bg-black h-1.5 rounded-full transition-all"
                                    style={{ width: `${f.progress}%` }}
                                />
                            </div>
                            <span className="w-8 text-right">{f.progress}%</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default function GalleryManager() {
    const [activeCategory, setActiveCategory] = useState("wedding-day");
    const [albums, setAlbums] = useState<Album[]>([]);
    const [expandedAlbum, setExpandedAlbum] = useState<string | null>(null);
    const [photos, setPhotos] = useState<Record<string, Photo[]>>({});
    const [loading, setLoading] = useState(false);
    const [editingAlbum, setEditingAlbum] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({ title: "", subtitle: "", location: "" });
    const [newAlbumForm, setNewAlbumForm] = useState({ title: "", subtitle: "", location: "" });
    const [showNewAlbum, setShowNewAlbum] = useState(false);
    const [creating, setCreating] = useState(false);
    // 삭제 확인 상태 (photoId -> 확인 대기중)
    const [deletingPhoto, setDeletingPhoto] = useState<string | null>(null);
    const [deletingAlbum, setDeletingAlbum] = useState<string | null>(null);

    // 앨범 드래그 순서 변경
    const [albumDragIdx, setAlbumDragIdx] = useState<number | null>(null);
    const [albumOverIdx, setAlbumOverIdx] = useState<number | null>(null);

    // 사진 드래그 순서 변경
    const [photoDragIdx, setPhotoDragIdx] = useState<number | null>(null);
    const [photoOverIdx, setPhotoOverIdx] = useState<number | null>(null);
    const [photoDragAlbum, setPhotoDragAlbum] = useState<string | null>(null);

    const handlePhotoDragStart = (e: React.DragEvent, albumId: string, idx: number) => {
        setPhotoDragIdx(idx);
        setPhotoDragAlbum(albumId);
        e.dataTransfer.effectAllowed = "move";
    };

    const handlePhotoDragOver = (e: React.DragEvent, idx: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (photoDragIdx !== null && idx !== photoDragIdx) {
            setPhotoOverIdx(idx);
        }
    };

    const handlePhotoDragEnd = async (albumId: string) => {
        if (photoDragIdx === null || photoOverIdx === null || photoDragIdx === photoOverIdx || photoDragAlbum !== albumId) {
            setPhotoDragIdx(null);
            setPhotoOverIdx(null);
            setPhotoDragAlbum(null);
            return;
        }

        const albumPhotos = [...(photos[albumId] || [])];
        const [moved] = albumPhotos.splice(photoDragIdx, 1);
        albumPhotos.splice(photoOverIdx, 0, moved);
        setPhotos((prev) => ({ ...prev, [albumId]: albumPhotos }));
        setPhotoDragIdx(null);
        setPhotoOverIdx(null);
        setPhotoDragAlbum(null);

        try {
            await Promise.all(albumPhotos.map((p, i) => updatePhotoOrder(p.id, i)));
        } catch (err) {
            console.error("사진 순서 저장 실패:", err);
            await loadPhotos(albumId);
        }
    };

    const handleAlbumDragStart = (e: React.DragEvent, idx: number) => {
        setAlbumDragIdx(idx);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleAlbumDragOver = (e: React.DragEvent, idx: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (albumDragIdx !== null && idx !== albumDragIdx) {
            setAlbumOverIdx(idx);
        }
    };

    const handleAlbumDragEnd = async () => {
        if (albumDragIdx === null || albumOverIdx === null || albumDragIdx === albumOverIdx) {
            setAlbumDragIdx(null);
            setAlbumOverIdx(null);
            return;
        }

        const newAlbums = [...albums];
        const [moved] = newAlbums.splice(albumDragIdx, 1);
        newAlbums.splice(albumOverIdx, 0, moved);

        // Optimistic UI update
        setAlbums(newAlbums);
        setAlbumDragIdx(null);
        setAlbumOverIdx(null);

        // Update in DB
        try {
            await Promise.all(
                newAlbums.map((a, i) => updateAlbumOrder(a.id, i))
            );
        } catch (e) {
            console.error("Failed to update album order", e);
            loadAlbums(); // Revert on failure
        }
    };

    useEffect(() => {
        loadAlbums();
    }, [activeCategory]);

    const loadAlbums = async () => {
        setLoading(true);
        try {
            const data = await getAlbumsByCategory(activeCategory);
            setAlbums(data);
        } catch (err) {
            console.error("앨범 로딩 실패:", err);
        } finally {
            setLoading(false);
        }
    };

    const loadPhotos = async (albumId: string) => {
        try {
            const data = await getPhotosByAlbum(albumId);
            setPhotos((prev) => ({ ...prev, [albumId]: data }));
        } catch (err) {
            console.error("사진 로딩 실패:", err);
        }
    };

    const toggleAlbum = async (albumId: string) => {
        if (expandedAlbum === albumId) {
            setExpandedAlbum(null);
        } else {
            setExpandedAlbum(albumId);
            await loadPhotos(albumId);
        }
    };

    const handleCreateAlbum = async () => {
        if (!newAlbumForm.title.trim()) return;
        setCreating(true);
        try {
            await createAlbum({
                categorySlug: activeCategory,
                title: newAlbumForm.title,
                subtitle: newAlbumForm.subtitle,
                location: newAlbumForm.location,
                coverImageUrl: "",
                order: albums.length,
            });
            setNewAlbumForm({ title: "", subtitle: "", location: "" });
            setShowNewAlbum(false);
            await loadAlbums();
        } catch (err) {
            console.error("앨범 생성 실패:", err);
            alert("앨범 생성에 실패했습니다. Firebase 보안 규칙을 확인해주세요.");
        } finally {
            setCreating(false);
        }
    };

    const handleSaveEdit = async (id: string) => {
        await updateAlbum(id, editForm);
        setEditingAlbum(null);
        await loadAlbums();
    };

    const handleDeleteAlbum = async (id: string) => {
        if (deletingAlbum !== id) {
            setDeletingAlbum(id);
            return;
        }
        setDeletingAlbum(null);
        try {
            await deleteAlbum(id);
            await loadAlbums();
        } catch (err) {
            console.error("앨범 삭제 실패:", err);
            alert("삭제에 실패했습니다: " + String(err));
        }
    };

    const handleDeletePhoto = async (albumId: string, photoId: string, url: string) => {
        if (deletingPhoto !== photoId) {
            setDeletingPhoto(photoId);
            return;
        }
        setDeletingPhoto(null);
        try {
            await deletePhoto(photoId, url);
            // 로컬 상태 즉시 업데이트
            setPhotos((prev) => ({
                ...prev,
                [albumId]: (prev[albumId] || []).filter((p) => p.id !== photoId),
            }));
        } catch (err) {
            console.error("사진 삭제 실패:", err);
            alert("삭제에 실패했습니다: " + String(err));
            await loadPhotos(albumId);
        }
    };

    const handleSetCover = async (albumId: string, url: string) => {
        await updateAlbum(albumId, { coverImageUrl: url });
        await loadAlbums();
    };

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-xl font-light tracking-widest uppercase text-black">갤러리 관리</h1>
                <p className="text-sm text-gray-400 mt-1">앨범을 생성하고 사진을 업로드합니다</p>
            </div>

            {/* Category Tabs */}
            <div className="flex gap-2 mb-8 border-b border-gray-200">
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat.slug}
                        onClick={() => {
                            setActiveCategory(cat.slug);
                            setExpandedAlbum(null);
                            setShowNewAlbum(false);
                        }}
                        className={`px-5 py-2.5 text-xs uppercase tracking-widest transition-colors border-b-2 -mb-[1px] ${activeCategory === cat.slug
                            ? "border-black text-black"
                            : "border-transparent text-gray-400 hover:text-gray-600"
                            }`}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>

            {/* New Album Button / Form */}
            <div className="mb-6">
                {!showNewAlbum ? (
                    <button
                        onClick={() => setShowNewAlbum(true)}
                        className="flex items-center gap-2 text-xs uppercase tracking-widest text-gray-500 border border-gray-300 px-4 py-2.5 hover:border-black hover:text-black transition-colors"
                    >
                        <Plus size={14} />
                        새 앨범 추가
                    </button>
                ) : (
                    <div className="border border-gray-200 rounded-xl p-6 bg-white space-y-4">
                        <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">새 앨범 만들기</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">
                                    앨범 제목 *
                                </label>
                                <input
                                    className="w-full border-b border-gray-200 py-2 text-sm focus:outline-none focus:border-black"
                                    value={newAlbumForm.title}
                                    onChange={(e) => setNewAlbumForm({ ...newAlbumForm, title: e.target.value })}
                                    placeholder="예: COUPLE 01"
                                    onKeyDown={(e) => e.key === "Enter" && handleCreateAlbum()}
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">
                                    부제목
                                </label>
                                <input
                                    className="w-full border-b border-gray-200 py-2 text-sm focus:outline-none focus:border-black"
                                    value={newAlbumForm.subtitle}
                                    onChange={(e) => setNewAlbumForm({ ...newAlbumForm, subtitle: e.target.value })}
                                    placeholder="예: Wedding Day"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">
                                    촬영 장소
                                </label>
                                <input
                                    className="w-full border-b border-gray-200 py-2 text-sm focus:outline-none focus:border-black"
                                    value={newAlbumForm.location}
                                    onChange={(e) => setNewAlbumForm({ ...newAlbumForm, location: e.target.value })}
                                    placeholder="예: SEOUL, KOREA"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={handleCreateAlbum}
                                disabled={!newAlbumForm.title.trim() || creating}
                                className="flex items-center gap-2 bg-black text-white px-6 py-2.5 text-xs uppercase tracking-widest hover:bg-gray-800 disabled:opacity-40 transition-colors"
                            >
                                {creating && <Loader size={13} className="animate-spin" />}
                                {creating ? "생성 중..." : "앨범 생성"}
                            </button>
                            <button
                                onClick={() => setShowNewAlbum(false)}
                                className="text-gray-400 text-xs px-5 py-2.5 border border-gray-200 hover:border-gray-400 transition-colors"
                            >
                                취소
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Album List */}
            {loading ? (
                <div className="flex justify-center py-16">
                    <div className="w-6 h-6 border-2 border-gray-300 border-t-black rounded-full animate-spin"></div>
                </div>
            ) : albums.length === 0 ? (
                <div className="text-center py-16">
                    <p className="text-gray-300 text-sm uppercase tracking-widest mb-3">앨범이 없습니다</p>
                    <p className="text-xs text-gray-300">"새 앨범 추가"를 눌러 앨범을 만들어보세요</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {albums.map((album, idx) => {
                        const isDragging = albumDragIdx === idx;
                        const isOver = albumOverIdx === idx;
                        return (
                            <div
                                key={album.id}
                                draggable
                                onDragStart={(e) => handleAlbumDragStart(e, idx)}
                                onDragOver={(e) => handleAlbumDragOver(e, idx)}
                                onDragEnd={handleAlbumDragEnd}
                                onDragLeave={() => { if (albumOverIdx === idx) setAlbumOverIdx(null); }}
                                className={`border border-gray-200 rounded-xl bg-white overflow-hidden transition-all duration-200 cursor-grab active:cursor-grabbing ${isDragging ? "opacity-30 scale-[0.98]" : isOver ? "ring-2 ring-black scale-[1.01]" : ""}`}
                            >
                                {/* Album Header */}
                                <div className="flex items-center gap-4 p-5">
                                    {/* Drag Handle */}
                                    <div className="text-gray-300">
                                        <GripVertical size={20} />
                                    </div>
                                    {/* Cover */}
                                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                        {album.coverImageUrl ? (
                                            <img src={album.coverImageUrl} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Upload size={16} className="text-gray-300" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Info / Edit Form */}
                                    {editingAlbum === album.id ? (
                                        <div className="flex-1 grid grid-cols-3 gap-3">
                                            <input
                                                className="border-b border-gray-300 py-1 text-sm focus:outline-none focus:border-black"
                                                value={editForm.title}
                                                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                                placeholder="제목"
                                            />
                                            <input
                                                className="border-b border-gray-300 py-1 text-sm focus:outline-none focus:border-black"
                                                value={editForm.subtitle}
                                                onChange={(e) => setEditForm({ ...editForm, subtitle: e.target.value })}
                                                placeholder="부제목"
                                            />
                                            <input
                                                className="border-b border-gray-300 py-1 text-sm focus:outline-none focus:border-black"
                                                value={editForm.location}
                                                onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                                                placeholder="장소"
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex-1">
                                            <p className="text-sm font-medium tracking-widest uppercase text-black">{album.title}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">{album.location || album.subtitle || "–"}</p>
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex items-center gap-1.5">
                                        {editingAlbum === album.id ? (
                                            <>
                                                <button
                                                    onClick={() => handleSaveEdit(album.id)}
                                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                    title="저장"
                                                >
                                                    <Check size={16} />
                                                </button>
                                                <button
                                                    onClick={() => setEditingAlbum(null)}
                                                    className="p-2 text-gray-400 hover:bg-gray-50 rounded-lg transition-colors"
                                                    title="취소"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                onClick={() => {
                                                    setEditingAlbum(album.id);
                                                    setEditForm({ title: album.title, subtitle: album.subtitle || "", location: album.location || "" });
                                                }}
                                                className="p-2 text-gray-400 hover:text-black hover:bg-gray-50 rounded-lg transition-colors"
                                                title="편집"
                                            >
                                                <Edit2 size={15} />
                                            </button>
                                        )}
                                        {deletingAlbum === album.id ? (
                                            <button
                                                onClick={() => handleDeleteAlbum(album.id)}
                                                className="px-2 py-1 bg-red-500 text-white text-xs rounded-lg transition-colors animate-pulse whitespace-nowrap"
                                            >
                                                삭제?
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleDeleteAlbum(album.id)}
                                                className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                title="삭제"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => toggleAlbum(album.id)}
                                            className={`p-2 rounded-lg transition-colors ml-1 ${expandedAlbum === album.id
                                                ? "bg-gray-100 text-black"
                                                : "text-gray-400 hover:text-black hover:bg-gray-50"
                                                }`}
                                            title={expandedAlbum === album.id ? "닫기" : "사진 보기/업로드"}
                                        >
                                            {expandedAlbum === album.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Photo Section */}
                                {expandedAlbum === album.id && (
                                    <div className="border-t border-gray-100 p-5 bg-gray-50/30">
                                        {/* 업로드 영역 */}
                                        <PhotoUploadZone
                                            albumId={album.id}
                                            currentPhotoCount={photos[album.id]?.length ?? 0}
                                            onUploadComplete={async () => {
                                                await loadPhotos(album.id);
                                                // 첫 사진이면 커버로 자동 설정
                                                const updated = await getPhotosByAlbum(album.id);
                                                if (updated.length === 1 && !album.coverImageUrl) {
                                                    await updateAlbum(album.id, { coverImageUrl: updated[0].url });
                                                    await loadAlbums();
                                                }
                                            }}
                                        />

                                        {/* Photo Grid */}
                                        {!photos[album.id] ? (
                                            <div className="flex justify-center py-8">
                                                <div className="w-5 h-5 border-2 border-gray-200 border-t-gray-400 rounded-full animate-spin"></div>
                                            </div>
                                        ) : photos[album.id].length === 0 ? (
                                            <p className="text-xs text-gray-300 uppercase tracking-widest text-center py-4">
                                                아직 사진이 없습니다
                                            </p>
                                        ) : (
                                            <>
                                                <div className="flex items-center justify-between mb-3">
                                                    <p className="text-[10px] text-gray-400 uppercase tracking-widest">
                                                        {photos[album.id].length}장의 사진
                                                    </p>
                                                    <p className="text-[10px] text-gray-300 uppercase tracking-widest">
                                                        드래그하여 순서 변경
                                                    </p>
                                                </div>
                                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                                                    {photos[album.id].map((photo, idx) => {
                                                        const isDragging = photoDragAlbum === album.id && photoDragIdx === idx;
                                                        const isOver = photoDragAlbum === album.id && photoOverIdx === idx;
                                                        return (
                                                            <div
                                                                key={photo.id}
                                                                draggable
                                                                onDragStart={(e) => handlePhotoDragStart(e, album.id, idx)}
                                                                onDragOver={(e) => handlePhotoDragOver(e, idx)}
                                                                onDragEnd={() => handlePhotoDragEnd(album.id)}
                                                                onDragLeave={() => { if (photoOverIdx === idx) setPhotoOverIdx(null); }}
                                                                className={`relative group aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-grab active:cursor-grabbing transition-all select-none ${isDragging ? "opacity-30 scale-90" : isOver ? "ring-2 ring-black ring-offset-1 scale-105" : ""
                                                                    }`}
                                                            >
                                                                <img src={photo.url} alt="" className="w-full h-full object-cover" draggable={false} />
                                                                {/* Order Badge */}
                                                                <div className="absolute top-1 right-1 bg-black/60 text-white text-[8px] w-5 h-5 rounded flex items-center justify-center font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                                    {idx + 1}
                                                                </div>
                                                                {/* Drag Handle */}
                                                                <div className="absolute top-1 left-1 text-white/70 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                                    <GripVertical size={14} />
                                                                </div>
                                                                {/* Hover Actions */}
                                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end justify-center gap-1.5 pb-2 opacity-0 group-hover:opacity-100 pointer-events-none">
                                                                    <button
                                                                        title="커버로 설정"
                                                                        onMouseDown={(e) => e.stopPropagation()}
                                                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeletingPhoto(null); handleSetCover(album.id, photo.url); }}
                                                                        className="p-1.5 bg-white/90 rounded-lg text-yellow-500 hover:bg-white transition-colors pointer-events-auto cursor-pointer relative z-10"
                                                                    >
                                                                        ⭐
                                                                    </button>
                                                                    {deletingPhoto === photo.id ? (
                                                                        <button
                                                                            title="삭제 확인"
                                                                            onMouseDown={(e) => e.stopPropagation()}
                                                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeletePhoto(album.id, photo.id, photo.url); }}
                                                                            className="px-2 py-1 bg-red-500 text-white text-[9px] rounded-lg font-medium pointer-events-auto cursor-pointer relative z-10 animate-pulse"
                                                                        >
                                                                            삭제?
                                                                        </button>
                                                                    ) : (
                                                                        <button
                                                                            title="삭제"
                                                                            onMouseDown={(e) => e.stopPropagation()}
                                                                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeletePhoto(album.id, photo.id, photo.url); }}
                                                                            className="p-1.5 bg-white/90 rounded-lg text-red-500 hover:bg-white transition-colors pointer-events-auto cursor-pointer relative z-10"
                                                                        >
                                                                            <Trash2 size={12} />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                                {/* Cover Badge */}
                                                                {album.coverImageUrl === photo.url && (
                                                                    <div className="absolute top-1 left-1 bg-black text-white text-[8px] px-1.5 py-0.5 rounded font-medium z-10 pointer-events-none">
                                                                        COVER
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    );
}
