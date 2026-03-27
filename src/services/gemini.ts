import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

export const getGeminiResponse = async (prompt: string, history: { role: string, text: string }[] = []) => {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }
  
  const ai = new GoogleGenAI({ apiKey });
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: [
      ...history.map(h => ({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.text }] })),
      { role: 'user', parts: [{ text: prompt }] }
    ],
    config: {
      systemInstruction: "Bạn là một Trợ lý Y tế AI thông minh của HomeCare Plus. Nhiệm vụ của bạn là giải đáp thắc mắc về sức khỏe, nhắc lịch uống thuốc, và sàng lọc nguy cơ sức khỏe cơ bản. Luôn trả lời một cách chuyên nghiệp, ân cần và dễ hiểu. Lưu ý: Luôn nhắc nhở người dùng rằng các tư vấn của bạn chỉ mang tính chất tham khảo và họ nên tham khảo ý kiến bác sĩ chuyên môn cho các tình trạng nghiêm trọng.",
    }
  });
  
  return response.text;
};
