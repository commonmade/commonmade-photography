import { useState, useEffect } from "react";
import { getInquiries, markInquiryRead, deleteInquiry, type Inquiry } from "../../lib/firestoreService";
import { Loader, Trash2, MailOpen, Mail } from "lucide-react";

export default function InquiryManager() {
    const [inquiries, setInquiries] = useState<Inquiry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadInquiries();
    }, []);

    const loadInquiries = async () => {
        setLoading(true);
        try {
            const data = await getInquiries();
            setInquiries(data);
        } catch (error) {
            console.error("Failed to load inquiries", error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkRead = async (id: string) => {
        await markInquiryRead(id);
        setInquiries(prev => prev.map(inq => inq.id === id ? { ...inq, read: true } : inq));
    };

    const handleDelete = async (id: string) => {
        if (!confirm("이 문의 내역을 삭제하시겠습니까?")) return;
        await deleteInquiry(id);
        setInquiries(prev => prev.filter(inq => inq.id !== id));
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="w-6 h-6 border-2 border-gray-300 border-t-black rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-8 flex justify-between items-end">
                <div>
                    <h1 className="text-xl font-light tracking-widest uppercase text-black">
                        문의 내역 (Inquiries)
                    </h1>
                    <p className="text-sm text-gray-400 mt-1">
                        웹사이트를 통해 접수된 고객의 문의 목록입니다.
                    </p>
                </div>
                <div className="text-xs text-gray-400">
                    전체 문의 수: {inquiries.length}건
                </div>
            </div>

            <div className="space-y-4 max-w-5xl">
                {inquiries.length === 0 ? (
                    <div className="text-center py-20 bg-white border border-gray-200 rounded-xl text-gray-500 text-sm">
                        접수된 문의 내역이 없습니다.
                    </div>
                ) : (
                    inquiries.map((inq) => (
                        <div key={inq.id} className={`bg-white border rounded-xl p-6 transition-colors ${inq.read ? 'border-gray-200 opacity-80' : 'border-black shadow-sm'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${inq.read ? 'bg-gray-100 text-gray-400' : 'bg-black text-white'}`}>
                                        {inq.read ? <MailOpen size={16} /> : <Mail size={16} />}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <h3 className="font-semibold text-gray-900">{inq.name}</h3>
                                            {!inq.read && <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full font-medium">NEW</span>}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">{new Date(inq.createdAt).toLocaleString()}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {!inq.read && (
                                        <button onClick={() => handleMarkRead(inq.id)} className="text-xs text-gray-500 hover:text-black border border-gray-200 px-3 py-1.5 rounded-md transition-colors">
                                            읽음 처리
                                        </button>
                                    )}
                                    <button onClick={() => handleDelete(inq.id)} className="text-gray-400 hover:text-red-500 p-1.5 transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6 bg-gray-50 p-4 rounded-lg text-sm">
                                <div>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">연락처</p>
                                    <p className="font-medium text-gray-800">{inq.phone}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">이메일</p>
                                    <p className="font-medium text-gray-800">{inq.email}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">행사 날짜</p>
                                    <p className="font-medium text-gray-800">{inq.date || "-"}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">장소 / 범주</p>
                                    <p className="font-medium text-gray-800">{inq.location || "-"} / {inq.category || "-"}</p>
                                </div>
                            </div>

                            <div>
                                <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-2">메시지 본문</p>
                                <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed border-l-2 border-gray-200 pl-4 py-1">
                                    {inq.message || "(내용 없음)"}
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
