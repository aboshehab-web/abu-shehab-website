"use client";

import { AppProvider } from "@/lib/store";
import Hero from "@/components/Hero";
import Categories from "@/components/Categories";
import Menu from "@/components/Menu";
import { Features, Steps, Contact } from "@/components/Sections";
import { CartBar, CartSheet } from "@/components/Cart";

export default function Home() {
return (
<AppProvider>
<Hero />
<main>
<Categories />
<Menu />
<Features />
<Steps />
<Contact />
</main>
<CartBar />
<CartSheet />
</AppProvider>
);
}
