import './globals.css';
import type { Metadata } from 'next';
export const metadata: Metadata = { metadataBase: new URL(process.env.APP_URL ?? 'http://localhost:3000'), title: {default:'ElarioLabs — Independent Software Studio',template:'%s — ElarioLabs'}, description:'ElarioLabs is an independent software studio.' };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body>{children}</body></html> }
