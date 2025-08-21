import { z } from 'zod';
import PageClient from './page-client';
import { AuthProvider } from '@/contexts/AuthContext';
import { jwtVerify, importSPKI } from 'jose';

export default async function CopilotV2Page(props: {searchParams: Promise<{ token: string }>}) {
  const searchParams = await props.searchParams;
  let token = '';  
  ({ token } = z.object({ token: z.string() }).parse(searchParams));
  
  if (process.env.ZENDESK_APP_PUBLIC_KEY) {
    const formattedKey = `-----BEGIN PUBLIC KEY-----\n${process.env.ZENDESK_APP_PUBLIC_KEY}\n-----END PUBLIC KEY-----`;    
    const verified = await jwtVerify(
      token,
      await importSPKI(formattedKey, 'RS256'),      
    );
    if (verified.payload) {
      console.log('Verified JWT', verified.payload.exp);
    }
  }
  
  return (
    <AuthProvider token={token}>
      <PageClient />
    </AuthProvider>
  );
}