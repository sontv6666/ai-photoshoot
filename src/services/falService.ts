import * as fal from "@fal-ai/serverless-client";

// Initialize the fal client with your API key
// The API key should be stored in an environment variable in production
fal.config({
  credentials: import.meta.env.VITE_FAL_KEY || "fal_key_placeholder",
});

// Log to verify the API key is being loaded correctly
console.log(
  "FAL API Key configured:",
  import.meta.env.VITE_FAL_KEY ? "Key is set" : "Key is not set",
);

// Interface for the try-on request parameters
export interface TryOnRequest {
  modelImage: string; // URL of the model image
  garmentImage: string; // URL of the garment/product image
}

// Interface for the try-on response
export interface TryOnResponse {
  image: string; // URL or base64 of the generated image
  id: string; // ID of the generation
}

/**
 * Performs a virtual try-on using the fal.ai API
 * @param params The parameters for the try-on request
 * @returns Promise with the try-on result
 */
export async function performTryOn(
  params: TryOnRequest,
): Promise<TryOnResponse> {
  try {
    // Check if API key is set
    if (!import.meta.env.VITE_FAL_KEY || import.meta.env.VITE_FAL_KEY === "fal_key_placeholder") {
      throw new Error(
        "FAL API key not configured. Please set VITE_FAL_KEY environment variable. " +
        "Get your API key from https://fal.ai/dashboard. " +
        "Note: Virtual try-on feature requires a valid FAL API key."
      );
    }

    // Try different fal.ai models for virtual try-on
    // Note: Model names may change - check https://fal.ai/models for current models
    const modelsToTry = [
      { name: "fal-ai/vit-suv-dev", params: { model_url: params.modelImage, garment_url: params.garmentImage } },
      { name: "fal-ai/ootdiffusion", params: { model_url: params.modelImage, garment_url: params.garmentImage } },
      // Try original params as fallback
      { name: "fal-ai/vit-suv-dev", params: { model_image: params.modelImage, garment_image: params.garmentImage } },
    ];

    let lastError: any = null;
    
    for (const { name: modelName, params: modelParams } of modelsToTry) {
      try {
        console.log(`Attempting to use fal.ai model: ${modelName}`);
        
        // Call the fal.ai API
        const result = await fal.run(modelName, {
          input: modelParams,
        }) as any;

        // Extract image from result (different models may return different structures)
        const imageUrl = result.output?.image?.url || 
                        result.output?.image || 
                        result.output?.result?.image ||
                        result.image?.url ||
                        result.image ||
                        result.data?.image?.url ||
                        result.data?.image ||
                        "";

        if (!imageUrl) {
          throw new Error("No image URL found in response");
        }

        // Return the processed result
        return {
          image: imageUrl,
          id: result.id || result.request_id || result.requestId || `tryon-${Date.now()}`,
        };
      } catch (error: any) {
        lastError = error;
        const errorMsg = error?.message || String(error);
        const errorStatus = error?.status || error?.statusCode;
        
        console.warn(`Model ${modelName} failed:`, errorMsg);
        
        // If it's a 404, try next model
        if (errorStatus === 404 || errorMsg.includes("404") || errorMsg.includes("not found")) {
          continue;
        }
        
        // If it's an authentication error, stop trying
        if (errorStatus === 401 || errorStatus === 403) {
          throw new Error(
            `FAL API authentication failed. Please check your API key at https://fal.ai/dashboard`
          );
        }
        
        // For other errors, try next model
        continue;
      }
    }

    // If all models failed
    const errorMsg = lastError?.message || String(lastError) || "Unknown error";
    throw new Error(
      `Virtual try-on failed. None of the available models worked. ` +
      `Last error: ${errorMsg}. ` +
      `Please check: 1) Your FAL API key is valid (get it from https://fal.ai/dashboard), ` +
      `2) The model is available, 3) Your images are in valid format (URLs).`
    );
  } catch (error: any) {
    console.error("Error performing try-on:", error);
    
    // Re-throw with more context if it's our custom error
    if (error.message && (error.message.includes("FAL API") || error.message.includes("Virtual try-on"))) {
      throw error;
    }
    
    // Otherwise wrap it
    throw new Error(
      `Virtual try-on failed: ${error?.message || error}. ` +
      `This feature requires a valid FAL API key. Get yours at https://fal.ai/dashboard`
    );
  }
}

/**
 * Checks the status of a try-on request
 * @param id The ID of the try-on request
 * @returns Promise with the current status
 */
export async function checkTryOnStatus(id: string): Promise<any> {
  try {
    // Note: fal.status might not be available in all versions
    // This is a placeholder implementation
    const status = await (fal as any).status?.(id) || { status: "unknown" };
    return status;
  } catch (error) {
    console.error("Error checking try-on status:", error);
    throw error;
  }
}
