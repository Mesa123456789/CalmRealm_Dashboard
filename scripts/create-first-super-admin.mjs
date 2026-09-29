import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const envPath = resolve(process.cwd(), ".env.local");

if (existsSync(envPath)) {
  const envFile = readFileSync(envPath, "utf8");
  for (const line of envFile.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...parts] = trimmed.split("=");
    process.env[key] ??= parts.join("=").replace(/^['"]|['"]$/g, "");
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const firstSuperAdmin = {
  username: process.env.FIRST_SUPER_ADMIN_USERNAME ?? "superadmin",
  email: process.env.FIRST_SUPER_ADMIN_EMAIL,
  name: process.env.FIRST_SUPER_ADMIN_NAME ?? "Super Admin",
  password: process.env.FIRST_SUPER_ADMIN_PASSWORD,
};

function requireValue(value, label) {
  if (!value) {
    throw new Error(`Missing ${label}.`);
  }
  return value;
}

const adminClient = createClient(
  requireValue(supabaseUrl, "NEXT_PUBLIC_SUPABASE_URL"),
  requireValue(serviceRoleKey, "SUPABASE_SERVICE_ROLE_KEY"),
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

const email = requireValue(firstSuperAdmin.email, "FIRST_SUPER_ADMIN_EMAIL").trim().toLowerCase();
const password = requireValue(firstSuperAdmin.password, "FIRST_SUPER_ADMIN_PASSWORD");

if (password.length < 6) {
  throw new Error("FIRST_SUPER_ADMIN_PASSWORD must be at least 6 characters.");
}

const { data: existingAccount, error: existingAccountError } = await adminClient
  .from("DashboardAccount")
  .select("id, username, email, role")
  .or(`username.eq.${firstSuperAdmin.username},email.eq.${email}`)
  .maybeSingle();

if (existingAccountError) {
  throw existingAccountError;
}

if (existingAccount) {
  console.log("Super admin already exists:");
  console.log(existingAccount);
  process.exit(0);
}

const { data: created, error: createError } = await adminClient.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
  user_metadata: {
    username: firstSuperAdmin.username,
    name: firstSuperAdmin.name,
    role: "super_admin",
  },
});

if (createError || !created.user) {
  throw createError ?? new Error("Could not create Supabase Auth user.");
}

const { error: insertError } = await adminClient.from("DashboardAccount").insert({
  id: created.user.id,
  username: firstSuperAdmin.username,
  email,
  name: firstSuperAdmin.name,
  role: "super_admin",
});

if (insertError) {
  await adminClient.auth.admin.deleteUser(created.user.id);
  throw insertError;
}

console.log("Created first super admin:");
console.log({
  id: created.user.id,
  username: firstSuperAdmin.username,
  email,
  name: firstSuperAdmin.name,
  role: "super_admin",
});
