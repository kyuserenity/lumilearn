"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, Upload, Trash2, AlertCircle, Download } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [userFiles, setUserFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUploads: 0,
    totalDownloads: 0,
    totalFileSize: 0,
  });
  const [activeTab, setActiveTab] = useState("stats");
  const supabase = createClient();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }

        if (!session) {
          window.location.href = "/login";
          return;
        }

        const { data: userData, error: userError } =
          await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        setUser(userData.user);

        const { data: filesData, error: filesError } = await supabase
          .from("pdf_files")
          .select("*")
          .eq("user_id", userData.user.id)
          .order("created_at", { ascending: false });

        if (filesError) {
          throw filesError;
        }

        setUserFiles(filesData || []);

        if (filesData && filesData.length > 0) {
          const totalUploads = filesData.length;
          const totalDownloads = filesData.reduce(
            (sum, file) => sum + (file.download_count || 0),
            0,
          );
          const totalFileSize = filesData.reduce(
            (sum, file) => sum + (file.file_size || 0),
            0,
          );

          setStats({
            totalUploads,
            totalDownloads,
            totalFileSize,
          });
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError(err.message);
        toast.error("เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้");
      } finally {
        setLoading(false);
        setStatsLoading(false);
      }
    };

    fetchUserData();
  }, [supabase]);

  const handleDeleteFile = async (fileId, filePath) => {
    try {
      const { error: storageError } = await supabase.storage
        .from("pdfs")
        .remove([filePath]);

      if (storageError) {
        throw storageError;
      }

      const { error: dbError } = await supabase
        .from("pdf_files")
        .delete()
        .eq("id", fileId);

      if (dbError) {
        throw dbError;
      }

      setUserFiles(userFiles.filter((file) => file.id !== fileId));

      const deletedFile = userFiles.find((file) => file.id === fileId);
      if (deletedFile) {
        setStats((prev) => ({
          totalUploads: prev.totalUploads - 1,
          totalDownloads:
            prev.totalDownloads - (deletedFile.download_count || 0),
          totalFileSize: prev.totalFileSize - (deletedFile.file_size || 0),
        }));
      }

      toast.success("ลบไฟล์เรียบร้อยแล้ว");
    } catch (err) {
      console.error("Error deleting file:", err);
      toast.error("เกิดข้อผิดพลาดในการลบไฟล์");
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    else if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    else return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="flex flex-col items-center justify-center text-center">
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

  return (
    <div className="container mx-auto">
      <h1 className="mb-6 text-2xl font-bold">โปรไฟล์ของฉัน</h1>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>ข้อมูลผู้ใช้</CardTitle>
            <CardDescription>ข้อมูลส่วนตัวและการตั้งค่าบัญชี</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <Avatar className="mb-4 h-24 w-24">
              <AvatarImage
                src={
                  user?.user_metadata?.avatar_url ||
                  user?.user_metadata?.picture ||
                  ""
                }
                alt={user?.email}
              />
              <AvatarFallback>
                <img
                  src="/favicon.svg"
                  alt="Default avatar"
                  className="h-12 w-12"
                />
              </AvatarFallback>
            </Avatar>
            <div className="text-center">
              <h3 className="text-lg font-medium">
                {user?.user_metadata?.full_name ||
                  user?.user_metadata?.name ||
                  user?.email}
              </h3>
              <p className="text-muted-foreground">{user?.email}</p>
            </div>
          </CardContent>
        </Card>

        <div className="overflow-auto md:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="stats">สถิติ</TabsTrigger>
              <TabsTrigger value="files">ไฟล์ของฉัน</TabsTrigger>
            </TabsList>

            <TabsContent value="stats">
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      จำนวนไฟล์ที่อัปโหลด
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2">
                      <Upload className="text-primary h-5 w-5" />
                      <div className="text-2xl font-bold">
                        {stats.totalUploads}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      จำนวนดาวน์โหลด
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2">
                      <Download className="text-primary h-5 w-5" />
                      <div className="text-2xl font-bold">
                        {stats.totalDownloads}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">
                      พื้นที่ใช้งานทั้งหมด
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center space-x-2">
                      <FileText className="text-primary h-5 w-5" />
                      <div className="text-2xl font-bold">
                        {formatFileSize(stats.totalFileSize)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>ไฟล์ล่าสุด</CardTitle>
                  <CardDescription>
                    ไฟล์ที่คุณอัปโหลดล่าสุด 3 รายการ
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {userFiles.length === 0 ? (
                    <div className="text-muted-foreground py-6 text-center">
                      <AlertCircle className="mx-auto mb-2 h-10 w-10" />
                      <p>คุณยังไม่มีไฟล์ที่อัปโหลด</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {userFiles.slice(0, 3).map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <FileText className="text-primary h-5 w-5" />
                            <div>
                              <p className="font-medium">{file.subject}</p>
                              <p className="text-muted-foreground text-xs">
                                {new Date(file.created_at).toLocaleString(
                                  undefined,
                                  { hour12: false },
                                )}
                              </p>
                            </div>
                          </div>
                          <Badge variant="outline">
                            {formatFileSize(file.file_size)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setActiveTab("files")}
                  >
                    ดูไฟล์ทั้งหมด
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="files">
              <Card>
                <CardHeader>
                  <div className="flex flex-col items-start justify-between sm:flex-row sm:items-center">
                    <div>
                      <CardTitle>ไฟล์ของฉัน</CardTitle>
                      <CardDescription>
                        จัดการไฟล์ที่คุณได้อัปโหลดไว้
                      </CardDescription>
                    </div>
                    <Button className="mt-4 sm:mt-0">
                      <Link href={"/create"}>อัปโหลดไฟล์ใหม่</Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {userFiles.length === 0 ? (
                    <div className="text-muted-foreground py-8 text-center">
                      <AlertCircle className="mx-auto mb-2 h-10 w-10" />
                      <p>คุณยังไม่มีไฟล์ที่อัปโหลด</p>
                      <Button variant="outline" className="mt-4">
                        <Link href={"/create"}>อัปโหลดไฟล์แรกของคุณ</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableCaption>รายการไฟล์ทั้งหมดของคุณ</TableCaption>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ชื่อไฟล์</TableHead>
                            <TableHead>วิชา</TableHead>
                            <TableHead>ปี</TableHead>
                            <TableHead>ขนาด</TableHead>
                            <TableHead>ดาวน์โหลด</TableHead>
                            <TableHead>วันที่อัปโหลด</TableHead>
                            <TableHead className="text-right">จัดการ</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {userFiles.map((file) => (
                            <TableRow key={file.id}>
                              <TableCell>{file.title}</TableCell>
                              <TableCell className="font-medium">
                                {file.subject}
                              </TableCell>
                              <TableCell>{file.year}</TableCell>
                              <TableCell>
                                {formatFileSize(file.file_size)}
                              </TableCell>
                              <TableCell>{file.download_count}</TableCell>
                              <TableCell>
                                {new Date(file.created_at).toLocaleString(
                                  undefined,
                                  { hour12: false },
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    handleDeleteFile(file.id, file.file_path)
                                  }
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
