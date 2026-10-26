"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { CartLine, Category, Item, Settings } from "./types";
import { DEFAULT_SETTINGS, DEMO_CATEGORIES, DEMO_ITEMS } from "./defaults";
import { getSupabase } from "./supabase";

const CART_KEY = "abushehab-cart-v1";

type Ctx = {
  loading: boolean;
  usingFallback: boolean;
  settings: Settings;
  categories: Category[];
  items: Item[];
  activeCat: string | null;
  setActiveCat: (id: string) => void;
  lines: { item: Item; qty: number }[];
  count: number;
  total: number;
  add: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  sheetOpen: boolean;
  openSheet: () => void;
  closeSheet: () => void;
  ordersBlocked: boolean;
  blockReason: string;
  reload: () => Promise<void>;
};

const AppCtx = createContext<Ctx | null>(null);

export function useApp() {
  const c = useContext(AppCtx);
  if (!c) throw new Error("useApp must be used inside AppProvider");
  return c;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [categories, setCategories] = useState<Category[]>(DEMO_CATEGORIES);
  const [rawItems, setRawItems] = useState<Item[]>(DEMO_ITEMS);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(true);
  const [activeCat, setActiveCat] = useState<string | null>(DEMO_CATEGORIES[0].id);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartReady, setCartReady] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const reload = useCallback(async () => {
    const sb = getSupabase();
    if (!sb) {
      setUsingFallback(true);
      setLoading(false);
      return;
    }
    try {
      const [c, i, s] = await Promise.all([
        sb.from("categories").select("*").order("sort_order"),
        sb.from("menu_items").select("*").eq("visible", true).order("sort_order"),
        sb.from("restaurant_settings").select("*").eq("id", 1).maybeSingle(),
      ]);
      if (c.error || i.error || s.error) throw new Error("load failed");
      setCategories(c.data as Category[]);
      setRawItems((i.data as Item[]).map((x) => ({ ...x, price: Number(x.price) })));
      if (s.data) setSettings(s.data as Settings);
      setUsingFallback(false);
      setActiveCat((cur) =>
        cur && (c.data as Category[]).some((x) => x.id === cur) ? cur : (c.data as Category[])[0]?.id ?? null
      );
    } catch {
      setUsingFallback(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  // cart <- localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed))
          setCart(parsed.filter((l) => l && typeof l.id === "string" && Number.isInteger(l.qty) && l.qty > 0));
      }
    } catch {}
    setCartReady(true);
  }, []);

  useEffect(() => {
    if (!cartReady) return;
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch {}
  }, [cart, cartReady]);

  // Once the real menu is live, hide demo items.
  const items = useMemo(
    () => (settings.menu_live && !usingFallback ? rawItems.filter((x) => !x.is_demo) : rawItems),
    [rawItems, settings.menu_live, usingFallback]
  );

  // Price/name always come from the menu data, never from stored cart values.
  const lines = useMemo(() => {
    const map = new Map(items.map((x) => [x.id, x]));
    return cart
      .map((l) => ({ item: map.get(l.id), qty: l.qty }))
      .filter((l): l is { item: Item; qty: number } => Boolean(l.item) && l.item!.available);
  }, [cart, items]);

  const count = lines.reduce((s, l) => s + l.qty, 0);
  const total = lines.reduce((s, l) => s + l.item.price * l.qty, 0);

  const add = useCallback((id: string) => {
    setCart((c) => {
      const f = c.find((l) => l.id === id);
      return f ? c.map((l) => (l.id === id ? { ...l, qty: Math.min(l.qty + 1, 99) } : l)) : [...c, { id, qty: 1 }];
    });
  }, []);
  const setQty = useCallback((id: string, qty: number) => {
    setCart((c) => (qty <= 0 ? c.filter((l) => l.id !== id) : c.map((l) => (l.id === id ? { ...l, qty: Math.min(qty, 99) } : l))));
  }, []);
  const remove = useCallback((id: string) => setCart((c) => c.filter((l) => l.id !== id)), []);
  const clear = useCallback(() => setCart([]), []);

  let blockReason = "";
  if (usingFallback) blockReason = "الموقع في وضع التجربة (قاعدة البيانات غير متصلة). الطلب الحقيقي غير متاح الآن.";
  else if (!settings.menu_live) blockReason = "المنيو الحالي تجريبي. سيتم تفعيل الطلب بعد اعتماد الأصناف والأسعار الحقيقية.";
  else if (!settings.orders_enabled) blockReason = "استقبال الطلبات متوقف مؤقتًا. يمكنك الاتصال بنا.";

  const value: Ctx = {
    loading,
    usingFallback,
    settings,
    categories,
    items,
    activeCat,
    setActiveCat,
    lines,
    count,
    total,
    add,
    setQty,
    remove,
    clear,
    sheetOpen,
    openSheet: () => setSheetOpen(true),
    closeSheet: () => setSheetOpen(false),
    ordersBlocked: Boolean(blockReason),
    blockReason,
    reload,
  };

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}
