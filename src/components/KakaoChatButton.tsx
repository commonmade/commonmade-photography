import { MessageCircle } from "lucide-react";

interface KakaoChatButtonProps {
    channelId: string; // e.g. '_abcde'
}

export default function KakaoChatButton({ channelId }: KakaoChatButtonProps) {
    const handleClick = () => {
        // @ts-ignore
        if (window.Kakao && window.Kakao.Channel) {
            // @ts-ignore
            window.Kakao.Channel.chat({
                channelPublicId: channelId,
            });
        } else {
            // Fallback if SDK fails to load or is blocked
            window.open(`http://pf.kakao.com/${channelId}/chat`, '_blank');
        }
    };

    if (!channelId) return null;

    return (
        <button
            onClick={handleClick}
            className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-[#FEE500] hover:bg-[#F4DC00] text-[#000000] rounded-full shadow-lg transition-transform hover:scale-110 focus:outline-none"
            aria-label="카카오톡 상담하기"
        >
            <MessageCircle size={28} className="fill-current" />
        </button>
    );
}
