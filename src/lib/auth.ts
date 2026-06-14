import { cookies } from "next/headers";

const COOKIE_NAME = "mp_admin";

// Password definida em env. Fallback para dev.
export function getAdminPassword(): string {
  return process.env.ADMIN_PASSWORD || "neon123";
}

// "Assinatura" minimalista: hash simples do segredo. Suficiente para este
// caso de uso (sem base de dados, conteúdo não sensível).
function token(): string {
  const secret = getAdminPassword();
  let h = 0;
  for (let i = 0; i < secret.length; i++) {
    h = (h << 5) - h + secret.charCodeAt(i);
    h |= 0;
  }
  return `ok_${Math.abs(h).toString(36)}`;
}

export async function isAuthed(): Promise<boolean> {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value === token();
}

export async function setAuthCookie(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, token(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 dias
  });
}

export async function clearAuthCookie(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export { COOKIE_NAME };
