import { NextResponse } from "next/server";
import { getAdminPassword, setAuthCookie } from "@/lib/auth";

export async function POST(req: Request) {
  const { password } = await req.json().catch(() => ({ password: "" }));
  if (typeof password !== "string" || password !== getAdminPassword()) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  await setAuthCookie();
  return NextResponse.json({ ok: true });
}
