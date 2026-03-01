import { useState, useEffect, useCallback } from "react";
import {
    getFaqs,
    addFaq,
    updateFaq,
    deleteFaq,
    getPolicySections,
    addPolicySection,
    updatePolicySection,
    deletePolicySection,
    getPageContent,
    updatePageContent,
    type FaqItem,
    type PolicySection,
} from "../../lib/firestoreService";
import {
    Plus,
    Pencil,
    Trash2,
    Check,
    X,
    Loader,
    ChevronUp,
    ChevronDown,
} from "lucide-react";

// ─── Page Header Section ────────────────────────────────────────────────────

function PageHeaderSection() {
    const [faqTitle, setFaqTitle] = useState("");
    const [faqSubtitle, setFaqSubtitle] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        getPageContent("faq").then((data) => {
            setFaqTitle(String(data.faq_title ?? "KakaoTalk Channel"));
            setFaqSubtitle(String(data.faq_subtitle ?? "Frequently asked questions & photographic guide"));
        }).finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        await updatePageContent("faq", { faq_title: faqTitle, faq_subtitle: faqSubtitle });
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    if (loading)
        return (
            <div className="flex justify-center py-12">
                <div className="w-6 h-6 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
            </div>
        );

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-8 max-w-2xl">
            <h2 className="text-[10px] uppercase tracking-widest text-gray-400 mb-6">
                F&amp;Q 페이지 상단 문구
            </h2>
            <div className="space-y-6">
                <div>
                    <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">
                        페이지 제목
                    </label>
                    <input
                        type="text"
                        className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
                        value={faqTitle}
                        onChange={(e) => setFaqTitle(e.target.value)}
                        placeholder="KakaoTalk Channel"
                    />
                </div>
                <div>
                    <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">
                        부제목 (제목 아래 작은 문구)
                    </label>
                    <textarea
                        rows={3}
                        className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors resize-none"
                        value={faqSubtitle}
                        onChange={(e) => setFaqSubtitle(e.target.value)}
                        placeholder="Frequently asked questions & photographic guide"
                    />
                </div>
            </div>
            <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-black text-white px-8 py-3 text-xs uppercase tracking-widest hover:bg-gray-800 transition-colors disabled:opacity-50 mt-8"
            >
                {saving ? <Loader size={14} className="animate-spin" /> : saved ? <Check size={14} /> : null}
                {saving ? "저장 중..." : saved ? "저장됨!" : "저장"}
            </button>
        </div>
    );
}

// ─── FAQ Section ────────────────────────────────────────────────────────────

