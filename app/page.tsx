"use client";
import { useState } from "react";
import { Tabs, TabsContent} from "@/components/ui/tabs";
import { Navbar } from "@/components/navbar";
import ImageConverter from "@/components/convertor/image-converter";
import ImageCompressor from "@/components/compressor/image-compressor";

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>("convert");

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
      />
      <main className="flex-1 container max-w-5xl mx-auto p-8 pt-24">
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="w-full"
        >
          {/* <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="convert">Image Converter</TabsTrigger>
            <TabsTrigger value="compress">Image Compressor</TabsTrigger>
          </TabsList> */}
          <TabsContent value="convert" className="mt-6">
            <ImageConverter />
          </TabsContent>
          <TabsContent value="compress" className="mt-6">
            <ImageCompressor />
          </TabsContent>
        </Tabs>
      </main>
      <footer className="py-6 border-t">
        <div className="container flex justify-center items-center">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium">imghub</span> - Universal image converter and compressor
          </p>
        </div>
      </footer>
    </div>
  );
}