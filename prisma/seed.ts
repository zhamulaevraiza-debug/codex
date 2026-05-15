import "dotenv/config";
import { PrismaClient, Role } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({
    url: process.env.DATABASE_URL ?? "file:./dev.db",
  }),
});

type DemoUser = {
  email: string;
  password: string;
  role: Role;
  name: string;
};

async function ensureUser(user: DemoUser) {
  const existing = await prisma.user.findUnique({ where: { email: user.email } });
  if (!existing) {
    const passwordHash = await bcrypt.hash(user.password, 10);
    await prisma.user.create({
      data: {
        email: user.email,
        passwordHash,
        role: user.role,
        profile: { create: { name: user.name } },
        settings: { create: {} },
      },
    });
    return;
  }
  if (existing.role !== user.role) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { role: user.role },
    });
  }
}

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set");
  }

  const users: DemoUser[] = [
    { email: adminEmail, password: adminPassword, role: Role.ADMIN, name: "Руководитель" },
    {
      email: process.env.OPERATOR_EMAIL ?? "operator@example.com",
      password: process.env.OPERATOR_PASSWORD ?? "operator123",
      role: Role.OPERATOR,
      name: "Оператор",
    },
    {
      email: process.env.DRIVER_EMAIL ?? "driver@example.com",
      password: process.env.DRIVER_PASSWORD ?? "driver123",
      role: Role.DRIVER,
      name: "Водитель",
    },
    {
      email: process.env.WORKSHOP_EMAIL ?? "workshop@example.com",
      password: process.env.WORKSHOP_PASSWORD ?? "workshop123",
      role: Role.WORKSHOP,
      name: "Работник цеха",
    },
  ];

  for (const user of users) {
    await ensureUser(user);
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
