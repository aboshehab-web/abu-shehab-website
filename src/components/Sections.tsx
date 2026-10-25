"use client";

import { useApp } from "@/lib/store";

export function Features() {
  const f = [
    ["مشويات على الفحم", "نشوي الأصناف على الفحم لنكهة مشويات مصرية معروفة."],
    ["طلب سهل", "اختر أصنافك وأضفها للسلة وأرسل الطلب بدون إنشاء حساب."],
    ["الدفع عند الاستلام", "الدفع نقدًا، حسب المعلومات المتاحة حاليًا."],
  ];
  return (
    <section className="sec" aria-labelledby="feat-h">
      <div className="wrap">
        <div className="sec-head"><h2 id="feat-h" className="display">لماذا أبو شهاب؟</h2></div>
        <div className="feat-grid">
          {f.map(([t, d]) => (
            <div className="feat" key={t}><h3>{t}</h3><p>{d}</p></div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Steps() {
  const s = ["اختر الأصناف من المنيو", "أضفها إلى السلة", "أدخل بياناتك وعنوانك", "أرسل طلبك عبر واتساب"];
  return (
    <section className="sec alt" aria-labelledby="steps-h">
      <div className="wrap">
        <div className="sec-head"><h2 id="steps-h" className="display">طريقة الطلب</h2></div>
        <ol className="steps" style={{ listStyle: "none" }}>
          {s.map((t, i) => (
            <li className="step" key={t}><b>{i + 1}</b><span>{t}</span></li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function Contact() {
  const { settings } = useApp();
  return (
    <section className="sec" id="contact" aria-labelledby="contact-h">
      <div className="wrap">
        <div className="sec-head"><h2 id="contact-h" className="display">تواصل معنا</h2></div>
        <div className="contact-grid">
          <dl className="contact-card">
            <dt>العنوان</dt><dd>{settings.address}</dd>
            <dt>ساعات العمل</dt><dd>{settings.hours}</dd>
            <dt>الدفع</dt><dd>{settings.payment}</dd>
            <dt>الهاتف</dt><dd dir="ltr" style={{ textAlign: "right" }}>{settings.phone}</dd>
          </dl>
          <div className="contact-actions">
            <a className="btn btn-primary" href={`tel:+2${settings.phone.replace(/^0/, "")}`}>اتصل الآن</a>
            <a className="btn btn-wa" href={`https://wa.me/2${settings.whatsapp.replace(/^0/, "")}`} target="_blank" rel="noopener noreferrer">تواصل عبر واتساب</a>
            <a className="btn btn-ghost" href={settings.maps_url} target="_blank" rel="noopener noreferrer">افتح الخريطة</a>
          </div>
        </div>
      </div>
      <p className="footer" style={{ marginTop: 48 }}>© {settings.name}</p>
    </section>
  );
}
