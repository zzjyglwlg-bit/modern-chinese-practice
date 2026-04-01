import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BookOpen, User, LogOut, Settings, History, BarChart3, Menu, X } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState } from "react";

const navLinks = [
  { href: "/", label: "首页" },
  { href: "/topics", label: "专题练习" },
  { href: "/history", label: "练习记录" },
];

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-border/50">
      <div className="container flex items-center justify-between h-12">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 text-foreground hover:opacity-70 transition-opacity">
          <BookOpen className="w-5 h-5 text-primary" />
          <span className="font-semibold text-sm tracking-tight">现代文练习</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-xs font-medium transition-opacity hover:opacity-70 ${
                location === link.href ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
          {isAuthenticated && user?.role === "admin" && (
            <Link
              href="/admin"
              className={`text-xs font-medium transition-opacity hover:opacity-70 ${
                location.startsWith("/admin") ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              管理后台
            </Link>
          )}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 gap-2 text-xs">
                  <User className="w-4 h-4" />
                  <span className="hidden sm:inline">{user?.name || "用户"}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/history" className="flex items-center gap-2">
                    <History className="w-4 h-4" />
                    练习记录
                  </Link>
                </DropdownMenuItem>
                {user?.role === "admin" && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        管理后台
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/admin/analytics" className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" />
                        数据分析
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logout()} className="text-destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  退出登录
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              size="sm"
              className="h-8 text-xs rounded-full px-4"
              onClick={() => { window.location.href = getLoginUrl(); }}
            >
              登录
            </Button>
          )}

          {/* Mobile Menu */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden h-8 w-8 p-0"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border/50 bg-white/95 backdrop-blur-xl">
          <div className="container py-3 flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm py-2 transition-opacity hover:opacity-70 ${
                  location === link.href ? "text-foreground font-medium" : "text-muted-foreground"
                }`}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {isAuthenticated && user?.role === "admin" && (
              <Link
                href="/admin"
                className="text-sm py-2 text-muted-foreground hover:opacity-70"
                onClick={() => setMobileOpen(false)}
              >
                管理后台
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
