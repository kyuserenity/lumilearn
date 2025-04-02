"use client";

import { useState, useEffect } from "react";
import TutorCard from "@/components/TutorCard";
import TutorDetailDrawer from "@/components/TutorDetailDrawer";

export default function Home() {
  const [tutors, setTutors] = useState([]);
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    fetch("/tutors.json")
      .then((response) => response.json())
      .then((data) => setTutors(data))
      .catch((error) => console.error("Error loading tutors:", error));
  }, []);

  const handleTutorClick = (tutor) => {
    setSelectedTutor(tutor);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-center text-3xl font-bold">รายชื่อติวเตอร์</h1>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {tutors.map((tutor) => (
          <TutorCard key={tutor.id} tutor={tutor} onClick={handleTutorClick} />
        ))}
      </div>

      <TutorDetailDrawer
        tutor={selectedTutor}
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
      />
    </main>
  );
}
