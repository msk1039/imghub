"use client";
import { useState, useEffect } from "react";
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { motion } from "framer-motion";
import { 
  UploadCloud, 
  Download, 
  FileImage,
  X,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight
} from "lucide-react";

// These are the formats that support compression
const SUPPORTED_FORMATS = [
  { value: "jpg", label: "JPEG (.jpg)" },
  { value: "png", label: "PNG (.png)" },
  { value: "webp", label: "WebP (.webp)" },
];

interface SelectedImage {
  file: File;
  id: string;
  previewUrl: string;
}

interface CompressedImage {
  id: string;
  originalName: string;
  format: string;
  data: Uint8Array;
  error?: string;
  status: 'pending' | 'compressing' | 'completed' | 'failed';
  originalSize: number;
  compressedSize: number;
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function ImageCompressor() {
  const [isClient, setIsClient] = useState(false);
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [targetFormat, setTargetFormat] = useState<string>("jpg");
  const [compressedImages, setCompressedImages] = useState<CompressedImage[]>([]);
  const [quality, setQuality] = useState<number>(80);
  const [isLoading, setIsLoading] = useState(false);
  const [wasmLoaded, setWasmLoaded] = useState(false);
  const [wasmModule, setWasmModule] = useState<any>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Load WASM module
  useEffect(() => {
    async function loadWasm() {
      try {
        const wasm = await import('@/wasm/pkg/tax_webassembly');
        await wasm.default();
        setWasmModule(wasm);
        setWasmLoaded(true);
      } catch (error) {
        console.error("Failed to load WebAssembly module:", error);
      }
    }

    loadWasm();
  }, []);

  // Clean up preview URLs when component unmounts
  useEffect(() => {
    return () => {
      selectedImages.forEach(image => {
        URL.revokeObjectURL(image.previewUrl);
      });
    };
  }, [selectedImages]);

  // Set isClient to true after component mounts
  useEffect(() => {
    setIsClient(true);
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileType = (file: File): string => {
    return file.type.split('/')[1]?.toUpperCase() || 'Unknown';
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const newImages: SelectedImage[] = Array.from(files).map(file => ({
      file,
      id: `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      previewUrl: URL.createObjectURL(file)
    }));

    setSelectedImages(prev => [...prev, ...newImages]);
    setCompressedImages([]);
    
    // Reset the input so the same files can be selected again
    event.target.value = '';
  };

  const removeImage = (id: string) => {
    setSelectedImages(prev => {
      const imageToRemove = prev.find(image => image.id === id);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.previewUrl);
      }
      return prev.filter(image => image.id !== id);
    });
  };

  const handleCompressAll = async () => {
    if (selectedImages.length === 0 || !wasmLoaded || !wasmModule) return;

    setIsLoading(true);
    toast.info(`Compressing ${selectedImages.length} images with quality: ${quality}%...`);

    // Initialize compression states for all images
    setCompressedImages(selectedImages.map(img => ({
      id: img.id,
      originalName: img.file.name,
      format: targetFormat,
      data: new Uint8Array(),
      status: 'pending',
      originalSize: img.file.size,
      compressedSize: 0
    })));

    // Process each image sequentially
    for (let i = 0; i < selectedImages.length; i++) {
      const image = selectedImages[i];
      
      // Update status to compressing
      setCompressedImages(prev => prev.map(item => 
        item.id === image.id ? {...item, status: 'compressing'} : item
      ));

      try {
        const buffer = await image.file.arrayBuffer();
        const inputArray = new Uint8Array(buffer);
        
        // Call the WASM compress_image function
        const result = wasmModule.compress_image(inputArray, targetFormat, quality);
        
        // Update with compressed data
        setCompressedImages(prev => prev.map(item => 
          item.id === image.id ? {
            ...item, 
            data: result,
            status: 'completed',
            compressedSize: result.length
          } : item
        ));
      } catch (error) {
        console.error(`Error compressing image ${image.file.name}:`, error);
        toast.error(`Error compressing ${image.file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        
        // Mark as failed but continue with other images
        setCompressedImages(prev => prev.map(item => 
          item.id === image.id ? {
            ...item, 
            error: error instanceof Error ? error.message : 'Unknown error',
            status: 'failed'
          } : item
        ));
      }
    }

    setIsLoading(false);
    const successCount = compressedImages.filter(img => img.status === 'completed').length;
    toast.success(`Compressed ${successCount} of ${selectedImages.length} images successfully!`);
  };

  const handleDownloadImages = async () => {
    const successfulCompressions = compressedImages.filter(img => img.status === 'completed');
    if (successfulCompressions.length === 0 || !isClient) return;
    
    try {
      // For single image download
      if (successfulCompressions.length === 1) {
        const image = successfulCompressions[0];
        const blob = new Blob([image.data], { type: `image/${image.format}` });
        
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        
        // Get base filename without extension
        const baseName = image.originalName.replace(/\.[^/.]+$/, "");
        const fileName = `${baseName}.${image.format}`;
        
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
        
        // Clean up
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        toast.success("Image downloaded successfully!");
        return;
      }
      
      // For multiple images, use JSZip but handle it directly in the browser
      toast.info("Creating ZIP file...");
      
      // Dynamic import JSZip only when needed
      const JSZipModule = await import('jszip');
      const JSZip = JSZipModule.default;
      
      // Create a new instance
      const zip = new JSZip();
      
      // Add each compressed image to the zip
      successfulCompressions.forEach(image => {
        // Get base filename without extension
        const baseName = image.originalName.replace(/\.[^/.]+$/, "");
        const fileName = `${baseName}.${image.format}`;
        zip.file(fileName, image.data);
      });
      
      // Generate the zip file content directly
      const content = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });
      
      // Create download link
      const url = URL.createObjectURL(content);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `compressed-images-${quality}%.zip`);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success("ZIP file downloaded successfully!");
    } catch (error) {
      console.error("Error downloading images:", error);
      toast.error("Failed to download images.");
    }
  };

  // Calculate total compression stats
  const totalOriginalSize = selectedImages.reduce((sum, img) => sum + img.file.size, 0);
  const totalCompressedSize = compressedImages
    .filter(img => img.status === 'completed')
    .reduce((sum, img) => sum + img.compressedSize, 0);
  
  const totalCompressionRatio = totalOriginalSize && totalCompressedSize 
    ? Math.round((1 - (totalCompressedSize / totalOriginalSize)) * 100) 
    : 0;

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;
    
    const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      toast.error("Please drop only image files");
      return;
    }
    
    // Create a simulated file input event
    const fileList = imageFiles as unknown as FileList;
    const event = { target: { files: fileList } } as React.ChangeEvent<HTMLInputElement>;
    handleFileChange(event);
  };

