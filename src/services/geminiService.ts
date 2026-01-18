import { GoogleGenerativeAI } from "@google/generative-ai";

// Helper to convert File to URL
function fileToUrl(file: File): string {
  return URL.createObjectURL(file);
}

// Initialize Gemini client
let genAI: GoogleGenerativeAI | null = null;

/**
 * Initialize the Gemini AI client with API key
 */
export function initializeGemini(apiKey: string) {
  genAI = new GoogleGenerativeAI(apiKey);
}

/**
 * Convert image file to base64
 */
async function imageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Convert image file to Gemini-compatible format
 */
async function fileToGenerativePart(file: File): Promise<{
  inlineData: { data: string; mimeType: string };
}> {
  const base64Data = await imageToBase64(file);
  return {
    inlineData: {
      data: base64Data,
      mimeType: file.type,
    },
  };
}

export interface ImageInputs {
  scene?: File; // Optional
  model: File; // Required
  clothing: File; // Required
}

// Legacy interface - kept for backward compatibility
export interface GeneratedScenario {
  theme: string;
  description: string;
  pose1: string;
  pose2: string;
}

export interface GeneratedScenarioV2 {
  theme: string;
  description: string;
  poses: Array<{
    name: string;
    description: string;
  }>;
}

export interface DetailedDescription {
  modelDescription: string; // Mô tả CỰC KỲ chi tiết về model
  clothingDescription: string; // Mô tả CỰC KỲ chi tiết về sản phẩm
  backgroundDescription: string; // Mô tả chi tiết về background
  theme: string; // Phong cách chụp
  poses: Array<{
    name: string;
    description: string;
  }>;
}

export interface GeneratedImageResult {
  setNumber: number;
  theme: string;
  variation1: {
    prompt: string;
    imageUrl?: string;
    base64?: string;
  };
  variation2: {
    prompt: string;
    imageUrl?: string;
    base64?: string;
  };
}

export interface GeneratedImageResultV2 {
  theme: string;
  description: string;
  images: Array<{
    poseName: string;
    prompt: string;
    imageUrl?: string;
    base64?: string;
  }>;
}

/**
 * BƯỚC 1: Dùng Gemini Vision để MÔ TẢ CỰC KỲ CHI TIẾT
 * Đây là bước QUAN TRỌNG NHẤT vì text-to-image không nhìn thấy ảnh gốc
 */
