// Vercel Function for the assistant. Set ANTHROPIC_API_KEY in the project's environment variables.
import { handleAssistant } from '../server/assistant';

export const GET = (request: Request) => handleAssistant(request);
export const POST = (request: Request) => handleAssistant(request);
