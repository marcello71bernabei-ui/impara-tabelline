
import { GoogleGenAI, Type } from "@google/genai";
import { GeminiFeedback } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const LOCAL_FALLBACK_CORRECT = [
  { message: "Bravissimo! Hai indovinato!", emoji: "🌟", tip: "Continua così, sei un campione!" },
  { message: "Incredibile! Sei un genio!", emoji: "🚀", tip: "La tua mente corre veloce!" }
];

const LOCAL_FALLBACK_WRONG = [
  { message: "Non preoccuparti, riprova!", emoji: "💪", tip: "Sbagliando si impara!" },
  { message: "Quasi! Guarda bene il tabellone.", emoji: "🔍", tip: "Usa il trucco dei salti!" }
];

export const getGeminiFeedback = async (
  a: number,
  b: number,
  isCorrect: boolean,
  userInput: number | string
): Promise<GeminiFeedback> => {
  try {
    const prompt = isCorrect 
      ? `Un bambino ha risposto correttamente ${userInput} a ${a}x${b}. Fornisci un breve complimento magico e un piccolo fatto divertente o trucco sulla tabellina del ${a} o ${b}.`
      : `Un bambino ha risposto ${userInput} a ${a}x${b}, ma la risposta corretta è ${a * b}. Fornisci un feedback incoraggiante, non giudicante, e un piccolo suggerimento per ricordare questa specifica tabellina senza essere troppo tecnico.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            message: { type: Type.STRING, description: "Il messaggio di feedback" },
            emoji: { type: Type.STRING, description: "Un emoji a tema" },
            tip: { type: Type.STRING, description: "Un trucco o consiglio matematico" }
          },
          required: ["message", "emoji", "tip"]
        },
        systemInstruction: "Sei un mago simpatico e incoraggiante di nome Merlino che aiuta i bambini di 7-10 anni a imparare le tabelline. Parla sempre in italiano, sii breve e molto caloroso."
      }
    });

    const result = JSON.parse(response.text || "{}");
    return {
      message: result.message || (isCorrect ? "Esatto!" : "Riprova!"),
      emoji: result.emoji || (isCorrect ? "✨" : "🧙‍♂️"),
      tip: result.tip || ""
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    // Fallback locale in caso di errore API
    const pool = isCorrect ? LOCAL_FALLBACK_CORRECT : LOCAL_FALLBACK_WRONG;
    const item = pool[Math.floor(Math.random() * pool.length)];
    return {
      ...item,
      message: !isCorrect && userInput !== "Tempo scaduto" 
        ? `${userInput} non è corretto. ${a}×${b} fa ${a*b}. ${item.message}` 
        : item.message
    };
  }
};
