import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    // สร้าง Supabase client จาก cookies
    const cookieStore = cookies();
    const supabase = await createClient(cookieStore);

    // รับข้อมูลจาก formData
    const formData = await req.formData();
    const file = formData.get("pdfUpload");
    const year = formData.get("year");
    const subject = formData.get("subject");

    // ตรวจสอบผู้ใช้งาน
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("Authentication error:", userError);
      return NextResponse.json(
        { error: "ไม่ได้รับอนุญาต กรุณาเข้าสู่ระบบ" },
        { status: 401 },
      );
    }

    // ตรวจสอบไฟล์
    if (!file || file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "กรุณาอัพโหลดไฟล์ PDF เท่านั้น" },
        { status: 400 },
      );
    }

    // สร้างชื่อไฟล์ที่ไม่ซ้ำกัน
    const userId = user.id;
    const timestamp = new Date().getTime();
    const sanitizedFileName = file.name
      .replace(/[^a-zA-Z0-9._-]/g, "_") // Replace special characters with underscores
      .replace(/_{2,}/g, "_") // Replace multiple underscores with a single underscore
      .replace(/^_|_$/g, ""); // Remove leading or trailing underscores
    const fileName = `${timestamp}_${sanitizedFileName}`;

    // ใช้ path ที่ถูกต้องสำหรับ Supabase Storage
    const filePath = `${userId}/${fileName}`;

    try {
      // อัปโหลดไฟล์ไปยัง Supabase Storage
      const { data: fileData, error: fileError } = await supabase.storage
        .from("pdfs") // ชื่อ bucket ใน Supabase
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (fileError) {
        console.error("File upload error:", fileError);
        return NextResponse.json(
          {
            error: "เกิดข้อผิดพลาดในการอัพโหลดไฟล์",
            details: fileError.message,
          },
          { status: 500 },
        );
      }

      // สร้าง URL สำหรับเข้าถึงไฟล์
      const { data: urlData } = supabase.storage
        .from("pdfs")
        .getPublicUrl(filePath);

      const fileUrl = urlData?.publicUrl || "";

      // บันทึกข้อมูลลงในฐานข้อมูล
      const yearNumber = parseInt(year.replace("Year ", ""));
      const { error: dbError } = await supabase.from("pdf_files").insert({
        year: yearNumber,
        subject: subject,
        file_path: filePath,
        file_size: file.size,
        user_id: userId,
        title: file.name, // Add original file name to the title column
      });

      if (dbError) {
        console.error("Database error:", dbError);
        // ถ้าบันทึกข้อมูลในฐานข้อมูลล้มเหลว ลบไฟล์ออกจาก storage
        await supabase.storage.from("pdfs").remove([filePath]);

        return NextResponse.json(
          {
            error: "เกิดข้อผิดพลาดในการบันทึกข้อมูล",
            details: dbError.message,
          },
          { status: 500 },
        );
      }

      // ส่งผลลัพธ์กลับ
      return NextResponse.json(
        {
          success: true,
          message: "อัพโหลดไฟล์สำเร็จ",
          file: {
            path: filePath,
            url: fileUrl,
            name: fileName,
          },
        },
        { status: 200 },
      );
    } catch (uploadError) {
      console.error("Upload process error:", uploadError);
      return NextResponse.json(
        {
          error: "เกิดข้อผิดพลาดในกระบวนการอัพโหลด",
          details: uploadError.message,
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดที่ไม่คาดคิด", details: error.message },
      { status: 500 },
    );
  }
}
