/**
 * scripts/create-admin.ts
 *
 * Creates an admin user in Supabase Auth and Prisma database.
 *
 * Usage:  npx tsx scripts/create-admin.ts
 */

import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import * as path from "path";

// Load .env.local
config({ path: path.resolve(__dirname, "..", ".env.local") });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const DATABASE_URL = process.env.DIRECT_URL!;

const EMAIL = "sebastian@gprevive.com";
const PASSWORD = "Almagor1804*";

// Supabase admin client (service role bypasses RLS)
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Prisma client
const adapter = new PrismaPg(DATABASE_URL);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Creating admin user...");

  // 1. Create user in Supabase Auth
  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
    });

  let authId: string;

  if (authError) {
    // Handle "user already exists"
    if (
      authError.message.toLowerCase().includes("already") ||
      authError.status === 422
    ) {
      console.log("User already exists in Supabase Auth, fetching by email...");
      const { data: listData, error: listError } =
        await supabase.auth.admin.listUsers();
      if (listError) throw listError;

      const existing = listData.users.find((u) => u.email === EMAIL);
      if (!existing) throw new Error("User exists but could not be found");
      authId = existing.id;
      console.log(`Found existing auth user: ${authId}`);
    } else {
      throw authError;
    }
  } else {
    authId = authData.user.id;
    console.log(`Created auth user: ${authId}`);
  }

  // 2. Upsert Usuario record in Prisma
  const usuario = await prisma.usuario.upsert({
    where: { auth_id: authId },
    update: { role: "admin", activo: true, email: EMAIL },
    create: {
      auth_id: authId,
      email: EMAIL,
      nombre: "Sebastian",
      role: "admin",
      activo: true,
    },
  });

  console.log(`Usuario record upserted: ${usuario.id} (role=${usuario.role})`);
  console.log("\nAdmin user ready!");
}

main()
  .catch((e) => {
    console.error("Failed to create admin:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
