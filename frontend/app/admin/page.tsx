"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, BookOpen, Film, LayoutDashboard, LogOut, Settings, ShieldCheck, Users } from "lucide-react";

const sections = [
  { label: "Umumiy ko‘rinish", icon: LayoutDashboard },
  { label: "Foydalanuvchilar", icon: Users },
  { label: "Anime ro‘yxatlari", icon: BookOpen },
  { label: "Kontent", icon: Film },
  { label: "Analitika", icon: BarChart3 },
  { label: "Admin loglari", icon: ShieldCheck },
];

const users = [
  { name: "Sardor", email: "sardor@example.com", status: "Faol", joined: "Bugun" },
  { name: "malika_uz", email: "malika@example.com", status: "Faol", joined: "Kecha" },
  { name: "animefan", email: "animefan@example.com", status: "Tekshiruvda", joined: "2 kun oldin" },
];

export default function AdminPage() {
  const router = useRouter();
  const [active, setActive] = useState("Umumiy ko‘rinish");

  async function logout() {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.push("/admin/login");
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="w-full border-b border-border bg-card p-5 lg:w-72 lg:border-b-0 lg:border-r lg:p-7">
          <div className="mb-10 flex items-center gap-3">
            <img src="/anilo-logo.jpg" alt="Anilo.uz" className="size-12 rounded-2xl object-cover" />
            <div><p className="font-bold">Anilo.uz</p><p className="text-xs text-muted-foreground">Admin CRM</p></div>
          </div>
          <nav className="flex gap-2 overflow-x-auto lg:flex-col">
            {sections.map(({ label, icon: Icon }) => <button key={label} onClick={() => setActive(label)} className={`flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition-colors ${active === label ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}><Icon data-icon="inline-start" />{label}</button>)}
          </nav>
          <button onClick={logout} className="mt-10 hidden items-center gap-3 px-4 py-3 text-sm text-muted-foreground hover:text-foreground lg:flex"><LogOut data-icon="inline-start" />Chiqish</button>
        </aside>
        <section className="flex-1 p-5 md:p-8 lg:p-12">
          <header className="mb-9 flex flex-wrap items-start justify-between gap-4"><div><p className="mb-2 text-sm font-medium text-primary">Anilo boshqaruv markazi</p><h1 className="text-3xl font-bold tracking-tight md:text-4xl">{active}</h1><p className="mt-2 text-muted-foreground">Platformangiz faoliyatini bir joydan boshqaring.</p></div><button className="rounded-xl border border-border p-3 text-muted-foreground hover:text-foreground" aria-label="Sozlamalar"><Settings /></button></header>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Jami foydalanuvchilar" value="12,480" change="+12.8%" /><Metric label="Bugungi tashriflar" value="3,842" change="+8.4%" /><Metric label="Anime katalogi" value="24,910" change="+164 yangi" /><Metric label="Faol tomosha" value="1,206" change="+5.1%" /></div>
          <div className="mt-8 grid gap-6 xl:grid-cols-[1.4fr_1fr]"><div className="rounded-2xl border border-border bg-card p-6"><div className="mb-6 flex items-center justify-between"><div><h2 className="font-semibold">Yangi foydalanuvchilar</h2><p className="mt-1 text-sm text-muted-foreground">Oxirgi qo‘shilgan akkauntlar</p></div><button className="text-sm font-medium text-primary">Barchasi</button></div><div className="flex flex-col gap-2">{users.map((user) => <div key={user.email} className="flex items-center justify-between gap-4 rounded-xl px-3 py-3 hover:bg-muted"><div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">{user.name[0].toUpperCase()}</div><div><p className="text-sm font-medium">{user.name}</p><p className="text-xs text-muted-foreground">{user.email}</p></div></div><div className="text-right"><p className="text-xs font-medium text-primary">{user.status}</p><p className="text-xs text-muted-foreground">{user.joined}</p></div></div>)}</div></div><div className="rounded-2xl bg-foreground p-6 text-background"><div className="mb-8 flex items-center justify-between"><div><h2 className="font-semibold">Platforma holati</h2><p className="mt-1 text-sm opacity-70">Jonli monitoring</p></div><span className="size-3 rounded-full bg-primary" /></div><div className="flex flex-col gap-5"><Status name="Web ilova" value="99.98%" /><Status name="API xizmatlari" value="99.94%" /><Status name="Neon baza" value="Barqaror" /></div></div></div>
          <div className="mt-6 flex items-center gap-3 text-sm text-muted-foreground"><ShieldCheck className="text-primary" /> Email tasdiqlash hozircha talab qilinmaydi. Admin kirishi xavfsiz sessiya orqali himoyalangan.</div>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value, change }: { label: string; value: string; change: string }) { return <div className="rounded-2xl border border-border bg-card p-5"><p className="text-sm text-muted-foreground">{label}</p><div className="mt-4 flex items-end justify-between gap-2"><p className="text-2xl font-bold">{value}</p><span className="text-xs font-medium text-primary">{change}</span></div></div>; }
function Status({ name, value }: { name: string; value: string }) { return <div className="flex items-center justify-between border-b border-background/15 pb-4 text-sm"><span className="opacity-75">{name}</span><span className="font-medium">{value}</span></div>; }
