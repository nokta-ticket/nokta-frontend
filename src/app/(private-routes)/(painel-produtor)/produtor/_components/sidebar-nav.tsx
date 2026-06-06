'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarLink } from "./sidebar-links";

export function SidebarNav({ items }: { items: SidebarLink[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-2 text-white text-md">
      {items.map((item) => {
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.label}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2 rounded-md font-normal ${
              isActive ? "bg-violet-600 text-white" : "hover:bg-white/10"
            }`}
          >
            {item.icon}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
