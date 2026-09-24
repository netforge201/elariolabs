const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const data = {
    name: "Test App",
    slug: "test-app",
    shortDescription: "Test",
    fullDescription: "Test full",
    appStoreStatus: "COMING_SOON",
    platform: "iOS"
  };
  try {
    const app = await prisma.application.create({ data });
    console.log("Created:", app.id);
  } catch (e) {
    console.error("Error:", e);
  }
}
main();
