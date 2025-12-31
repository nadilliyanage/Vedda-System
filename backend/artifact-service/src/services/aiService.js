const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generate artifact metadata from image URL using Gemini AI
 * @param {string} imageUrl - URL of the uploaded artifact image
 * @returns {Promise<Object>} - Generated metadata
 */
exports.generateArtifactMetadata = async (imageUrl) => {
  try {
    const prompt = `You are analyzing an artifact from the Vedda people (Wanniyala-Aetto), the indigenous people of Sri Lanka. The Vedda are one of the oldest indigenous communities in South Asia, with a rich cultural heritage dating back thousands of years. They are known for their hunting and gathering lifestyle, traditional crafts, and deep connection to the forests of Sri Lanka.

Analyze this Vedda cultural artifact image and provide detailed information in the following JSON format:
{
  "name": "A descriptive name for the artifact (2-5 words)",
  "description": "A detailed description of the artifact including its appearance, materials, potential uses, and connection to Vedda culture and traditions (50-150 words)",
  "category": "One of: tools, pottery, jewelry, weapons, clothing, other",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "estimatedAge": "Estimated age or time period (e.g., '500-1000 years old', 'Ancient period', 'Traditional', etc.)",
  "culturalSignificance": "Brief note on the artifact's significance to Vedda culture, traditional uses, or spiritual importance"
}

Context about Vedda artifacts:
- Tools: Often made from stone, bone, or wood; includes axes (gala kapuma), arrows, hunting implements
- Pottery: Traditional clay vessels used for cooking and storage
- Jewelry: Made from natural materials like shells, bones, seeds, and stones
- Weapons: Bows (dhanu), arrows, and hunting tools
- Clothing: Traditionally minimal, made from bark cloth or animal hide
- Other: Ceremonial items, ritual objects, musical instruments

Provide accurate, culturally respectful descriptions that honor the Vedda heritage. If you cannot determine specific details, provide general observations about Vedda material culture. Return ONLY the JSON object, no additional text.`;

    // Fetch and encode image
    const imageBase64 = await fetchImageAsBase64(imageUrl);

    // Generate content using gemini-2.5-flash (stable model with better quota)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent([
      {
        inlineData: {
          data: imageBase64,
          mimeType: 'image/jpeg',
        },
      },
      prompt,
    ]);

    const response = result.response;
    const text = response.text();
    
    // Parse the JSON response
    // Remove markdown code blocks if present
    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const metadata = JSON.parse(cleanText);

    return {
      success: true,
      data: metadata,
    };
  } catch (error) {
    console.error('Gemini AI error:', error);
    throw new Error('Failed to generate metadata: ' + error.message);
  }
};

/**
 * Fetch image from URL and convert to base64
 * @param {string} url - Image URL
 * @returns {Promise<string>} - Base64 encoded image
 */
async function fetchImageAsBase64(url) {
  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return buffer.toString('base64');
  } catch (error) {
    console.error('Error fetching image:', error);
    throw new Error('Failed to fetch image');
  }
}