export async function analyzeImagesInDetail(
  inputs: ImageInputs,
): Promise<DetailedDescription> {
  if (!genAI) {
    throw new Error("Gemini AI not initialized. Please provide API key first.");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

  const imageParts = [];
  if (inputs.scene) {
    imageParts.push(await fileToGenerativePart(inputs.scene));
  }
  imageParts.push(await fileToGenerativePart(inputs.model));
  imageParts.push(await fileToGenerativePart(inputs.clothing));

  const analysisPrompt = `Bạn là chuyên gia phân tích hình ảnh. Nhiệm vụ: MÔ TẢ CỰC KỲ CHI TIẾT các hình ảnh để AI text-to-image có thể TÁI TẠO CHÍNH XÁC 100%.

QUAN TRỌNG: AI tạo ảnh KHÔNG NHÌN THẤY ảnh gốc, chỉ đọc text. Bạn PHẢI mô tả từng chi tiết nhỏ nhất.

Phân tích ${inputs.scene ? "3" : "2"} hình ảnh:
${inputs.scene ? "1. Background/Scene\n" : ""}${inputs.scene ? "2" : "1"}. Model (người mẫu)
${inputs.scene ? "3" : "2"}. Clothing/Product (sản phẩm quần áo)

YÊU CẦU MÔ TẢ:

A. MODEL (Người mẫu) - MÔ TẢ CỰC KỲ CHI TIẾT:
- Giới tính, độ tuổi ước tính (VD: "Asian woman, approximately 25 years old")
- Sắc tộc và tone màu da CHÍNH XÁC (VD: "East Asian, fair porcelain skin tone", "Southeast Asian, warm medium tan skin")
- Khuôn mặt: hình dáng (oval/round/heart-shaped), đặc điểm nổi bật
- Mắt: hình dạng, màu sắc, khoảng cách, có makeup không
- Mũi: cao/thấp, dáng mũi
- Môi: dày/mỏng, màu sắc
- Tóc: màu sắc CHÍNH XÁC, độ dài, kiểu tóc, texture (straight/wavy/curly)
- Dáng người: chiều cao ước tính, cân nặng, body type (slim/athletic/curvy)
- Phong cách tổng thể

B. CLOTHING (Sản phẩm) - MÔ TẢ CỰC KỲ CHI TIẾT:
- Loại quần áo (shirt/dress/jacket/pants...)
- Màu sắc CHÍNH XÁC (dùng tên màu cụ thể: "coral pink", "navy blue", "emerald green")
- Họa tiết/pattern: stripes/floral/solid/geometric - mô tả kích thước, màu sắc họa tiết
- Chất liệu: cotton/silk/denim/leather - texture, độ bóng/mờ
- Kiểu dáng: oversized/fitted/loose/tailored
- Chi tiết: cổ áo (round/V-neck/collar), tay áo (long/short/sleeveless), nút, túi, zipper
- Đặc điểm ĐẶC BIỆT: logo, embroidery, prints, unique design elements
- Nếu là bản vẽ/sketch: mô tả design và đề xuất màu sắc phù hợp

C. BACKGROUND ${inputs.scene ? "" : "(nếu không có ảnh, tạo background phù hợp)"}:
- Loại môi trường: studio/outdoor/urban/nature
- Màu sắc chủ đạo của background
- Ánh sáng: natural/studio/golden hour/soft diffused
- Chi tiết môi trường: props, furniture, architecture
- Tone màu tổng thể: warm/cool/neutral

D. THEME & POSES:
- Chọn 1 theme phù hợp (High Fashion/Street Style/Editorial/Commercial)
- Tạo 3 poses: Front view, Side/Three-quarter view, Back view

Trả về JSON format:
{
  "modelDescription": "MÔ TẢ CỰC KỲ CHI TIẾT về model (bằng tiếng Anh, 150-200 từ, tập trung vào đặc điểm nhận dạng: face shape, eye shape and color, nose, lips, skin tone, hair color and style, body type, height estimate)",
  "clothingDescription": "MÔ TẢ CỰC KỲ CHI TIẾT về sản phẩm (bằng tiếng Anh, 150-200 từ, tập trung vào: exact garment type, precise colors with color names, patterns with sizes and colors, material and texture, fit and silhouette, neckline, sleeves, closures, pockets, unique design elements)",
  "backgroundDescription": "MÔ TẢ CHI TIẾT background (bằng tiếng Anh, 80-100 từ)",
  "theme": "Tên theme",
  "poses": [
    {"name": "Front View", "description": "Chi tiết pose góc trước"},
    {"name": "Side View", "description": "Chi tiết pose góc nghiêng"},
    {"name": "Back View", "description": "Chi tiết pose góc sau"}
  ]
}

CHỈ trả về JSON, KHÔNG có text khác.`;

  try {
    const result = await model.generateContent([analysisPrompt, ...imageParts]);
    const response = result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse analysis from Gemini response");
    }

    const description: DetailedDescription = JSON.parse(jsonMatch[0]);
    
    if (!description.modelDescription || !description.clothingDescription || 
        !description.poses || description.poses.length !== 3) {
      throw new Error("Invalid analysis format");
    }

    console.log("=== DETAILED DESCRIPTIONS ===");
    console.log("Model:", description.modelDescription);
    console.log("Clothing:", description.clothingDescription);
    console.log("Background:", description.backgroundDescription);

    return description;
  } catch (error: any) {
    console.error("Error analyzing images:", error);
    throw new Error(`Failed to analyze images: ${error.message}`);
  }
}

// Legacy function for backward compatibility
export async function generateScenarios(
  inputs: ImageInputs,
): Promise<GeneratedScenarioV2> {
  const detailed = await analyzeImagesInDetail(inputs);
  return {
    theme: detailed.theme,
    description: `Model: ${detailed.modelDescription.substring(0, 100)}... | Clothing: ${detailed.clothingDescription.substring(0, 100)}...`,
    poses: detailed.poses,
  };
}

export interface PromptContext {
  productName?: string;
  productDescription?: string;
  modelDescription?: string; // Description of selected model (ethnicity, body type, style)
  backgroundDescription?: string; // Description of selected background
  backgroundCategory?: string;
}

/**
 * Hàm generate image với Gemini text-to-image
 */
