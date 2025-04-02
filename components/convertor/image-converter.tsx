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
import { Skeleton } from "@/components/ui/skeleton";

// These will be the available formats for conversion
const SUPPORTED_FORMATS = [
  { value: "jpg", label: "JPEG (.jpg)" },
  { value: "png", label: "PNG (.png)" },
  { value: "webp", label: "WebP (.webp)" },
  { value: "heic", label: "HEIC (.heic)" },
  { value: "gif", label: "GIF (.gif)" },
  { value: "bmp", label: "BMP (.bmp)" },
  { value: "ico", label: "ICO (.ico)" },
  { value: "tiff", label: "TIFF (.tiff)" },
  { value: "pnm", label: "PNM (.pnm)" },
];

interface SelectedImage {
  file: File;
  id: string; // unique id for each image
  previewUrl: string;
}

interface ConvertedImage {
  id: string;
  originalName: string;
  format: string;
  data: Uint8Array;
  error?: string;
  status: 'pending' | 'converting' | 'completed' | 'failed';
}

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function ImageConverter() {
  const [isClient, setIsClient] = useState(false);
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [targetFormat, setTargetFormat] = useState<string>("png");
  const [convertedImages, setConvertedImages] = useState<ConvertedImage[]>([]);
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

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Process files
    const processFiles = async () => {
      const newImages: SelectedImage[] = [];
      
      for (const file of files) {
        let previewUrl;
        
        // Handle HEIC files specially for preview if in client environment
        if ((file.type.includes('heic') || file.name.toLowerCase().endsWith('.heic')) && isClient) {
          try {
            // Import heic2any dynamically when needed
            const heic2any = (await import('heic2any')).default;
            const blob = new Blob([await file.arrayBuffer()], { type: 'image/heic' });
            const jpegBlob = await heic2any({
              blob,
              toType: 'image/jpeg',
              quality: 0.8
            }) as Blob;
            
            previewUrl = URL.createObjectURL(jpegBlob);
          } catch (error) {
            console.error('Failed to convert HEIC for preview:', error);
            // Fallback to standard preview
            previewUrl = URL.createObjectURL(file);
          }
        } else {
          // Normal preview for other formats
          previewUrl = URL.createObjectURL(file);
        }
        
        newImages.push({
          file,
          id: `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          previewUrl
        });
      }

      setSelectedImages(prev => [...prev, ...newImages]);
      setConvertedImages([]);
    };
    
    await processFiles();
    
    // Reset the input so the same file can be selected again
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

  const handleConvertAll = async () => {
    if (selectedImages.length === 0 || !wasmLoaded || !wasmModule || !isClient) return;

    setIsLoading(true);
    toast.info(`Converting ${selectedImages.length} images to ${targetFormat.toUpperCase()}...`);

    // Initialize conversion states for all images
    setConvertedImages(selectedImages.map(img => ({
      id: img.id,
      originalName: img.file.name,
      format: targetFormat,
      data: new Uint8Array(),
      status: 'pending'
    })));

    // Process each image sequentially
    for (let i = 0; i < selectedImages.length; i++) {
      const image = selectedImages[i];
      
      // Update status to converting
      setConvertedImages(prev => prev.map(item => 
        item.id === image.id ? {...item, status: 'converting'} : item
      ));

      try {
        // Handle HEIC input specially
        if (image.file.type.includes('heic') || image.file.name.toLowerCase().endsWith('.heic')) {
          try {
            // Convert HEIC to JPEG first using heic2any
            const buffer = await image.file.arrayBuffer();
            const heicBlob = new Blob([buffer], { type: 'image/heic' });
            
            const heic2any = (await import('heic2any')).default;

              // Use heic2any to convert to JPEG
              const jpegBlob = await heic2any({
                blob: heicBlob,
                toType: "image/jpeg",
                quality: 0.9
              }) as Blob;
            
            const jpegBuffer = await jpegBlob.arrayBuffer();
            
            if (targetFormat === 'heic') {
              // If target is also HEIC, just use the original
              setConvertedImages(prev => prev.map(item => 
                item.id === image.id ? {
                  ...item, 
                  data: new Uint8Array(buffer),
                  status: 'completed'
                } : item
              ));
            } else {
              // Convert the JPEG to the target format using WASM
              const result = wasmModule.convert_image(new Uint8Array(jpegBuffer), targetFormat);
              
              setConvertedImages(prev => prev.map(item => 
                item.id === image.id ? {
                  ...item, 
                  data: result,
                  status: 'completed'
                } : item
              ));
            }
            
            continue;
          } catch (error) {
            console.error("HEIC handling error:", error);
            throw new Error(`HEIC conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }

        const buffer = await image.file.arrayBuffer();
        const inputArray = new Uint8Array(buffer);
        
        // Call the WASM convert_image function
        const result = wasmModule.convert_image(inputArray, targetFormat);
        
        // Update with converted data
        setConvertedImages(prev => prev.map(item => 
          item.id === image.id ? {
            ...item, 
            data: result,
            status: 'completed'
          } : item
        ));
      } catch (error) {
        console.error(`Error converting image ${image.file.name}:`, error);
        toast.error(`Error converting ${image.file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        
        // Mark as failed but continue with other images
        setConvertedImages(prev => prev.map(item => 
          item.id === image.id ? {
            ...item, 
            error: error instanceof Error ? error.message : 'Unknown error',
            status: 'failed'
          } : item
        ));
      }
    }

    setIsLoading(false);
    const successCount = convertedImages.filter(img => img.status === 'completed').length;
    toast.success(`Converted ${successCount} of ${selectedImages.length} images successfully!`);
  };

  const handleDownloadZip = async () => {
    const successfulConversions = convertedImages.filter(img => img.status === 'completed');
    if (successfulConversions.length === 0 || !isClient) return;
    
    try {
      toast.info("Creating ZIP file...");
      
      // Dynamic imports inside the function where they're used
      const JSZip = (await import('jszip')).default;
      const { saveAs } = await import('file-saver');
      
      const zip = new JSZip();
      
      // Add each converted image to the zip
      successfulConversions.forEach(image => {
        // Get base filename without extension
        const baseName = image.originalName.replace(/\.[^/.]+$/, "");
        const fileName = `${baseName}.${image.format}`;
        zip.file(fileName, image.data);
      });
      
      // Generate and download the zip file
      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, `converted-images-${targetFormat}.zip`);
      
      toast.success("ZIP file downloaded successfully!");
    } catch (error) {
      console.error("Error creating ZIP file:", error);
      toast.error("Failed to create ZIP file.");
    }
  };

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
          <span className="gradient-text">Image Converter</span>
        </h1>
        <p className="text-muted-foreground">
          Convert multiple images to different formats with our fast WebAssembly-powered converter
        </p>
      </motion.div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Upload Section */}
        <motion.div variants={fadeInUp}>
          <Card className="overflow-hidden border-border/50 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-3">
                  <Label htmlFor="image-upload" className="text-lg font-medium">Upload Images</Label>
                  <div 
                    className={`border-2 border-dashed ${isDragging ? 'border-primary' : 'border-border'} rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors`}
                    onClick={() => document.getElementById('image-upload')?.click()}
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
                          Support for JPG, PNG, WebP, HEIC and more
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
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <Label htmlFor="format-select" className="text-lg font-medium">Target Format</Label>
                  <Select
                    value={targetFormat}
                    onValueChange={setTargetFormat}
                    disabled={selectedImages.length === 0 || isLoading}
                  >
                    <SelectTrigger id="format-select" className="rounded-md w-full h-12">
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

                <Button
                  onClick={handleConvertAll}
                  disabled={selectedImages.length === 0 || !wasmLoaded || isLoading}
                  className="mt-2 bg-gradient-to-b h-10 text-md from-[#353f5b] to-[#232a40] hover:shadow-[0_5px_10px_rgba(109,120,161,0.6)] transition-all duration-200"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Converting...
                    </>
                  ) : (
                    <>
                      Convert {selectedImages.length} {selectedImages.length === 1 ? 'Image' : 'Images'}
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
                  <h3 className="text-lg font-medium">Converted Images</h3>
                  <p className="text-muted-foreground mt-1">
                    {convertedImages.length === 0
                      ? "Your converted images will appear here"
                      : `${convertedImages.filter(img => img.status === 'completed').length} of ${convertedImages.length} images converted to ${targetFormat.toUpperCase()}`}
                  </p>
                </div>

                {convertedImages.length > 0 && convertedImages.some(img => img.status === 'completed') && (
                  <Button 
                    onClick={handleDownloadZip} 
                    className="mt-2 bg-gradient-to-b h-10 text-md from-[#353f5b] to-[#232a40] hover:shadow-[0_5px_10px_rgba(109,120,161,0.6)] transition-all duration-200" 
                    disabled={isLoading}
                  >
                    <Download className="h-4 w-4" />
                    Download All as ZIP
                  </Button>
                )}

                {convertedImages.length > 0 ? (
                  <div className="mt-2 max-h-[500px] overflow-y-auto pr-1 space-y-3 flex-grow">
                    {convertedImages.map((image) => (
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
                            {image.status === 'converting' && (
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
                                ? `Converted to ${image.format.toUpperCase()} • ${formatFileSize(image.data.length)}` 
                                : image.status === 'failed'
                                ? image.error || "Conversion failed"
                                : image.status === 'converting'
                                ? "Converting..."
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
                        <p className="font-medium">No converted images yet</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Upload and convert your images to see results here
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