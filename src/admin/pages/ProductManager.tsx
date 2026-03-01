import { useState, useEffect, useCallback } from "react";
import {
    getProducts, addProduct, updateProduct, deleteProduct,
    getProductPolicySections, addProductPolicySection, updateProductPolicySection, deleteProductPolicySection,
    getPageContent, updatePageContent,
    type ProductItem, type PolicySection,
} from "../../lib/firestoreService";
import { Plus, Trash2, Check, Loader, ChevronUp, ChevronDown } from "lucide-react";

// ─── Default data ─────────────────────────────────────────────────────────────

const DEFAULT_PRODUCTS: Omit<ProductItem, "id">[] = [
    { order: 0, subtitle: "WEDDING DAY", name: "[Style A] - 원데이스냅", description: "상품기준으로 하루 한 팀만 진행하며, 실내+야외 모두 촬영할 수 있으며, 일몰까지 촬영합니다.\n[Compose] 원본/수정본 포함, 앨범 1권, 18 x 24 고급액자 1개", price: "작가 2인 촬영 30page 앨범 350만원(vat포함)" },
    { order: 1, subtitle: "WEDDING DAY", name: "[Style B] - 하프앤하프스냅", description: "상품기준으로 하루 한 팀만 진행하며, 실내+야외 총 5시간 정도 촬영합니다.\n[Compose] 원본/수정본 포함, 앨범 1권, 18 x 24 고급액자 1개", price: "작가 2인 촬영 20page 앨범 250만원(vat포함)" },
    { order: 2, subtitle: "WEDDING DAY", name: "[Style D] - 야외 하프스냅", description: "상품기준으로 하루 한 팀만 진행하며, 야외만 총 5시간 정도 촬영합니다.\n[Compose] 원본 포함, Acut 수정본 12장, 18 x 24 고급액자 1개, 사진인화물 12매", price: "작가 2인 촬영 200만원(vat포함)" },
    { order: 3, subtitle: "BABY & FAMILY", name: "[Family A] - 대규모 가족사진", description: "대가족 단체사진 및 소가족별 촬영.\n[Compose] 원본/수정본 포함, 6 x 8 고급액자 1개", price: "비수기 130만원 / 성수기 160만원 (vat포함)" },
    { order: 4, subtitle: "BABY & FAMILY", name: "[Family B] - 소규모 가족사진", description: "3-5인 소가족 단체사진 및 부부 커플사진.\n[Compose] 원본/수정본 포함, 6 x 8 고급액자 1개", price: "비수기 100만원 / 성수기 130만원 (vat포함)" },
    { order: 5, subtitle: "BABY & FAMILY", name: "[Family C] - 돌상스냅", description: "돌상 시작 1시간 전 연출부터 돌잡이까지 3시간 촬영.\n[Compose] 원본/수정본 포함, 20p 앨범 1권, 6 x 8 고급액자 2개", price: "작가 2인 촬영 220만원 (vat포함)" },
    { order: 6, subtitle: "WEDDING DAY", name: "[Style F] - 가봉스냅", description: "웨딩드레스 가봉시 드레스샵에서 촬영합니다.\n[Compose] 원본 포함, Acut 수정본 10장, 18 x 24 고급액자 1개, 사진인화물 10매", price: "작가 1인 촬영 150만원 (vat포함)" },
    { order: 7, subtitle: "WEDDING DAY", name: "[Style S] - 브라이덜 샤워", description: "브라이덜 샤워를 위한 장소 대관 및 우정촬영.\n[Compose] 원본 포함, 6 x 8 고급액자 1개", price: "작가 1인 촬영 100만원 (vat포함)" },
    { order: 8, subtitle: "WEDDING DAY", name: "[Style W] - 본식스냅", description: "식장 도착부터 폐백까지 결혼식 당일 모든 이야기를 촬영합니다.\n[Compose] 원본/수정본 포함 70page 스냅앨범 1권, 10page 원판앨범 3권", price: "작가 2인 촬영 250만원 (vat포함)" },
];

