"use client";

import { useCallback, useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabase, supabaseConfigured } from "@/lib/supabase";
import { Category, Item, Settings } from "@/lib/types";

type Tab = "items" | "cats" | "settings";
type Flash = { kind: "ok" | "bad"; text: string } | null;

const blankItem = { id: "", name: "", description: "", price: "", category_id: "", available: true, visible: true, image_url: "" };

export default function AdminPage() {
  const sb = getSupabase();
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [flash, setFlash] = useState<Flash>(null);
  const [tab, setTab] = useState<Tab>("items");

  const [cats, setCats] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [form, setForm] = useState({ ...blankItem });
  const [file, setFile] = useState<File | null>(null);
  const [newCat, setNewCat] = useState("");
  const [busy, setBusy] = useState(false);

  const ok = (text: string) => setFlash({ kind: "ok", text });
  const bad = (text: string) => setFlash({ kind: "bad", text });

  const load = useCallback(async () => {
    if (!sb) return;
    const [c, i, s] = await Promise.all([
      sb.from("categories").select("*").order("sort_order"),
      sb.from("menu_items").select("*").order("sort_order"),
      sb.from("restaurant_settings").select("*").eq("id", 1).maybeSingle(),
    ]);
    if (c.error || i.error || s.error) return bad("تعذر تحميل البيانات. تأكد من تنفيذ ملف SQL.");
    setCats(c.data as Category[]);
    setItems((i.data as Item[]).map((x) => ({ ...x, price: Number(x.price) })));
    setSettings(s.data as Settings);
  }, [sb]);

  const checkAdmin = useCallback(async (s: Session | null) => {
    if (!sb || !s) { setIsAdmin(null); setChecking(false); return; }
    const { data } = await sb.from("admins").select("user_id").eq("user_id", s.user.id).maybeSingle();
    setIsAdmin(Boolean(data));
    setChecking(false);
    if (data) load();
  }, [sb, load]);

  useEffect(() => {
    if (!sb) { setChecking(false); return; }
    sb.auth.getSession().then(({ data }) => { setSession(data.session); checkAdmin(data.session); });
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => { setSession(s); checkAdmin(s); });
    return () => sub.subscription.unsubscribe();
  }, [sb, checkAdmin]);

  if (!supabaseConfigured || !sb) {
    return (
      <main className="adm"><div className="wrap">
        <h1 className="display">لوحة المدير</h1>
        <div className="msg bad">قاعدة البيانات غير متصلة بعد. أضف متغيري NEXT_PUBLIC_SUPABASE_URL و NEXT_PUBLIC_SUPABASE_ANON_KEY كما في ملف README.</div>
      </div></main>
    );
  }

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    setFlash(null);
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) bad("البريد أو كلمة المرور غير صحيحة.");
  };

  if (checking) return <main className="adm"><div className="wrap">جاري التحميل…</div></main>;

  if (!session) {
    return (
      <main className="adm"><div className="wrap" style={{ maxWidth: 420 }}>
        <h1 className="display">دخول المدير</h1>
        {flash && <div className={`msg ${flash.kind}`}>{flash.text}</div>}
        <form className="panel" onSubmit={login}>
          <div className="field"><label htmlFor="em">البريد الإلكتروني</label><input id="em" type="email" dir="ltr" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" /></div>
          <div className="field"><label htmlFor="pw">كلمة المرور</label><input id="pw" type="password" dir="ltr" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" /></div>
          <button className="btn btn-primary" style={{ width: "100%" }}>دخول</button>
        </form>
      </div></main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="adm"><div className="wrap">
        <h1 className="display">غير مصرح</h1>
        <div className="msg bad">هذا الحساب مسجّل الدخول لكنه غير مضاف كمدير. نفّذ أمر إضافة المدير في Supabase (موضح في README).</div>
        <button className="btn btn-ghost" onClick={() => sb.auth.signOut()}>تسجيل الخروج</button>
      </div></main>
    );
  }

  // ---------- actions ----------
  const wrap = async (fn: () => Promise<string | void>) => {
    setBusy(true); setFlash(null);
    try { const m = await fn(); if (m) ok(m); await load(); } catch (e: any) { bad(e?.message ? `فشل الحفظ: ${e.message}` : "فشل الحفظ"); }
    setBusy(false);
  };

  const saveItem = (e: React.FormEvent) => {
    e.preventDefault();
    return wrap(async () => {
      const price = Number(form.price);
      if (!form.name.trim() || !form.category_id || !Number.isFinite(price) || price < 0) throw new Error("أكمل الاسم والقسم وسعرًا صحيحًا");
      let image_url: string | null = form.image_url || null;
      if (file) {
        const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
        const path = `items/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const up = await sb.storage.from("menu-images").upload(path, file, { contentType: file.type });
        if (up.error) throw up.error;
        image_url = sb.storage.from("menu-images").getPublicUrl(path).data.publicUrl;
      }
      const row = { name: form.name.trim(), description: form.description.trim() || null, price, category_id: form.category_id, available: form.available, visible: form.visible, image_url, is_demo: false };
      const r = form.id
        ? await sb.from("menu_items").update(row).eq("id", form.id)
        : await sb.from("menu_items").insert({ ...row, sort_order: items.length + 1 });
      if (r.error) throw r.error;
      setForm({ ...blankItem, category_id: form.category_id }); setFile(null);
      return "تم حفظ الصنف";
    });
  };

  const patchItem = (id: string, patch: Partial<Item>, msg: string) =>
    wrap(async () => { const r = await sb.from("menu_items").update(patch).eq("id", id); if (r.error) throw r.error; return msg; });

  const delItem = (it: Item) => {
    if (!confirm(`حذف «${it.name}» نهائيًا؟`)) return;
    return wrap(async () => { const r = await sb.from("menu_items").delete().eq("id", it.id); if (r.error) throw r.error; return "تم الحذف"; });
  };

  const addCat = () => wrap(async () => {
    if (!newCat.trim()) throw new Error("اكتب اسم القسم");
    const r = await sb.from("categories").insert({ name: newCat.trim(), sort_order: cats.length + 1 });
    if (r.error) throw r.error; setNewCat(""); return "تمت إضافة القسم";
  });
  const renameCat = (c: Category) => {
    const name = prompt("الاسم الجديد للقسم", c.name);
    if (!name || !name.trim()) return;
    return wrap(async () => { const r = await sb.from("categories").update({ name: name.trim() }).eq("id", c.id); if (r.error) throw r.error; return "تم تعديل القسم"; });
  };
  const moveCat = (idx: number, dir: -1 | 1) => wrap(async () => {
    const a = cats[idx], b = cats[idx + dir]; if (!a || !b) return;
    const r1 = await sb.from("categories").update({ sort_order: b.sort_order }).eq("id", a.id);
    const r2 = await sb.from("categories").update({ sort_order: a.sort_order }).eq("id", b.id);
    if (r1.error || r2.error) throw new Error("تعذر الترتيب");
  });
  const delCat = (c: Category) => {
    const n = items.filter((i) => i.category_id === c.id).length;
    if (!confirm(`حذف قسم «${c.name}»؟ سيُحذف معه ${n} صنف.`)) return;
    return wrap(async () => { const r = await sb.from("categories").delete().eq("id", c.id); if (r.error) throw r.error; return "تم حذف القسم"; });
  };

  const saveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    return wrap(async () => {
      const { id, ...rest } = settings;
      const r = await sb.from("restaurant_settings").update(rest).eq("id", 1);
      if (r.error) throw r.error; return "تم حفظ الإعدادات";
    });
  };
  const removeDemo = () => {
    if (!confirm("حذف كل الأصناف التجريبية نهائيًا؟")) return;
    return wrap(async () => { const r = await sb.from("menu_items").delete().eq("is_demo", true); if (r.error) throw r.error; return "تم حذف الأصناف التجريبية"; });
  };

  const demoCount = items.filter((i) => i.is_demo).length;
  const realCount = items.filter((i) => !i.is_demo).length;
  const sset = (k: keyof Settings) => (e: React.ChangeEvent<HTMLInputElement>) => setSettings((s) => (s ? { ...s, [k]: e.target.value } : s));
  const sbool = (k: "orders_enabled" | "menu_live") => (e: React.ChangeEvent<HTMLInputElement>) => setSettings((s) => (s ? { ...s, [k]: e.target.checked } : s));

  return (
    <main className="adm"><div className="wrap">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <h1 className="display">لوحة المدير</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <a className="sm" href="/" style={{ display: "inline-flex", alignItems: "center" }}>الموقع</a>
          <button className="sm" onClick={() => sb.auth.signOut()}>خروج</button>
        </div>
      </div>
      {flash && <div className={`msg ${flash.kind}`} role="status">{flash.text}</div>}
      <div className="adm-tabs">
        {([["items", "الأصناف"], ["cats", "الأقسام"], ["settings", "إعدادات المطعم"]] as [Tab, string][]).map(([k, l]) => (
          <button key={k} className="tab" aria-selected={tab === k} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>

      {tab === "items" && (<>
        <form className="panel" onSubmit={saveItem}>
          <h2>{form.id ? "تعديل صنف" : "إضافة صنف"}</h2>
          <div className="field"><label htmlFor="i-n">الاسم</label><input id="i-n" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="field"><label htmlFor="i-d">الوصف (اختياري)</label><input id="i-d" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="field"><label htmlFor="i-p">السعر (ج.م)</label><input id="i-p" type="number" inputMode="decimal" min="0" step="0.5" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
          <div className="field"><label htmlFor="i-c">القسم</label>
            <select id="i-c" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
              <option value="">اختر القسم</option>
              {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select></div>
          <div className="field"><label htmlFor="i-f">الصورة {form.image_url && !file ? "(توجد صورة حالية)" : ""}</label><input id="i-f" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></div>
          <label className="check"><input type="checkbox" checked={form.available} onChange={(e) => setForm({ ...form, available: e.target.checked })} /> متوفر</label>
          <label className="check"><input type="checkbox" checked={form.visible} onChange={(e) => setForm({ ...form, visible: e.target.checked })} /> ظاهر في الموقع</label>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button className="btn btn-primary" disabled={busy}>{form.id ? "حفظ التعديل" : "إضافة الصنف"}</button>
            {form.id && <button type="button" className="btn btn-ghost" onClick={() => { setForm({ ...blankItem }); setFile(null); }}>إلغاء</button>}
          </div>
        </form>

        <div className="panel">
          <h2>كل الأصناف ({items.length})</h2>
          {items.length === 0 && <div className="empty">لا توجد أصناف بعد.</div>}
          {items.map((it) => (
            <div className="adm-row" key={it.id}>
              <div>
                <strong>{it.name}</strong>{it.is_demo && <span className="badge">تجريبي</span>}{!it.visible && <span className="badge off">مخفي</span>}{!it.available && <span className="badge off">غير متوفر</span>}
                <div style={{ color: "var(--muted)", fontSize: ".9rem" }}>{cats.find((c) => c.id === it.category_id)?.name} — {it.price} ج.م</div>
              </div>
              <div className="acts">
                <button className="sm" onClick={() => { setForm({ id: it.id, name: it.name, description: it.description ?? "", price: String(it.price), category_id: it.category_id, available: it.available, visible: it.visible, image_url: it.image_url ?? "" }); window.scrollTo({ top: 0, behavior: "smooth" }); }}>تعديل</button>
                <button className="sm" onClick={() => patchItem(it.id, { available: !it.available }, "تم تغيير التوفر")}>{it.available ? "غير متوفر" : "متوفر"}</button>
                <button className="sm" onClick={() => patchItem(it.id, { visible: !it.visible }, it.visible ? "تم الإخفاء" : "تمت الإعادة")}>{it.visible ? "إخفاء" : "إظهار"}</button>
                <button className="sm danger" onClick={() => delItem(it)}>حذف</button>
              </div>
            </div>
          ))}
        </div>
      </>)}

      {tab === "cats" && (
        <div className="panel">
          <h2>الأقسام</h2>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input className="search" placeholder="اسم قسم جديد" value={newCat} onChange={(e) => setNewCat(e.target.value)} />
            <button className="btn btn-primary" onClick={addCat} disabled={busy}>إضافة</button>
          </div>
          {cats.map((c, i) => (
            <div className="adm-row" key={c.id}>
              <strong>{c.name}</strong>
              <div className="acts">
                <button className="sm" disabled={i === 0} onClick={() => moveCat(i, -1)} aria-label="للأعلى">↑</button>
                <button className="sm" disabled={i === cats.length - 1} onClick={() => moveCat(i, 1)} aria-label="للأسفل">↓</button>
                <button className="sm" onClick={() => renameCat(c)}>تعديل</button>
                <button className="sm danger" onClick={() => delCat(c)}>حذف</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "settings" && settings && (
        <>
          <div className="panel">
            <h2>إطلاق الموقع</h2>
            <p style={{ color: "var(--muted)", marginBottom: 8 }}>أصناف حقيقية: {realCount} — أصناف تجريبية: {demoCount}</p>
            <button className="sm danger" onClick={removeDemo} disabled={demoCount === 0}>حذف كل الأصناف التجريبية</button>
          </div>
          <form className="panel" onSubmit={saveSettings}>
            <h2>بيانات المطعم</h2>
            <div className="field"><label>الاسم</label><input value={settings.name} onChange={sset("name")} /></div>
            <div className="field"><label>الوصف</label><input value={settings.tagline} onChange={sset("tagline")} /></div>
            <div className="field"><label>العنوان</label><input value={settings.address} onChange={sset("address")} /></div>
            <div className="field"><label>رقم الاتصال</label><input dir="ltr" value={settings.phone} onChange={sset("phone")} /></div>
            <div className="field"><label>رقم واتساب الطلبات</label><input dir="ltr" value={settings.whatsapp} onChange={sset("whatsapp")} /></div>
            <div className="field"><label>ساعات العمل</label><input value={settings.hours} onChange={sset("hours")} /></div>
            <div className="field"><label>الدفع</label><input value={settings.payment} onChange={sset("payment")} /></div>
            <label className="check"><input type="checkbox" checked={settings.menu_live} onChange={sbool("menu_live")} /> تفعيل المنيو الحقيقي (يخفي الأصناف التجريبية)</label>
            <label className="check"><input type="checkbox" checked={settings.orders_enabled} onChange={sbool("orders_enabled")} /> استقبال الطلبات</label>
            <button className="btn btn-primary" style={{ marginTop: 10 }} disabled={busy}>حفظ الإعدادات</button>
          </form>
        </>
      )}
    </div></main>
  );
}
