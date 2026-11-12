// Bundled defaults. The site renders these if the database is unreachable or empty.
// Prices are placeholders until the owner sets real ones in the admin.
window.HB_DEFAULTS = {
  settings: {
    banner: { enabled: false, text_en: "", text_ar: "" },
    hours: [
      { day: 0, open: "10:00", close: "22:00", closed: false },
      { day: 1, open: "10:00", close: "22:00", closed: false },
      { day: 2, open: "10:00", close: "22:00", closed: false },
      { day: 3, open: "10:00", close: "22:00", closed: false },
      { day: 4, open: "10:00", close: "22:00", closed: false },
      { day: 5, open: "16:00", close: "22:00", closed: false },
      { day: 6, open: "10:00", close: "22:00", closed: false }
    ],
    rating: { value: 0, count: 0, show: false },
    alert_sound: "chime"
  },
  categories: [
    { id: "c-abaya", name_en: "Abayas", name_ar: "العبايات", sort: 1, hidden: false },
    { id: "c-sash", name_en: "National Day sashes", name_ar: "أوشحة العيد الوطني", sort: 2, hidden: false },
    { id: "c-occasion", name_en: "Occasion wear", name_ar: "إطلالات المناسبات", sort: 3, hidden: false }
  ],
  items: [
    { id: "i1", category_id: "c-abaya", name_en: "Everyday black abaya", name_ar: "عباية سوداء يومية", desc_en: "Plain weave, open front, wide sleeve.", desc_ar: "نسيج سادة، فتحة أمامية، كم واسع.", price: 38, img: "abaya-black-front.jpg", sort: 1, hidden: false, sold_out: false },
    { id: "i2", category_id: "c-abaya", name_en: "Lace panel abaya", name_ar: "عباية بتفصيل دانتيل", desc_en: "Black lace panel across the back, metal tag.", desc_ar: "لوح دانتيل أسود على الظهر مع شارة معدنية.", price: 65, img: "abaya-lace-back.jpg", sort: 2, hidden: false, sold_out: false },
    { id: "i3", category_id: "c-abaya", name_en: "Gold lace evening abaya", name_ar: "عباية سهرة بدانتيل ذهبي", desc_en: "Black lace with gold thread, hooded.", desc_ar: "دانتيل أسود بخيوط ذهبية مع غطاء رأس.", price: 95, img: "abaya-seated.jpg", sort: 3, hidden: false, sold_out: false },
    { id: "i4", category_id: "c-sash", name_en: "Sand sash, embroidered", name_ar: "وشاح رملي مطرز", desc_en: "Satin in desert sand, gold embroidery.", desc_ar: "ساتان بلون رمل الصحراء مع تطريز ذهبي.", price: 18, img: "sash-sand-detail.jpg", sort: 1, hidden: false, sold_out: false },
    { id: "i5", category_id: "c-sash", name_en: "Red sash, dagger belt motif", name_ar: "وشاح أحمر بنقشة حزام الخنجر", desc_en: "Red satin, gold embroidery, name in Arabic script.", desc_ar: "ساتان أحمر مع تطريز ذهبي وخط عربي.", price: 18, img: "sash-red-thobe.jpg", sort: 2, hidden: false, sold_out: false },
    { id: "i6", category_id: "c-occasion", name_en: "Occasion set, abaya and sash", name_ar: "طقم مناسبات: عباية ووشاح", desc_en: "Lace abaya with a matching sand sash.", desc_ar: "عباية دانتيل مع وشاح رملي مطابق.", price: 110, img: "sash-sand-hooded.jpg", sort: 1, hidden: false, sold_out: false }
  ],
  photos: [
    { id: "p1", section: "hero", url: "assets/img/sash-sand-hooded.jpg", thumb: "assets/img/sm/sash-sand-hooded.jpg", caption_en: "Sand satin sash over black gold lace", caption_ar: "وشاح ساتان رملي فوق دانتيل أسود وذهبي", sort: 1 },
    { id: "p2", section: "gallery", url: "assets/img/abaya-black-front.jpg", thumb: "assets/img/sm/abaya-black-front.jpg", caption_en: "Black abaya with lace panel", caption_ar: "عباية سوداء بلوح دانتيل", sort: 1 },
    { id: "p3", section: "gallery", url: "assets/img/sash-red-thobe.jpg", thumb: "assets/img/sm/sash-red-thobe.jpg", caption_en: "Red sash, gold embroidery", caption_ar: "وشاح أحمر بتطريز ذهبي", sort: 2 },
    { id: "p4", section: "gallery", url: "assets/img/abaya-lace-back.jpg", thumb: "assets/img/sm/abaya-lace-back.jpg", caption_en: "Lace back panel", caption_ar: "لوح الدانتيل الخلفي", sort: 3 },
    { id: "p5", section: "gallery", url: "assets/img/sash-sand-detail.jpg", thumb: "assets/img/sm/sash-sand-detail.jpg", caption_en: "Embroidery detail", caption_ar: "تفصيل التطريز", sort: 4 },
    { id: "p6", section: "gallery", url: "assets/img/abaya-seated.jpg", thumb: "assets/img/sm/abaya-seated.jpg", caption_en: "Gold lace evening abaya", caption_ar: "عباية سهرة بدانتيل ذهبي", sort: 5 }
  ]
};