async function generateImageWithGemini(
  prompt: string,
  apiKey: string,
  aspectRatio: "1:1" | "2:3" | "3:2" | "3:4" | "4:3" | "4:5" | "5:4" | "9:16" | "16:9" | "21:9",
  imageSize: "1K" | "2K" | "4K",
): Promise<{ base64: string; dataUrl: string }> {
  
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          imageConfig: { aspectRatio, imageSize },
        },
      }),
    },
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Failed to generate image: ${response.status} ${errorData.error?.message || ""}`);
  }

  const data = await response.json();
  const imagePart = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
  
  if (!imagePart?.inlineData) {
    throw new Error("No image data in response");
  }

  const base64Data = imagePart.inlineData.data;
  const mimeType = imagePart.inlineData.mimeType || "image/png";
  
  return {
    base64: base64Data,
    dataUrl: `data:${mimeType};base64,${base64Data}`,
  };
}

/**
 * Generate a single image using Nano Banana Pro (gemini-3-pro-image-preview)
 * Legacy function - kept for backward compatibility
 */
export async function generateImageWithNanoBanana(
  prompt: string,
  apiKey: string,
  aspectRatio: "1:1" | "2:3" | "3:2" | "3:4" | "4:3" | "4:5" | "5:4" | "9:16" | "16:9" | "21:9" = "1:1",
  imageSize: "1K" | "2K" | "4K" = "2K",
): Promise<{ base64: string; dataUrl: string }> {
  return generateImageWithGemini(prompt, apiKey, aspectRatio, imageSize);
}

/**
 * BƯỚC 2: Tạo SEED IMAGE (ảnh đầu tiên) với mô tả chi tiết
 */
async function generateSeedImage(
  description: DetailedDescription,
  pose: { name: string; description: string },
  apiKey: string,
  aspectRatio: "1:1" | "2:3" | "3:2" | "3:4" | "4:3" | "4:5" | "5:4" | "9:16" | "16:9" | "21:9",
  imageSize: "1K" | "2K" | "4K",
): Promise<{ base64: string; dataUrl: string }> {
  
  // Tạo prompt CỰC KỲ chi tiết từ mô tả
  const seedPrompt = `Professional fashion photography, ${description.theme} style.

CRITICAL: Generate EXACTLY this specific person and outfit:

MODEL DESCRIPTION (MUST MATCH EXACTLY):
${description.modelDescription}

CLOTHING DESCRIPTION (MUST MATCH EXACTLY):
${description.clothingDescription}

BACKGROUND:
${description.backgroundDescription}

POSE:
${pose.description}

IMPORTANT CONSISTENCY REQUIREMENTS:
- The model MUST have ALL the physical features described above (face shape, eyes, nose, lips, skin tone, hair)
- The outfit MUST match ALL details described (exact colors, patterns, design, materials)
- Use the EXACT background described
- Professional fashion photography quality, 4K resolution, cinematic lighting
- The model should look natural and realistic, not cartoon or illustration

Photography specifications:
- Camera: Full-frame DSLR, 85mm portrait lens
- Lighting: Professional studio lighting or natural light as specified
- Focus: Sharp focus on model and outfit
- Style: High-end fashion editorial photography`;

  return await generateImageWithGemini(seedPrompt, apiKey, aspectRatio, imageSize);
}

/**
 * BƯỚC 3: Tạo các ảnh tiếp theo bằng cách EDIT seed image
 * Chỉ thay đổi pose, giữ nguyên model và outfit
 */
async function generateVariationFromSeed(
  seedImageBase64: string,
  description: DetailedDescription,
  newPose: { name: string; description: string },
  apiKey: string,
  aspectRatio: "1:1" | "2:3" | "3:2" | "3:4" | "4:3" | "4:5" | "5:4" | "9:16" | "16:9" | "21:9",
  imageSize: "1K" | "2K" | "4K",
): Promise<{ base64: string; dataUrl: string }> {
  
  const editPrompt = `Professional fashion photography.

CRITICAL: Keep EXACTLY the same person and outfit from the reference image. ONLY change the pose.

WHAT TO KEEP (DO NOT CHANGE):
- Same model: exact same face, same skin tone, same hair, same body type
- Same outfit: exact same clothing design, colors, patterns, materials
- Same background and lighting setup

WHAT TO CHANGE:
New pose: ${newPose.description}

CONSISTENCY IS CRITICAL:
- The person's face MUST be identical to the reference image
- The clothing MUST be identical to the reference image
- ONLY the body pose and camera angle should change
- Maintain professional fashion photography quality, 4K resolution`;

  // Gemini edit API (nếu có)
  // Hiện tại Gemini chưa có image editing API tốt
  // Workaround: Generate lại với prompt emphasize consistency
  const fullPrompt = `${editPrompt}

