import { Item, Settings } from "./types";

export type OrderForm = {
  name: string;
  phone: string;
  address: string;
  landmark: string;
  notes: string;
};

export type OrderLine = { item: Item; qty: number };

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";

export function normalizeDigits(s: string) {
  return s.replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d))).replace(/\s+/g, "");
}

export function isValidEgMobile(s: string) {
  return /^(?:\+?20|0)?1[0125]\d{8}$/.test(normalizeDigits(s));
}

export function fmtEGP(n: number) {
  const v = Number.isInteger(n) ? String(n) : n.toFixed(2);
  return `${v} ج.م`;
}

export function waNumber(local: string) {
  const d = normalizeDigits(local).replace(/^\+/, "");
  if (d.startsWith("20")) return d;
  return "20" + d.replace(/^0/, "");
}

export function buildMessage(settings: Settings, form: OrderForm, lines: OrderLine[]) {
  const total = lines.reduce((s, l) => s + l.item.price * l.qty, 0);
  const out: string[] = [];
  out.push(`طلب جديد من موقع ${settings.name}`);
  out.push("");
  out.push(`الاسم: ${form.name.trim()}`);
  out.push(`الهاتف: ${normalizeDigits(form.phone)}`);
  out.push(`العنوان: ${form.address.trim()}`);
  out.push(`أقرب مكان مشهور: ${form.landmark.trim()}`);
  if (form.notes.trim()) out.push(`ملاحظات: ${form.notes.trim()}`);
  out.push("");
  out.push("الأصناف:");
  lines.forEach((l, i) => {
    out.push(
      `${i + 1}) ${l.item.name} × ${l.qty} — سعر الوحدة ${fmtEGP(l.item.price)} — الإجمالي ${fmtEGP(l.item.price * l.qty)}`
    );
  });
  out.push("");
  out.push(`إجمالي الطلب: ${fmtEGP(total)}`);
  out.push(`الدفع: ${settings.payment}`);
  return out.join("\n");
}

export function buildWaUrl(settings: Settings, text: string) {
  return `https://wa.me/${waNumber(settings.whatsapp)}?text=${encodeURIComponent(text)}`;
}
