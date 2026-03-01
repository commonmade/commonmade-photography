import { MessageCircle } from "lucide-react";

interface KakaoChatButtonProps {
    channelId: string; // e.g. '_abcde'
}

export default function KakaoChatButton({ channelId }: KakaoChatButtonProps) {
    if (!channelId) return null;

    return (
        <a
            href={`http://pf.kakao.com/${channelId}/chat`}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-[#FEE500] hover:bg-[#F4DC00] text-[#000000] rounded-full shadow-lg transition-transform hover:scale-110 focus:outline-none"
            aria-label="카카오톡 상담하기"
        >
            <MessageCircle size={28} className="fill-current" />
        </a>
    );
}
