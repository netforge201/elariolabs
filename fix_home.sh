sed -i '' '/const latestApps/i\
  const settings = await prisma.siteSettings.findFirst({ include: { heroImage: true } });\
' src/app/\(public\)/page.tsx
