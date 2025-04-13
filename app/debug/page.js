'use client';

import dynamic from 'next/dynamic';

const GltfDebugger = dynamic(() => import('../gltf-debug'), {
  ssr: false,
  loading: () => <p>Loading debugger...</p>
});

export default function DebugPage() {
  return <GltfDebugger />;
} 