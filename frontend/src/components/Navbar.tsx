"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle, LayoutDashboard, UtensilsCrossed, Crown } from "lucide-react";

const links = [
  { href: "/", label: "Concierge", icon: MessageCircle },
  { href: "/menu", label: "Menu", icon: UtensilsCrossed },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="bg-primary sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <Crown className="w-4 h-4 text-primary-dark" />
            </div>
            <div className="flex flex-col">
              <span className="text-[15px] font-semibold text-white tracking-wide leading-tight">
                The Grand Hotel
              </span>
              <span className="text-[10px] text-accent tracking-widest uppercase leading-tight">
                AI Concierge
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-0.5">
            {links.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-[13px] font-medium transition-all ${
                    isActive
                      ? "bg-white/15 text-accent"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  }`}
                >
                  <link.icon className="w-3.5 h-3.5" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
