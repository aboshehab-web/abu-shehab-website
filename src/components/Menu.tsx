"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useApp } from "@/lib/store";
import { fmtEGP } from "@/lib/whatsapp";

export default function Menu() {
const { categories, items, activeCat, setActiveCat, add, loading, usingFallback, settings } = useApp();
const [q, setQ] = useState("");
const [justAdded, setJustAdded] = useState<string | null>(null);

const term = q.trim();
const shown = useMemo(() => {
if (term) return items.filter((i) => (i.name + " " + (i.description ?? "")).includes(term));
return items.filter((i) => i.category_id === activeCat);
}, [items, activeCat, term]);

const demoMode = usingFallback || !settings.menu_live;
const catName = (id: string) => categories.find((c) => c.id === id)?.name ?? "";

const onAdd = (id: string) => {
add(id);
setJustAdded(id);
setTimeout(() => setJustAdded((c) => (c === id ? null : c)), 900);
};

return (
<section className="sec alt" id="menu" aria-labelledby="menu-h">
<div className="wrap">
<div className="sec-head">
<h2 id="menu-h" className="display">منيو أبو شهاب</h2>
</div>
<div className="menu-box">
<div className="menu-top">
<input
className="search"
type="search"
placeholder="ابحث في المنيو…"
value={q}
onChange={(e) => setQ(e.target.value)}
aria-label="ابحث في المنيو"
/>
</div>
<div className="tabs" role="tablist" aria-label="أقسام المنيو">
{categories.map((c) => (
<button
key={c.id}
role="tab"
aria-selected={!term && c.id === activeCat}
className="tab"
onClick={() => { setQ(""); setActiveCat(c.id); }}
>
{c.name}
</button>
))}
</div>
{demoMode && (
<div className="notice" role="status">
{usingFallback
? "وضع تجربة: الأصناف والأسعار التالية تجريبية وليست المنيو الحقيقي."
: "المنيو والأسعار الحالية تجريبية، وسيتم اعتماد المنيو الحقيقي قريبًا."}
</div>
)}
{loading ? (
<div className="empty">جاري تحميل المنيو…</div>
) : shown.length === 0 ? (
<div className="empty">{term ? "لا توجد أصناف مطابقة لبحثك." : "لا توجد أصناف في هذا القسم حاليًا."}</div>
) : (
<div className="items" role="tabpanel">
{shown.map((it) => (
<article className="item" key={it.id}>
{it.image_url ? (
<Image className="thumb" src={it.image_url} alt={it.name} width={96} height={96} unoptimized />
) : (
<div className="thumb" aria-hidden="true">🔥</div>
)}
<div>
<h3>
{it.name}
{it.is_demo && <span className="badge">تجريبي</span>}
{!it.available && <span className="badge off">غير متوفر</span>}
</h3>
{term && <p>القسم: {catName(it.category_id)}</p>}
{it.description && <p>{it.description}</p>}
<div className="row">
<span className="price">
{fmtEGP(it.price)}
{it.is_demo && <small> (سعر تجريبي)</small>}
</span>
<button className="add" disabled={!it.available} onClick={() => onAdd(it.id)}>
{justAdded === it.id ? "تمت الإضافة ✓" : "أضف للسلة"}
</button>
</div>
</div>
</article>
))}
</div>
)}
</div>
</div>
</section>
);
  }
