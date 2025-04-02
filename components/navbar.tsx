"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileIcon, CompassIcon, MenuIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import ShinyButton from "@/components/ui/shiny-button";
interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function Navbar({ activeTab, setActiveTab }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  return (
    <motion.header 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b border-border/40"
    >
      <div className="container max-w-5xl mx-auto py-4 px-4 md:px-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="font-bold text-2xl flex items-center">
            <span className="gradient-text">imghub</span>
          </Link>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {/* <Button 
              variant={activeTab === "convert" ? "default" : "ghost"} 
              onClick={() => setActiveTab("convert")}
              className="rounded-full font-medium"
              size="sm"
            >
              <FileIcon className="h-4 w-4 mr-2" />
              Image Converter
            </Button> */}
            {/* <Button 
              variant={activeTab === "compress" ? "selected" : "ghost"} 
              onClick={() => setActiveTab("compress")}
              className="rounded-md font-medium"
              // size="sm"
            >
              <CompassIcon className="h-4 w-4 mr-2" />
              Image Compressor
            </Button> */}
            <ShinyButton 
              onClick={() => setActiveTab("convert")}
              className="h-10"
              variant={activeTab === "convert" ? "selected" : "default"}
            >
              <CompassIcon className="h-4 w-4 mr-2" />
              Image Converter
            </ShinyButton>

            <ShinyButton 
              onClick={() => setActiveTab("compress")}
              className="h-10"
              variant={activeTab === "compress" ? "selected" : "default"}
            >
              <CompassIcon className="h-4 w-4 mr-2" />
              Image Compressor
            </ShinyButton>
            {/* <Button
              variant="outline"
              className="rounded-full font-medium border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              size="sm"
            >
              Get Started
            </Button> */}
          </nav>
          
          {/* Mobile Menu Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <MenuIcon className="h-6 w-6" />
          </Button>
        </div>
        
        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden pt-4 pb-2 flex flex-col gap-2"
          >
            <Button 
              variant={activeTab === "convert" ? "default" : "ghost"} 
              onClick={() => {
                setActiveTab("convert");
                setMobileMenuOpen(false);
              }}
              className="w-full justify-start"
              size="sm"
            >
              <FileIcon className="h-4 w-4 mr-2" />
              Image Converter
            </Button>
            <Button 
              variant={activeTab === "compress" ? "default" : "ghost"} 
              onClick={() => {
                setActiveTab("compress");
                setMobileMenuOpen(false);
              }}
              className="w-full justify-start"
              size="sm"
            >
              <CompassIcon className="h-4 w-4 mr-2" />
              Image Compressor
            </Button>
            <Button
              variant="outline"
              className="w-full justify-center mt-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              size="sm"
            >
              Get Started
            </Button>
          </motion.div>
        )}
      </div>
    </motion.header>
  );
}