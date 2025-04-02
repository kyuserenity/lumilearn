"use client";

import { Suspense, useState, useCallback, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Card, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { FileText, Download } from "lucide-react";
import { toast } from "sonner";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import useEmblaCarousel from "embla-carousel-react";

function PdfCard({
  filePath,
  fileSize,
  year,
  subject,
  title,
  downloadCount,
  fileId,
  createdAt,
  onDownload,
  supabase,
  user,
}) {
  const [isDownloading, setIsDownloading] = useState(false);

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    else if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    else return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDownload = async () => {
    if (!user) {
      toast.error("กรุณาเข้าสู่ระบบก่อนดาวน์โหลดไฟล์");
      return;
    }

    try {
      setIsDownloading(true);
      const { data, error } = await supabase.storage
        .from("pdfs")
        .download(filePath);

      if (error) {
        console.error("Error downloading file:", error);
        toast.error("เกิดข้อผิดพลาดในการดาวน์โหลดไฟล์");
        return;
      }

      const fileName = filePath.split("/").pop();

      // สร้าง URL สำหรับดาวน์โหลดไฟล์
      const blobUrl = URL.createObjectURL(data);

      // สร้าง element เพื่อดาวน์โหลดไฟล์
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();

      // ทำความสะอาดหลังการดาวน์โหลด
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);

      onDownload(fileId);

      toast.success(`ดาวน์โหลดไฟล์ ${fileName} สำเร็จ`);
    } catch (err) {
      console.error("Error during download:", err);
      toast.error("เกิดข้อผิดพลาดในการดาวน์โหลดไฟล์");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Card className="flex w-full cursor-pointer flex-col justify-between transition-transform duration-200 hover:scale-95 focus-visible:scale-95">
          <CardHeader className="pb-2">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">
                  {title} #ปี{year}
                </CardTitle>
              </div>
              <p className="text-muted-foreground text-sm">{subject}</p>
            </div>
          </CardHeader>
          <CardFooter className="text-muted-foreground pt-0 text-xs">
            <div className="flex w-full justify-between">
              <span>{formatFileSize(fileSize)}</span>
              <span>ดาวน์โหลด {downloadCount} ครั้ง</span>
            </div>
          </CardFooter>
        </Card>
      </DrawerTrigger>

      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>
              {title} #ปี{year}
            </DrawerTitle>
          </DrawerHeader>
          <div className="space-y-2 p-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-muted rounded-md p-2">
                <p className="text-xs font-medium">ขนาดไฟล์</p>
                <p>{formatFileSize(fileSize)}</p>
              </div>
              <div className="bg-muted rounded-md p-2">
                <p className="text-xs font-medium">ปี</p>
                <p>{year}</p>
              </div>
            </div>
            <div className="bg-muted rounded-md p-2">
              <p className="text-xs font-medium">จำนวนการดาวน์โหลด</p>
              <p>{downloadCount} ครั้ง</p>
            </div>
            <div className="bg-muted rounded-md p-2">
              <p className="text-xs font-medium">เพิ่มเมื่อ</p>
              <p>
                {new Date(createdAt).toLocaleString(undefined, {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                })}
              </p>
            </div>
          </div>
          <DrawerFooter>
            <Button
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex gap-2"
            >
              <Download className="h-4 w-4" />
              {isDownloading ? "กำลังดาวน์โหลด..." : "ดาวน์โหลด"}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline">ปิด</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

// คอมโพเนนต์ส่วนเนื้อหาหลัก
function PageContent() {
  const [pdfFiles, setPdfFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const supabase = createClient();
  const searchParams = useSearchParams();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };

    fetchUser();
  }, [supabase]);

  // ดึงข้อมูล PDF files
  useEffect(() => {
    const fetchPdfFiles = async () => {
      try {
        const { data, error } = await supabase.from("pdf_files").select("*");

        if (error) {
          setError(error.message);
          toast.error("เกิดข้อผิดพลาดในการดึงข้อมูลไฟล์");
        } else {
          // เรียงไฟล์ตามจำนวนการดาวน์โหลดจากมากไปน้อย
          const sortedData = (data || []).sort(
            (a, b) => (b.download_count || 0) - (a.download_count || 0),
          );
          setPdfFiles(sortedData);
        }
      } catch (err) {
        setError(err.message);
        toast.error("เกิดข้อผิดพลาดในการดึงข้อมูลไฟล์");
      } finally {
        setLoading(false);
      }
    };

    fetchPdfFiles();
  }, [supabase]);

  const incrementDownloadCount = async (fileId) => {
    try {
      // ดึงข้อมูลปัจจุบัน
      const { data, error } = await supabase
        .from("pdf_files")
        .select("*")
        .eq("id", fileId)
        .single();

      if (error) {
        console.error("Error fetching download count:", error);
        return;
      }

      // คำนวณค่าใหม่
      const newDownloadCount = (data.download_count || 0) + 1;

      // อัปเดตข้อมูล
      const { error: updateError } = await supabase
        .from("pdf_files")
        .update({ download_count: newDownloadCount })
        .eq("id", fileId);

      if (updateError) {
        console.error("Error updating download count:", updateError);
        return;
      }

      // อัปเดต state ท้องถิ่น
      setPdfFiles((prevFiles) =>
        prevFiles.map((file) =>
          file.id === fileId
            ? { ...file, download_count: newDownloadCount }
            : file,
        ),
      );
    } catch (err) {
      console.error("Error updating download count:", err);
    }
  };

  const shuffleArray = (array) => {
    return array.sort(() => Math.random() - 0.5);
  };

  const searchQuery = searchParams.get("s") || "";
  const filteredFiles = pdfFiles.filter(
    (file) =>
      file.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="flex flex-col items-center text-center">
          <div className="border-primary mb-2 h-6 w-6 animate-spin rounded-full border-4 border-t-transparent"></div>
          <p>กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 text-destructive mt-10 rounded-md p-4 text-center">
        <p>เกิดข้อผิดพลาด: {error}</p>
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
          className="mt-2"
        >
          ลองใหม่อีกครั้ง
        </Button>
      </div>
    );
  }

  if (searchQuery) {
    return (
      <div className="container mx-auto mt-6">
        <h2 className="mb-4 text-xl font-semibold">
          ผลการค้นหา: "{searchQuery}"
        </h2>
        {filteredFiles.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredFiles.map((file) => (
              <PdfCard
                key={file.id}
                filePath={file.file_path}
                fileSize={file.file_size}
                year={file.year}
                subject={file.subject}
                title={file.title}
                downloadCount={file.download_count || 0}
                fileId={file.id}
                createdAt={file.created_at}
                onDownload={incrementDownloadCount}
                supabase={supabase}
                user={user}
              />
            ))}
          </div>
        ) : (
          <div className="mt-10 text-center">
            <p>ไม่พบผลลัพธ์ที่ตรงกับ "{searchQuery}"</p>
          </div>
        )}
      </div>
    );
  }

  const popularFiles = pdfFiles.slice(0, 4); // Top 5 most downloaded files
  const allFiles = shuffleArray(pdfFiles.slice(5)); // Remaining files shuffled

  return (
    <div className="container mx-auto mt-6">
      {popularFiles.length > 0 && (
        <div className="mb-6">
          <h2 className="mb-4 text-xl font-semibold">ไฟล์ยอดนิยม</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {popularFiles.map((file) => (
              <PdfCard
                key={file.id}
                filePath={file.file_path}
                fileSize={file.file_size}
                year={file.year}
                subject={file.subject}
                title={file.title}
                downloadCount={file.download_count || 0}
                fileId={file.id}
                createdAt={file.created_at}
                onDownload={incrementDownloadCount}
                supabase={supabase}
                user={user}
              />
            ))}
          </div>
        </div>
      )}
      <h2 className="mb-4 text-xl font-semibold">ไฟล์ทั้งหมด</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {allFiles.map((file) => (
          <PdfCard
            key={file.id}
            filePath={file.file_path}
            fileSize={file.file_size}
            year={file.year}
            subject={file.subject}
            title={file.title}
            downloadCount={file.download_count || 0}
            fileId={file.id}
            createdAt={file.created_at}
            onDownload={incrementDownloadCount}
            supabase={supabase}
            user={user}
          />
        ))}
      </div>
      {pdfFiles.length === 0 && (
        <div className="mt-10 text-center">
          <p>ไม่พบข้อมูลไฟล์ PDF</p>
        </div>
      )}
    </div>
  );
}

