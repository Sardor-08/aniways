"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity, BarChart3, BookOpen, CheckCircle2, ChevronRight, CircleHelp,
  Film, LayoutDashboard, LogOut, Menu, MoreHorizontal, Search, Settings,
  ShieldCheck, Ticket, Users, X, Bell, ArrowUpRight, Database,
} from "lucide-react";
import { useRouter } from "next/navigation";

type Section = "Dashboard" | "Foydalanuvchilar" | "Anime katalogi" | "Epizodlar" | "Anime listlar" | "Analitika" | "Moderatsiya" | "Support" | "Adminlar va rollar" | "Audit loglar" | "Sozlamalar";

const nav: { label: Section; icon: typeof LayoutDashboard; group?: string }[] = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Foydalanuvchilar", icon: Users },
  { label: "Anime katalogi", icon: Film, group: "Kontent" },
  { label: "Epizodlar", icon: BookOpen, group: "Kontent" },
  { label: "Anime listlar", icon: Activity, group: "Kontent" },
  { label: "Analitika", icon: BarChart3, group: "Boshqaruv" },
  { label: "Moderatsiya", icon: ShieldCheck, group: "Boshqaruv" },
  { label: "Support", icon: Ticket, group: "Boshqaruv" },
  { label: "Adminlar va rollar", icon: Users, group: "Tizim" },
  { label: "Audit loglar", icon: ShieldCheck, group: "Tizim" },
  { label: "Sozlamalar", icon: Settings, group: "Tizim" },
];

const users = [
  { name: "Sardor", email: "sardor@example.com", status: "Faol", time: "2 daqiqa oldin", initials: "SA" },
  { name: "malika_uz", email: "malika@example.com", status: "Faol", time: "18 daqiqa oldin", initials: "MU" },
  { name: "animefan", email: "animefan@example.com", status: "Tekshiruvda", time: "42 daqiqa oldin", initials: "AF" },
  { name: "otaku_2000", email: "otaku@example.com", status: "Faol", time: "1 soat oldin", initials: "OT" },
];

