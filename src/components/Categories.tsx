"use client";

import { useApp } from "@/lib/store";

export default function Categories() {
const { categories, items, setActiveCat } = useApp();
const go = (id: string) => {
setActiveCat(id);
document.getElementById("menu")?.scrollIntoView({ behavior: "smooth" });
};
return (
<section className="sec" id="categories" aria-labelledby="cat-h">
<div className="wrap">
<div className="sec-head">
<h2 id="cat-h" className="display">أقسام الطعام</h2>
<p className="intro">اختر القسم لتنتقل مباشرة إلى أصنافه في المنيو.</p>
</div>
<div className="cat-grid">
{categories.map((c) => (
<button key={c.id} className="cat-card" onClick={() => go(c.id)}>
{c.name}
<small>{items.filter((i) => i.category_id === c.id).length} صنف</small>
</button>
))}
</div>
</div>
</section>
);
}
