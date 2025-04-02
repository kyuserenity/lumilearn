"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";
import { usePathname, useRouter } from "next/navigation";
import { Search, Menu, X } from "lucide-react";

export default function Header() {
  const supabase = createClient();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error("Error fetching user:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();

    // Setup auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_IN") {
          setUser(session?.user || null);
        } else if (event === "SIGNED_OUT") {
          setUser(null);
        }
      },
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [supabase]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/?s=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const loginWithGoogle = async () => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const logOut = async () => {
    try {
      await fetch("/auth/signout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const navItems = [
    { name: "home", path: "/" },
    { name: "freshy", path: "/freshy" },
    { name: "sophomore", path: "/sophomore" },
    { name: "junior", path: "/junior" },
    { name: "senior", path: "/senior" },
    { name: "tutor", path: "/tutor" },
  ];

  return (
    <header className="bg-background/75 sticky top-0 z-10 backdrop-blur-md">
      {/* Main Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo Section */}
            <div className="flex items-center gap-2">
              <Link href="/" className="flex items-center gap-2">
                <Image
                  className="h-8 w-8"
                  src="/favicon.svg"
                  width={32}
                  height={32}
                  alt="LumiLearn Logo"
                />
                <p className="text-xl font-semibold">LumiLearn</p>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>

            {/* Desktop Navigation */}
            <div className="hidden md:flex md:items-center md:gap-3">
              {/* Desktop Search */}
              <form onSubmit={handleSearchSubmit} className="relative mr-2">
                <Input
                  type="text"
                  placeholder="ค้นหา..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full md:w-64"
                  autoComplete="off"
                />
                <button
                  type="submit"
                  className="absolute top-1/2 right-2 -translate-y-1/2"
                  aria-label="Search"
                >
                  <Search className="text-muted-foreground h-4 w-4" />
                </button>
              </form>

              {/* Auth Section */}
              {isLoading ? (
                <div className="bg-muted h-8 w-8 animate-pulse rounded-full"></div>
              ) : user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="ring-primary rounded-full transition-shadow hover:ring-2 focus:ring-2">
                      <Image
                        className="h-8 w-8 rounded-full"
                        src={user.user_metadata?.avatar_url || "/favicon.svg"}
                        width={32}
                        height={32}
                        alt="โปรไฟล์ผู้ใช้"
                      />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>บัญชีของฉัน</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile">โปรไฟล์</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/create">เพิ่มไฟล์</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={logOut}
                    >
                      ออกจากระบบ
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm">เข้าสู่ระบบ</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                      <DialogTitle>เข้าสู่ระบบ</DialogTitle>
                      <DialogDescription>
                        เข้าสู่ระบบเพื่อเข้าถึงและแชร์เอกสารต่างๆ
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="mt-4">
                      <Button className="w-full" onClick={loginWithGoogle}>
                        เข้าสู่ระบบด้วย Google
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <nav className="border-b">
        <div className="container mx-auto px-4">
          {/* Desktop Navigation Links */}
          <div className="hidden md:block">
            <div className="flex justify-center gap-4 p-4">
              {navItems.map((item) => (
                <Link key={item.path} href={item.path}>
                  <Button
                    variant={pathname === item.path ? "default" : "ghost"}
                    className="uppercase"
                  >
                    {item.name}
                  </Button>
                </Link>
              ))}
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          <div className={`${mobileMenuOpen ? "block" : "hidden"} md:hidden`}>
            {/* Mobile Search */}
            <form onSubmit={handleSearchSubmit} className="mt-4 mb-4">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="ค้นหา..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                  autoComplete="off"
                />
                <button
                  type="submit"
                  className="absolute top-1/2 right-2 -translate-y-1/2"
                  aria-label="Search"
                >
                  <Search className="text-muted-foreground h-4 w-4" />
                </button>
              </div>
            </form>

            {/* Mobile Nav Links */}
            <div className="grid grid-cols-1 gap-1 pb-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button
                    variant={pathname === item.path ? "default" : "ghost"}
                    className="w-full justify-start uppercase"
                  >
                    {item.name}
                  </Button>
                </Link>
              ))}

              {/* Mobile Auth Section */}
              {!isLoading && !user && (
                <Button className="mt-2" onClick={loginWithGoogle}>
                  เข้าสู่ระบบด้วย Google
                </Button>
              )}

              {!isLoading && user && (
                <>
                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button
                      variant="outline"
                      className="mt-2 w-full justify-start"
                    >
                      โปรไฟล์
                    </Button>
                  </Link>
                  <Link href="/create" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full justify-start">
                      เพิ่มไฟล์
                    </Button>
                  </Link>
                  <Button
                    variant="destructive"
                    className="mt-2"
                    onClick={logOut}
                  >
                    ออกจากระบบ
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
