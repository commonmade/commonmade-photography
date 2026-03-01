import { useState, useEffect } from "react";
import { getPageContent, updatePageContent } from "../../lib/firestoreService";
import { Check, Loader } from "lucide-react";

const FIELDS = [
    // ── 상단 텍스트 ──────────────────────────────────────────
    {
        section: "페이지 상단",
        items: [
            { key: "subtitle", label: "부제목 (상단 설명 문구)", type: "textarea" },
        ],
    },
    // ── 연락처 정보 ──────────────────────────────────────────
    {
        section: "연락처 정보",
        items: [
            { key: "address", label: "주소", type: "textarea" },
            { key: "phone", label: "전화번호", type: "text" },
            { key: "email", label: "이메일", type: "text" },
            { key: "instagram", label: "인스타그램 (@ 포함)", type: "text" },
            { key: "kakao", label: "카카오채널 ID (pf.kakao.com/_뒤 ID)", type: "text" },
        ],
    },
    // ── 문의 폼 텍스트 ───────────────────────────────────────
    {
        section: "문의 폼 텍스트",
        items: [
            { key: "form_title", label: "폼 제목", type: "text" },
            { key: "form_subtitle", label: "폼 설명 문구", type: "textarea" },
        ],
    },
];

export default function ContactManager() {
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        setLoading(true);
        getPageContent("contact")
            .then((data) => {
                const strData: Record<string, string> = {};
                for (const [k, v] of Object.entries(data)) {
                    strData[k] = String(v ?? "");
                }
                setFormData(strData);
            })
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async () => {
        setSaving(true);
        await updatePageContent("contact", formData);
        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const set = (key: string, value: string) =>
        setFormData((prev) => ({ ...prev, [key]: value }));

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-xl font-light tracking-widest uppercase text-black">
                    Contact 페이지 관리
                </h1>
                <p className="text-sm text-gray-400 mt-1">
                    Contact 페이지의 텍스트 및 연락처 정보를 수정합니다
                </p>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-6 h-6 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
                </div>
            ) : (
                <div className="space-y-8 max-w-3xl">
                    {FIELDS.map(({ section, items }) => (
                        <div key={section} className="bg-white border border-gray-200 rounded-xl p-8">
                            <h2 className="text-[10px] uppercase tracking-widest text-gray-400 mb-6">
                                {section}
                            </h2>
                            <div className="space-y-6">
                                {items.map(({ key, label, type }) => (
                                    <div key={key}>
                                        <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">
                                            {label}
                                        </label>
                                        {type === "textarea" ? (
                                            <textarea
                                                rows={3}
                                                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors resize-none"
                                                value={formData[key] ?? ""}
                                                onChange={(e) => set(key, e.target.value)}
                                            />
                                        ) : (
                                            <input
                                                type="text"
                                                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
                                                value={formData[key] ?? ""}
                                                onChange={(e) => set(key, e.target.value)}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 bg-black text-white px-10 py-3 text-xs uppercase tracking-widest hover:bg-gray-800 transition-colors disabled:opacity-50"
                    >
                        {saving ? (
                            <Loader size={14} className="animate-spin" />
                        ) : saved ? (
                            <Check size={14} />
                        ) : null}
                        {saving ? "저장 중..." : saved ? "저장됨!" : "저장"}
                    </button>
                </div>
            )}
        </div>
    );
}
