import React from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Phone } from "lucide-react";

export default function TutorCard({ tutor, onClick }) {
  // ฟังก์ชั่นเพื่อป้องกันการเผลอคลิกปุ่มติดต่อแล้วเปิด Drawer
  const handleContactClick = (e, type) => {
    e.stopPropagation();

    if (type === "phone") {
      window.location.href = `tel:${tutor.contact.phone}`;
    }
  };

  return (
    <Card
      className="cursor-pointer transition-shadow duration-200 hover:scale-95 focus-visible:scale-95"
      onClick={() => onClick(tutor)}
    >
      <CardHeader className="flex flex-row items-center gap-4 pb-2">
        <Avatar className="h-16 w-16">
          <AvatarImage src={tutor.image} alt={tutor.name} />
          <AvatarFallback>{tutor.name.substring(0, 2)}</AvatarFallback>
        </Avatar>
        <div>
          <h3 className="text-lg font-semibold">{tutor.name}</h3>
          <p className="text-muted-foreground">{tutor.subject}</p>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground line-clamp-2 text-sm">
          {tutor.description}
        </p>
      </CardContent>
      <CardFooter className="flex gap-2 pt-2">
        <button
          className="flex flex-1 items-center justify-center gap-1 rounded-md bg-green-100 px-3 py-1 text-sm text-green-700 hover:bg-green-200"
          onClick={(e) => handleContactClick(e, "phone")}
        >
          <Phone className="h-4 w-4" /> โทร
        </button>
      </CardFooter>
    </Card>
  );
}