const DEFAULT_POLICIES: Omit<PolicySection, "id">[] = [
    { order: 0, title: "작가 지정 비용", body: "*각 상품별 작가 지정 가능하며 지정비는 작가의 직급별로 상이합니다.\n*Style B,D,S 상품은 대표작가 지정 불가합니다.\n\n이경호 대표작가\nStyle A (원데이스냅) 150만원\nStyle F,W / Family A,B,C 110만원\n\n이사 33만원\n수석실장 22만원\n실장 11만원" },
    { order: 1, title: "성수기 안내", body: "**Family A,B type의 경우 웨딩촬영이 많은 3-6월, 9-11월에 성수기 요금이 적용되며 12-2월, 7-8월에는 비수기 요금이 적용됩니다." },
    { order: 2, title: "위약금 안내", body: "**계약금은 계약서 발송 후 3일 이내 입금을 원칙으로 합니다. 계약금 입금 후 72시간(3일) 이내에 환불을 요청할 수 있으며, 이후부터는 환불이 불가능합니다.\n\n*촬영 예정일 기준으로 촬영 취소/변경시 위약금이 기간에 따라 발생합니다.\n\n- 90일전까지 총금액의 30%\n- 60일전까지 총금액의 50%\n- 30일전~당일 총금액의 100%\n\n(위 위약금 발생기준 일자에 해당되지 않는경우 총금액의 10% 위약금 발생)" },
];

// ─── Product Row (inline editable) ───────────────────────────────────────────

function ProductRow({ product, index, total, onMove, onDelete, onSave }:
    { product: ProductItem; index: number; total: number; onMove: (i: number, d: -1 | 1) => void; onDelete: (id: string) => void; onSave: (id: string, data: Partial<ProductItem>) => Promise<void>;[key: string]: any }) {
    const [subtitle, setSubtitle] = useState(product.subtitle ?? "");
    const [name, setName] = useState(product.name);
    const [price, setPrice] = useState(product.price);
    const [description, setDescription] = useState(product.description);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const isDirty = subtitle !== (product.subtitle ?? "") || name !== product.name || price !== product.price || description !== product.description;

    const handleSave = async () => {
        setSaving(true);
        await onSave(product.id, { subtitle: subtitle.trim(), name: name.trim(), price: price.trim(), description: description.trim() });
        setSaving(false); setSaved(true);
        setTimeout(() => setSaved(false), 1800);
    };

    return (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <button onClick={() => onMove(index, -1)} disabled={index === 0} className="text-gray-300 hover:text-black transition-colors disabled:opacity-20"><ChevronUp size={15} /></button>
                    <button onClick={() => onMove(index, 1)} disabled={index === total - 1} className="text-gray-300 hover:text-black transition-colors disabled:opacity-20"><ChevronDown size={15} /></button>
                    <span className="text-[10px] uppercase tracking-widest text-gray-400 ml-2">상품 #{index + 1}</span>
                </div>
                <button onClick={() => onDelete(product.id)} className="text-xs text-gray-400 hover:text-red-500 transition-colors uppercase tracking-widest">삭제</button>
            </div>
            <div className="p-6 space-y-5">
                <div><label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">부제목</label><input type="text" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-black transition-colors" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="예: WEDDING DAY" /></div>
                <div><label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">제목 (상품명)</label><input type="text" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-black transition-colors" value={name} onChange={(e) => setName(e.target.value)} placeholder="예: [Style A] - 원데이스냅" /></div>
                <div><label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">가격</label><input type="text" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-black transition-colors" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="예: 작가 2인 촬영 350만원(vat포함)" /></div>
                <div><label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">내용 (상세 설명)</label><textarea rows={8} className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors resize-none font-mono leading-relaxed" value={description} onChange={(e) => setDescription(e.target.value)} placeholder={"상세 설명을 입력하세요.\n\n[촬영시간]\n- 예시 내용"} /></div>
                {isDirty && (
                    <button onClick={handleSave} disabled={saving}
                        className="flex items-center gap-2 bg-black text-white px-6 py-2 text-xs uppercase tracking-widest hover:bg-gray-800 transition-colors disabled:opacity-40">
                        {saving ? <Loader size={12} className="animate-spin" /> : <Check size={12} />}
                        {saving ? "저장 중..." : "변경 저장"}
                    </button>
                )}
                {saved && !isDirty && <p className="text-[10px] text-green-600 uppercase tracking-widest">저장 완료 ✓</p>}
            </div>
        </div>
    );
}

// ─── New Product Form ─────────────────────────────────────────────────────────

