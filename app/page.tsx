"use client";
import { useState } from "react";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import ImageConverter from "@/components/convertor/image-converter";
import ImageCompressor from "@/components/compressor/image-compressor";
import { motion } from "framer-motion";
import { FileImage, ArrowRight } from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>("convert");

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen flex flex-col relative bg-[#e4e8ed]">

{/* Fine-grained noise background */}
<div className="fixed inset-0 w-full h-full pointer-events-none opacity-50 z-0 ">
  <div 
    className="absolute inset-0"
    style={{
      backgroundImage: 'url(/noise3.jpg)',
      backgroundRepeat: 'repeat',
      backgroundSize: '200px 200px',
      // filter: 'brightness(0) invert(1)'
    }}
  ></div>
  {/* <div 
    className="absolute inset-0"
    style={{
      backgroundImage: 'url(/noise3.jpg)',
      backgroundRepeat: 'repeat',
      backgroundSize: '400px 400px',
      filter: 'brightness(0) invert(1)'
    }}
  ></div> */}
  <div 
    className="absolute inset-0"
    style={{
      backgroundImage: 'url(/noise2.jpg)',
      backgroundRepeat: 'repeat',
      backgroundSize: '100px 100px',
      opacity: 0.7,
      // filter: 'brightness(0) invert(1)'
    }}
  ></div>
  {/* <div 
    className="absolute inset-0"
    style={{
      backgroundImage: 'url(/noise2.jpg)',
      backgroundRepeat: 'repeat',
      backgroundSize: '50px 50px',
      opacity: 0.5,
      filter: 'brightness(0) invert(1)'
    }}
  ></div> */}
</div>
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
      />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4 relative z-10">
        <div className="container max-w-5xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            variants={container}
            initial="hidden"
            animate="show"
          >
            <motion.h1 
              className="text-4xl md:text-6xl font-bold mb-6 tracking-tight"
              variants={item}
            >
              <span className="gradient-text">Private.</span> <span className="gradient-text">Local.</span> <span className="gradient-text">Secure.</span>
              <br />Client-side image tools. Zero uploads.
            </motion.h1>
            <motion.p 
              className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8"
              variants={item}
            >
              Convert and compress images directly in your browser with complete privacy.
              Your files never leave your device - fast, free, and secure.
            </motion.p>
            {/* <motion.div className="flex flex-col sm:flex-row items-center justify-center gap-4" variants={item}>
              <Button 
                onClick={() => setActiveTab("convert")}
                size="lg"
                className="rounded-full font-medium"
              >
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                onClick={() => setActiveTab("compress")}
                className="rounded-full font-medium"
              >
                Learn More
              </Button>
            </motion.div> */}
          </motion.div>
          
          <motion.div 
            className="relative z-10 bg-card rounded-2xl shadow-xl border border-border/50 overflow-hidden"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <Tabs 
              value={activeTab} 
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsContent value="convert" className="mt-0 p-1">
                <div className="bg-gradient-to-r from-blue-50 to-violet-50 dark:from-blue-950/20 dark:to-violet-950/20 p-8 rounded-xl">
                  <ImageConverter />
                </div>
              </TabsContent>
              <TabsContent value="compress" className="mt-0 p-1">
                <div className="bg-gradient-to-r from-blue-50 to-violet-50 dark:from-blue-950/20 dark:to-violet-950/20 p-8 rounded-xl">
                  <ImageCompressor />
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-16 px-4 z-10">
        <div className="container max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Comprehensive Features</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Powerful tools to handle any image format with ease
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "Image Conversion",
                description: "Convert between multiple image formats with our fast WebAssembly-powered engine",
                icon: <FileImage className="h-8 w-8 text-primary" />
              },
              {
                title: "Image Compression",
                description: "Reduce file sizes while maintaining quality with our advanced algorithms",
                icon: <FileImage className="h-8 w-8 text-primary" />
              },
              {
                title: "Batch Processing",
                description: "Process multiple images at once with our efficient batch processing system",
                icon: <FileImage className="h-8 w-8 text-primary" />
              }
            ].map((feature, index) => (
              <motion.div 
                key={index}
                className="p-6 rounded-xl border border-border/50  bg-[#f7fbff] shadow-[0_10px_20px_rgba(109,120,161,0.3)]"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}

                whileHover={{ scale: 1.02 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
              >
                <div className="mb-4 p-2 inline-block rounded-lg">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      <footer className="py-6 border-t">
        <div className="container max-w-5xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground mb-4 md:mb-0">
            <span className="font-medium gradient-text">imagely</span> - Universal image converter and compressor
          </p>
          <div className="flex gap-4">
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground">Privacy Policy</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground">Terms of Service</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-foreground">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}