export function AdminCRM() {
  const router = useRouter();
  const [active, setActive] = useState<Section>("Dashboard");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const filteredUsers = useMemo(() => users.filter((u) => `${u.name} ${u.email}`.toLowerCase().includes(query.toLowerCase())), [query]);

  async function logout() { await fetch("/api/admin/auth", { method: "DELETE" }); router.push("/admin/login"); }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <aside className={`${open ? "translate-x-0" : "-translate-x-full"} fixed inset-y-0 z-40 flex w-72 shrink-0 flex-col border-r border-border bg-card p-5 transition-transform lg:static lg:translate-x-0`}>
          <div className="flex items-center justify-between gap-3 px-2 pb-8">
            <div className="flex items-center gap-3"><img src="/anilo-logo.jpg" alt="Anilo.uz" className="size-11 rounded-2xl object-cover" /><div><p className="font-semibold tracking-tight">Anilo.uz</p><p className="text-xs text-muted-foreground">Admin CRM</p></div></div>
            <button className="lg:hidden" onClick={() => setOpen(false)} aria-label="Menyuni yopish"><X className="size-5" /></button>
          </div>
          <div className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Asosiy menyu</div>
          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
            {nav.map(({ label, icon: Icon, group }, index) => <div key={label}>{(group && (index === 2 || nav[index - 1]?.group !== group)) && <p className="mb-2 mt-6 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{group}</p>}<button onClick={() => { setActive(label); setOpen(false); }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${active === label ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}><Icon className="size-[18px]" />{label}</button></div>)}
          </nav>
          <div className="mt-5 rounded-2xl bg-muted p-3"><div className="flex items-center gap-2 text-xs font-medium"><span className="size-2 rounded-full bg-primary" /> Tizim faol</div><p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">Barcha xizmatlar barqaror ishlamoqda.</p></div>
          <button onClick={logout} className="mt-3 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"><LogOut className="size-[18px]" /> Chiqish</button>
        </aside>
        {open && <button className="fixed inset-0 z-30 bg-foreground/20 lg:hidden" onClick={() => setOpen(false)} aria-label="Menyuni yopish" />}
        <section className="min-w-0 flex-1">
          <header className="flex h-16 items-center justify-between border-b border-border bg-card/80 px-5 backdrop-blur md:px-8"><div className="flex items-center gap-3"><button className="lg:hidden" onClick={() => setOpen(true)} aria-label="Menyuni ochish"><Menu className="size-5" /></button><div className="hidden items-center gap-2 text-sm text-muted-foreground md:flex"><span>Boshqaruv</span><ChevronRight className="size-4" /><span className="font-medium text-foreground">{active}</span></div></div><div className="flex items-center gap-3"><button className="hidden items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-xs text-muted-foreground md:flex"><Search className="size-4" /> Qidirish <kbd className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px]">⌘ K</kbd></button><button className="relative rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Bildirishnomalar"><Bell className="size-[18px]" /><span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-primary" /></button><div className="flex size-9 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">SA</div></div></header>
          <div className="p-5 md:p-8 xl:p-10"><div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">Anilo boshqaruv markazi</p><h1 className="text-3xl font-bold tracking-tight md:text-4xl">{active}</h1><p className="mt-2 text-sm text-muted-foreground">Platformangiz faoliyatini aniq va tez boshqaring.</p></div><div className="flex gap-2"><button className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium hover:bg-muted">Hisobot yuklash</button><button className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">+ Yangi qo‘shish</button></div></div>
            <DashboardContent active={active} filteredUsers={filteredUsers} query={query} setQuery={setQuery} />
          </div>
        </section>
      </div>
    </main>
  );
}

function DashboardContent({ active, filteredUsers, query, setQuery }: { active: Section; filteredUsers: typeof users; query: string; setQuery: (v: string) => void }) {
  if (active === "Foydalanuvchilar") return <UsersView users={filteredUsers} query={query} setQuery={setQuery} />;
  const title = active === "Dashboard" ? "Bugungi holat" : active;
  return <div className="space-y-6"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Jami foydalanuvchilar" value="12,480" change="+12.8%" icon={Users} /><Metric label="Bugungi ko‘rishlar" value="3,842" change="+8.4%" icon={Activity} /><Metric label="Anime katalogi" value="24,910" change="+164 yangi" icon={Film} /><Metric label="Faol tomosha" value="1,206" change="+5.1%" icon={BarChart3} /></div><div className="grid gap-6 xl:grid-cols-[1.45fr_0.9fr]"><div className="rounded-2xl border border-border bg-card p-5 md:p-6"><div className="mb-6 flex items-start justify-between"><div><h2 className="font-semibold">Foydalanuvchilar o‘sishi</h2><p className="mt-1 text-sm text-muted-foreground">Oxirgi 30 kunlik faollik</p></div><button className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted"><MoreHorizontal className="size-5" /></button></div><div className="flex h-52 items-end gap-2 border-b border-border pb-3">{[42,55,48,65,58,70,62,82,74,89,78,96,84,100,92,88,105,96,112,104,118,108,126,116,132,124,140,128,145,138].map((height, i) => <div key={i} className="group relative flex-1"><div className="h-full rounded-t-md bg-primary/15 transition-all group-hover:bg-primary" style={{ height: `${height}%` }} /></div>)}</div><div className="mt-4 flex justify-between text-xs text-muted-foreground"><span>1-avgust</span><span>15-avgust</span><span>30-avgust</span></div></div><div className="rounded-2xl bg-foreground p-6 text-background"><div className="flex items-start justify-between"><div><h2 className="font-semibold">Tizim holati</h2><p className="mt-1 text-sm opacity-60">Jonli monitoring</p></div><span className="size-3 rounded-full bg-primary shadow-[0_0_0_5px] shadow-primary/20" /></div><div className="mt-8 space-y-5"><Status name="Web ilova" value="99.98%" /><Status name="API xizmatlari" value="99.94%" /><Status name="Neon baza" value="Barqaror" /><Status name="Media server" value="Barqaror" /></div><div className="mt-8 flex items-center gap-2 text-xs opacity-60"><Database className="size-4" /> Oxirgi tekshiruv: hozirgina</div></div></div><div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]"><div className="rounded-2xl border border-border bg-card p-5 md:p-6"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-semibold">So‘nggi foydalanuvchilar</h2><p className="mt-1 text-sm text-muted-foreground">Yangi qo‘shilgan akkauntlar</p></div><ArrowUpRight className="size-5 text-muted-foreground" /></div><div className="space-y-1">{users.slice(0, 3).map((user) => <UserRow key={user.email} user={user} />)}</div></div><div className="rounded-2xl border border-border bg-card p-5 md:p-6"><div className="mb-5 flex items-center justify-between"><div><h2 className="font-semibold">Mashhur anime</h2><p className="mt-1 text-sm text-muted-foreground">Bugungi ko‘rishlar</p></div><CircleHelp className="size-5 text-muted-foreground" /></div>{["One Piece", "Solo Leveling", "Jujutsu Kaisen"].map((name, i) => <div key={name} className="flex items-center gap-3 border-b border-border py-3 last:border-0"><span className="font-mono text-xs text-primary">0{i + 1}</span><span className="flex-1 text-sm font-medium">{name}</span><span className="text-xs text-muted-foreground">{[1240, 986, 742][i]} ko‘rish</span></div>)}</div></div></div>;
}

