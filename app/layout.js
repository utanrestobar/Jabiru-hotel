export const metadata = {
  title: "Jabirú Hotel",
  description: "Sistema de gestión de Jabirú Hotel",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
