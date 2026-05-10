"use client";
import Link from "next/link";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { Home, ShoppingBag, Bot, Images, User } from "lucide-react";

interface Item {
  key: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  matchTab?: string; // query param `tab` value
  special?: boolean;
}

export default function BottomNav() {
  const pathname = usePathname();
  const search = useSearchParams();
  const router = useRouter();
  const activeTab = search?.get("tab");

  const items: Item[] = [
    { key: "home", label: "Beranda", href: "/", icon: <Home size={20} strokeWidth={1.7} /> },
    { key: "market", label: "Produk", href: "/?tab=marketplace", icon: <ShoppingBag size={20} strokeWidth={1.7} />, matchTab: "marketplace" },
    { key: "ai", label: "AI", href: "/ai", icon: <Bot size={22} strokeWidth={1.7} />, special: true },
    { key: "galeri", label: "Galeri", href: "/?tab=kegiatan", icon: <Images size={20} strokeWidth={1.7} />, matchTab: "kegiatan" },
    { key: "profil", label: "Profil", href: "/tentang", icon: <User size={20} strokeWidth={1.7} /> },
  ];

  const isActive = (it: Item) => {
    if (it.key === "ai") return pathname === "/ai";
    if (it.matchTab) return pathname === "/" && activeTab === it.matchTab;
    if (it.key === "home") return pathname === "/" && !activeTab;
    if (it.key === "profil") return pathname === "/tentang";
    return false;
  };

  const onClick = (e: React.MouseEvent, it: Item) => {
    // Handle Beranda click - force navigation to clear tab params
    if (it.key === "home" && pathname === "/" && activeTab) {
      e.preventDefault();
      router.push("/");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <>
      <nav
        aria-label="Bottom navigation"
        className="ciburial-bottom-nav"
        style={{
          position: "fixed",
          bottom: 0, left: 0, right: 0,
          zIndex: 45,
          paddingBottom: "env(safe-area-inset-bottom, 0)",
          background: "rgba(250,248,243,.92)",
          backdropFilter: "blur(14px)",
          borderTop: "1px solid var(--bo)",
          boxShadow: "0 -8px 24px rgba(28,58,43,.08)",
        }}
      >
        <ul style={{
          margin: 0, padding: "8px 4px 10px",
          display: "grid", gridTemplateColumns: "repeat(5, 1fr)",
          listStyle: "none",
        }}>
          {items.map((it) => {
            const active = isActive(it);
            return (
              <li key={it.key}>
                <Link
                  href={it.href}
                  onClick={(e) => onClick(e, it)}
                  aria-current={active ? "page" : undefined}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                    padding: it.special ? "2px 0" : "6px 0",
                    textDecoration: "none",
                    color: active ? "var(--accent)" : "var(--tm)",
                    fontWeight: active ? 700 : 500,
                    transition: "color .2s",
                    position: "relative",
                  }}
                >
                  <span
                    style={it.special ? {
                      width: 44, height: 44, borderRadius: "50%",
                      background: "linear-gradient(135deg, #2F8F4E 0%, #4FBF7E 100%)",
                      color: "#fff",
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      boxShadow: "0 8px 20px rgba(47,143,78,.35)",
                      transform: active ? "translateY(-4px) scale(1.05)" : "translateY(-4px)",
                      transition: "transform .25s cubic-bezier(.22,1,.36,1)",
                      border: "3px solid var(--cr)",
                    } : {
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      transition: "transform .25s",
                      transform: active ? "scale(1.08)" : "scale(1)",
                    }}
                  >
                    {it.icon}
                  </span>
                  <span style={{ fontSize: 9.5, letterSpacing: ".05em", textTransform: "uppercase" }}>
                    {it.label}
                  </span>
                  {active && !it.special && (
                    <span style={{
                      position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
                      width: 24, height: 2, borderRadius: 99,
                      background: "var(--accent)",
                    }} />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Spacer so fixed bottom nav doesn't overlap page content on mobile */}
      <div className="ciburial-bottom-nav-spacer" aria-hidden="true" />

      <style>{`
        .ciburial-bottom-nav, .ciburial-bottom-nav-spacer { display: none; }
        @media (max-width: 767px) {
          .ciburial-bottom-nav { display: block; }
          .ciburial-bottom-nav-spacer { display: block; height: calc(72px + env(safe-area-inset-bottom, 0px)); }
        }
      `}</style>
    </>
  );
}
