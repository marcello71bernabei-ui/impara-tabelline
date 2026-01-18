
import { GeminiFeedback } from "../types";

const correctMessages = [
  { message: "Bravissimo! Hai indovinato!", emoji: "🌟" },
  { message: "Incredibile! Sei un genio delle tabelline!", emoji: "🚀" },
  { message: "Ottimo lavoro! Continua così!", emoji: "👏" },
  { message: "Esatto! Sei velocissimo!", emoji: "⚡" },
  { message: "Fantastico! La matematica per te non ha segreti!", emoji: "🎈" },
  { message: "Super! Risposta perfetta!", emoji: "🏆" }
];

const incorrectMessages = [
  { message: "Non preoccuparti, sbagliando si impara!", emoji: "💪" },
  { message: "Quasi! Prova a pensarci ancora un po'.", emoji: "🧠" },
  { message: "Nessun problema, la prossima andrà meglio!", emoji: "🌈" },
  { message: "Coraggio! Anche i grandi matematici sbagliano.", emoji: "⚓" },
  { message: "Ops! Guarda bene il tabellone per aiutarti.", emoji: "🔍" }
];

const tips = [
  "Sapevi che moltiplicare per 5 è come fare la metà e aggiungere uno zero?",
  "Tutti i numeri moltiplicati per 1 rimangono uguali!",
  "Per la tabellina del 9, la somma delle cifre del risultato fa sempre 9!",
  "I numeri moltiplicati per 0 diventano sempre... ZERO!",
  "La tabellina del 2 è come contare saltando un numero: 2, 4, 6, 8...",
  "Moltiplicare per 10 è facilissimo: basta aggiungere uno 0 alla fine!"
];

/**
 * Fornisce feedback locale senza chiamare API esterne per evitare errori di quota.
 */
export const getGeminiFeedback = async (
  a: number,
  b: number,
  isCorrect: boolean,
  userInput: number | string
): Promise<GeminiFeedback> => {
  // Simuliamo un brevissimo caricamento per mantenere l'effetto "pensante"
  await new Promise(resolve => setTimeout(resolve, 600));

  const source = isCorrect ? correctMessages : incorrectMessages;
  const randomMsg = source[Math.floor(Math.random() * source.length)];
  const randomTip = Math.random() > 0.4 ? tips[Math.floor(Math.random() * tips.length)] : undefined;

  // Se è sbagliato e conosciamo il risultato, aggiungiamo una nota tecnica
  let message = randomMsg.message;
  if (!isCorrect && userInput !== "Tempo scaduto") {
    message = `${userInput} non è corretto. Ricorda che ${a} × ${b} fa proprio ${a * b}. ${message}`;
  }

  return {
    message: message,
    emoji: randomMsg.emoji,
    tip: randomTip
  };
};
