import "dotenv/config";
import { getPrisma } from "../lib/prisma";
import { hashPassword } from "../lib/auth-crypto";

async function seed() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password || password.length < 12)
    throw new Error(
      "Set ADMIN_EMAIL and a unique ADMIN_PASSWORD of at least 12 characters before seeding.",
    );
  const db = getPrisma();
  const catalog: [string, string, number, string][] = [
    ["Hair Washing", "Refreshing wash and scalp rinse.", 30, "wash-care"],
    ["Adult Barbing", "A classic haircut with a clean finish.", 45, "barbing"],
    ["Children's Cut", "A gentle trim for little ones.", 30, "barbing"],
    ["Shaving", "Face shave and shape-up.", 30, "barbing"],
    ["Barbing + Shaving", "A complete haircut and shave.", 60, "barbing"],
    ["Plaiting", "Neat plaiting and protective styling.", 120, "braiding"],
    [
      "Conditioning Treatment",
      "Deep conditioning and hair care.",
      60,
      "wash-care",
    ],
    [
      "Wash + Conditioning",
      "A fresh wash and conditioning treatment.",
      75,
      "wash-care",
    ],
  ];
  for (const [name, description, durationMinutes, serviceArea] of catalog) {
    await db.service.upsert({
      where: { name },
      update: {},
      create: { name, description, durationMinutes, serviceArea },
    });
  }
  for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
    await db.availabilityRule.upsert({
      where: { dayOfWeek },
      update: {},
      create: {
        dayOfWeek,
        openTime: dayOfWeek === 6 ? "10:00" : "09:00",
        closeTime:
          dayOfWeek === 5 ? "19:00" : dayOfWeek === 6 ? "17:00" : "18:00",
        isClosed: dayOfWeek === 0,
      },
    });
  }
  // Rerunning the seed rotates configured credentials and revokes existing sessions.
  await db.$transaction(async (tx) => {
    const admin = await tx.adminUser.upsert({
      where: { email },
      update: { passwordHash: hashPassword(password) },
      create: { email, passwordHash: hashPassword(password) },
    });
    await tx.adminSession.deleteMany({ where: { adminId: admin.id } });
  });
  await db.$disconnect();
  console.log("Salon services, availability and configured admin seeded.");
}
seed().catch((error) => {
  console.error(error instanceof Error ? error.message : "Seed failed.");
  process.exit(1);
});
