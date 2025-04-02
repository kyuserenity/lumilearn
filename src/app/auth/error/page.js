import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AuthError() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="mx-auto max-w-md text-center">
        <h1 className="text-3xl font-bold">เกิดข้อผิดพลาด</h1>
        <p className="mt-2 text-gray-600">
          เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง
        </p>
        <Button asChild className="mt-4">
          <Link href="/">กลับไปหน้าแรก</Link>
        </Button>
      </div>
    </div>
  );
}
