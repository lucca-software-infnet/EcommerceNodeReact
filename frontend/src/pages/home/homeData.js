function formatSeed(n) {
  return (n * 37) % 997;
}

export const HERO_SLIDES = [
  {
    id: "hero-1",
    badge: "Ofertas relâmpago",
    title: "Descontos que acabam hoje",
    subtitle: "Produtos populares com frete rápido e compra segura.",
    cta: "Ver ofertas",
    theme: "blue",
  },
  {
    id: "hero-2",
    badge: "Tecnologia",
    title: "Upgrade com preço justo",
    subtitle: "Acessórios e gadgets selecionados para o dia a dia.",
    cta: "Explorar tech",
    theme: "steel",
  },
  {
    id: "hero-3",
    badge: "Casa & escritório",
    title: "Conforto e produtividade",
    subtitle: "Tudo para montar seu setup com qualidade.",
    cta: "Montar meu setup",
    theme: "neutral",
  },
];

export const CATEGORIES = [
  { id: "tech", label: "Tecnologia" },
  { id: "audio", label: "Áudio" },
  { id: "office", label: "Escritório" },
  { id: "home", label: "Casa" },
];

export const MOCK_PRODUCTS = [
  { id: "p1", name: "Fone Bluetooth Pro ANC", price: 299.9, category: "audio", seed: formatSeed(11) },
  { id: "p2", name: "Smartwatch Fitness 2", price: 219.9, category: "tech", seed: formatSeed(22) },
  { id: "p3", name: "Mouse Gamer 16000 DPI", price: 149.9, category: "tech", seed: formatSeed(33) },
  { id: "p4", name: "Teclado Mecânico Compacto", price: 399.9, category: "tech", seed: formatSeed(44) },
  { id: "p5", name: "Câmera Wi‑Fi 1080p", price: 169.9, category: "home", seed: formatSeed(55) },
  { id: "p6", name: "Cadeira Ergonômica", price: 899.9, category: "office", seed: formatSeed(66) },
  { id: "p7", name: "Hub USB‑C 8 em 1", price: 189.9, category: "tech", seed: formatSeed(77) },
  { id: "p8", name: "Caixa de Som Portátil", price: 249.9, category: "audio", seed: formatSeed(88) },
  { id: "p9", name: "Monitor 27\" IPS 75Hz", price: 1099.9, category: "office", seed: formatSeed(99) },
  { id: "p10", name: "Webcam Full HD com Microfone", price: 189.9, category: "office", seed: formatSeed(101) },
  { id: "p11", name: "Luminária LED de Mesa", price: 99.9, category: "home", seed: formatSeed(111) },
  { id: "p12", name: "Organizador de Cabos Premium", price: 39.9, category: "office", seed: formatSeed(121) },
  { id: "p13", name: "Carregador Rápido 65W USB‑C", price: 129.9, category: "tech", seed: formatSeed(131) },
  { id: "p14", name: "Soundbar Compacta", price: 499.9, category: "audio", seed: formatSeed(141) },
  { id: "p15", name: "Aspirador Portátil Sem Fio", price: 259.9, category: "home", seed: formatSeed(151) },
  { id: "p16", name: "Suporte de Notebook Ajustável", price: 119.9, category: "office", seed: formatSeed(161) },
];

