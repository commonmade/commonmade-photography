import { useState, useEffect } from "react";
import { getProducts, getProductPolicySections, getPageContent, type ProductItem, type PolicySection } from "../lib/firestoreService";

export default function Product() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [policies, setPolicies] = useState<PolicySection[]>([]);
  const [guidePolicyTitle, setGuidePolicyTitle] = useState("추가옵션 & 촬영안내");
  const [introText, setIntroText] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getProducts(), getProductPolicySections(), getPageContent("product")])
      .then(([productData, policyData, pageData]) => {
        setProducts(productData);
        setPolicies(policyData);

        let fetchedTitle = String(pageData.guidePolicyTitle || "");
        if (!fetchedTitle || fetchedTitle === "GUIDE & POLICY") {
          fetchedTitle = "추가옵션 & 촬영안내";
        }
        setGuidePolicyTitle(fetchedTitle);
        setIntroText(String(pageData.introText || ""));
      })
      .catch(() => { })
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
    <div className="w-full max-w-5xl mx-auto animate-in fade-in duration-1000 pb-24">
      <div className="text-center mb-8 md:mb-12">
        <h2 className="logo-font text-sm md:text-lg tracking-widest uppercase font-light text-black">
          PRODUCT
        </h2>
        <div className="w-12 h-[1px] bg-gray-300 mx-auto mt-8"></div>
      </div>

      {introText && (
        <div className="max-w-6xl mx-auto px-4 md:px-0 w-full mb-16 md:mb-20 text-left">
          <div className="md:w-2/3 lg:w-1/2">
            <p className="text-[13px] md:text-[14px] text-gray-800 leading-[2.6] whitespace-pre-line tracking-wide font-serif break-keep">
              {introText}
            </p>
          </div>
        </div>
      )}

      {products.length === 0 ? (
        <p className="text-center text-sm text-gray-400 py-20">
          상품 정보가 없습니다. 관리자에서 상품을 추가해주세요.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 lg:gap-x-12 gap-y-16 max-w-6xl mx-auto px-4 md:px-0 w-full mt-12 md:mt-24">
          {products.map((product) => (
            <div key={product.id} className="flex flex-col text-left">
              <div className="flex items-baseline gap-1.5 mb-4">
                <h3 className="text-[15px] font-serif text-gray-800 tracking-wider">
                  {product.name}
                </h3>
                {product.price && (
                  <span className="text-[15px] font-serif text-gray-800 tracking-wider">
                    ({product.price})
                  </span>
                )}
              </div>

              <div className="w-full h-[1px] bg-gray-300 mb-8" />

              <div className="text-[13px] text-gray-600 leading-[2.4] whitespace-pre-line break-keep font-light">
                {product.description}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Guide & Policy — loaded from Firestore */}
      {policies.length > 0 && (
        <div className="mt-32 border-t border-gray-200 pt-16 px-4">
          <h3 className="logo-font text-sm md:text-lg tracking-widest uppercase font-light text-black mb-12 text-center">
            {guidePolicyTitle}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-6xl mx-auto">
            {policies.map((section) => (
              <div key={section.id}>
                <h4 className="text-sm font-medium tracking-widest uppercase text-black mb-4">
                  {section.title}
                </h4>
                <div className="text-xs text-gray-500 leading-loose whitespace-pre-line">
                  {section.body}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
