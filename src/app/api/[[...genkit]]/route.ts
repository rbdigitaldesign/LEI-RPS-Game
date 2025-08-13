'use server';
import { appRoute } from '@genkit-ai/next';

const handler = appRoute();
export { handler as GET, handler as POST };