function FaqSection() {
    const [faqs, setFaqs] = useState<FaqItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Edit state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editQ, setEditQ] = useState("");
    const [editA, setEditA] = useState("");

    // New item form
    const [showNew, setShowNew] = useState(false);
    const [newQ, setNewQ] = useState("");
    const [newA, setNewA] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        const data = await getFaqs();
        setFaqs(data);
        setLoading(false);
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const handleAdd = async () => {
        if (!newQ.trim() || !newA.trim()) return;
        setSaving(true);
        const order = faqs.length > 0 ? Math.max(...faqs.map((f) => f.order)) + 1 : 0;
        await addFaq({ question: newQ.trim(), answer: newA.trim(), order });
        setNewQ("");
        setNewA("");
        setShowNew(false);
        setSaving(false);
        await load();
    };

    const handleEdit = (faq: FaqItem) => {
        setEditingId(faq.id);
        setEditQ(faq.question);
        setEditA(faq.answer);
    };

    const handleSaveEdit = async () => {
        if (!editingId) return;
        setSaving(true);
        await updateFaq(editingId, { question: editQ.trim(), answer: editA.trim() });
        setEditingId(null);
        setSaving(false);
        await load();
    };

    const handleDelete = async (id: string) => {
        if (!confirm("삭제하시겠습니까?")) return;
        await deleteFaq(id);
        await load();
    };

    const handleMoveUp = async (index: number) => {
        if (index === 0) return;
        const a = faqs[index];
        const b = faqs[index - 1];
        await Promise.all([
            updateFaq(a.id, { order: b.order }),
            updateFaq(b.id, { order: a.order }),
        ]);
        await load();
    };

    const handleMoveDown = async (index: number) => {
        if (index === faqs.length - 1) return;
        const a = faqs[index];
        const b = faqs[index + 1];
        await Promise.all([
            updateFaq(a.id, { order: b.order }),
            updateFaq(b.id, { order: a.order }),
        ]);
        await load();
    };

    if (loading)
        return (
            <div className="flex justify-center py-12">
                <div className="w-6 h-6 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
            </div>
        );

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xs uppercase tracking-widest text-gray-500">
                        FAQ 목록 (아코디언)
                    </h2>
                    <p className="text-[10px] text-gray-400 mt-1">
                        좌측의 위/아래 화살표 버튼을 클릭해 노출 순서(위치)를 변경할 수 있습니다.
                    </p>
                </div>
                <button
                    onClick={() => setShowNew(true)}
                    className="flex items-center gap-2 text-xs bg-black text-white px-4 py-2 uppercase tracking-widest hover:bg-gray-800 transition-colors"
                >
                    <Plus size={13} /> 새 항목 추가
                </button>
            </div>

            {/* New Item Form */}
            {showNew && (
                <div className="border border-gray-200 rounded-xl p-6 mb-4 bg-gray-50">
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-4">
                        새 FAQ 추가
                    </p>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">
                                질문
                            </label>
                            <input
                                type="text"
                                placeholder="질문을 입력하세요"
                                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
                                value={newQ}
                                onChange={(e) => setNewQ(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">
                                답변
                            </label>
                            <textarea
                                rows={4}
                                placeholder="답변을 입력하세요"
                                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors resize-none"
                                value={newA}
                                onChange={(e) => setNewA(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                        <button
                            onClick={handleAdd}
                            disabled={saving || !newQ.trim() || !newA.trim()}
                            className="flex items-center gap-2 bg-black text-white px-5 py-2 text-xs uppercase tracking-widest hover:bg-gray-800 transition-colors disabled:opacity-40"
                        >
                            {saving ? <Loader size={12} className="animate-spin" /> : <Check size={12} />}
                            저장
                        </button>
                        <button
                            onClick={() => { setShowNew(false); setNewQ(""); setNewA(""); }}
                            className="flex items-center gap-2 border border-gray-200 px-5 py-2 text-xs uppercase tracking-widest text-gray-500 hover:border-gray-400 transition-colors"
                        >
                            <X size={12} /> 취소
                        </button>
                    </div>
                </div>
            )}

            {/* FAQ List */}
            <div className="space-y-3">
                {faqs.map((faq, index) => (
                    <div key={faq.id} className="border border-gray-200 rounded-xl overflow-hidden">
                        {editingId === faq.id ? (
                            <div className="p-6 bg-gray-50">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">질문</label>
                                        <input
                                            type="text"
                                            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
                                            value={editQ}
                                            onChange={(e) => setEditQ(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">답변</label>
                                        <textarea
                                            rows={4}
                                            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors resize-none"
                                            value={editA}
                                            onChange={(e) => setEditA(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-4">
                                    <button
                                        onClick={handleSaveEdit}
                                        disabled={saving}
                                        className="flex items-center gap-2 bg-black text-white px-5 py-2 text-xs uppercase tracking-widest hover:bg-gray-800 transition-colors disabled:opacity-40"
                                    >
                                        {saving ? <Loader size={12} className="animate-spin" /> : <Check size={12} />}
                                        저장
                                    </button>
                                    <button
                                        onClick={() => setEditingId(null)}
                                        className="flex items-center gap-2 border border-gray-200 px-5 py-2 text-xs uppercase tracking-widest text-gray-500 hover:border-gray-400 transition-colors"
                                    >
                                        <X size={12} /> 취소
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-start gap-4 p-5">
                                <div className="flex flex-col gap-1 pt-0.5">
                                    <button
                                        onClick={() => handleMoveUp(index)}
                                        disabled={index === 0}
                                        className="text-gray-300 hover:text-black transition-colors disabled:opacity-20"
                                    >
                                        <ChevronUp size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleMoveDown(index)}
                                        disabled={index === faqs.length - 1}
                                        className="text-gray-300 hover:text-black transition-colors disabled:opacity-20"
                                    >
                                        <ChevronDown size={16} />
                                    </button>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium uppercase tracking-wide text-gray-800">
                                        {faq.question}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1 whitespace-pre-line">
                                        {faq.answer}
                                    </p>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    <button
                                        onClick={() => handleEdit(faq)}
                                        className="p-2 text-gray-400 hover:text-black transition-colors"
                                    >
                                        <Pencil size={15} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(faq.id)}
                                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
                {faqs.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-10">
                        FAQ가 없습니다. 위 버튼으로 추가하세요.
                    </p>
                )}
            </div>
        </div>
    );
}

// ─── Policy Section ─────────────────────────────────────────────────────────

function PolicySectionManager() {
    const [sections, setSections] = useState<PolicySection[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState("");
    const [editBody, setEditBody] = useState("");

    const [showNew, setShowNew] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newBody, setNewBody] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        const data = await getPolicySections();
        setSections(data);
        setLoading(false);
    }, []);

    useEffect(() => {
        load();
    }, [load]);

    const handleAdd = async () => {
        if (!newTitle.trim() || !newBody.trim()) return;
        setSaving(true);
        const order = sections.length > 0 ? Math.max(...sections.map((s) => s.order)) + 1 : 0;
        await addPolicySection({ title: newTitle.trim(), body: newBody.trim(), order });
        setNewTitle("");
        setNewBody("");
        setShowNew(false);
        setSaving(false);
        await load();
    };

    const handleSaveEdit = async () => {
        if (!editingId) return;
        setSaving(true);
        await updatePolicySection(editingId, { title: editTitle.trim(), body: editBody.trim() });
        setEditingId(null);
        setSaving(false);
        await load();
    };

    const handleDelete = async (id: string) => {
        if (!confirm("삭제하시겠습니까?")) return;
        await deletePolicySection(id);
        await load();
    };

    const handleMoveUp = async (index: number) => {
        if (index === 0) return;
        const a = sections[index];
        const b = sections[index - 1];
        await Promise.all([
            updatePolicySection(a.id, { order: b.order }),
            updatePolicySection(b.id, { order: a.order }),
        ]);
        await load();
    };

    const handleMoveDown = async (index: number) => {
        if (index === sections.length - 1) return;
        const a = sections[index];
        const b = sections[index + 1];
        await Promise.all([
            updatePolicySection(a.id, { order: b.order }),
            updatePolicySection(b.id, { order: a.order }),
        ]);
        await load();
    };

    if (loading)
        return (
            <div className="flex justify-center py-12">
                <div className="w-6 h-6 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
            </div>
        );

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xs uppercase tracking-widest text-gray-500">
                        Guide &amp; Policy (3단 섹션)
                    </h2>
                    <p className="text-[10px] text-gray-400 mt-1">
                        최대 3개 권장. **텍스트** 로 굵게 표시됩니다.
                    </p>
                </div>
                <button
                    onClick={() => setShowNew(true)}
                    className="flex items-center gap-2 text-xs bg-black text-white px-4 py-2 uppercase tracking-widest hover:bg-gray-800 transition-colors"
                >
                    <Plus size={13} /> 섹션 추가
                </button>
            </div>

            {/* New Section Form */}
            {showNew && (
                <div className="border border-gray-200 rounded-xl p-6 mb-4 bg-gray-50">
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-4">새 섹션 추가</p>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">
                                제목
                            </label>
                            <input
                                type="text"
                                placeholder="예: 작가 지정 비용"
                                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">
                                내용 (줄바꿈은 엔터, **텍스트** 로 굵게 표시)
                            </label>
                            <textarea
                                rows={8}
                                placeholder={"**굵게 표시할 내용**\n\n일반 텍스트\n\n- 목록1\n- 목록2"}
                                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors resize-none font-mono"
                                value={newBody}
                                onChange={(e) => setNewBody(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                        <button
                            onClick={handleAdd}
                            disabled={saving || !newTitle.trim() || !newBody.trim()}
                            className="flex items-center gap-2 bg-black text-white px-5 py-2 text-xs uppercase tracking-widest hover:bg-gray-800 transition-colors disabled:opacity-40"
                        >
                            {saving ? <Loader size={12} className="animate-spin" /> : <Check size={12} />}
                            저장
                        </button>
                        <button
                            onClick={() => { setShowNew(false); setNewTitle(""); setNewBody(""); }}
                            className="flex items-center gap-2 border border-gray-200 px-5 py-2 text-xs uppercase tracking-widest text-gray-500 hover:border-gray-400 transition-colors"
                        >
                            <X size={12} /> 취소
                        </button>
                    </div>
                </div>
            )}

            {/* Sections List */}
            <div className="space-y-3">
                {sections.map((section, index) => (
                    <div key={section.id} className="border border-gray-200 rounded-xl overflow-hidden">
                        {editingId === section.id ? (
                            <div className="p-6 bg-gray-50">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">제목</label>
                                        <input
                                            type="text"
                                            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
                                            value={editTitle}
                                            onChange={(e) => setEditTitle(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-1">
                                            내용 (줄바꿈은 엔터, **텍스트** 로 굵게 표시)
                                        </label>
                                        <textarea
                                            rows={10}
                                            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors resize-none font-mono"
                                            value={editBody}
                                            onChange={(e) => setEditBody(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-4">
                                    <button
                                        onClick={handleSaveEdit}
                                        disabled={saving}
                                        className="flex items-center gap-2 bg-black text-white px-5 py-2 text-xs uppercase tracking-widest hover:bg-gray-800 transition-colors disabled:opacity-40"
                                    >
                                        {saving ? <Loader size={12} className="animate-spin" /> : <Check size={12} />}
                                        저장
                                    </button>
                                    <button
                                        onClick={() => setEditingId(null)}
                                        className="flex items-center gap-2 border border-gray-200 px-5 py-2 text-xs uppercase tracking-widest text-gray-500 hover:border-gray-400 transition-colors"
                                    >
                                        <X size={12} /> 취소
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-start gap-4 p-5">
                                <div className="flex flex-col gap-1 pt-0.5">
                                    <button
                                        onClick={() => handleMoveUp(index)}
                                        disabled={index === 0}
                                        className="text-gray-300 hover:text-black transition-colors disabled:opacity-20"
                                    >
                                        <ChevronUp size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleMoveDown(index)}
                                        disabled={index === sections.length - 1}
                                        className="text-gray-300 hover:text-black transition-colors disabled:opacity-20"
                                    >
                                        <ChevronDown size={16} />
                                    </button>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium tracking-wide text-gray-800">
                                        {section.title}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1 line-clamp-2 font-mono whitespace-pre-line">
                                        {section.body.slice(0, 120)}{section.body.length > 120 ? "…" : ""}
                                    </p>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    <button
                                        onClick={() => {
                                            setEditingId(section.id);
                                            setEditTitle(section.title);
                                            setEditBody(section.body);
                                        }}
                                        className="p-2 text-gray-400 hover:text-black transition-colors"
                                    >
                                        <Pencil size={15} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(section.id)}
                                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
                {sections.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-10">
                        섹션이 없습니다. 위 버튼으로 추가하세요.
                    </p>
                )}
            </div>
        </div>
    );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

const TABS = [
    { id: "header", label: "페이지 상단" },
    { id: "faq", label: "FAQ (아코디언)" },
    { id: "policy", label: "Benefit & Event (3단)" },
];

export default function FaqManager() {
    const [activeTab, setActiveTab] = useState("faq");

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-xl font-light tracking-widest uppercase text-black">FAQ 관리</h1>
                <p className="text-sm text-gray-400 mt-1">
                    F&amp;Q 페이지의 아코디언 항목과 3단 가이드 섹션을 관리합니다
                </p>
            </div>

            {/* Tabs */}
            <div className="flex gap-0 mb-8 border-b border-gray-200">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-6 py-3 text-xs uppercase tracking-widest transition-colors border-b-2 -mb-[1px] ${activeTab === tab.id
                            ? "border-black text-black"
                            : "border-transparent text-gray-400 hover:text-gray-600"
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            {activeTab === "header" && <PageHeaderSection />}
            {activeTab === "faq" && <FaqSection />}
            {activeTab === "policy" && <PolicySectionManager />}
        </div>
    );
}
