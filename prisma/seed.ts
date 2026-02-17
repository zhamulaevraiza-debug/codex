import "dotenv/config";
import { PrismaClient, Role } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: Role.ADMIN,
        profile: { create: { name: "Admin" } },
        settings: { create: {} },
      },
    });
  } else if (existing.role !== Role.ADMIN) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { role: Role.ADMIN },
    });
  }

  const defaultStyle = await prisma.teachingStyle.findFirst({
    where: { isDefault: true },
  });
  if (!defaultStyle) {
    await prisma.teachingStyle.create({
      data: {
        name: "Default",
        content: "Placeholder teaching style. Replace via Admin.",
        isDefault: true,
      },
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