function NewProductForm({ onAdd }: { onAdd: (data: Omit<ProductItem, "id" | "order">) => Promise<void> }) {
    const [subtitle, setSubtitle] = useState(""); const [name, setName] = useState(""); const [price, setPrice] = useState(""); const [description, setDescription] = useState(""); const [saving, setSaving] = useState(false);
    const handleAdd = async () => {
        if (!name.trim() || !description.trim()) return;
        setSaving(true);
        await onAdd({ subtitle: subtitle.trim(), name: name.trim(), price: price.trim(), description: description.trim() });
        setSubtitle(""); setName(""); setPrice(""); setDescription(""); setSaving(false);
    };
    return (
        <div className="border border-dashed border-gray-300 rounded-xl p-6 bg-gray-50/50">
            <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-5">새 상품 추가</p>
            <div className="space-y-5">
                <div><label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">부제목</label><input type="text" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-black transition-colors" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} placeholder="예: WEDDING DAY" /></div>
                <div><label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">제목 (상품명)</label><input type="text" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-black transition-colors" value={name} onChange={(e) => setName(e.target.value)} placeholder="예: [Style A] - 원데이스냅" /></div>
                <div><label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">가격</label><input type="text" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-black transition-colors" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="예: 작가 2인 촬영 350만원(vat포함)" /></div>
                <div><label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">내용 (상세 설명)</label><textarea rows={8} className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors resize-none font-mono leading-relaxed" value={description} onChange={(e) => setDescription(e.target.value)} placeholder={"상세 설명을 입력하세요."} /></div>
            </div>
            <div className="pt-5 mt-2 border-t border-gray-100">
                <button onClick={handleAdd} disabled={saving || !name.trim() || !description.trim()}
                    className="flex items-center gap-2 bg-black text-white px-6 py-2 text-xs uppercase tracking-widest hover:bg-gray-800 transition-colors disabled:opacity-40">
                    {saving ? <Loader size={12} className="animate-spin" /> : <Plus size={12} />}
                    {saving ? "추가 중..." : "추가"}
                </button>
            </div>
        </div>
    );
}

// ─── Products Tab ─────────────────────────────────────────────────────────────

function ProductsTab() {
    const [products, setProducts] = useState<ProductItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [seeding, setSeeding] = useState(false);
    const [showNew, setShowNew] = useState(false);

    const load = useCallback(async () => { setLoading(true); setProducts(await getProducts()); setLoading(false); }, []);
    useEffect(() => { load(); }, [load]);

    const handleSeedDefaults = async () => {
        if (!confirm("기본 상품 목록을 Firestore에 추가하시겠습니까?")) return;
        setSeeding(true);
        for (const p of DEFAULT_PRODUCTS) { await addProduct(p); }
        setSeeding(false); await load();
    };

    const handleAdd = async (data: Omit<ProductItem, "id" | "order">) => {
        const order = products.length > 0 ? Math.max(...products.map((p) => p.order)) + 1 : 0;
        await addProduct({ ...data, order }); setShowNew(false); await load();
    };

    const handleSave = async (id: string, data: Partial<ProductItem>) => { await updateProduct(id, data); await load(); };
    const handleDelete = async (id: string) => { if (!confirm("이 상품을 삭제하시겠습니까?")) return; await deleteProduct(id); await load(); };
    const handleMove = async (index: number, dir: -1 | 1) => {
        const a = products[index], b = products[index + dir];
        if (!b) return;
        await Promise.all([updateProduct(a.id, { order: b.order }), updateProduct(b.id, { order: a.order })]);
        await load();
    };

    return (
        <div>
            <div className="flex items-center gap-3 mb-8">
                <button onClick={() => setShowNew((v) => !v)} className="flex items-center gap-2 text-xs bg-black text-white px-4 py-2 uppercase tracking-widest hover:bg-gray-800 transition-colors">
                    <Plus size={13} /> 새 상품 추가
                </button>
                {products.length === 0 && !loading && (
                    <button onClick={handleSeedDefaults} disabled={seeding} className="flex items-center gap-2 text-xs border border-gray-300 px-4 py-2 uppercase tracking-widest text-gray-600 hover:border-gray-500 transition-colors disabled:opacity-50">
                        {seeding ? <Loader size={13} className="animate-spin" /> : null} 기본 상품 불러오기
                    </button>
                )}
            </div>
            {loading ? (
                <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-gray-300 border-t-black rounded-full animate-spin" /></div>
            ) : (
                <div className="space-y-6">
                    {showNew && <NewProductForm onAdd={handleAdd} />}
                    {products.map((product, index) => (
                        <ProductRow key={product.id} product={product} index={index} total={products.length} onMove={handleMove} onDelete={handleDelete} onSave={handleSave} />
                    ))}
                    {products.length === 0 && <p className="text-sm text-gray-400 text-center py-14">상품이 없습니다. 위 버튼으로 추가하거나 기본 데이터를 불러오세요.</p>}
                </div>
            )}
        </div>
    );
}

