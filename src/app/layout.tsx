import '../index.css';

export const metadata = {
  title: 'Cabinet de Rééducation',
  description: 'Votre cabinet de rééducation fonctionnelle',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
