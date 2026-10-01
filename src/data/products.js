// Product catalog data shared by the storefront views.
const tshirtDropDetails = {
  11: ["Control Yourself Washed Tee", "Washed grey oversized T-shirt with a three-line chest slogan."],
  13: ["Rose Brushstroke Boxy Tee", "Sand-colored boxy T-shirt with a faded rose chest graphic."],
  14: ["Faded Typography Ombre Tee", "Dark oversized T-shirt with a subtle tonal chest print and faded finish."],
  15: ["Cloud Wash Mini-Print Tee", "Light oversized T-shirt with a charcoal cloud-wash pattern and small chest print."],
  16: ["Floral Script Washed Tee", "Charcoal washed T-shirt with a large floral illustration and script graphic."],
  17: ["Boneless Retrospect Boxy Tee", "Boxy dark T-shirt with a bold BONELESS RETROSPECT chest print."],
  18: ["Trend Logo Green Tee", "Green oversized T-shirt with a large TREND front graphic."],
  19: ["11:11 Rose Graphic Tee", "Brown oversized T-shirt with an 11:11 and rose chest graphic."],
  20: ["Boneless Chest Logo Tee", "White oversized T-shirt with a small BONELESS chest logo."],
  21: ["Minimal Heart Emblem Tee", "Cream oversized T-shirt with a small abstract heart-shaped chest emblem."],
  22: ["John Seafood Graphic Tee", "White oversized T-shirt with a blue seafood illustration and JOHN lettering."],
  23: ["Studded Wordmark Black Tee", "Black oversized T-shirt with a sparkling chest wordmark."],
  24: ["Trust Issues 02 Graphic Tee", "Muted mauve oversized T-shirt with a raised TRUST ISSUES 02 front graphic."],
  25: ["Summum Studios Washed Tee", "Mint-green washed T-shirt with a small Summum Studios chest wordmark."]
};

export const products = [
    { id: 1, name: "SUMMER COLLECTION TEE", price: 700, oldPrice: null, image: "/images/product1.jpg", tag: "HOT", size: "M", color: "Black", inStock: true, rating: 4.5, availableColors: ["#000", "#fff", "#7e22ce"], description: "Premium heavyweight cotton oversized tee with exclusive summer artwork. Limited edition drop - no restocks once sold out." },
    { id: 2, name: "ULTIMATE BERSERK TEE", price: 750, oldPrice: 1450, image: "/images/product2.jpg", tag: "SALE", size: "L", color: "White", inStock: true, rating: 5.0, availableColors: ["#fff", "#000"], description: "Inspired by the legendary Berserk manga. Heavyweight cotton with detailed anime artwork. A must-have for true fans." },
    { id: 3, name: "LUFFY - STRAW HAT", price: 750, oldPrice: 1250, image: "/images/product3.jpg", tag: "SALE", size: "XL", color: "Red", inStock: false, rating: 4.2, availableColors: ["#dc2626", "#000"], description: "One Piece inspired design featuring Luffy's iconic straw hat. Oversized fit with premium fabric." },
    { id: 4, name: "ZORO ASHU MODE", price: 680, oldPrice: 1450, image: "/images/product4.jpg", tag: "SALE", size: "M", color: "Green", inStock: true, rating: 4.8, availableColors: ["#16a34a", "#000"], description: "Zoro's Ashura mode design in striking green. Limited run with exclusive artwork and premium cotton." },
    { id: 5, name: "DARK STREET OVERSIZED", price: 800, oldPrice: null, image: "/images/product5.jpg", tag: "NEW", size: "XXL", color: "Black", inStock: true, rating: 4.6, availableColors: ["#000", "#7e22ce"], description: "Dark aesthetic streetwear with oversized fit. Perfect for those who appreciate minimal yet bold designs." },
    { id: 6, name: "ANIME VINTAGE TEE", price: 720, oldPrice: 1100, image: "/images/product6.jpg", tag: "SALE", size: "L", color: "Purple", inStock: true, rating: 4.1, availableColors: ["#7e22ce", "#fff"], description: "Vintage anime aesthetic with retro color palette. Soft cotton blend for maximum comfort." },
    { id: 7, name: "SHADOW HUNTER HOODIE", price: 1150, oldPrice: 1600, image: "/images/product7.jpg", tag: "POPULAR", size: "XL", color: "Black", inStock: true, rating: 4.9, availableColors: ["#000", "#dc2626"], description: "Premium hoodie inspired by Shadow Hunter anime. Heavyweight fabric with detailed embroidery." },
    { id: 8, name: "TOKYO REVENGE DROP", price: 790, oldPrice: null, image: "/images/product8.jpg", tag: "LIMITED", size: "S", color: "White", inStock: false, rating: 3.9, availableColors: ["#fff", "#000"], description: "Limited edition Tokyo Revengers collaboration. Only 100 pieces made worldwide." },
    { id: 9, name: "NINJA STREETWEAR", price: 850, oldPrice: 1300, image: "/images/product9.jpg", tag: "SALE", size: "M", color: "Black", inStock: true, rating: 4.4, availableColors: ["#000", "#16a34a"], description: "Naruto-inspired streetwear with modern twist. Oversized fit with premium cotton blend." },
    { id: 10, name: "CYBERPUNK GRAPHIC TEE", price: 740, oldPrice: null, image: "/images/product10.jpg", tag: "NEW", size: "L", color: "Purple", inStock: true, rating: 4.7, availableColors: ["#7e22ce", "#000"], description: "Futuristic cyberpunk design with neon accents. Perfect for tech and anime enthusiasts." },
    ...[11, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25].map(id => {
      return {
        id,
        name: tshirtDropDetails[id][0],
        price: 700 + ((id - 11) % 6) * 50,
        oldPrice: null,
        image: `/images/product${id}.jpg`,
        detailImages: [1, 2, 3, 4].map(view => `/images/product${id}-detail${view}.jpg`),
        tag: "NEW",
        size: "M",
        color: "Black",
        category: "T-SHIRTS",
        inStock: true,
        rating: 4.5,
        availableColors: ["#000", "#fff"],
        description: tshirtDropDetails[id][1]
      };
    }),
  ];

