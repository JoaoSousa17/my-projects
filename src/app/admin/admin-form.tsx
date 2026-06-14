"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AdminForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function submit() {
    if (!password) return;
    setLoading(true);
    setError(false);
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      router.push("/manage");
      router.refresh();
    } else {
      setError(true);
      setLoading(false);
      setPassword("");
    }
  }

  return (
    <div className="rgb-frame w-full max-w-sm p-7 sm:p-8">
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-black/40">
          <Lock className="h-5 w-5 text-cyan-300" />
        </div>
        <h1 className="text-xl font-semibold tracking-tight">Acesso à gestão</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Introduz a password para continuar.
        </p>
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            autoFocus
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            className="border-white/15 bg-black/40 focus-visible:ring-cyan-400"
            placeholder="••••••••"
          />
        </div>

        {error && (
          <p className="text-sm text-red-400">Password incorreta. Tenta de novo.</p>
        )}

        <Button
          onClick={submit}
          disabled={loading || !password}
          className="w-full bg-cyan-500 text-black hover:bg-cyan-400"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar"}
        </Button>
      </div>
    </div>
  );
}
