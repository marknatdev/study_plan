"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  LayoutDashboard,
  PlusCircle,
  Calendar,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import styles from "./dashboard.module.css";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || "");
      } else {
        router.push("/auth");
      }
    };
    getUser();
  }, [router, supabase.auth]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const navLinks = [
    {
      href: "/dashboard",
      label: "My Plans",
      icon: <LayoutDashboard size={18} />,
    },
    {
      href: "/dashboard/calendar",
      label: "Calendar",
      icon: <Calendar size={18} />,
    },
    {
      href: "/dashboard/create",
      label: "New Plan",
      icon: <PlusCircle size={18} />,
    },
  ];

  const initial = userEmail ? userEmail[0].toUpperCase() : "?";

  return (
    <div className={styles.dashLayout}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className={styles.overlay}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}
      >
        <div className={styles.sidebarLogo}>
          <div className={styles.sidebarLogoIcon}>
            <BookOpen size={16} color="white" />
          </div>
          StudyForge
        </div>

        <nav className={styles.sidebarNav}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.sidebarLink} ${
                pathname === link.href ? styles.sidebarLinkActive : ""
              }`}
              onClick={() => setSidebarOpen(false)}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>{initial}</div>
            <div className={styles.userEmail}>{userEmail}</div>
          </div>
          <button
            className={`${styles.sidebarLink}`}
            onClick={handleLogout}
            style={{ width: "100%" }}
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <main className={styles.main}>
        <div className={styles.topBar}>
          <button
            className={styles.mobileMenuBtn}
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
        {children}
      </main>
    </div>
  );
}
