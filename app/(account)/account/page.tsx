import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isAdmin } from "@/lib/auth";

export const metadata = { title: "حسابي" };

export default async function AccountDashboardPage() {
  const admin = await isAdmin();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">لوحة التحكم</h1>
      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">طلباتي</CardTitle></CardHeader>
          <CardContent>
            <Link href="/account/orders" className="text-sm text-graphite hover:text-carbon-ink">
              عرض الطلبات ←
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">الملف الشخصي</CardTitle></CardHeader>
          <CardContent>
            <Link href="/account/profile" className="text-sm text-graphite hover:text-carbon-ink">
              تعديل البيانات ←
            </Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">العناوين</CardTitle></CardHeader>
          <CardContent>
            <Link href="/account/addresses" className="text-sm text-graphite hover:text-carbon-ink">
              إدارة العناوين ←
            </Link>
          </CardContent>
        </Card>
        {admin ? (
          <Card>
            <CardHeader><CardTitle className="text-base">الإدارة</CardTitle></CardHeader>
            <CardContent>
              <Link href="/admin" className="text-sm text-graphite hover:text-carbon-ink">
                لوحة الإدارة ←
              </Link>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