// ─── Policy Section Row (inline editable) ────────────────────────────────────

function PolicyRow({ section, index, total, onMove, onDelete, onSave }:
    { section: PolicySection; index: number; total: number; onMove: (i: number, d: -1 | 1) => void; onDelete: (id: string) => void; onSave: (id: string, data: Partial<PolicySection>) => Promise<void>;[key: string]: any }) {
    const [title, setTitle] = useState(section.title);
    const [body, setBody] = useState(section.body);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const isDirty = title !== section.title || body !== section.body;

    const handleSave = async () => {
        setSaving(true);
        await onSave(section.id, { title: title.trim(), body: body.trim() });
        setSaving(false); setSaved(true);
        setTimeout(() => setSaved(false), 1800);
    };

    return (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <button onClick={() => onMove(index, -1)} disabled={index === 0} className="text-gray-300 hover:text-black transition-colors disabled:opacity-20"><ChevronUp size={15} /></button>
                    <button onClick={() => onMove(index, 1)} disabled={index === total - 1} className="text-gray-300 hover:text-black transition-colors disabled:opacity-20"><ChevronDown size={15} /></button>
                </div>
                <button onClick={() => onDelete(section.id)} className="text-xs text-gray-400 hover:text-red-500 transition-colors uppercase tracking-widest">삭제</button>
            </div>
            <div className="p-6 space-y-5">
                <div>
                    <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">섹션 제목 (목록 이름)</label>
                    <input type="text" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-black transition-colors" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 작가 지정 비용" />
                </div>
                <div>
                    <label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">내용</label>
                    <textarea rows={8} className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors resize-none font-mono leading-relaxed" value={body} onChange={(e) => setBody(e.target.value)} placeholder="내용을 입력하세요." />
                </div>
                {isDirty && (
                    <button onClick={handleSave} disabled={saving}
                        className="flex items-center gap-2 bg-black text-white px-6 py-2 text-xs uppercase tracking-widest hover:bg-gray-800 transition-colors disabled:opacity-40">
                        {saving ? <Loader size={12} className="animate-spin" /> : <Check size={12} />}
                        {saving ? "저장 중..." : "변경 저장"}
                    </button>
                )}
                {saved && !isDirty && <p className="text-[10px] text-green-600 uppercase tracking-widest">저장 완료 ✓</p>}
            </div>
        </div>
    );
}

// ─── Guide & Policy Tab ───────────────────────────────────────────────────────

