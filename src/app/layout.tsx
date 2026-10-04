import '../index.css';

export const metadata = {
  title: 'Cabinet de Rééducation',
  description: 'Votre cabinet de rééducation fonctionnelle',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
