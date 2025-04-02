use wasm_bindgen::prelude::*;
use image::{ImageOutputFormat, load_from_memory, DynamicImage};

#[wasm_bindgen]
pub fn convert_image(input_data: &[u8], format: &str) -> Result<Vec<u8>, JsValue> {
    // Load the image from the input bytes
    let img = match load_from_memory(input_data) {
        Ok(img) => img,
        Err(e) => return Err(JsValue::from_str(&format!("Failed to load image: {}", e))),
    };
    
    // Create a buffer to store the output
    let mut output_buffer = Vec::new();
    
    // Convert to the requested format
    let result = match format {
        "jpg" | "jpeg" => {
            let mut buffer = std::io::Cursor::new(&mut output_buffer);
            img.write_to(&mut buffer, ImageOutputFormat::Jpeg(85))
        },
        "png" => {
            let mut buffer = std::io::Cursor::new(&mut output_buffer);
            img.write_to(&mut buffer, ImageOutputFormat::Png)
        },
        "gif" => {
            let mut buffer = std::io::Cursor::new(&mut output_buffer);
            img.write_to(&mut buffer, ImageOutputFormat::Gif)
        },
        "webp" => {
            let mut buffer = std::io::Cursor::new(&mut output_buffer);
            img.write_to(&mut buffer, ImageOutputFormat::WebP)
        },
        "bmp" => {
            let mut buffer = std::io::Cursor::new(&mut output_buffer);
            img.write_to(&mut buffer, ImageOutputFormat::Bmp)
        },
        "ico" => {
            let mut buffer = std::io::Cursor::new(&mut output_buffer);
            img.write_to(&mut buffer, ImageOutputFormat::Ico)
        },
        "tiff" => {
            let mut buffer = std::io::Cursor::new(&mut output_buffer);
            img.write_to(&mut buffer, ImageOutputFormat::Tiff)
        },
        "pnm" => {
            let mut buffer = std::io::Cursor::new(&mut output_buffer);
            img.write_to(&mut buffer, ImageOutputFormat::Pnm(image::codecs::pnm::PnmSubtype::Pixmap(image::codecs::pnm::SampleEncoding::Binary)))
        },
        "heic" => {
            // HEIC format is not natively supported by the image crate
            // We need to convert to a common format and then to HEIC
            return Err(JsValue::from_str("HEIC conversion is handled on the frontend side"))
        },
        _ => return Err(JsValue::from_str("Unsupported output format. Please select a valid format."))
    };
    
    // Check if conversion was successful
    match result {
        Ok(_) => Ok(output_buffer),
        Err(e) => Err(JsValue::from_str(&format!("Failed to convert image: {}", e))),
    }
}

#[wasm_bindgen]
pub fn compress_image(input_data: &[u8], format: &str, quality: u8) -> Result<Vec<u8>, JsValue> {
    // Load the image from the input bytes
    let img = match load_from_memory(input_data) {
        Ok(img) => img,
        Err(e) => return Err(JsValue::from_str(&format!("Failed to load image: {}", e))),
    };
    
    // Create a buffer to store the output
    let mut output_buffer = Vec::new();
    
    // Ensure quality is between 1 and 100
    let quality = quality.clamp(1, 100);
    
    // Convert and compress based on format
    let result = match format {
        "jpg" | "jpeg" => {
            let mut buffer = std::io::Cursor::new(&mut output_buffer);
            img.write_to(&mut buffer, ImageOutputFormat::Jpeg(quality))
        },
        "png" => {
            // PNG doesn't support lossy compression, so we'll just convert
            let mut buffer = std::io::Cursor::new(&mut output_buffer);
            img.write_to(&mut buffer, ImageOutputFormat::Png)
        },
        "webp" => {
            // WebP with quality parameter
            let mut buffer = std::io::Cursor::new(&mut output_buffer);
            img.write_to(&mut buffer, ImageOutputFormat::WebP)
        },
        "heic" => {
            // HEIC format is not natively supported by the image crate
            return Err(JsValue::from_str("HEIC compression is handled on the frontend side"))
        },
        _ => return Err(JsValue::from_str("Compression is only supported for JPEG, PNG, WebP, and HEIC formats."))
    };
    
    // Check if compression was successful
    match result {
        Ok(_) => Ok(output_buffer),
        Err(e) => Err(JsValue::from_str(&format!("Failed to compress image: {}", e))),
    }
}

#[wasm_bindgen]
pub fn resize_image(input_data: &[u8], format: &str, scale_percentage: u8) -> Result<Vec<u8>, JsValue> {
    // Load the image from the input bytes
    let img = match load_from_memory(input_data) {
        Ok(img) => img,
        Err(e) => return Err(JsValue::from_str(&format!("Failed to load image: {}", e))),
    };
    
    // Ensure scale percentage is between 1 and 100
    let scale_factor = (scale_percentage.clamp(1, 100) as f32) / 100.0;
    
    // Calculate new dimensions
    let new_width = (img.width() as f32 * scale_factor) as u32;
    let new_height = (img.height() as f32 * scale_factor) as u32;
    
    // Resize the image
    let resized_img = img.resize(new_width, new_height, image::imageops::FilterType::Lanczos3);
    
    // Create a buffer to store the output
    let mut output_buffer = Vec::new();
    
    // Convert to the requested format
    let result = match format {
        "jpg" | "jpeg" => {
            let mut buffer = std::io::Cursor::new(&mut output_buffer);
            resized_img.write_to(&mut buffer, ImageOutputFormat::Jpeg(85))
        },
        "png" => {
            let mut buffer = std::io::Cursor::new(&mut output_buffer);
            resized_img.write_to(&mut buffer, ImageOutputFormat::Png)
        },
        "webp" => {
            let mut buffer = std::io::Cursor::new(&mut output_buffer);
            resized_img.write_to(&mut buffer, ImageOutputFormat::WebP)
        },
        "gif" => {
            let mut buffer = std::io::Cursor::new(&mut output_buffer);
            resized_img.write_to(&mut buffer, ImageOutputFormat::Gif)
        },
        "bmp" => {
            let mut buffer = std::io::Cursor::new(&mut output_buffer);
            resized_img.write_to(&mut buffer, ImageOutputFormat::Bmp)
        },
        _ => return Err(JsValue::from_str("Unsupported format for resizing."))
    };
    
    // Check if resizing was successful
    match result {
        Ok(_) => Ok(output_buffer),
        Err(e) => Err(JsValue::from_str(&format!("Failed to resize image: {}", e))),
    }
}