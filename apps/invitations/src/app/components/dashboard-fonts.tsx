/**
 * Sora + DM Sans for the dashboard and login only (invitation pages never
 * render this). A plain stylesheet link keeps the build free of network calls.
 */
export default function DashboardFonts() {
  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Sora:wght@500;600;700&display=swap"
        precedence="default"
      />
    </>
  );
}
