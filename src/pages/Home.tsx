import { useState, useEffect } from "react";
import { getHomeContent, type HomeContent } from "../lib/firestoreService";

const DEFAULT_CONTENT: HomeContent = {
  quote: "",
  body: "",
  closing1: "",
  closing2: "",
  imageUrl: "",
};

export default function Home() {
  const [content, setContent] = useState<HomeContent>(DEFAULT_CONTENT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHomeContent()
      .then(setContent)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-32">
        <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  const hasContent = content.quote || content.body || content.imageUrl;

  if (!hasContent) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-32 text-center">
        <p className="text-gray-300 text-sm tracking-widest uppercase">아직 홈 내용이 없습니다</p>
        <p className="text-gray-400 text-xs mt-2">관리자 페이지에서 내용을 입력해주세요</p>
      </div>
    );
  }

  return (
    <div className="w-full animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row gap-12 md:gap-16 lg:gap-24 items-center">
        {/* Left: Text Content */}
        <div className="flex-1 flex flex-col items-center text-center py-4 md:py-8">
          {content.quote && (
            <h2 className="text-lg md:text-xl lg:text-2xl font-light text-gray-800 mb-6 md:mb-8 leading-relaxed tracking-tight">
              "{content.quote}"
            </h2>
          )}

          {content.body && (
            <div className="space-y-2 mb-8">
              {content.body.split("\n").map((line, i) =>
                line.trim() ? (
                  <p
                    key={i}
                    className="text-[13px] md:text-sm text-gray-600 leading-relaxed tracking-wide"
                    dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }}
                  />
                ) : (
                  <div key={i} className="h-1.5" />
                )
              )}
            </div>
          )}

          {(content.closing1 || content.closing2) && (
            <div className="mt-6 pt-6 border-t border-gray-100 w-full max-w-sm">
              {content.closing1 && (
                <p className="text-sm md:text-base text-gray-700 leading-relaxed tracking-tight">
                  {content.closing1}
                </p>
              )}
              {content.closing2 && (
                <p className="text-sm md:text-lg font-medium text-gray-900 mt-2 leading-relaxed tracking-tight">
                  {content.closing2}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Right: Image */}
        {content.imageUrl && (
          <div className="w-full md:w-[45%] lg:w-[42%] flex-shrink-0">
            <img
              src={content.imageUrl}
              alt="Home visual"
              className="w-full h-auto object-cover"
              style={{ maxHeight: "75vh" }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
