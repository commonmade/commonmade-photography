import { MessageCircle } from "lucide-react";

interface KakaoChatButtonProps {
    channelId: string; // e.g. '_abcde'
}

export default function KakaoChatButton({ channelId }: KakaoChatButtonProps) {
    if (!channelId) return null;

    // 만약 사용자가 "_nTFqX" 대신 "http://pf.kakao.com/_nTFqX" 를 통째로 넣었을 경우를 방어하는 코드
    const cleanId = channelId.includes('/') ? channelId.split('/').pop() : channelId;
    const chatUrl = `http://pf.kakao.com/${cleanId}/chat`;

    return (
        <a
            href={chatUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-6 right-6 z-[9999] flex items-center justify-center w-14 h-14 bg-[#FEE500] hover:bg-[#F4DC00] text-[#000000] rounded-full shadow-lg transition-transform hover:scale-110 focus:outline-none"
            aria-label="카카오톡 상담하기"
        >
            <MessageCircle size={28} className="fill-current" />
        </a>
    );
}
