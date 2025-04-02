import React from "react";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Phone, Mail } from "lucide-react";

export default function TutorDetailDrawer({ tutor, isOpen, onClose }) {
  if (!tutor) return null;

  console.log(tutor);

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader className="text-center">
            <div className="flex justify-center">
              <Avatar className="h-24 w-24">
                <AvatarImage src={tutor.image} alt={tutor.name} />
                <AvatarFallback>{tutor.name.substring(0, 2)}</AvatarFallback>
              </Avatar>
            </div>
            <DrawerTitle className="mt-4 text-xl font-bold">
              {tutor.name}
            </DrawerTitle>
            <DrawerDescription className="text-md text-primary font-medium">
              {tutor.subject}
            </DrawerDescription>
          </DrawerHeader>
          <div className="p-4 pb-0">
            <h3 className="mb-2 font-semibold">รายละเอียด</h3>
            <p className="text-muted-foreground">{tutor.description}</p>

            {tutor.contact && (
              <>
                <h3 className="mt-4 mb-2 font-semibold">ช่องทางการติดต่อ</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Mail className="text-primary h-4 w-4" />
                    <span className="text-muted-foreground">
                      {tutor.contact.email}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="text-primary h-4 w-4" />
                    <span className="text-muted-foreground">
                      {tutor.contact.phone}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
          <DrawerFooter>
            <DrawerClose className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 rounded-md px-4 py-2">
              ปิด
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
