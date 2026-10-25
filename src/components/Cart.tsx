"use client";

import { useEffect, useRef, useState } from "react";
import { useApp } from "@/lib/store";
import { OrderForm, buildMessage, buildWaUrl, fmtEGP, isValidEgMobile } from "@/lib/whatsapp";

const EMPTY: OrderForm = { name: "", phone: "", address: "", landmark: "", notes: "" };

export function CartBar() {
  const { count, total, openSheet } = useApp();
  const [bump, setBump] = useState(false);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    setBump(true);
    const t = setTimeout(() => setBump(false), 360);
    return () => clearTimeout(t);
  }, [count, total]);

  return (
    <div className="cartbar">
      <button onClick={openSheet} aria-label="عرض السلة وإتمام الطلب">
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          🛒 <span className={`cnt ${bump ? "bump" : ""}`}>{count}</span>
        </span>
        <span className="tot">{fmtEGP(total)}</span>
        <span className="go">عرض السلة وإتمام الطلب</span>
      </button>
    </div>
  );
}

export function CartSheet() {
  const { sheetOpen, closeSheet, lines, total, setQty, remove, settings, ordersBlocked, blockReason } = useApp();
  const [step, setStep] = useState<"cart" | "form">("cart");
  const [form, setForm] = useState<OrderForm>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof OrderForm, string>>>({});

  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeSheet();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [sheetOpen, closeSheet]);

  useEffect(() => { if (lines.length === 0) setStep("cart"); }, [lines.length]);
  useEffect(() => { if (!sheetOpen) setStep("cart"); }, [sheetOpen]);

  if (!sheetOpen) return null;

  const set = (k: keyof OrderForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const validate = () => {
    const e: typeof errors = {};
    if (form.name.trim().length < 2) e.name = "اكتب اسمك";
    if (!isValidEgMobile(form.phone)) e.phone = "اكتب رقم موبايل مصري صحيح (مثال 01012345678)";
    if (form.address.trim().length < 8) e.address = "اكتب عنوان التوصيل بالتفصيل";
    if (form.landmark.trim().length < 2) e.landmark = "اكتب مكانًا مشهورًا قريبًا";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const send = () => {
    if (ordersBlocked || lines.length === 0 || !validate()) return;
    const url = buildWaUrl(settings, buildMessage(settings, form, lines));
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const field = (k: keyof OrderForm, label: string, opts: { area?: boolean; optional?: boolean; type?: string } = {}) => (
    <div className="field">
      <label htmlFor={`f-${k}`}>{label}{opts.optional ? " (اختياري)" : ""}</label>
      {opts.area ? (
        <textarea id={`f-${k}`} rows={2} value={form[k]} onChange={set(k)} />
      ) : (
        <input id={`f-${k}`} type={opts.type ?? "text"} inputMode={k === "phone" ? "tel" : undefined} value={form[k]} onChange={set(k)} aria-invalid={Boolean(errors[k])} autoComplete={k === "name" ? "name" : k === "phone" ? "tel" : undefined} />
      )}
      {errors[k] && <span className="err" role="alert">{errors[k]}</span>}
    </div>
  );

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && closeSheet()}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label="السلة">
        <div className="sheet-h">
          <h3 className="display">{step === "cart" ? "سلتك" : "بيانات الطلب"}</h3>
          <button className="x" onClick={closeSheet} aria-label="إغلاق">✕</button>
        </div>

        <div className="sheet-b">
          {lines.length === 0 ? (
            <div className="empty">سلتك فارغة. أضف أصنافًا من المنيو لتبدأ طلبك.</div>
          ) : step === "cart" ? (
            lines.map(({ item, qty }) => (
              <div className="line" key={item.id}>
                <div>
                  <h4>{item.name}</h4>
                  <small>{fmtEGP(item.price)} للوحدة</small>
                </div>
                <strong style={{ color: "var(--gold)" }}>{fmtEGP(item.price * qty)}</strong>
                <div className="qty" role="group" aria-label={`كمية ${item.name}`}>
                  <button onClick={() => setQty(item.id, qty - 1)} aria-label="تقليل الكمية">−</button>
                  <span>{qty}</span>
                  <button onClick={() => setQty(item.id, qty + 1)} aria-label="زيادة الكمية">+</button>
                </div>
                <button className="del" onClick={() => remove(item.id)}>حذف الصنف</button>
              </div>
            ))
          ) : (
            <>
              <div className="summary">
                {lines.map(({ item, qty }) => (
                  <div key={item.id}><span>{item.name} × {qty}</span><span>{fmtEGP(item.price * qty)}</span></div>
                ))}
                <div style={{ fontWeight: 800, marginTop: 6 }}><span>الإجمالي</span><span>{fmtEGP(total)}</span></div>
              </div>
              {field("name", "الاسم")}
              {field("phone", "رقم الهاتف", { type: "tel" })}
              {field("address", "عنوان التوصيل بالتفصيل", { area: true })}
              {field("landmark", "مكان مشهور قريب")}
              {field("notes", "ملاحظات إضافية", { area: true, optional: true })}
            </>
          )}
        </div>

        {lines.length > 0 && (
          <div className="sheet-f">
            <div className="sum"><span>الإجمالي</span><span>{fmtEGP(total)}</span></div>
            {ordersBlocked && <div className="notice" style={{ margin: 0 }} role="status">{blockReason}</div>}
            {step === "cart" ? (
              <button className="btn btn-primary" onClick={() => setStep("form")}>متابعة إتمام الطلب</button>
            ) : (
              <>
                <button className="btn btn-wa" disabled={ordersBlocked} onClick={send}>تأكيد الطلب عبر واتساب</button>
                <p style={{ fontSize: ".85rem", color: "var(--muted)" }}>سيفتح واتساب برسالة جاهزة، ولا يصل طلبك إلا بعد أن تضغط «إرسال» بنفسك.</p>
                <button className="btn btn-ghost" onClick={() => setStep("cart")}>العودة إلى السلة</button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