  return (
    <motion.div 
      className="flex flex-col gap-8"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.1
          }
        }
      }}
    >
      <motion.div variants={fadeInUp} className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">
          <span className="gradient-text">Image Compressor</span>
        </h1>
        <p className="text-muted-foreground">
          Compress multiple images while maintaining quality with our intelligent algorithms
        </p>
      </motion.div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Upload Section */}
        <motion.div variants={fadeInUp}>
          <Card className="overflow-hidden border-border/50 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-3">
                  <Label htmlFor="image-upload-compress" className="text-lg font-medium">Upload Images</Label>
                  <div 
                    className={`border-2 border-dashed ${isDragging ? 'border-primary' : 'border-border'} rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors`}
                    onClick={() => document.getElementById('image-upload-compress')?.click()}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className={`p-3 rounded-full ${isDragging ? 'bg-primary/20' : 'bg-primary/10'} transition-colors`}>
                        <UploadCloud className="h-8 w-8 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {isDragging ? 'Drop images here' : 'Click to upload or drag and drop'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Support for JPG, PNG, and WebP formats
                        </p>
                      </div>
                      <Button 
                        variant="outline" 
                        className="mt-2 rounded-md border-primary/60 text-primary hover:bg-primary hover:text-white"
                      >
                        Select files
                      </Button>
                    </div>
                    <input
                      id="image-upload-compress"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <Label htmlFor="format-select-compress" className="text-lg font-medium">Target Format</Label>
                  <Select
                    value={targetFormat}
                    onValueChange={setTargetFormat}
                    disabled={selectedImages.length === 0 || isLoading}
                  >
                    <SelectTrigger id="format-select-compress" className="rounded-md w-full h-12">
                      <SelectValue placeholder="Select a format" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPORTED_FORMATS.map((format) => (
                        <SelectItem key={format.value} value={format.value}>
                          {format.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="quality-slider" className="text-lg font-medium">Quality: {quality}%</Label>
                  </div>
                  <Slider
                    id="quality-slider"
                    min={1}
                    max={100}
                    step={1}
                    value={[quality]}
                    onValueChange={(value) => setQuality(value[0])}
                    disabled={selectedImages.length === 0 || isLoading}
                    className="py-4"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Smaller file</span>
                    <span>Better quality</span>
                  </div>
                </div>

                <Button
                  onClick={handleCompressAll}
                  disabled={selectedImages.length === 0 || !wasmLoaded || isLoading}
                  className="mt-2 bg-gradient-to-b h-10 text-md from-[#353f5b] to-[#232a40] hover:shadow-[0_5px_10px_rgba(109,120,161,0.6)] transition-all duration-200"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Compressing...
                    </>
                  ) : (
                    <>
                      Compress {selectedImages.length} {selectedImages.length === 1 ? 'Image' : 'Images'}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>

              {selectedImages.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-medium mb-3">Selected Images ({selectedImages.length})</h3>
                  <div className="max-h-[400px] overflow-y-auto pr-1 space-y-3">
                    {selectedImages.map((image) => (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={image.id} 
                        className="flex items-center p-3 bg-background/50 backdrop-blur-sm rounded-xl border border-border/40"
                      >
                        <div className="h-12 w-12 bg-muted rounded-lg overflow-hidden flex-shrink-0 mr-3">
                          <img
                            src={image.previewUrl}
                            alt={image.file.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="overflow-hidden flex-1 min-w-0">
                          <p className="font-medium truncate" title={image.file.name}>
                            {image.file.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {getFileType(image.file)} • {formatFileSize(image.file.size)}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 rounded-full text-muted-foreground hover:text-destructive flex-shrink-0 ml-2"
                          onClick={() => removeImage(image.id)}
                          disabled={isLoading}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Result Section */}
        <motion.div variants={fadeInUp}>
          <Card className="overflow-hidden border-border/50 shadow-lg hover:shadow-xl transition-shadow h-full">
            <CardContent className="p-6">
              <div className="flex flex-col gap-6 h-full">
                <div>
                  <h3 className="text-lg font-medium">Compressed Images</h3>
                  <p className="text-muted-foreground mt-1">
                    {compressedImages.length === 0
                      ? "Your compressed images will appear here"
                      : `${compressedImages.filter(img => img.status === 'completed').length} of ${compressedImages.length} images compressed to ${targetFormat.toUpperCase()}`}
                  </p>
                </div>

                {totalCompressionRatio > 0 && (
                  <div className="bg-background/50 p-4 rounded-xl border border-border/40 backdrop-blur-sm">
                    <div className="flex justify-between mb-2">
                      <span className="text-sm">Total compression ratio:</span> 
                      <span className="font-medium text-sm">
                        {totalCompressionRatio}% smaller
                      </span>
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${totalCompressionRatio}%` }}
                        transition={{ duration: 1, delay: 0.2 }}
                        className="bg-gradient-to-r from-primary to-blue-500 h-full" 
                      ></motion.div>
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                      <span>Original: {formatFileSize(totalOriginalSize)}</span>
                      <span>Compressed: {formatFileSize(totalCompressedSize)}</span>
                    </div>
                  </div>
                )}

                {compressedImages.length > 0 && compressedImages.some(img => img.status === 'completed') && (
                  <Button 
                    onClick={handleDownloadImages} 
                    className="mt-2 bg-gradient-to-b h-10 text-md from-[#353f5b] to-[#232a40] hover:shadow-[0_5px_10px_rgba(109,120,161,0.6)] transition-all duration-200" 
                    disabled={isLoading}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download {compressedImages.filter(img => img.status === 'completed').length === 1 ? 'Image' : 'All as ZIP'}
                  </Button>
                )}

                {compressedImages.length > 0 ? (
                  <div className="mt-2 max-h-[500px] overflow-y-auto pr-1 space-y-3 flex-grow">
                    {compressedImages.map((image) => (
                      <motion.div 
                        key={image.id} 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center p-3 bg-background/50 backdrop-blur-sm rounded-xl border border-border/40"
                      >
                        <div className="flex-1 flex items-center gap-3">
                          <div className="h-10 w-10 flex items-center justify-center flex-shrink-0 bg-muted/30 rounded-lg">
                            {image.status === 'pending' && (
                              <div className="h-3 w-3 bg-muted-foreground rounded-full animate-pulse"></div>
                            )}
                            {image.status === 'compressing' && (
                              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            )}
                            {image.status === 'completed' && (
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            )}
                            {image.status === 'failed' && (
                              <XCircle className="h-5 w-5 text-destructive" />
                            )}
                          </div>
                          <div className="overflow-hidden">
                            <p className="font-medium truncate" title={image.originalName}>
                              {image.originalName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {image.status === 'completed' 
                                ? `${formatFileSize(image.originalSize)} → ${formatFileSize(image.compressedSize)} (${Math.round((1 - (image.compressedSize / image.originalSize)) * 100)}% smaller)` 
                                : image.status === 'failed'
                                ? image.error || "Compression failed"
                                : image.status === 'compressing'
                                ? "Compressing..."
                                : "Pending..."}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-1 items-center justify-center text-muted-foreground">
                    <div className="flex flex-col items-center gap-4 py-12">
                      <div className="p-5 rounded-full bg-muted/50">
                        <FileImage className="h-12 w-12 opacity-30" />
                      </div>
                      <div className="text-center">
                        <p className="font-medium">No compressed images yet</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Upload and compress your images to see results here
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}