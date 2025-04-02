"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Download } from "lucide-react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * YearPage component for displaying PDF files by year
 * @param {string} year - Academic year
 * @param {string} title - Page title
 */
export default function YearPage({ year, title }) {
  const [pdfFiles, setPdfFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [downloadingFileId, setDownloadingFileId] = useState(null);
  const supabase = createClient();
  const sectionRefs = useRef({});

  useEffect(() => {
    const fetchPdfFiles = async () => {
      try {
        const { data, error } = await supabase
          .from("pdf_files")
          .select("*")
          .eq("year", year)
          .order("subject");

        if (error) {
          setError(error.message);
          toast.error("เกิดข้อผิดพลาดในการดึงข้อมูลไฟล์");
        } else {
          setPdfFiles(data || []);
        }
      } catch (err) {
        setError(err.message);
        toast.error("เกิดข้อผิดพลาดในการดึงข้อมูลไฟล์");
      } finally {
        setLoading(false);
      }
    };

    fetchPdfFiles();
  }, [supabase, year]);

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

  // Group files by subject
  const groupedFiles = pdfFiles.reduce((acc, file) => {
    if (!acc[file.subject]) {
      acc[file.subject] = [];
    }
    acc[file.subject].push(file);
    return acc;
  }, {});

  const subjects = Object.keys(groupedFiles).sort();

  /**
   * Scroll to a specific subject section
   * @param {string} subject - Subject name to scroll to
   */
  const scrollToSection = (subject) => {
    if (sectionRefs.current[subject]) {
      sectionRefs.current[subject].scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  /**
   * Format file size from bytes to human-readable format
   * @param {number} bytes - File size in bytes
   * @returns {string} Formatted file size
   */
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  /**
   * Truncate text with ellipsis if it exceeds maxLength
   * @param {string} text - Text to truncate
   * @param {number} maxLength - Maximum length before truncation
   * @returns {string} Truncated text
   */
  const truncateText = (text, maxLength) => {
    if (!text) return "";
    return text.length > maxLength
      ? `${text.substring(0, maxLength)}...`
      : text;
  };

  /**
   * Handle file download
   * @param {Object} file - File object to download
   */
  const handleDownload = async (file) => {
    if (!user) {
      toast.error("กรุณาเข้าสู่ระบบก่อนดาวน์โหลดไฟล์");
      return;
    }

    setDownloadingFileId(file.id); // Set downloading state
    try {
      const { data, error } = await supabase.storage
        .from("pdfs")
        .download(file.file_path);

      if (error) {
        console.error("Error downloading file:", error);
        toast.error("เกิดข้อผิดพลาดในการดาวน์โหลดไฟล์");
        return;
      }

      const fileName = file.file_path.split("/").pop();
      const blobUrl = URL.createObjectURL(data);
      const a = document.createElement("a");

      a.href = blobUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);

      // Increment download count in the database
      const { data: currentData, error: fetchError } = await supabase
        .from("pdf_files")
        .select("*")
        .eq("id", file.id)
        .single();

      if (fetchError) {
        console.error("Error fetching download count:", fetchError);
        return;
      }

      const newDownloadCount = (currentData.download_count || 0) + 1;

      const { error: updateError } = await supabase
        .from("pdf_files")
        .update({ download_count: newDownloadCount })
        .eq("id", file.id);

      if (updateError) {
        console.error("Error updating download count:", updateError);
        return;
      }

      // Update local state
      setPdfFiles((prevFiles) =>
        prevFiles.map((f) =>
          f.id === file.id ? { ...f, download_count: newDownloadCount } : f,
        ),
      );

      toast.success(`ดาวน์โหลดไฟล์ ${fileName} สำเร็จ`);
    } catch (err) {
      console.error("Error during download:", err);
      toast.error("เกิดข้อผิดพลาดในการดาวน์โหลดไฟล์");
    } finally {
      setDownloadingFileId(null); // Reset downloading state
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  return (
    <div className="container mx-auto">
      <h1 className="mb-8 text-center text-3xl font-bold">{title}</h1>
      <div className="flex flex-col gap-6 md:flex-row">
        <SubjectNavigation
          subjects={subjects}
          scrollToSection={scrollToSection}
          truncateText={truncateText}
        />
        <FileListContent
          subjects={subjects}
          groupedFiles={groupedFiles}
          sectionRefs={sectionRefs}
          formatFileSize={formatFileSize}
          handleDownload={handleDownload}
          truncateText={truncateText}
          downloadingFileId={downloadingFileId}
        />
      </div>
    </div>
  );
}

/**
 * Loading state component
 */
function LoadingState() {
  return (
    <div className="flex h-40 items-center justify-center">
      <div className="flex flex-col items-center text-center">
        <div className="border-primary mb-2 h-6 w-6 animate-spin rounded-full border-4 border-t-transparent"></div>
        <p>กำลังโหลดข้อมูล...</p>
      </div>
    </div>
  );
}

/**
 * Error state component
 * @param {string} error - Error message
 */
function ErrorState({ error }) {
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

/**
 * Subject navigation sidebar
 * @param {Array} subjects - List of subjects
 * @param {Function} scrollToSection - Function to scroll to section
 * @param {Function} truncateText - Function to truncate text
 */
function SubjectNavigation({ subjects, scrollToSection, truncateText }) {
  return (
    <div className="md:sticky md:top-24 md:h-full md:w-64 md:self-start">
      <div className="bg-card rounded-lg border p-4 shadow-sm">
        <h2 className="mb-2 text-xl font-semibold">รายวิชา</h2>
        <nav className="flex flex-col gap-2">
          {subjects.length > 0 ? (
            subjects.map((subject) => (
              <TooltipProvider key={subject}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      className="justify-start overflow-hidden text-left uppercase"
                      variant="ghost"
                      onClick={() => scrollToSection(subject)}
                    >
                      <span className="w-full truncate">
                        {truncateText(subject, 20)}
                      </span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{subject}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))
          ) : (
            <p className="text-muted-foreground text-sm">ไม่พบรายวิชา</p>
          )}
        </nav>
      </div>
    </div>
  );
}

/**
 * File list content component
 * @param {Array} subjects - List of subjects
 * @param {Object} groupedFiles - Files grouped by subject
 * @param {Object} sectionRefs - References to subject sections
 * @param {Function} formatFileSize - Function to format file size
 * @param {Function} handleDownload - Function to handle file download
 * @param {Function} truncateText - Function to truncate text
 * @param {number} downloadingFileId - ID of the file being downloaded
 */
function FileListContent({
  subjects,
  groupedFiles,
  sectionRefs,
  formatFileSize,
  handleDownload,
  truncateText,
  downloadingFileId,
}) {
  return (
    <div className="flex-1">
      {subjects.length > 0 ? (
        subjects.map((subject) => (
          <SubjectSection
            key={subject}
            subject={subject}
            files={groupedFiles[subject]}
            sectionRef={(el) => (sectionRefs.current[subject] = el)}
            formatFileSize={formatFileSize}
            handleDownload={handleDownload}
            truncateText={truncateText}
            downloadingFileId={downloadingFileId}
          />
        ))
      ) : (
        <EmptyState />
      )}
    </div>
  );
}

/**
 * Subject section component
 * @param {string} subject - Subject name
 * @param {Array} files - List of files for the subject
 * @param {Function} sectionRef - Ref callback function
 * @param {Function} formatFileSize - Function to format file size
 * @param {Function} handleDownload - Function to handle file download
 * @param {Function} truncateText - Function to truncate text
 * @param {number} downloadingFileId - ID of the file being downloaded
 */
function SubjectSection({
  subject,
  files,
  sectionRef,
  formatFileSize,
  handleDownload,
  truncateText,
  downloadingFileId,
}) {
  return (
    <section
      ref={sectionRef}
      className="mb-10 scroll-mt-24"
      id={subject.replace(/\s+/g, "-").toLowerCase()}
    >
      <Card>
        <CardHeader>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <CardTitle className="truncate text-2xl font-semibold uppercase">
                  {truncateText(subject, 40)}
                </CardTitle>
              </TooltipTrigger>
              <TooltipContent>
                <p>{subject}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {files.map((file) => (
            <FileCard
              key={file.id}
              file={file}
              formatFileSize={formatFileSize}
              handleDownload={handleDownload}
              truncateText={truncateText}
              downloadingFileId={downloadingFileId}
            />
          ))}
        </CardContent>
      </Card>
    </section>
  );
}

/**
 * File card component
 * @param {Object} file - File object
 * @param {Function} formatFileSize - Function to format file size
 * @param {Function} handleDownload - Function to handle file download
 * @param {Function} truncateText - Function to truncate text
 * @param {number} downloadingFileId - ID of the file being downloaded
 */
function FileCard({
  file,
  formatFileSize,
  handleDownload,
  truncateText,
  downloadingFileId,
}) {
  return (
    <Card key={file.id} className="overflow-hidden">
      <div className="flex h-full flex-col">
        <CardHeader>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <CardTitle className="line-clamp-2 text-base font-medium hover:cursor-help">
                  {file.title}
                </CardTitle>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">{file.title}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <p className="text-muted-foreground mt-1 text-sm">
            {formatFileSize(file.file_size)}
          </p>
        </CardHeader>
        <div className="mt-2 flex justify-center px-4">
          <Button
            size="sm"
            className="w-full gap-1"
            onClick={() => handleDownload(file)}
            disabled={downloadingFileId === file.id} // Disable button if downloading
          >
            {downloadingFileId === file.id ? (
              <span>กำลังดาวน์โหลด...</span>
            ) : (
              <>
                <Download className="h-4 w-4" />
                ดาวน์โหลด
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}

/**
 * Empty state component when no files are available
 */
function EmptyState() {
  return (
    <div className="bg-muted/50 rounded-md p-12 text-center">
      <h3 className="mb-2 text-xl font-medium">ยังไม่มีเอกสาร</h3>
      <p className="text-muted-foreground mb-4">ไม่มีเอกสารในขณะนี้</p>
    </div>
  );
}
