import { json, error } from '@sveltejs/kit';
import prisma from '$lib/prisma.js';

// This is a placeholder - you'll need to integrate with an AI service
// Options: OpenAI GPT, Anthropic Claude, etc.
async function summarizeText(text, contextPrompt = '') {
  // TODO: Implement actual AI summarization
  // Example with OpenAI:
  /*
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant that summarizes notes about auction lots. ${contextPrompt}`
        },
        {
          role: 'user',
          content: `Please summarize the following note in 2-3 sentences:\n\n${text}`
        }
      ],
      max_tokens: 200
    })
  });
  
  const data = await response.json();
  return data.choices[0].message.content;
  */
  
  // Placeholder: simple truncation
  if (text.length <= 200) return text;
  return text.substring(0, 200) + '...';
}

export async function POST({ params, locals }) {
  try {
    const session = await locals.auth?.();
    if (!session?.user) {
      throw error(401, 'Unauthorized');
    }

    const lot = await prisma.lot.findUnique({
      where: { id: params.id },
      include: { 
        auction: { 
          include: { 
            auctionHouse: true 
          } 
        } 
      }
    });

    if (!lot) {
      throw error(404, 'Lot not found');
    }

    // Check permissions
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user || (user.id !== lot.auction.sellerId && user.auctionHouseId !== lot.auction.auctionHouseId)) {
      throw error(403, 'Forbidden');
    }

    const note = await prisma.lotNote.findUnique({
      where: { id: params.noteId }
    });

    if (!note || note.lotId !== params.id) {
      throw error(404, 'Note not found');
    }

    const textToSummarize = note.transcription || note.content;
    if (!textToSummarize) {
      throw error(400, 'Note has no content to summarize');
    }

    // Get AI prompts from settings
    const auctionHousePrompt = lot.auction.auctionHouse.settings 
      ? JSON.parse(lot.auction.auctionHouse.settings).aiPrompt || ''
      : '';
    const auctionPrompt = lot.auction.settings
      ? JSON.parse(lot.auction.settings).aiPrompt || ''
      : '';

    const contextPrompt = [auctionHousePrompt, auctionPrompt].filter(Boolean).join(' ');

    // Generate summary
    const summary = await summarizeText(textToSummarize, contextPrompt);

    // Update note with summary
    const updated = await prisma.lotNote.update({
      where: { id: params.noteId },
      data: { summary }
    });

    return json(updated);
  } catch (err) {
    if (err.status) {
      throw err;
    }
    console.error('Error summarizing note:', err);
    throw error(500, err.message || 'Failed to summarize note');
  }
}

