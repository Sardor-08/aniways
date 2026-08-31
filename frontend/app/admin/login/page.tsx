"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Eye, EyeOff, Loader2, LockKeyhole } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault(); setLoading(true); setError("");
    const response = await fetch("/api/admin/auth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) });
    if (response.ok) router.push("/admin"); else { const data = await response.json().catch(() => ({})); setError(data.error || "Kirish amalga oshmadi"); setLoading(false); }
  }

  return <main className="flex min-h-screen items-center justify-center bg-background px-5"><div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-sm md:p-10"><Link href="/" className="mb-10 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft data-icon="inline-start" />Bosh sahifaga qaytish</Link><div className="mb-8 flex items-center gap-4"><div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><LockKeyhole /></div><div><p className="text-sm font-medium text-primary">Anilo.uz</p><h1 className="text-2xl font-bold">Admin panel</h1></div></div><p className="mb-7 text-sm leading-6 text-muted-foreground">CRM boshqaruv markaziga kirish uchun admin maʼlumotlaringizni kiriting.</p><form onSubmit={submit} className="flex flex-col gap-5">{error && <div role="alert" className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}<label className="flex flex-col gap-2 text-sm font-medium">Username yoki email<input value={username} onChange={(e) => setUsername(e.target.value)} required autoComplete="username" className="h-12 rounded-xl border border-border bg-background px-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="admin yoki admin@anilo.uz" /></label><label className="flex flex-col gap-2 text-sm font-medium">Parol<div className="relative"><input value={password} onChange={(e) => setPassword(e.target.value)} required type={show ? "text" : "password"} autoComplete="current-password" className="h-12 w-full rounded-xl border border-border bg-background px-4 pr-12 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" placeholder="••••••••" /><button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label={show ? "Parolni yashirish" : "Parolni ko‘rsatish"}>{show ? <EyeOff /> : <Eye />}</button></div></label><button disabled={loading} className="mt-2 flex h-12 items-center justify-center rounded-xl bg-primary font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">{loading ? <Loader2 className="animate-spin" /> : "Kirish"}</button></form></div></main>;
}
