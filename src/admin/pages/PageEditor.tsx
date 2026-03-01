import { useState, useEffect } from "react";
import { getPageContent, updatePageContent } from "../../lib/firestoreService";
import { Check, Loader } from "lucide-react";

const PAGES = [
    {
        slug: "product",
        name: "Product (상품구성)",
        fields: [
            { key: "title", label: "페이지 제목", type: "text" },
            { key: "subtitle", label: "부제목", type: "text" },
            { key: "description", label: "설명", type: "textarea" },
            { key: "package1_name", label: "패키지 1 이름", type: "text" },
            { key: "package1_price", label: "패키지 1 가격", type: "text" },
            { key: "package1_description", label: "패키지 1 설명", type: "textarea" },
            { key: "package2_name", label: "패키지 2 이름", type: "text" },
            { key: "package2_price", label: "패키지 2 가격", type: "text" },
            { key: "package2_description", label: "패키지 2 설명", type: "textarea" },
            { key: "package3_name", label: "패키지 3 이름", type: "text" },
            { key: "package3_price", label: "패키지 3 가격", type: "text" },
            { key: "package3_description", label: "패키지 3 설명", type: "textarea" },
        ],
    },
    {
        slug: "faq",
        name: "FAQ (자주 묻는 질문)",
        fields: [
            { key: "title", label: "페이지 제목", type: "text" },
            { key: "q1", label: "질문 1", type: "text" },
            { key: "a1", label: "답변 1", type: "textarea" },
            { key: "q2", label: "질문 2", type: "text" },
            { key: "a2", label: "답변 2", type: "textarea" },
            { key: "q3", label: "질문 3", type: "text" },
            { key: "a3", label: "답변 3", type: "textarea" },
            { key: "q4", label: "질문 4", type: "text" },
            { key: "a4", label: "답변 4", type: "textarea" },
            { key: "q5", label: "질문 5", type: "text" },
            { key: "a5", label: "답변 5", type: "textarea" },
        ],
    },
    {
        slug: "contact",
        name: "Contact (연락처)",
        fields: [
            { key: "title", label: "페이지 제목", type: "text" },
            { key: "subtitle", label: "부제목", type: "text" },
            { key: "address", label: "주소", type: "textarea" },
            { key: "phone", label: "전화번호", type: "text" },
            { key: "email", label: "이메일", type: "text" },
        ],
    },
];

export default function PageEditor() {
    const [activePage, setActivePage] = useState("product");
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const currentPage = PAGES.find((p) => p.slug === activePage)!;

    useEffect(() => {
        setLoading(true);
        getPageContent(activePage)
            .then((data) => {
                const strData: Record<string, string> = {};
                for (const [k, v] of Object.entries(data)) {
                    strData[k] = String(v ?? "");
                }
                setFormData(strData);
            })
            .finally(() => setLoading(false));
    }, [activePage]);

    const handleSave = async () => {
        setSaving(true);
        await updatePageContent(activePage, formData);
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-xl font-light tracking-widest uppercase text-black">페이지 편집</h1>
                <p className="text-sm text-gray-400 mt-1">각 페이지의 텍스트 내용을 수정합니다</p>
            </div>

            {/* Page Tabs */}
            <div className="flex gap-2 mb-8 border-b border-gray-200">
                {PAGES.map((page) => (
                    <button
                        key={page.slug}
                        onClick={() => setActivePage(page.slug)}
                        className={`px-5 py-2.5 text-xs uppercase tracking-widest transition-colors border-b-2 -mb-[1px] ${activePage === page.slug
                                ? "border-black text-black"
                                : "border-transparent text-gray-400 hover:text-gray-600"
                            }`}
                    >
                        {page.slug.toUpperCase()}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center py-16">
                    <div className="w-6 h-6 border-2 border-gray-300 border-t-black rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="bg-white border border-gray-200 rounded-xl p-8 max-w-3xl">
                    <h2 className="text-xs uppercase tracking-widest text-gray-400 mb-8">{currentPage.name}</h2>

                    <div className="space-y-6">
                        {currentPage.fields.map((field) => (
                            <div key={field.key}>
                                <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">
                                    {field.label}
                                </label>
                                {field.type === "textarea" ? (
                                    <textarea
                                        rows={4}
                                        className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors resize-none"
                                        value={formData[field.key] ?? ""}
                                        onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                                    />
                                ) : (
                                    <input
                                        type="text"
                                        className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
                                        value={formData[field.key] ?? ""}
                                        onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                                    />
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="mt-8 flex items-center gap-4">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 bg-black text-white px-8 py-3 text-xs uppercase tracking-widest hover:bg-gray-800 transition-colors disabled:opacity-50"
                        >
                            {saving ? <Loader size={14} className="animate-spin" /> : saved ? <Check size={14} /> : null}
                            {saving ? "저장 중..." : saved ? "저장됨!" : "저장"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
