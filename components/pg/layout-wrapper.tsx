import React from 'react';

export function LayoutWrapper({ 
  title, 
  children 
}: { 
  title: string; 
  children: React.ReactNode 
}) {
  return (
    <main className="min-h-screen bg-[#F9FAFB] p-6">
      <header className="mb-8">
        <h1 className="text-2xl font-bold">{title}</h1>
      </header>
      {children}
    </main>
  );
}