function UsersView({ users: list, query, setQuery }: { users: typeof users; query: string; setQuery: (v: string) => void }) { return <div className="rounded-2xl border border-border bg-card"><div className="flex flex-wrap items-center justify-between gap-4 border-b border-border p-5"><div><h2 className="font-semibold">Barcha foydalanuvchilar</h2><p className="mt-1 text-sm text-muted-foreground">12,480 ta akkaunt boshqarilmoqda</p></div><div className="flex gap-2"><div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2"><Search className="size-4 text-muted-foreground" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Qidirish..." className="w-36 bg-transparent text-sm outline-none" /></div><button className="rounded-xl border border-border px-3 py-2 text-sm hover:bg-muted">Filter</button></div></div><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-5 py-3 font-medium">Foydalanuvchi</th><th className="px-5 py-3 font-medium">Holat</th><th className="px-5 py-3 font-medium">Oxirgi faollik</th><th className="px-5 py-3 font-medium text-right">Amal</th></tr></thead><tbody>{list.map((user) => <tr key={user.email} className="border-t border-border"><td className="px-5 py-4"><UserRow user={user} /></td><td className="px-5 py-4"><span className="inline-flex items-center gap-1.5 text-xs font-medium"><span className={`size-1.5 rounded-full ${user.status === "Faol" ? "bg-primary" : "bg-muted-foreground"}`} />{user.status}</span></td><td className="px-5 py-4 text-muted-foreground">{user.time}</td><td className="px-5 py-4 text-right"><button className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label={`${user.name} amallari`}><MoreHorizontal className="size-4" /></button></td></tr>)}</tbody></table></div></div> }
function UserRow({ user }: { user: (typeof users)[number] }) { return <div className="flex items-center gap-3"><div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{user.initials}</div><div><p className="text-sm font-medium">{user.name}</p><p className="text-xs text-muted-foreground">{user.email}</p></div></div> }
function Metric({ label, value, change, icon: Icon }: { label: string; value: string; change: string; icon: typeof Users }) { return <div className="rounded-2xl border border-border bg-card p-5"><div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">{label}</p><Icon className="size-4 text-primary" /></div><div className="mt-4 flex items-end justify-between gap-2"><p className="text-2xl font-bold tracking-tight">{value}</p><span className="text-xs font-medium text-primary">{change}</span></div></div> }
function Status({ name, value }: { name: string; value: string }) { return <div className="flex items-center justify-between border-b border-background/15 pb-4 text-sm"><span className="opacity-65">{name}</span><span className="flex items-center gap-2 font-medium"><CheckCircle2 className="size-4 text-primary" />{value}</span></div> }
