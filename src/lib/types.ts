export type Category = { id: string; name: string; sort_order: number };

export type Item = {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  available: boolean;
  visible: boolean;
  is_demo: boolean;
  sort_order: number;
};

export type Settings = {
  id: number;
  name: string;
  tagline: string;
  address: string;
  phone: string;
  whatsapp: string;
  hours: string;
  payment: string;
  maps_url: string;
  orders_enabled: boolean;
  menu_live: boolean;
};

export type CartLine = { id: string; qty: number };
