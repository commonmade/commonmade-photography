import { useState, useEffect } from "react";
import { getProducts, getProductPolicySections, getPageContent, type ProductItem, type PolicySection } from "../lib/firestoreService";

export default function Product() {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [policies, setPolicies] = useState<PolicySection[]>([]);
  const [guidePolicyTitle, setGuidePolicyTitle] = useState("추가옵션 & 촬영안내");
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
        <p className="mt-8 text-sm text-gray-500 uppercase tracking-widest max-w-2xl mx-auto leading-relaxed">
          상품구성
        </p>
      </div>

      {products.length === 0 ? (
        <p className="text-center text-sm text-gray-400 py-20">
          상품 정보가 없습니다. 관리자에서 상품을 추가해주세요.
        </p>
      ) : (
        <div className="space-y-16 md:space-y-20">
          {products.map((product) => (
            <div
              key={product.id}
              className="border-t border-gray-100 pt-12 grid grid-cols-1 md:grid-cols-2 gap-0 md:divide-x md:divide-gray-200"
            >
              {/* Left — 부제목 + 제목 + 가격 */}
              <div className="md:pr-12 mb-8 md:mb-0">
                {product.subtitle && (
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-2">
                    {product.subtitle}
                  </p>
                )}
                <h3 className="logo-font text-sm md:text-base tracking-widest uppercase font-light text-black mb-6">
                  {product.name}
                </h3>
                {product.price && (
                  <span className="inline-block text-xs font-medium uppercase tracking-[0.12em] text-black border-b border-gray-300 pb-1.5">
                    {product.price}
                  </span>
                )}
              </div>

              {/* Right — 상세 내용 */}
              <div className="md:pl-12">
                <p className="text-sm text-gray-500 leading-loose whitespace-pre-line">
                  {product.description}
                </p>
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
