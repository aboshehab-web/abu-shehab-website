import { Category, Item, Settings } from "./types";

// Fallback used ONLY when Supabase is not configured yet.
export const DEFAULT_SETTINGS: Settings = {
  id: 1,
  name: "كبابجي أبو شهاب",
  tagline: "مشويات مصرية على الفحم",
  address: "2 جمال عبد الناصر، المعتمدية، بولاق الدكرور، محافظة الجيزة",
  phone: "01270880970",
  whatsapp: "01110245245",
  hours: "يوميًا من 10 صباحًا حتى 3 صباحًا",
  payment: "نقدًا",
  maps_url:
    "https://www.google.com/maps/search/?api=1&query=2%20Gamal%20Abdel%20Nasser%2C%20Al-Moatamediya%2C%20Boulaq%20El-Dakrour%2C%20Giza%2C%20Egypt",
  orders_enabled: false,
  menu_live: false,
};

const CAT_NAMES = [
  "الكباب",
  "الكفتة",
  "الطرب",
  "الفراخ",
  "المشويات المشكلة",
  "المقبلات",
  "الأرز والخبز",
  "المشروبات",
];

export const DEMO_CATEGORIES: Category[] = CAT_NAMES.map((name, i) => ({
  id: `demo-c${i + 1}`,
  name,
  sort_order: i + 1,
}));

const DEMO_NAMES = [
  "كباب حلة",
  "كفتة مشوية",
  "طرب مشوي",
  "فرخة مشوية",
  "مشكل مشويات",
  "سلطة",
  "أرز",
  "مشروب",
];

// Symbolic demo prices — NOT real. Orders stay blocked until the manager activates the real menu.
export const DEMO_ITEMS: Item[] = [
  { cat: 0, name: "كباب مشوي" },
  { cat: 0, name: DEMO_NAMES[0] },
  { cat: 1, name: DEMO_NAMES[1] },
  { cat: 2, name: DEMO_NAMES[2] },
  { cat: 3, name: DEMO_NAMES[3] },
  { cat: 4, name: DEMO_NAMES[4] },
  { cat: 5, name: DEMO_NAMES[5] },
  { cat: 6, name: DEMO_NAMES[6] },
  { cat: 7, name: DEMO_NAMES[7] },
].map((d, i) => ({
  id: `demo-i${i + 1}`,
  category_id: DEMO_CATEGORIES[d.cat].id,
  name: `${d.name} (تجريبي)`,
  description: "صنف تجريبي للعرض فقط",
  price: 100,
  image_url: null,
  available: true,
  visible: true,
  is_demo: true,
  sort_order: i + 1,
}));
