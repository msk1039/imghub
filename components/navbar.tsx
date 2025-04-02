"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileIcon, CompassIcon } from "lucide-react";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Navbar({ activeTab, setActiveTab }: NavbarProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/80 border-b">
    
        <div className="flex justify-between w-full container max-w-5xl mx-auto py-4 px-8">
          <Link href="/" className="font-semibold text-xl flex items-center">
            imghub
          </Link>
          <nav className="hidden md:flex gap-4">
            <Button 
              variant={activeTab === "convert" ? "default" : "ghost"} 
              onClick={() => setActiveTab("convert")}
              size="sm"
            >
              <FileIcon className="h-4 w-4 mr-2" />
              Image Converter
            </Button>
            <Button 
              variant={activeTab === "compress" ? "default" : "ghost"} 
              onClick={() => setActiveTab("compress")}
              size="sm"
            >
              <CompassIcon className="h-4 w-4 mr-2" />
              Image Compressor
            </Button>
          </nav>
        </div>
    
    </header>
  );
}