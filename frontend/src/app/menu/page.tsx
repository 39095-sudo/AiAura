"use client";

import Navbar from "@/components/Navbar";
import Image from "next/image";
import { UtensilsCrossed } from "lucide-react";

interface MenuItem {
  name: string;
  price: number;
  image: string;
  description: string;
}

interface MenuCategory {
  title: string;
  items: MenuItem[];
}

const menuData: MenuCategory[] = [
  {
    title: "Mains",
    items: [
      { name: "Club Sandwich", price: 18, image: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&h=300&fit=crop", description: "Triple-decker with turkey, bacon, lettuce & tomato" },
      { name: "Caesar Salad", price: 15, image: "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&h=300&fit=crop", description: "Crisp romaine, parmesan, croutons & house dressing" },
      { name: "Grilled Chicken", price: 24, image: "https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=400&h=300&fit=crop", description: "Herb-marinated chicken breast with seasonal vegetables" },
      { name: "Pasta Carbonara", price: 20, image: "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400&h=300&fit=crop", description: "Classic Italian pasta with pancetta & creamy egg sauce" },
      { name: "Margherita Pizza", price: 16, image: "https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=400&h=300&fit=crop", description: "Fresh mozzarella, basil & San Marzano tomato sauce" },
      { name: "Burger", price: 19, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop", description: "Angus beef patty with cheddar, lettuce & special sauce" },
      { name: "Steak", price: 35, image: "https://images.unsplash.com/photo-1600891964092-4316c288032e?w=400&h=300&fit=crop", description: "8oz premium ribeye with garlic butter & fries" },
      { name: "Salmon", price: 28, image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&h=300&fit=crop", description: "Pan-seared Atlantic salmon with lemon dill sauce" },
    ],
  },
  {
    title: "Sides & Soups",
    items: [
      { name: "French Fries", price: 8, image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=300&fit=crop", description: "Crispy golden fries with house seasoning" },
      { name: "Soup of the Day", price: 12, image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop", description: "Chef's daily fresh soup served with artisan bread" },
    ],
  },
  {
    title: "Breakfast",
    items: [
      { name: "Breakfast Platter", price: 22, image: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&h=300&fit=crop", description: "Eggs, bacon, toast, sausage, hash browns & juice" },
      { name: "Fruit Platter", price: 15, image: "https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?w=400&h=300&fit=crop", description: "Seasonal fresh fruits with honey yogurt dip" },
    ],
  },
  {
    title: "Beverages",
    items: [
      { name: "Coffee", price: 5, image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&h=300&fit=crop", description: "Freshly brewed premium Arabica coffee" },
      { name: "Tea", price: 4, image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=300&fit=crop", description: "Selection of fine teas - English Breakfast, Earl Grey, Green" },
      { name: "Fresh Juice", price: 7, image: "https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?w=400&h=300&fit=crop", description: "Freshly squeezed orange, apple or mixed berry" },
      { name: "Mineral Water", price: 3, image: "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&h=300&fit=crop", description: "Still or sparkling premium mineral water" },
    ],
  },
  {
    title: "Drinks",
    items: [
      { name: "Beer", price: 9, image: "https://images.unsplash.com/photo-1608270586620-248524c67de9?w=400&h=300&fit=crop", description: "Selection of local and imported craft beers" },
      { name: "Wine", price: 14, image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=400&h=300&fit=crop", description: "Glass of house red, white, or rosé wine" },
    ],
  },
  {
    title: "Desserts",
    items: [
      { name: "Dessert", price: 12, image: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400&h=300&fit=crop", description: "Chef's special dessert of the day" },
      { name: "Ice Cream", price: 10, image: "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=400&h=300&fit=crop", description: "Three scoops - vanilla, chocolate & strawberry" },
    ],
  },
];

export default function MenuPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
              <UtensilsCrossed className="w-6 h-6 text-accent" />
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Room Service Menu</h1>
            <p className="text-muted text-[13px] mt-1.5">Available 24/7 — Order through our AI Concierge</p>
          </div>

          {/* Menu Sections */}
          {menuData.map((category) => (
            <section key={category.title} className="mb-10">
              <h2 className="text-lg font-bold text-foreground mb-4 pb-2 border-b border-border flex items-center gap-2">
                <span className="w-1 h-5 bg-accent rounded-full" />
                {category.title}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {category.items.map((item) => (
                  <div key={item.name} className="bg-white rounded-lg border border-border overflow-hidden hover:shadow-md transition-all group">
                    <div className="relative h-40 overflow-hidden">
                      <Image src={item.image} alt={item.name} fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" unoptimized />
                      <div className="absolute top-2 right-2 bg-primary text-white text-[12px] font-bold px-2 py-0.5 rounded shadow">${item.price}</div>
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-[13px] text-foreground">{item.name}</h3>
                      <p className="text-[11px] text-muted leading-relaxed mt-0.5">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}

          {/* Footer CTA */}
          <div className="text-center py-8 bg-primary rounded-xl">
            <p className="text-white font-semibold text-[15px]">Ready to order?</p>
            <p className="text-white/60 text-[13px] mt-1 mb-4">Tell our AI Concierge what you'd like</p>
            <a href="/" className="inline-flex items-center gap-2 px-5 py-2 bg-accent text-primary-dark rounded-md font-semibold text-[13px] hover:bg-accent-light transition-colors">
              Order via Chat
            </a>
          </div>
        </div>
      </main>
    </>
  );
}
