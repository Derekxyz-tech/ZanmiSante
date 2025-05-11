import { model, SYSTEM_PROMPT } from '@/config/gemini';

export type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export async function generateResponse(messages: Message[]): Promise<string> {
  try {
    // For the first message, include the system prompt
    const lastMessage = messages[messages.length - 1];
    const prompt = messages.length === 1 
      ? `${SYSTEM_PROMPT}\n\nUser: ${lastMessage.content}`
      : lastMessage.content;

    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{ text: prompt }]
      }]
    });

    const response = await result.response;
    
    if (!response.text()) {
      throw new Error('Empty response from the model');
    }
    
    return response.text();
  } catch (error) {
    console.error('Error generating response:', error);
    throw new Error('Failed to generate response. Please try again.');
  }
} 