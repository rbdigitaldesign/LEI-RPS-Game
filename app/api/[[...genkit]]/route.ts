
import { appRoute } from '@genkit-ai/next';
import {getGcpCredentials} from 'common-server';
import {google} from 'googleapis';
export const { GET, POST } = appRoute();
