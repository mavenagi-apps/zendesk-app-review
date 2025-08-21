import { proxyFetch } from '@/lib/proxy-fetch';
import { type NextRequest } from 'next/server';
import { z } from 'zod';

// Zendesk signed request is always a POST and contains a token in the body
// https://developer.zendesk.com/documentation/apps/app-developer-guide/using-the-apps-framework/#authenticating-zendesk-in-your-server-side-app
// Next.js does not offer a way to have a page route that accepts POST requests
// So we instead do a proxy fetch with the token as a GET query param
export const POST = async (req: NextRequest) => {
  let token: string;
  try {
    const body = await req.formData();
    ({ token } = z.object({ token: z.string().min(1) }).parse(Object.fromEntries(body.entries())));
  } catch (error) {
    try {
      const jsonData = await req.json();
      token = jsonData.token;
    } catch {
      console.error('POST handler error:', error);
      return new Response('Invalid request', { status: 400 });
    }
  }

  // Proxy to the server component route
  return await proxyFetch(
    `https://${req.headers.get('x-forwarded-host')!}/copilot-v2?${new URLSearchParams({
      token,
    }).toString()}`
  );
};
