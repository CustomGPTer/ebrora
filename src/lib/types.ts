export interface Product {
  id: string;
  title: string;
  category: string[];
  price: string;
  oldPrice: string;
  badge: string;
  icon: string;
  desc: string;
  longDesc: string;
  features: string[];
  images: string[];
  pdfLink: string;
  buyLink: string;
  youtubeId: string;
  new: boolean;
  featured: boolean;
  compatible: string;
  version: string;
  fileSize: string;
  lastUpdate: string;
  popularity: number;
  isBundle: boolean;
  bundleProducts: string[];
}

export interface Category {
  label: string;
  icon: string;
}

export interface Review {
  stars: number;
  text: string;
  author: string;
  role: string;
}
