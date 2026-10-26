
"use client";

import Image from "next/image";
import { useApp } from "@/lib/store";

export default function Hero() {
  const { settings, openSheet, count } = useApp();

  return (
    <header className="hero" id="home">
      <Image
        src="/images/hero.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="hero-img"
      />

      <nav className="nav" aria-label="التنقل الرئيسي">
        <div className="wrap">
          <span className="nav-brand display">{settings.name}</span>
          <ul>
            <li><a href="#home">الرئيسية</a></li>
            <li><a href="#menu">المنيو</a></li>
            <li><a href="#contact">تواصل معنا</a></li>
            <li>
              <button className="navlink" onClick={openSheet}>
                السلة{count > 0 ? ` (${count})` : ""}
              </button>
            </li>
          </ul>
        </div>
      </nav>

      <div className="wrap">
        <div className="hero-body">
          <h1 className="display">{settings.name}</h1>
          <p className="sub">{settings.tagline}</p>
          <p className="lead">طعم الفحم الأصيل، وتجربة طلب أسهل</p>

          <div className="hero-cta">
            <a href="#menu" className="btn btn-primary">اطلب الآن</a>
            <a
              href={`tel:+2${settings.phone.replace(/^0/, "")}`}
              className="btn btn-ghost"
            >
              اتصل بنا
            </a>
          </div>
        </div>
      </div>
    </header>
  );
}
