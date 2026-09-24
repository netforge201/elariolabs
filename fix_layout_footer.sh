sed -i '' '/const socialLinks = await prisma.socialLink.findMany/a\
  const company = await prisma.companyInformation.findFirst();' src/app/\(public\)/layout.tsx

sed -i '' 's/<p>© {new Date().getFullYear()} ElarioLabs. All rights reserved.<\/p>/<p>{company?.copyrightText || `© ${new Date().getFullYear()} ElarioLabs. All rights reserved.`}<\/p>/g' src/app/\(public\)/layout.tsx
