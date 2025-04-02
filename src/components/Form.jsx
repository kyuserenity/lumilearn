"use client";

import { useState } from "react";
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

export default function Form() {
  const [subjects, setSubjects] = useState([]);
  const [selectedYear, setSelectedYear] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileSelected, setFileSelected] = useState(false);
  const [fileName, setFileName] = useState("");
  const [responseDetails, setResponseDetails] = useState("");

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
      setSelectedSubject("");
      setSubjects([]);
      setFileSelected(false);
      setFileName("");

      setErrorMessage("อัพโหลดไฟล์สำเร็จ");
    } catch (error) {
      setErrorMessage(`เกิดข้อผิดพลาดในการอัพโหลดไฟล์: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleYearChange = (year) => {
    setSelectedYear(year);
    let subjectOptions = [];
    switch (year) {
      case "Year 1":
        subjectOptions = [
          "calculus 1",
          "calculus 2",
          "computer programming",
          "drawing",
          "engineering materials",
          "engineering mechanics",
          "general chemistry",
          "general chemistry laboratory 1",
          "general physics laboratory 2",
          "general physics 1",
          "general physics 2",
        ];
        break;
      case "Year 2":
        subjectOptions = [
          "computer-aided design for manufacturing",
          "computer and information technology for industrial engineering",
          "electrical engineering",
          "elementary differential equations and linear algebra",
          "engineering metallurgy",
          "industrial safety engineering",
          "manufacturing processes",
          "numerical methods for engineering",
          "probability and statistics 1",
          "thermodynamics",
        ];
        break;
      case "Year 3":
        subjectOptions = [
          "economics",
          "industrial work study",
          "maintenance",
          "operations research",
          "pollution control",
        ];
        break;
      case "Year 4":
        subjectOptions = [
          "advanced engineering management",
          "cost analysis",
          "logistics and supply chain management",
          "quality management",
        ];
        break;
      default:
        subjectOptions = [];
    }
    setSubjects(subjectOptions);
    setSelectedSubject("");
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
                required
              >
                <SelectTrigger id="year" className="w-full">
                  <SelectValue placeholder="เลือกปีการศึกษา" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Year 1">ปี 1</SelectItem>
                  <SelectItem value="Year 2">ปี 2</SelectItem>
                  <SelectItem value="Year 3">ปี 3</SelectItem>
                  <SelectItem value="Year 4">ปี 4</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">วิชา</Label>
              <Select
                onValueChange={setSelectedSubject}
                value={selectedSubject}
                disabled={!selectedYear}
                required
              >
                <SelectTrigger id="subject" className="w-full">
                  <SelectValue
                    placeholder={
                      selectedYear ? "เลือกวิชา" : "กรุณาเลือกปีก่อน"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {subjects.length > 0 ? (
                    subjects.map((subject, index) => (
                      <SelectItem key={index} value={subject}>
                        {subject}
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
          disabled={isSubmitting}
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
