import { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { getFaqs, getPolicySections, getPageContent, getSiteConfig, type FaqItem, type PolicySection } from "../lib/firestoreService";

const DEFAULT_FAQS: FaqItem[] = [
  {
    id: "1",
    order: 0,
    question: "HOW DO I BOOK A SESSION?",
    answer:
      "You can book a session by filling out the form on our Reserve page. We will get back to you within 24-48 hours to confirm availability and discuss details.",
  },
  {
    id: "2",
    order: 1,
    question: "WHAT IS YOUR PHOTOGRAPHY STYLE?",
    answer:
      "Our style is natural, candid, and timeless. We focus on capturing genuine emotions and moments rather than stiffly posed shots. We prefer natural light and clean, true-to-life editing.",
  },
  {
    id: "3",
    order: 2,
    question: "HOW MANY PHOTOS WILL I RECEIVE?",
    answer:
      "For a standard 1-hour session, you can expect to receive between 50–80 fully edited, high-resolution images. For weddings, it typically ranges from 500–800 images depending on the coverage hours.",
  },
  {
    id: "4",
    order: 3,
    question: "WHEN WILL I GET MY PHOTOS?",
    answer:
      "Portrait sessions are typically delivered within 2–3 weeks. Wedding galleries take about 6–8 weeks. We always try to send a few sneak peeks within 48 hours of the event!",
  },
  {
    id: "5",
    order: 4,
    question: "DO YOU TRAVEL FOR WEDDINGS?",
    answer:
      "Yes, we love to travel! We are based locally but are available for destination weddings worldwide. Travel fees apply for locations outside our local radius.",
  },
  {
    id: "6",
    order: 5,
    question: "CAN WE GET THE RAW UNEDITED FILES?",
    answer:
      "We do not provide RAW files. Editing is a crucial part of our artistic process and the final product. We ensure you receive all the best images fully edited to our standard.",
  },
];

const DEFAULT_POLICIES: PolicySection[] = [
  {
    id: "p1",
    order: 0,
    title: "작가 지정 비용",
    body: "각 상품별 작가 지정 가능하며 지정비는 작가의 직급별로 상이합니다.\n\nStyle B,D,S 상품은 대표작가 지정 불가합니다.\n\n**대표작가 기준**\nStyle A (원데이스냅) 150만원\nStyle F,W / Family A,B,C 110만원\n\n이사 33만원\n수석실장 22만원\n실장 11만원",
  },
  {
    id: "p2",
    order: 1,
    title: "성수기 안내",
    body: "**Family A,B type의 경우** 웨딩촬영이 많은 3–6월, 9–11월에 성수기 요금이 적용되며 12–2월, 7–8월에는 비수기 요금이 적용됩니다.",
  },
  {
    id: "p3",
    order: 2,
    title: "위약금 안내",
    body: "**계약금은 계약서 발송 후 3일 이내 입금을 원칙으로 합니다.** 계약금 입금 후 72시간(3일) 이내에 환불을 요청할 수 있으며, 이후부터는 환불이 불가능합니다.\n\n촬영 예정일 기준으로 촬영 취소/변경시 위약금이 기간에 따라 발생합니다.\n\n- 90일전까지 총금액의 30%\n- 60일전까지 총금액의 50%\n- 30일전–당일 총금액의 100%\n\n(위 위약금 발생기준 일자에 해당되지 않는경우 총금액의 10% 위약금 발생)",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [policies, setPolicies] = useState<PolicySection[]>([]);
  const [faqTitle, setFaqTitle] = useState("F&Q — GUIDE");
  const [faqSubtitle, setFaqSubtitle] = useState("Frequently asked questions & photographic guide");
  const [kakaoUrl, setKakaoUrl] = useState("#");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getFaqs(), getPolicySections(), getPageContent("faq"), getSiteConfig()])
      .then(([faqData, policyData, pageData, config]) => {
        setFaqs(faqData.length > 0 ? faqData : DEFAULT_FAQS);
        setPolicies(policyData.length > 0 ? policyData : DEFAULT_POLICIES);
        if (pageData.faq_title) setFaqTitle(String(pageData.faq_title));
        if (pageData.faq_subtitle) setFaqSubtitle(String(pageData.faq_subtitle));
        if (config.kakao && config.kakao !== "#") setKakaoUrl(config.kakao);
      })
      .catch(() => {
        setFaqs(DEFAULT_FAQS);
        setPolicies(DEFAULT_POLICIES);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-40">
        <div className="w-7 h-7 border-2 border-gray-300 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto animate-in fade-in duration-1000">

      {/* ── Page Header ── */}
      <div className="mb-14 md:mb-20">
        <div className="text-center mb-8">
          <h2 className="logo-font text-sm md:text-lg tracking-widest uppercase font-light text-black">
            {faqTitle}
          </h2>
          <div className="w-12 h-[1px] bg-gray-300 mx-auto mt-8" />
          <p className="mt-8 text-xs text-gray-400 uppercase tracking-widest leading-loose">
            {faqSubtitle}
          </p>
        </div>

        {/* Kakao Channel Banner */}
        <div className="flex justify-center mt-12 mb-4">
          <a
            href="https://open.kakao.com/o/sF6Jm5ji"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:scale-105 transition-transform duration-300 active:scale-95"
          >
            <img
              src="/kakao-banner.png"
              alt="카카오톡 상담연결"
              className="w-full max-w-[170px] h-auto rounded-xl shadow-sm"
            />
          </a>
        </div>
      </div>

      {/* ── FAQ Accordion ── */}
      <div className="mb-14 md:mb-18">
        {faqs.map((faq, index) => (
          <div key={faq.id} className="border-b border-gray-200">
            <button
              className="w-full flex justify-between items-center py-6 md:py-7 text-left focus:outline-none group"
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
            >
              <span className="text-base md:text-lg font-medium uppercase tracking-wider text-gray-800 group-hover:text-black transition-colors">
                {faq.question}
              </span>
              <span
                className={`ml-6 text-gray-300 group-hover:text-black transition-all duration-300 ${openIndex === index ? "rotate-180" : "rotate-0"}`}
              >
                <ChevronDown size={22} />
              </span>
            </button>

            <div
              className={`overflow-hidden transition-all duration-400 ease-in-out ${openIndex === index
                ? "max-h-[2000px] opacity-100 pb-7"
                : "max-h-0 opacity-0"
                }`}
            >
              <p className="text-sm md:text-base text-gray-500 leading-relaxed pr-10 whitespace-pre-line">
                {faq.answer}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Guide & Policy (3-column) ── */}
      {policies.length > 0 && (
        <div className="border-t border-gray-200 pt-10 md:pt-14">
          <div className="text-center mb-16">
            Benefit &amp; Event
            <div className="w-8 h-[1px] bg-gray-300 mx-auto mt-6" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
            {policies.map((section) => (
              <div key={section.id}>
                <h4 className="text-sm md:text-base font-semibold tracking-wide text-gray-900 mb-5">
                  {section.title}
                </h4>
                <div className="text-xs md:text-sm text-gray-500 leading-relaxed space-y-1">
                  {section.body.split("\n").map((line, i) => {
                    if (line.trim() === "") return <br key={i} />;
                    // Handle **bold**
                    const parts = line.split(/(\*\*[^*]+\*\*)/g);
                    return (
                      <p key={i}>
                        {parts.map((part, j) =>
                          part.startsWith("**") && part.endsWith("**") ? (
                            <strong key={j}>{part.slice(2, -2)}</strong>
                          ) : (
                            <span key={j}>{part}</span>
                          )
                        )}
                      </p>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
