'use client';

import React, { Suspense } from 'react';
import { Loading } from '@/components/ui/Loading';
import ZendeskCopilotV2 from './ZendeskCopilotV2';

export default function PageClient() {
  return (
    <div className="flex h-[calc(100vh-4px)] flex-col border-2 border-gray-300 bg-gray-100">
      <Suspense fallback={<Loading />}>
        <ZendeskCopilotV2 />
      </Suspense>
    </div>
  );
}