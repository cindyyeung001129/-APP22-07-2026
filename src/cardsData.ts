import { QuoteCard } from './types';

export const ALL_CARDS: QuoteCard[] = Array.from({ length: 30 }, (_, i) => {
  const idStr = String(i + 1).padStart(3, '0');
  return {
    id: idStr,
    text: `每天都是新的一天，保持微笑！相信美好的事情即將發生。`,
    imageUrl: `https://picsum.photos/seed/${idStr}/120/160` // Placeholder images
  };
});
