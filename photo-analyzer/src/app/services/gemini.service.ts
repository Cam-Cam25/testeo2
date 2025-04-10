import { Injectable } from '@angular/core';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { environment } from '../../environments/environment.prod';


@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    this.genAI = new GoogleGenerativeAI(environment.geminiApiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  async analyzeImage(base64Image: string) {
    try {
      const prompt = 'Analiza esta imagen y determina si los materiales o elementos que aparecen son orgánicos o inorgánicos. Proporciona una respuesta clara y concisa, indicando específicamente qué tipo de material es y por qué se clasifica así.';
      
      const imageParts = [
        {
          inlineData: {
            data: base64Image,
            mimeType: 'image/jpeg'
          }
        }
      ];

      const result = await this.model.generateContent([prompt, ...imageParts]);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error al analizar la imagen:', error);
      throw error;
    }
  }
}