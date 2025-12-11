import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || ''; // Ideally handled via secure env

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey });

export const generateTaskContent = async (taskTitle: string, currentContent: string): Promise<string> => {
  if (!apiKey) return "AI generation is unavailable without an API Key.";

  try {
    const model = 'gemini-2.5-flash';
    const prompt = `
      You are an expert project manager and technical writer.
      The user is working on a task titled: "${taskTitle}".
      
      Current content context:
      ${currentContent}

      Please generate a structured, helpful continuation for this task description. 
      It should be concise and actionable. 
      Use Markdown formatting (headings, bullet points, checkboxes).
      Do not include the task title in the output.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    return response.text || '';
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating content. Please try again.";
  }
};

export const polishText = async (text: string): Promise<string> => {
  if (!apiKey) return text;
  
  try {
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Rewrite the following text to be more professional, clear, and concise:\n\n${text}`
    });
    return response.text || text;
  } catch (e) {
      console.error(e);
      return text;
  }
}

// --- Creative Studio Services ---

export const generateAppCode = async (requirements: string): Promise<string> => {
    if(!apiKey) return "API Key missing.";
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `
                You are a senior software engineer. 
                Generate a React component or NestJS service based on these requirements: "${requirements}".
                
                Return ONLY the code block in Markdown format (e.g. \`\`\`tsx ... \`\`\`).
                Add comments explaining key parts.
            `
        });
        return response.text || '';
    } catch(e) {
        console.error(e);
        return "Failed to generate code.";
    }
}

export const generateCreativeText = async (prompt: string, type: 'story' | 'game'): Promise<string> => {
    if(!apiKey) return "API Key missing.";
    try {
        const systemInstruction = type === 'game' 
            ? "You are a game designer. Output a JSON structure for a simple educational game based on the prompt." 
            : "You are a creative storyteller. Write a short, engaging story based on the prompt.";

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { systemInstruction }
        });
        return response.text || '';
    } catch(e) {
        console.error(e);
        return "Failed to generate text.";
    }
}

export const generateColoringPage = async (prompt: string): Promise<string | null> => {
    if(!apiKey) return null;
    try {
        const finalPrompt = `A clean, black and white line art coloring page for children, white background, high contrast, simple lines: ${prompt}`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: finalPrompt,
            config: {
                // responseMimeType: 'image/jpeg' // Not supported for nano banana
            }
        });

        // Loop through parts to find the image
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
        return null;
    } catch(e) {
        console.error(e);
        return null;
    }
}