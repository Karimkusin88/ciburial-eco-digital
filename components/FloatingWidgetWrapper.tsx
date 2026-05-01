"use client";

import dynamic from 'next/dynamic';

const CuacaSholatWidget = dynamic(() => import('@/components/CuacaSholatWidget'), { ssr: false });

export default function FloatingWidgetWrapper() {
  return <CuacaSholatWidget />;
}
