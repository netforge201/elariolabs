const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const company = await prisma.companyInformation.findFirst();
  console.log(company);
}
main();
