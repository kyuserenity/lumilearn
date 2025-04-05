"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createClient } from "@/utils/supabase/client";

export default function Form() {
  const supabase = createClient();
  const [years, setYears] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedYearId, setSelectedYearId] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileSelected, setFileSelected] = useState(false);
  const [fileName, setFileName] = useState("");
  const [responseDetails, setResponseDetails] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Fetch years from Supabase when component mounts
  useEffect(() => {
    async function fetchYears() {
      try {
        const { data, error } = await supabase
          .from("years")
          .select("id, year_name")
          .order("id");

        if (error) throw error;
        setYears(data || []);
      } catch (error) {
        console.error("Error fetching years:", error);
        setErrorMessage("ไม่สามารถดึงข้อมูลปีการศึกษาได้");
      } finally {
        setIsLoading(false);
      }
    }

    fetchYears();
  }, []);

  // Fetch subjects when selectedYearId changes
  useEffect(() => {
    async function fetchSubjects() {
      if (!selectedYearId) {
        setSubjects([]);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("subjects")
          .select("id, subject_name")
          .eq("year_id", selectedYearId)
          .order("subject_name");

        if (error) throw error;
        setSubjects(data || []);
      } catch (error) {
        console.error("Error fetching subjects:", error);
        setErrorMessage("ไม่สามารถดึงข้อมูลวิชาได้");
      }
    }

    fetchSubjects();
  }, [selectedYearId]);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type !== "application/pdf") {
        setErrorMessage("กรุณาอัพโหลดไฟล์ PDF เท่านั้น");
        setFileSelected(false);
        setFileName("");
        return;
      }
      setErrorMessage("");
      setFileSelected(true);
      setFileName(file.name);
    } else {
      setFileSelected(false);
      setFileName("");
    }
  };

  const handleYearChange = (yearValue) => {
    const selectedYearObject = years.find(
      (year) => year.year_name === yearValue,
    );
    if (selectedYearObject) {
      setSelectedYear(yearValue);
      setSelectedYearId(selectedYearObject.id);
      setSelectedSubject("");
    }
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setResponseDetails("");
    const formData = new FormData(event.target);

    formData.append("year", selectedYear);
    formData.append("subject", selectedSubject);

    if (!selectedYear || !selectedSubject || !formData.get("pdfUpload").name) {
      setErrorMessage("กรุณากรอกข้อมูลให้ครบถ้วน");
      setIsSubmitting(false);
      return;
    }

    const file = formData.get("pdfUpload");
    if (file && file.type !== "application/pdf") {
      setErrorMessage("กรุณาอัพโหลดไฟล์ PDF เท่านั้น");
      setIsSubmitting(false);
      return;
    }

    setErrorMessage("");

    try {
      const response = await fetch("/create/action", {
        method: "POST",
        body: formData,
      });

      const responseData = await response.json();

      if (!response.ok) {
        setResponseDetails(responseData.details || "ไม่มีรายละเอียดข้อผิดพลาด");
        throw new Error(responseData.error || "Upload failed");
      }

      event.target.reset();
      setSelectedYear("");
      setSelectedYearId(null);
      setSelectedSubject("");
      setFileSelected(false);
      setFileName("");

      setErrorMessage("อัพโหลดไฟล์สำเร็จ");
    } catch (error) {
      setErrorMessage(`เกิดข้อผิดพลาดในการอัพโหลดไฟล์: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-center">อัพโหลดเอกสาร</CardTitle>
      </CardHeader>
      <CardContent>
        <form id="uploadForm" onSubmit={handleFormSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="year">ปี</Label>
              <Select
                onValueChange={handleYearChange}
                value={selectedYear}
                disabled={isLoading}
                required
              >
                <SelectTrigger id="year" className="w-full">
                  <SelectValue
                    placeholder={isLoading ? "กำลังโหลด..." : "เลือกปีการศึกษา"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year.id} value={year.year_name}>
                      {year.year_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">วิชา</Label>
              <Select
                onValueChange={setSelectedSubject}
                value={selectedSubject}
                disabled={!selectedYearId}
                required
              >
                <SelectTrigger id="subject" className="w-full">
                  <SelectValue
                    placeholder={
                      selectedYearId ? "เลือกวิชา" : "กรุณาเลือกปีก่อน"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {subjects.length > 0 ? (
                    subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.subject_name}>
                        {subject.subject_name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      ไม่มีวิชาให้เลือก
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pdfUpload">อัพโหลดไฟล์ PDF</Label>
            <div className="flex flex-col gap-2">
              <Input
                type="file"
                id="pdfUpload"
                name="pdfUpload"
                accept="application/pdf"
                onChange={handleFileUpload}
                required
                className="cursor-pointer"
              />
              {fileSelected && (
                <p className="text-xs text-green-600">เลือกไฟล์: {fileName}</p>
              )}
            </div>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col">
        <Button
          form="uploadForm"
          type="submit"
          className="w-full"
          disabled={isSubmitting || isLoading}
        >
          {isSubmitting ? "กำลังอัพโหลด..." : "อัพโหลด"}
        </Button>

        {errorMessage && (
          <Alert
            className={`mt-4 ${
              errorMessage.includes("สำเร็จ") ? "bg-green-50" : "bg-red-50"
            }`}
          >
            <AlertDescription
              className={
                errorMessage.includes("สำเร็จ")
                  ? "text-green-600"
                  : "text-red-600"
              }
            >
              {errorMessage}
            </AlertDescription>
          </Alert>
        )}
      </CardFooter>
    </Card>
  );
}
