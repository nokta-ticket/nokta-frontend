import { ReactNode } from "react";
import "@/app/globals.css";
import Sidebar from "./_components/sidebar";

type LayoutProps = {
  children: ReactNode;
};

export default function PainelLayout({ children }: LayoutProps) {
  return (
    <div
      className="fixed inset-0 flex flex-col lg:flex-row bg-[#151619] text-white overflow-hidden"
    >
      <Sidebar />

      <div
        className="flex-1 lg:mt-4 rounded-t-2xl lg:rounded-tl-2xl bg-[#F9FAFA] text-black overflow-hidden"
      >
        <div className="h-full overflow-y-auto p-4 lg:p-8">
          {children}
        </div>
      </div>
    </div>
  );
}

