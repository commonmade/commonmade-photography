import { MessageCircle } from "lucide-react";

interface KakaoChatButtonProps {
    chatUrl: string;
}

export default function KakaoChatButton({ chatUrl }: KakaoChatButtonProps) {
    if (!chatUrl) return null;

    // 만약 예전 방식(_nTFqX 처럼 아이디만)으로 저장되어 있다면 변환
    const isChannelId = !chatUrl.startsWith('http') && !chatUrl.includes('/');
    const finalUrl = isChannelId ? `https://pf.kakao.com/${chatUrl}/chat` : chatUrl;

    return (
        <a
            href={chatUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-6 right-6 z-[9999] flex items-center justify-center w-14 h-14 bg-[#FEE500] hover:bg-[#F4DC00] text-[#000000] rounded-full shadow-lg transition-transform hover:scale-110 focus:outline-none"
            aria-label="카카오톡 상담하기"
        >
            <MessageCircle size={28} className="fill-current pointer-events-none" />
        </a>
    );
}