REFERENCE DETAILS (for consistency):
Model: ${description.modelDescription}
Clothing: ${description.clothingDescription}
Background: ${description.backgroundDescription}`;

  return await generateImageWithGemini(fullPrompt, apiKey, aspectRatio, imageSize);
}

/**
 * Step 3: Generate images using Nano Banana Pro (gemini-3-pro-image-preview) with prompts
 * New version: Generates 3 images from 1 scenario (consistent model, outfit, background)
 */
export async function generateImagesWithNanoBanana(
  prompts: string[],
  apiKey: string,
  scenario: GeneratedScenarioV2,
  aspectRatio: "1:1" | "2:3" | "3:2" | "3:4" | "4:3" | "4:5" | "5:4" | "9:16" | "16:9" | "21:9" = "1:1",
  imageSize: "1K" | "2K" | "4K" = "2K",
): Promise<GeneratedImageResultV2> {
  // This function is kept for backward compatibility but now uses the new workflow
  // It requires DetailedDescription instead of just scenario
  throw new Error("This function requires DetailedDescription. Use generateFashionPhotoshoot instead.");
}

/**
 * Step 3 (Alternative): Generate images using try-on API with prompts
 * @deprecated Consider using generateImagesWithNanoBanana instead for prompt-based generation
 * Note: This function is kept for backward compatibility but is not fully implemented
 */
export async function generateImagesWithPrompts(
  prompts: string[],
  modelImage: File,
  clothingImage: File,
  scenarios: GeneratedScenario[],
): Promise<GeneratedImageResult[]> {
  const results: GeneratedImageResult[] = [];
  
  // Convert files to URLs
  const modelImageUrl = fileToUrl(modelImage);
  const clothingImageUrl = fileToUrl(clothingImage);

  // Note: This function is not fully implemented as we use Nano Banana for image generation
  // This function is deprecated and not implemented
  // Use generateImagesWithNanoBanana instead which uses Gemini API
  console.warn("generateImagesWithPrompts is deprecated. Use generateImagesWithNanoBanana instead.");
  
  for (let i = 0; i < prompts.length; i += 2) {
    const setNumber = Math.floor(i / 2) + 1;
    const scenario = scenarios[setNumber - 1];
    
    // Return prompts without images since this function is not implemented
    results.push({
      setNumber,
      theme: scenario.theme,
      variation1: {
        prompt: prompts[i],
      },
      variation2: {
        prompt: prompts[i + 1],
      },
    });
  }

  return results;
}

export interface ImageGenerationOptions {
  useNanoBanana?: boolean; // Use Nano Banana Pro for image generation (default: true)
  aspectRatio?: "1:1" | "2:3" | "3:2" | "3:4" | "4:3" | "4:5" | "5:4" | "9:16" | "16:9" | "21:9";
  imageSize?: "1K" | "2K" | "4K"; // Image resolution (default: 2K for gemini-3-pro-image-preview)
  promptContext?: PromptContext; // Context for generating better prompts with product/model/background info
}

/**
 * WORKFLOW HOÀN CHỈNH
 * BƯỚC 1: Phân tích chi tiết -> BƯỚC 2: Tạo seed image -> BƯỚC 3: Tạo variations
 */
export async function generateFashionPhotoshoot(
  inputs: ImageInputs,
  apiKey: string,
  options: ImageGenerationOptions = {},
): Promise<{
  scenario: GeneratedScenarioV2;
  prompts: string[];
  structuredResults: GeneratedImageResultV2;
}> {
  
  if (!genAI) {
    initializeGemini(apiKey);
  }

  const { aspectRatio = "2:3", imageSize = "2K" } = options;

  console.log("Step 1: Analyzing images in extreme detail...");
  const description = await analyzeImagesInDetail(inputs);

  console.log("Step 2: Generating seed image (first pose)...");
  const seedImage = await generateSeedImage(
    description,
    description.poses[0],
    apiKey,
    aspectRatio,
    imageSize,
  );

  const images: Array<{
    poseName: string;
    prompt: string;
    imageUrl?: string;
    base64?: string;
  }> = [
    {
      poseName: description.poses[0].name,
      prompt: `Seed image - ${description.poses[0].description}`,
      base64: seedImage.base64,
      imageUrl: seedImage.dataUrl,
    },
  ];

  console.log("Step 3: Generating variation images (keeping same model & outfit)...");
  for (let i = 1; i < description.poses.length; i++) {
    try {
      // Tạo variation từ seed với prompt nhấn mạnh consistency
      const variation = await generateVariationFromSeed(
        seedImage.base64,
        description,
        description.poses[i],
        apiKey,
        aspectRatio,
        imageSize,
      );

      images.push({
        poseName: description.poses[i].name,
        prompt: description.poses[i].description,
        base64: variation.base64,
        imageUrl: variation.dataUrl,
      });
    } catch (error) {
      console.error(`Error generating pose ${i + 1}:`, error);
      images.push({
        poseName: description.poses[i].name,
        prompt: description.poses[i].description,
      });
    }
  }

  // Convert DetailedDescription to GeneratedScenarioV2 for compatibility
  const scenario: GeneratedScenarioV2 = {
    theme: description.theme,
    description: `Model: ${description.modelDescription.substring(0, 100)}... | Outfit: ${description.clothingDescription.substring(0, 100)}...`,
    poses: description.poses,
  };

  const structuredResults: GeneratedImageResultV2 = {
    theme: description.theme,
    description: `Model: ${description.modelDescription.substring(0, 100)}... | Outfit: ${description.clothingDescription.substring(0, 100)}...`,
    images,
  };

  // Generate prompts for backward compatibility
  const prompts = images.map(img => img.prompt);

  return {
    scenario,
    prompts,
    structuredResults,
  };
}