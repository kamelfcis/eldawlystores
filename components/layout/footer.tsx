import Link from "next/link";
import { getStoreWhatsapp } from "@/lib/store-settings";

export async function Footer() {
  const whatsapp = await getStoreWhatsapp();
  const whatsappHref = whatsapp ? `https://wa.me/20${whatsapp.slice(1)}` : null;

  return (
    <footer className="border-t border-mist bg-paper-white mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-sm">
          <div>
            <h3 className="font-semibold mb-3">Doly Stores</h3>
            <p className="text-graphite">متجرك الإلكتروني للإلكترونيات في مصر</p>
          </div>
          <div>
            <h3 className="font-semibold mb-3">روابط</h3>
            <ul className="space-y-2 text-graphite">
              <li><Link href="/categories/smartphones" className="hover:text-carbon-ink">هواتف ذكية</Link></li>
              <li><Link href="/categories/laptops" className="hover:text-carbon-ink">لابتوب</Link></li>
              <li><Link href="/products" className="hover:text-carbon-ink">كل المنتجات</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-3">تواصل</h3>
            <p className="text-graphite">الدفع عند الاستلام متاح</p>
            {whatsappHref ? (
              <a href={whatsappHref} className="mt-2 inline-block text-carbon-ink">
                واتساب
              </a>
            ) : null}
          </div>
        </div>
        <div className="border-t border-mist mt-8 pt-4 text-xs text-graphite text-center">
          © {new Date().getFullYear()} Doly Stores. جميع الحقوق محفوظة.
        </div>
      </div>
    </footer>
  );
}
