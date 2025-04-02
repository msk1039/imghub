"use client";
import { toast } from 'sonner';
import { useState, useEffect } from "react";
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
import { 
  UploadCloud, 
  Download, 
  FileImage,
  X,
  CheckCircle2,
  XCircle,
  Loader2  
} from "lucide-react";
// import { Skeleton } from "@/components/ui/skeleton";
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

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

export default function ImageCompressor() {
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [targetFormat, setTargetFormat] = useState<string>("jpg");
  const [compressedImages, setCompressedImages] = useState<CompressedImage[]>([]);
  const [quality, setQuality] = useState<number>(80);
  const [isLoading, setIsLoading] = useState(false);
  const [wasmLoaded, setWasmLoaded] = useState(false);
  const [wasmModule, setWasmModule] = useState<any>(null);

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
  };

  const handleDownloadZip = async () => {
    const successfulCompressions = compressedImages.filter(img => img.status === 'completed');
    if (successfulCompressions.length === 0) return;
    
    const zip = new JSZip();
    
    // Add each compressed image to the zip
    successfulCompressions.forEach(image => {
      // Get base filename without extension
      const baseName = image.originalName.replace(/\.[^/.]+$/, "");
      const fileName = `${baseName}.${image.format}`;
      zip.file(fileName, image.data);
    });
    
    // Generate and download the zip file
    const content = await zip.generateAsync({ type: 'blob' });
    
    saveAs(content, `compressed-images-${quality}%.zip`);

    // Show toast notification after the zip is created and download starts
    toast.promise(
      // This will resolve when the zip is created and file download starts
      new Promise<void>((resolve) => {
        // Small delay to ensure download has started
        setTimeout(() => resolve(), 500);
      }),
      {
        loading: 'Creating ZIP file...',
        success: 'ZIP file downloaded successfully!',
        error: 'Failed to create ZIP file'
      }
    );
  };

  // Calculate total compression stats
  const totalOriginalSize = selectedImages.reduce((sum, img) => sum + img.file.size, 0);
  const totalCompressedSize = compressedImages
    .filter(img => img.status === 'completed')
    .reduce((sum, img) => sum + img.compressedSize, 0);
  
  const totalCompressionRatio = totalOriginalSize && totalCompressedSize 
    ? Math.round((1 - (totalCompressedSize / totalOriginalSize)) * 100) 
    : 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold">Batch Image Compressor</h1>
        <p className="text-muted-foreground">
          Compress multiple images while maintaining quality
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Upload Section */}
        <Card className="overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="image-upload-compress">Upload Images</Label>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('image-upload-compress')?.click()}
                    className="w-full"
                  >
                    <UploadCloud className="mr-2 h-4 w-4" />
                    Select Images
                  </Button>
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

              <div className="flex flex-col gap-2">
                <Label htmlFor="format-select-compress">Target Format</Label>
                <Select
                  value={targetFormat}
                  onValueChange={setTargetFormat}
                  disabled={selectedImages.length === 0 || isLoading}
                >
                  <SelectTrigger id="format-select-compress">
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

              <div className="flex flex-col gap-2">
                <div className="flex justify-between">
                  <Label htmlFor="quality-slider">Quality: {quality}%</Label>
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
                className="mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Compressing...
                  </>
                ) : (
                  `Compress ${selectedImages.length} ${selectedImages.length === 1 ? 'Image' : 'Images'}`
                )}
              </Button>
            </div>

            {selectedImages.length > 0 && (
              <div className="mt-6">
                <h3 className="text-sm font-medium mb-2">Selected Images ({selectedImages.length})</h3>
                <div className="max-h-[400px] overflow-y-auto pr-1">
                  {selectedImages.map((image) => (
                    <div key={image.id} className="flex items-center justify-between p-2 border rounded-md mb-2">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-muted rounded-md overflow-hidden flex-shrink-0">
                          <img
                            src={image.previewUrl}
                            alt={image.file.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-sm font-medium truncate" title={image.file.name}>
                            {image.file.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {getFileType(image.file)} • {formatFileSize(image.file.size)}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => removeImage(image.id)}
                        disabled={isLoading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Result Section */}
        <Card className="overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="font-medium">Compressed Images</h3>
                <p className="text-sm text-muted-foreground">
                  {compressedImages.length === 0
                    ? "Your compressed images will appear here"
                    : `${compressedImages.filter(img => img.status === 'completed').length} of ${compressedImages.length} images compressed to ${targetFormat.toUpperCase()}`}
                </p>
              </div>

              {totalCompressionRatio > 0 && (
                <div className="bg-muted p-3 rounded-md text-sm">
                  <div className="flex justify-between mb-1">
                    <span>Total compression ratio:</span> 
                    <span className="font-medium">
                      {totalCompressionRatio}% smaller
                    </span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-primary h-full" 
                      style={{ width: `${totalCompressionRatio}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-2 text-xs">
                    <span>Original: {formatFileSize(totalOriginalSize)}</span>
                    <span>Compressed: {formatFileSize(totalCompressedSize)}</span>
                  </div>
                </div>
              )}

              {compressedImages.length > 0 && compressedImages.some(img => img.status === 'completed') && (
                <Button onClick={handleDownloadZip} className="gap-2" disabled={isLoading}>
                  <Download className="h-4 w-4" />
                  Download All as ZIP
                </Button>
              )}
            </div>

            {compressedImages.length > 0 && (
              <div className="mt-4 max-h-[500px] overflow-y-auto pr-1">
                {compressedImages.map((image) => (
                  <div key={image.id} className="flex items-center p-2 border rounded-md mb-2">
                    <div className="flex-1 flex items-center gap-3">
                      <div className="h-8 w-8 flex items-center justify-center flex-shrink-0">
                        {image.status === 'pending' && (
                          <div className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse"></div>
                        )}
                        {image.status === 'compressing' && (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                        {image.status === 'completed' && (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        )}
                        {image.status === 'failed' && (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-medium truncate" title={image.originalName}>
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
                  </div>
                ))}
              </div>
            )}

            {!compressedImages.length && (
              <div className="flex h-[200px] items-center justify-center text-muted-foreground mt-4">
                <div className="flex flex-col items-center">
                  <FileImage className="h-12 w-12 opacity-20 mb-2" />
                  <p className="text-sm">No compressed images yet</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}