// คอมโพเนนต์ Carousel
function Carousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState([]);
  const [banners, setBanners] = useState([]);

  useEffect(() => {
    // Fetch banner data from banner.json
    const fetchBanners = async () => {
      try {
        const response = await fetch("/banner.json");
        const data = await response.json();
        setBanners(data);
      } catch (error) {
        console.error("Error fetching banners:", error);
      }
    };

    fetchBanners();
  }, []);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    setScrollSnaps(emblaApi.scrollSnapList());
    emblaApi.on("select", onSelect);

    // Auto-scroll functionality
    const autoScroll = setInterval(() => {
      emblaApi && emblaApi.scrollNext();
    }, 5000);

    return () => {
      emblaApi.off("select", onSelect);
      clearInterval(autoScroll);
    };
  }, [emblaApi, onSelect]);

  return (
    <div className="relative mb-8">
      <div className="overflow-hidden rounded-md" ref={emblaRef}>
        <div className="flex rounded-md">
          {banners.map((banner) => (
            <div key={banner.id} className="flex-[0_0_100%]">
              <Image
                className="aspect-video cursor-pointer object-cover"
                src={banner.image}
                alt={`Banner ${banner.id}`}
                width={1000}
                height={300}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ปุ่มเลื่อนซ้าย-ขวา */}
      <button
        className="absolute top-1/2 left-2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white"
        onClick={() => emblaApi && emblaApi.scrollPrev()}
      >
        &#10094;
      </button>
      <button
        className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white"
        onClick={() => emblaApi && emblaApi.scrollNext()}
      >
        &#10095;
      </button>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={""}>
      <div className="container mx-auto px-4 py-6">
        <Carousel />
        <PageContent />
      </div>
    </Suspense>
  );
}
