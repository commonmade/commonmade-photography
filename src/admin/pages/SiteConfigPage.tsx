import { useState, useEffect } from "react";
import { getSiteConfig, updateSiteConfig } from "../../lib/firestoreService";
import { seedInitialData } from "../../lib/firestoreService";
import { Check, Loader, Database } from "lucide-react";

const CONFIG_FIELDS = [
    { key: "instagram", label: "Instagram URL", placeholder: "https://instagram.com/commonmade_photography" },
    { key: "kakao", label: "카카오 채널 링크 (기존)", placeholder: "https://pf.kakao.com/..." },
    { key: "kakaoChannelId", label: "카카오 채널 검색용 ID (플로팅 톡버튼용)", placeholder: "예: _abcde (@제외)" },
    { key: "email", label: "이메일", placeholder: "hello@commonmade.com" },
    { key: "phone", label: "전화번호", placeholder: "+82 10 0000 0000" },
    { key: "address", label: "주소", placeholder: "Seoul, South Korea" },
    { key: "copyright", label: "저작권 텍스트", placeholder: "© 2019 by Commonmade Photography." },
];

export default function SiteConfigPage() {
    const [config, setConfig] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [saved, setSaved] = useState<string | null>(null);
    const [seeding, setSeeding] = useState(false);
    const [seedDone, setSeedDone] = useState(false);

    useEffect(() => {
        getSiteConfig()
            .then(setConfig)
            .finally(() => setLoading(false));
    }, []);

    const handleSave = async (key: string) => {
        setSaving(key);
        await updateSiteConfig(key, config[key] ?? "");
        setSaving(null);
        setSaved(key);
        setTimeout(() => setSaved(null), 2000);
    };

    const handleSeed = async () => {
        if (!confirm("초기 카테고리 및 기본 설정값을 DB에 생성합니다. 계속할까요?")) return;
        setSeeding(true);
        await seedInitialData();
        setSeeding(false);
        setSeedDone(true);
        setTimeout(() => setSeedDone(false), 3000);
    };

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-xl font-light tracking-widest uppercase text-black">사이트 설정</h1>
                <p className="text-sm text-gray-400 mt-1">연락처, SNS 링크, 저작권 등 기본 정보를 수정합니다</p>
            </div>

            {/* Seed DB */}
            <div className="mb-8 p-6 bg-gray-50 border border-dashed border-gray-300 rounded-xl flex items-center justify-between">
                <div>
                    <p className="text-xs uppercase tracking-widest text-gray-500 font-medium">초기 데이터 설정</p>
                    <p className="text-xs text-gray-400 mt-1">
                        처음 사용 시 카테고리(Wedding/Baby/Moments) 및 기본 설정을 DB에 생성합니다
                    </p>
                </div>
                <button
                    onClick={handleSeed}
                    disabled={seeding}
                    className="flex items-center gap-2 bg-gray-800 text-white px-5 py-2.5 text-xs uppercase tracking-widest hover:bg-black transition-colors disabled:opacity-50"
                >
                    {seeding ? <Loader size={13} className="animate-spin" /> : <Database size={13} />}
                    {seeding ? "생성 중..." : seedDone ? "완료!" : "초기화"}
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-16">
                    <div className="w-6 h-6 border-2 border-gray-300 border-t-black rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="bg-white border border-gray-200 rounded-xl p-8 max-w-2xl">
                    <div className="space-y-6">
                        {CONFIG_FIELDS.map((field) => (
                            <div key={field.key}>
                                <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">
                                    {field.label}
                                </label>
                                <div className="flex gap-3">
                                    <input
                                        type="text"
                                        placeholder={field.placeholder}
                                        className="flex-1 border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors"
                                        value={config[field.key] ?? ""}
                                        onChange={(e) => setConfig({ ...config, [field.key]: e.target.value })}
                                    />
                                    <button
                                        onClick={() => handleSave(field.key)}
                                        disabled={saving === field.key}
                                        className="px-4 py-2 bg-black text-white text-xs uppercase tracking-widest hover:bg-gray-800 transition-colors flex items-center gap-1.5 min-w-[70px] justify-center"
                                    >
                                        {saving === field.key ? (
                                            <Loader size={13} className="animate-spin" />
                                        ) : saved === field.key ? (
                                            <Check size={13} />
                                        ) : null}
                                        {saving === field.key ? "" : saved === field.key ? "저장됨" : "저장"}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
