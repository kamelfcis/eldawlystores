import Link from "next/link";
import { getCategories } from "@/lib/catalog";
import { getStoreWhatsapp } from "@/lib/store-settings";

export async function Footer() {
  const [categories, whatsapp] = await Promise.all([getCategories(), getStoreWhatsapp()]);
  const whatsappHref = whatsapp ? `https://wa.me/20${whatsapp.slice(1)}` : null;

  return (
    <footer className="mt-auto border-t border-mist bg-paper-white">
      <div className="mx-auto w-full max-w-[1440px] px-4 py-8">
        <div className="grid grid-cols-1 gap-8 text-sm sm:grid-cols-3">
          <div>
            <h3 className="mb-3 font-semibold text-retail-ink">Doly Stores</h3>
            <p className="text-graphite">متجرك الإلكتروني للإلكترونيات في مصر</p>
            <p className="mt-2 text-graphite">الدفع عند الاستلام متاح لجميع المحافظات.</p>
          </div>
          <div>
            <h3 className="mb-3 font-semibold text-retail-ink">الأقسام</h3>
            <ul className="space-y-2 text-graphite">
              {categories.length > 0 ? (
                categories.slice(0, 8).map((category) => (
                  <li key={category.id}>
                    <Link href={`/categories/${category.slug}`} className="hover:text-carbon-ink">
                      {category.name_ar}
                    </Link>
                  </li>
                ))
              ) : (
                <li>
                  <Link href="/products" className="hover:text-carbon-ink">
                    كل المنتجات
                  </Link>
                </li>
              )}
              <li>
                <Link href="/products" className="hover:text-carbon-ink">
                  كل المنتجات
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 font-semibold text-retail-ink">المساعدة</h3>
            <ul className="space-y-2 text-graphite">
              <li>الشحن: تُحسب تكلفة الشحن حسب المحافظة عند إتمام الطلب.</li>
              <li>الإرجاع: تواصل معنا خلال 14 يوماً من الاستلام للمنتجات المؤهلة.</li>
            </ul>
            {whatsappHref ? (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-[4px] border border-retail-line px-3 py-2 text-[14px] font-bold text-carbon-ink hover:bg-fog"
              >
                تواصل عبر واتساب
              </a>
            ) : null}
          </div>
        </div>
        <div className="mt-8 border-t border-mist pt-4 text-center text-xs text-graphite">
          © {new Date().getFullYear()} Doly Stores. جميع الحقوق محفوظة.
        </div>
      </div>
    </footer>
  );
}