export const typeCategories = {
    "T-SHIRTS": products.map(item => ({ ...item, category: "T-SHIRTS" })),
    "HOODIES": [
      { id: "h1", name: "Shadow Hunter Hoodie", price: 1150, oldPrice: 1600, image: "/images/Hoodies1.jpg", size: "L", category: "HOODIES", color: "Black", inStock: true, rating: 4.9, tag: "BESTSELLER", availableColors: ["#000", "#fff"], description: "Premium hoodie inspired by Shadow Hunter anime." },
      { id: "h2", name: "Tokyo Revenge Drop", price: 1100, oldPrice: 1500, image: "/images/Hoodies2.jpg", size: "XL", category: "HOODIES", color: "White", inStock: true, rating: 4.4, tag: "SALE", availableColors: ["#fff", "#000"], description: "Tokyo Revengers collaboration hoodie." },
      { id: "h3", name: "Akatsuki Legend Hoodie", price: 1200, oldPrice: 1700, image: "/images/Hoodies3.jpg", size: "M", category: "HOODIES", color: "Red", inStock: true, rating: 4.7, tag: "NEW", availableColors: ["#dc2626", "#000"], description: "Naruto Akatsuki design. Premium heavyweight hoodie." },
      { id: "h4", name: "Chibi Squad Hoodie", price: 1050, oldPrice: 1400, image: "/images/Hoodies4.jpg", size: "S", category: "HOODIES", color: "Purple", inStock: false, rating: 4.1, tag: "HOT", availableColors: ["#7e22ce", "#fff"], description: "Cute chibi anime characters design." },
      ...[
        ["SAWN Contrast-Piped Hoodie", "Black pullover hoodie with white contrast piping and a small chest wordmark."],
        ["Circle Star Logo Hoodie", "Navy pullover hoodie with a large circular star chest graphic."],
        ["Legendary Piped Hoodie", "Navy hoodie with contrast piping and a small LEGENDARY chest graphic."],
        ["Scuffers Colorblock Hoodie", "Navy hoodie with cream contrast panels and a large Scuffers chest print."]
      ].map(([name, description], index) => {
        const id = index + 5;
        return { id: `h${id}`, name, price: 1100 + (id - 5) * 50, oldPrice: null, image: `/images/Hoodies${id}.jpg`, size: "L", category: "HOODIES", color: "Black", inStock: true, rating: 4.4, tag: "NEW", availableColors: ["#000", "#fff"], description };
      }),
    ],
    "JACKETS": [
      { id: "j1", name: "Cyberpunk Utility Jacket", price: 1450, oldPrice: 1900, image: "/images/Jackets1.jpg", size: "XL", category: "JACKETS", color: "Black", inStock: true, rating: 4.8, tag: "BESTSELLER", availableColors: ["#000", "#16a34a"], description: "Futuristic cyberpunk utility jacket with multiple pockets." },
      { id: "j2", name: "Streetwear Bomber Jacket", price: 1350, oldPrice: 1800, image: "/images/Jackets2.jpg", size: "L", category: "JACKETS", color: "Green", inStock: true, rating: 4.5, tag: "SALE", availableColors: ["#16a34a", "#000"], description: "Classic bomber jacket with modern streetwear twist." },
      { id: "j3", name: "Demon Slayer Haori", price: 1250, oldPrice: 1650, image: "/images/Jackets3.jpg", size: "M", category: "JACKETS", color: "White", inStock: true, rating: 4.6, tag: "NEW", availableColors: ["#fff", "#7e22ce"], description: "Demon Slayer inspired haori jacket." },
      { id: "j5", name: "WB 23 Varsity Jacket", price: 1550, oldPrice: null, image: "/images/Jackets5.jpg", size: "L", category: "JACKETS", color: "Black", inStock: true, rating: 4.5, tag: "NEW", availableColors: ["#000"], description: "Black varsity jacket with faux-leather sleeves, striped ribbing, and WB 23 chest graphics." },
    ],
    "PANTS": [
      { id: "p1", name: "Cargo Tech Pants", price: 950, oldPrice: 1300, image: "/images/Pants1.jpg", size: "L", category: "PANTS", color: "Black", inStock: true, rating: 4.7, tag: "BESTSELLER", availableColors: ["#000", "#fff"], description: "Tech cargo pants with multiple utility pockets." },
      { id: "p2", name: "Oversized Street Joggers", price: 850, oldPrice: 1150, image: "/images/Pants2.jpg", size: "M", category: "PANTS", color: "Purple", inStock: true, rating: 4.3, tag: "SALE", availableColors: ["#7e22ce", "#000"], description: "Oversized joggers perfect for streetwear style." },
      { id: "p3", name: "Dark Aesthetic Trousers", price: 900, oldPrice: 1250, image: "/images/Pants3.jpg", size: "XL", category: "PANTS", color: "Black", inStock: false, rating: 4.0, tag: "NEW", availableColors: ["#000"], description: "Dark aesthetic trousers with clean lines." },
      ...[
        ["Black Embroidered Wide-Leg Sweatpants", "Black wide-leg sweatpants with a large tonal embroidered leg graphic."],
        ["Grey Patch-Pocket Baggy Joggers", "Grey baggy joggers with a rear patch pocket and a small embroidered motif."],
        ["Statement Print Sweat Set", "Coordinated navy sweatshirt and taupe joggers with bold front lettering."]
      ].map(([name, description], index) => {
        const id = index + 4;
        return { id: `p${id}`, name, price: 850 + (id - 4) * 50, oldPrice: null, image: `/images/Pants${id}.jpg`, size: "L", category: "PANTS", color: "Black", inStock: true, rating: 4.4, tag: "NEW", availableColors: ["#000", "#fff"], description };
      }),
    ],
    "CAPS": [
      { id: "c1", name: "Berserk Cap Black", price: 220, oldPrice: 450, image: "/images/Caps3.jpg", size: "M", category: "CAPS", color: "Black", inStock: true, rating: 4.6, tag: "SALE", availableColors: ["#000", "#fff"], description: "Berserk logo cap. Adjustable fit." },
      { id: "c2", name: "Sukuna Curse Cap", price: 220, oldPrice: 400, image: "/images/Caps8.jpg", size: "M", category: "CAPS", color: "Red", inStock: true, rating: 4.4, tag: "HOT", availableColors: ["#dc2626", "#000"], description: "Jujutsu Kaisen Sukuna curse mark design." },
      { id: "c3", name: "Straw Hat Minimal Cap", price: 250, oldPrice: 500, image: "/images/Caps1.jpg", size: "M", category: "CAPS", color: "White", inStock: true, rating: 4.8, tag: "BESTSELLER", availableColors: ["#fff", "#000"], description: "Minimal straw hat design inspired by One Piece." },
      { id: "c2-alt", name: "Creme Logo Cap", price: 240, oldPrice: null, image: "/images/Caps2.jpg", size: "M", category: "CAPS", color: "White", inStock: true, rating: 4.4, tag: "NEW", availableColors: ["#000", "#fff"], description: "Cream baseball cap with a black CREME front wordmark." },
      ...[
        ["Citizens Beverly Hills Cap", "White baseball cap with CITIZENS and Beverly Hills front embroidery."],
        ["Discipline Patch Trucker Cap", "Two-tone trucker cap with a colorful illustrated DISCIPLINE front patch."],
        ["Camouflage Patch Trucker Cap", "Camouflage and mesh trucker cap with a circular embroidered front patch."],
        ["Burgundy Corduroy Initial Cap", "Burgundy corduroy cap with small embroidered initials."]
      ].map(([name, description], index) => {
        const id = index + 4;
        return { id: `c${id}`, name, price: 220 + (id % 3) * 20, oldPrice: null, image: `/images/Caps${id}.jpg`, size: "M", category: "CAPS", color: "Black", inStock: true, rating: 4.4, tag: "NEW", availableColors: ["#000", "#fff"], description };
      }),
    ]
  };

export const counts = Object.fromEntries(
  Object.entries(typeCategories).map(([category, items]) => [category, items.length])
);
export const categoryIcons = { "T-SHIRTS": "👕", "HOODIES": "", "JACKETS": "🧥", "PANTS": "", "CAPS": "🧢" };

// Used only when the catalog API is unavailable; category entries take precedence over duplicates.
const normalizeProductName = product => String(product.name || '').trim().toLowerCase();
const fallbackCandidates = [
  ...Object.entries(typeCategories)
    .filter(([category]) => category !== 'T-SHIRTS')
    .flatMap(([, items]) => items),
  ...typeCategories['T-SHIRTS']
];
const fallbackNames = new Set();

export const localCatalog = fallbackCandidates.filter(product => {
  const name = normalizeProductName(product);
  if (!name || fallbackNames.has(name)) return false;
  fallbackNames.add(name);
  return true;
});