function GuidePolicyTab() {
    const [sections, setSections] = useState<PolicySection[]>([]);
    const [loading, setLoading] = useState(true);
    const [seeding, setSeeding] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [newTitle, setNewTitle] = useState("");
    const [newBody, setNewBody] = useState("");
    const [addSaving, setAddSaving] = useState(false);

    // 섹션 메인 타이틀
    const [mainTitle, setMainTitle] = useState("추가옵션 & 촬영안내");
    const [titleSaving, setTitleSaving] = useState(false);
    const [titleSaved, setTitleSaved] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        const [policyData, pageData] = await Promise.all([
            getProductPolicySections(),
            getPageContent("product")
        ]);
        setSections(policyData);

        let fetchedTitle = String(pageData.guidePolicyTitle || "");
        if (!fetchedTitle || fetchedTitle === "GUIDE & POLICY") {
            fetchedTitle = "추가옵션 & 촬영안내";
        }
        setMainTitle(fetchedTitle);
        setLoading(false);
    }, []);
    useEffect(() => { load(); }, [load]);

    const handleSeedDefaults = async () => {
        if (!confirm("기본 추가옵션 & 촬영안내 3개를 Firestore에 추가하시겠습니까?")) return;
        setSeeding(true);
        for (const p of DEFAULT_POLICIES) { await addProductPolicySection(p); }
        setSeeding(false); await load();
    };

    const handleAdd = async () => {
        if (!newTitle.trim() || !newBody.trim()) return;
        setAddSaving(true);
        const order = sections.length > 0 ? Math.max(...sections.map((s) => s.order)) + 1 : 0;
        await addProductPolicySection({ title: newTitle.trim(), body: newBody.trim(), order });
        setNewTitle(""); setNewBody(""); setShowNew(false); setAddSaving(false);
        await load();
    };

    const handleSave = async (id: string, data: Partial<PolicySection>) => { await updateProductPolicySection(id, data); await load(); };
    const handleDelete = async (id: string) => { if (!confirm("이 섹션을 삭제하시겠습니까?")) return; await deleteProductPolicySection(id); await load(); };
    const handleMove = async (index: number, dir: -1 | 1) => {
        const a = sections[index], b = sections[index + dir];
        if (!b) return;
        await Promise.all([updateProductPolicySection(a.id, { order: b.order }), updateProductPolicySection(b.id, { order: a.order })]);
        await load();
    };

    return (
        <div>
            <div className="flex items-center gap-3 mb-8">
                <button onClick={() => setShowNew((v) => !v)} className="flex items-center gap-2 text-xs bg-black text-white px-4 py-2 uppercase tracking-widest hover:bg-gray-800 transition-colors">
                    <Plus size={13} /> 새 섹션 추가
                </button>
                {sections.length === 0 && !loading && (
                    <button onClick={handleSeedDefaults} disabled={seeding} className="flex items-center gap-2 text-xs border border-gray-300 px-4 py-2 uppercase tracking-widest text-gray-600 hover:border-gray-500 transition-colors disabled:opacity-50">
                        {seeding ? <Loader size={13} className="animate-spin" /> : null} 기본 3단 불러오기
                    </button>
                )}
            </div>
            {loading ? (
                <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-gray-300 border-t-black rounded-full animate-spin" /></div>
            ) : (
                <div className="space-y-6">
                    {showNew && (
                        <div className="border border-dashed border-gray-300 rounded-xl p-6 bg-gray-50/50">
                            <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-5">새 섹션 추가</p>
                            <div className="space-y-5">
                                <div><label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">섹션 제목 (목록 이름)</label><input type="text" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-black transition-colors" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="예: 작가 지정 비용" /></div>
                                <div><label className="block text-[10px] uppercase tracking-widest text-gray-400 mb-2">내용</label><textarea rows={7} className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-black transition-colors resize-none font-mono leading-relaxed" value={newBody} onChange={(e) => setNewBody(e.target.value)} placeholder="내용을 입력하세요." /></div>
                            </div>
                            <div className="pt-5 mt-2 border-t border-gray-100">
                                <button onClick={handleAdd} disabled={addSaving || !newTitle.trim() || !newBody.trim()}
                                    className="flex items-center gap-2 bg-black text-white px-6 py-2 text-xs uppercase tracking-widest hover:bg-gray-800 transition-colors disabled:opacity-40">
                                    {addSaving ? <Loader size={12} className="animate-spin" /> : <Plus size={12} />} 추가
                                </button>
                            </div>
                        </div>
                    )}
                    {sections.map((section, index) => (
                        <PolicyRow key={section.id} section={section} index={index} total={sections.length} onMove={handleMove} onDelete={handleDelete} onSave={handleSave} />
                    ))}
                    {sections.length === 0 && <p className="text-sm text-gray-400 text-center py-14">섹션이 없습니다. 위 버튼으로 추가하거나 기본 데이터를 불러오세요.</p>}
                </div>
            )}
        </div>
    );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

const TABS = [
    { id: "products", label: "상품 목록" },
    { id: "policy", label: "추가옵션 & 촬영안내 (3단)" },
];

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ProductManager() {
    const [activeTab, setActiveTab] = useState("products");

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-xl font-light tracking-widest uppercase text-black">Product 관리</h1>
                <p className="text-sm text-gray-400 mt-1">상품 목록과 추가옵션 & 촬영안내를 관리합니다</p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-8 gap-0">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-6 py-3 text-xs uppercase tracking-widest transition-colors border-b-2 -mb-[1px] ${activeTab === tab.id ? "border-black text-black" : "border-transparent text-gray-400 hover:text-gray-600"}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === "products" && <ProductsTab />}
            {activeTab === "policy" && <GuidePolicyTab />}
        </div>
    );
}
