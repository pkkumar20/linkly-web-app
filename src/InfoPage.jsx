import React, { useEffect, useRef, useState } from "react";
import { motion, useInView, useMotionValue, useSpring, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router";

/* ─── Google Fonts ─────────────────────────────────────────── */
const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href =
  "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Work+Sans:wght@300;400;500;600;700&display=swap";
document.head.appendChild(fontLink);

/* ─── useWindowSize hook ────────────────────────────────────── */
function useWindowSize() {
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return size;
}

/* ─── Linkly Logo SVG ───────────────────────────────────────── */
function LinklyIcon({ size = 22, color = "#fff" }) {
  return (
    <svg fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ width: size, height: size }}>
      <polyline
        points="16 11 13 13 11 11 8 13"
        style={{ fill: "none", stroke: color, strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2 }}
      />
      <path
        d="M20.88,13.46A9,9,0,0,1,7.88,20L3,21l1-4.88a9,9,0,1,1,16.88-2.66Z"
        style={{ fill: "none", stroke: color, strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2 }}
      />
    </svg>
  );
}

/* ─── Animated Counter ──────────────────────────────────────── */
function AnimatedCounter({ target, suffix = "", duration = 2 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { duration: duration * 1000, bounce: 0 });
  const [display, setDisplay] = useState(0);

  useEffect(() => { if (inView) motionVal.set(target); }, [inView, target, motionVal]);
  useEffect(() => spring.on("change", (v) => setDisplay(Math.floor(v))), [spring]);

  return <span ref={ref}>{display.toLocaleString()}{suffix}</span>;
}

/* ─── Feature Card ──────────────────────────────────────────── */
function FeatureCard({ icon, title, desc, delay }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
      style={{
        background: "#ffffff",
        border: "1px solid rgba(135,99,234,0.12)",
        borderRadius: 24,
        padding: "36px 30px",
        boxShadow: "0 10px 30px -10px rgba(135,99,234,0.06)",
        cursor: "default"
      }}
      whileHover={{
        scale: 1.025,
        borderColor: "rgba(135,99,234,0.4)",
        boxShadow: "0 20px 40px -15px rgba(135,99,234,0.12)"
      }}
    >
      <div style={{
        width: 52,
        height: 52,
        borderRadius: 16,
        background: "linear-gradient(135deg, #8763ea, #a78bfa)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 20,
        boxShadow: "0 8px 20px rgba(135,99,234,0.25)"
      }}>
        {icon}
      </div>
      <h3 style={{ fontFamily: "Outfit", fontWeight: 700, fontSize: 19, color: "#1f1b2d", marginBottom: 12 }}>{title}</h3>
      <p style={{ fontFamily: "Work Sans", fontSize: 14.5, color: "#6b6680", lineHeight: 1.7 }}>{desc}</p>
    </motion.div>
  );
}

/* ─── Review Card ───────────────────────────────────────────── */
function ReviewCard({ name, role, avatar, text, stars, delay }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay }}
      style={{
        background: "#ffffff",
        border: "1px solid rgba(135,99,234,0.08)",
        borderRadius: 20,
        padding: "30px 26px",
        boxShadow: "0 10px 30px -10px rgba(135,99,234,0.04)"
      }}
    >
      <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
        {Array.from({ length: stars }).map((_, i) => (
          <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="#FBBF24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        ))}
      </div>
      <p style={{ fontFamily: "Work Sans", fontSize: 14.5, color: "#4b465c", lineHeight: 1.7, marginBottom: 20 }}>"{text}"</p>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${avatar}, #8763ea)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Outfit",
          fontWeight: 700,
          color: "#fff",
          fontSize: 16
        }}>
          {name[0]}
        </div>
        <div>
          <p style={{ fontFamily: "Outfit", fontWeight: 600, fontSize: 15, color: "#1f1b2d" }}>{name}</p>
          <p style={{ fontFamily: "Work Sans", fontSize: 12.5, color: "#8b869c" }}>{role}</p>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Floating Orb ──────────────────────────────────────────── */
function FloatingOrb({ size, top, left, color, duration }) {
  return (
    <motion.div
      style={{
        position: "absolute",
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        filter: "blur(90px)",
        top,
        left,
        pointerEvents: "none",
        zIndex: 0
      }}
      animate={{ y: [0, -25, 0], scale: [1, 1.05, 1] }}
      transition={{ duration, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

/* ─── Mobile/Tablet Popup ───────────────────────────────────── */
function MobilePopup({ onDownload, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(31,27,45,0.4)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center"
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#ffffff",
          border: "1px solid rgba(135,99,234,0.15)",
          borderRadius: "28px 28px 0 0",
          padding: "36px 28px 48px",
          width: "100%",
          maxWidth: 480,
          textAlign: "center",
          position: "relative",
          boxShadow: "0 -15px 40px rgba(135,99,234,0.08)"
        }}
      >
        <div style={{ width: 40, height: 4, borderRadius: 2, background: "rgba(135,99,234,0.15)", margin: "0 auto 28px" }} />

        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 20,
            right: 20,
            background: "rgba(135,99,234,0.06)",
            border: "none",
            borderRadius: "50%",
            width: 32,
            height: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer"
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8763ea" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div style={{
          width: 72,
          height: 72,
          borderRadius: "50%",
          background: "#8763ea",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 20px",
          boxShadow: "0 8px 25px rgba(135,99,234,0.3)"
        }}>
          <LinklyIcon size={36} />
        </div>

        <p style={{ fontFamily: "Work Sans", fontSize: 12, fontWeight: 600, color: "#8763ea", textTransform: "uppercase", letterSpacing: 2, marginBottom: 10 }}>
          Welcome To Linkly
        </p>
        <h2 style={{ fontFamily: "Outfit", fontWeight: 800, fontSize: 26, color: "#1f1b2d", letterSpacing: -0.8, marginBottom: 12, lineHeight: 1.2 }}>
          Chat with anyone, anywhere
        </h2>
        <p style={{ fontFamily: "Work Sans", fontSize: 15, color: "#6b6680", lineHeight: 1.7, marginBottom: 32 }}>
          Linkly is a modern, light-speed messaging application. Explore features or jump straight back to home to start texting.
        </p>

        <motion.button
          onClick={onDownload}
          whileTap={{ scale: 0.96 }}
          style={{
            background: "linear-gradient(135deg,#8763ea,#a78bfa)",
            border: "none",
            borderRadius: 16,
            padding: "16px 0",
            width: "100%",
            color: "#fff",
            fontFamily: "Outfit",
            fontWeight: 800,
            fontSize: 17,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            boxShadow: "0 8px 25px rgba(135,99,234,0.3)",
            marginBottom: 12
          }}
        >
          Get Started
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

/* ─── Main InfoPage ─────────────────────────────────────── */
export default function InfoPage() {
  const { w } = useWindowSize();
  const isMobile = w <= 640;
  const isTablet = w <= 1024;
  const isSmall = w <= 1024;

  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [showMobilePopup, setShowMobilePopup] = useState(false);

  useEffect(() => {
    if (isSmall && !sessionStorage.getItem("linkly-popup-shown")) {
      const t = setTimeout(() => {
        setShowMobilePopup(true);
        sessionStorage.setItem("linkly-popup-shown", "1");
      }, 800);
      return () => clearTimeout(t);
    }
  }, [isSmall]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleGoHome = () => {
    navigate("/");
  };

  /* ── Data ─────────────────────────────────────────────────── */
  const features = [
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      ),
      title: "Instant Messaging",
      desc: "Send text messages, voice notes, and rich media to anyone in your contacts instantly with real-time delivery.",
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
      title: "Full Privacy",
      desc: "Your data belongs to you. Linkly never sells, tracks, or shares your personal information. Zero data collection, full control.",
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      title: "Groups & Channels",
      desc: "Create groups for up to 1,000 members or broadcast channels for your audience. Perfect for communities.",
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
          <line x1="7" y1="2" x2="7" y2="22" />
          <line x1="17" y1="2" x2="17" y2="22" />
          <line x1="2" y1="12" x2="22" y2="12" />
        </svg>
      ),
      title: "Media Sharing",
      desc: "Share photos, videos, documents, and locations in high quality. No compression.",
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      ),
      title: "Reactions & Replies",
      desc: "React to any message with emoji reactions. Reply to specific messages to keep conversations organized.",
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
      title: "Always Available",
      desc: "Linkly runs seamlessly across all your devices. Your chats sync instantly, so you never miss a message.",
    },
  ];

  const reviews = [
    { name: "Priya S.", role: "Student, Mumbai", avatar: "#e879f9", text: "Linkly is super fast and the UI is gorgeous! Way better than WhatsApp for groups.", stars: 5 },
    { name: "Arjun K.", role: "Developer, Bangalore", avatar: "#38bdf8", text: "The message reactions and reply threading are chef's kiss. I switched from Telegram immediately.", stars: 5 },
    { name: "Neha M.", role: "Designer, Delhi", avatar: "#34d399", text: "Finally a chat app that looks as good as it works. The animations are so satisfying!", stars: 5 },
    { name: "Rohan P.", role: "Entrepreneur, Pune", avatar: "#fb923c", text: "Managing my team channel on Linkly is a breeze. Groups work perfectly for 500+ members.", stars: 4 },
  ];

  const stats = [
    { value: 50000, suffix: "+", label: "Active Users" },
    { value: 5, suffix: "M+", label: "Messages Sent" },
    { value: 4.9, suffix: "★", label: "Average Rating" },
    { value: 99, suffix: "%", label: "Uptime" },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: "#fcfbfe",
      fontFamily: "Work Sans, sans-serif",
      overflowX: "hidden",
      position: "relative",
      userSelect: "none",
      color: "#1f1b2d"
    }}>

      {/* ── Mobile/Tablet Popup ──────────────────────────────── */}
      <AnimatePresence>
        {showMobilePopup && (
          <MobilePopup onDownload={handleGoHome} onClose={() => setShowMobilePopup(false)} />
        )}
      </AnimatePresence>

      {/* ── Floating Navbar ─────────────────────────────────── */}
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{
          position: "fixed", top: isMobile ? 10 : 16, left: "50%", transform: "translateX(-50%)", zIndex: 100,
          width: `calc(100% - ${isMobile ? 24 : 48}px)`, maxWidth: 1100,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: isMobile ? "12px 16px" : "14px 28px", borderRadius: isMobile ? 16 : 20,
          background: scrolled ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.4)",
          border: "1px solid rgba(135,99,234,0.15)", backdropFilter: "blur(20px)",
          transition: "background 0.4s ease, border 0.4s ease",
          boxShadow: scrolled ? "0 10px 30px rgba(135,99,234,0.06)" : "none",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: "50%", background: "#8763ea",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 12px rgba(135,99,234,0.3)", flexShrink: 0
          }}>
            <LinklyIcon size={20} />
          </div>
          <span style={{ fontFamily: "Outfit", fontWeight: 800, fontSize: isMobile ? 18 : 20, color: "#1f1b2d", letterSpacing: -0.5 }}>Linkly</span>
        </div>

        {/* Desktop Nav Links */}
        {!isSmall && (
          <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
            {["Features", "Reviews", "About"].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`}
                style={{ fontFamily: "Work Sans", fontWeight: 500, fontSize: 14, color: "#6b6680", textDecoration: "none", transition: "color 0.2s" }}
                onMouseEnter={(e) => (e.target.style.color = "#8763ea")}
                onMouseLeave={(e) => (e.target.style.color = "#6b6680")}
              >{item}</a>
            ))}
          </div>
        )}

        {/* Action Button */}
        <motion.button
          onClick={handleGoHome}
          whileHover={{ scale: 1.05, boxShadow: "0 8px 25px rgba(135,99,234,0.3)" }}
          whileTap={{ scale: 0.97 }}
          style={{
            background: "linear-gradient(135deg,#8763ea,#a78bfa)",
            border: "none",
            borderRadius: isMobile ? 10 : 12,
            padding: isMobile ? "8px 14px" : "10px 22px",
            color: "#fff",
            fontFamily: "Outfit",
            fontWeight: 700,
            fontSize: isMobile ? 13 : 14,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6
          }}
        >
          Go to Home
        </motion.button>
      </motion.nav>

      {/* ── Background Orbs ─────────────────────────────────── */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
        <FloatingOrb size={isMobile ? 260 : 500} top="-10%" left="-10%" color="rgba(135,99,234,0.06)" duration={8} />
        <FloatingOrb size={isMobile ? 200 : 400} top="30%" left="65%" color="rgba(167,139,250,0.05)" duration={10} />
        <FloatingOrb size={isMobile ? 180 : 300} top="70%" left="10%" color="rgba(135,99,234,0.04)" duration={7} />
      </div>

      {/* ── HERO ────────────────────────────────────────────── */}
      <section style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: isMobile ? "100px 20px 60px" : isTablet ? "110px 32px 70px" : "120px 24px 80px", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 1100, width: "100%", display: "grid", gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr" : "1fr 1fr", gap: isMobile ? 48 : 64, alignItems: "center" }}>

          {/* Left Text */}
          <div style={{ textAlign: isMobile || isTablet ? "center" : "left" }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(135,99,234,0.08)", border: "1px solid rgba(135,99,234,0.2)", borderRadius: 100, padding: "6px 16px", marginBottom: 24 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#8763ea", boxShadow: "0 0 8px #8763ea" }} />
              <span style={{ fontFamily: "Work Sans", fontSize: 13, color: "#8763ea", fontWeight: 600 }}>Explore Linkly App</span>
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
              style={{ fontFamily: "Outfit", fontWeight: 900, fontSize: isMobile ? "clamp(32px,9vw,42px)" : "clamp(38px, 5vw, 62px)", color: "#1f1b2d", lineHeight: 1.1, letterSpacing: -1.5, marginBottom: 20 }}>
              Chat Smarter,<br />
              <span style={{ background: "linear-gradient(135deg,#8763ea,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Connect Better</span>
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
              style={{
                fontFamily: "Work Sans", fontSize: isMobile ? 15 : 18, color: "#6b6680", lineHeight: 1.7, marginBottom: 36,
                maxWidth: isMobile || isTablet ? "100%" : 480, margin: isMobile || isTablet ? "0 auto 36px" : "0 0 36px"
              }}>
              Linkly is the fastest, most secure messaging app built for you. Send messages, share media, create groups, and stay connected — all in one beautiful interface.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
              style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: isMobile || isTablet ? "center" : "flex-start" }}>
              <motion.button onClick={handleGoHome} whileHover={{ scale: 1.04, boxShadow: "0 16px 40px rgba(135,99,234,0.3)" }} whileTap={{ scale: 0.97 }}
                style={{
                  background: "linear-gradient(135deg,#8763ea,#a78bfa)",
                  border: "none",
                  borderRadius: 16,
                  padding: isMobile ? "15px 28px" : "18px 36px",
                  color: "#fff",
                  fontFamily: "Outfit",
                  fontWeight: 700,
                  fontSize: isMobile ? 15 : 17,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  boxShadow: "0 8px 25px rgba(135,99,234,0.2)"
                }}>
                Go to Home
              </motion.button>

              <motion.button whileHover={{ scale: 1.04, background: "rgba(135,99,234,0.06)" }} whileTap={{ scale: 0.97 }}
                style={{
                  background: "#ffffff",
                  border: "1px solid rgba(135,99,234,0.25)",
                  borderRadius: 16,
                  padding: isMobile ? "15px 24px" : "18px 32px",
                  color: "#8763ea",
                  fontFamily: "Outfit",
                  fontWeight: 600,
                  fontSize: isMobile ? 14 : 16,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  transition: "background 0.2s"
                }}
                onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" />
                </svg>
                See Features
              </motion.button>
            </motion.div>

            {/* Trust Badges */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.5 }}
              style={{ display: "flex", alignItems: "center", gap: isMobile ? 16 : 24, marginTop: 36, flexWrap: "wrap", justifyContent: isMobile || isTablet ? "center" : "flex-start" }}>
              {["Free Forever", "No Ads", "Fast & Secure"].map((b) => (
                <div key={b} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#8763ea">
                    <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span style={{ fontFamily: "Work Sans", fontSize: 13, color: "#6b6680" }}>{b}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right — Graphic (hidden on mobile, shown on tablet/desktop) */}
          {!isMobile && (
            <motion.div initial={{ opacity: 0, x: isTablet ? 0 : 60, y: isTablet ? 30 : 0 }} animate={{ opacity: 1, x: 0, y: 0 }} transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              style={{ display: "flex", justifyContent: "center", alignItems: "center", position: "relative" }}>
              <div style={{ position: "absolute", width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle, rgba(135,99,234,0.1) 0%, transparent 70%)", filter: "blur(30px)" }} />
              <motion.div
                animate={{ y: [0, -12, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  width: isTablet ? 260 : 340,
                  height: isTablet ? 260 : 340,
                  borderRadius: 36,
                  background: "linear-gradient(135deg, #f3e8ff, #fae8ff)",
                  border: "1px solid rgba(135,99,234,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 20px 50px rgba(135,99,234,0.1)",
                  position: "relative",
                  zIndex: 1
                }}
              >
                <div style={{
                  width: 100, height: 100, borderRadius: "50%", background: "#8763ea",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 10px 30px rgba(135,99,234,0.4)"
                }}>
                  <LinklyIcon size={52} />
                </div>
              </motion.div>
            </motion.div>
          )}
        </div>
      </section>

      {/* ── STATS ───────────────────────────────────────────── */}
      <section style={{ padding: isMobile ? "40px 20px" : "60px 24px", position: "relative", zIndex: 1 }}>
        <div style={{
          maxWidth: 900, margin: "0 auto", background: "#ffffff", border: "1px solid rgba(135,99,234,0.12)",
          borderRadius: isMobile ? 18 : 24, padding: isMobile ? "32px 20px" : "48px 40px",
          display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
          gap: isMobile ? 24 : 40, textAlign: "center",
          boxShadow: "0 10px 30px -10px rgba(135,99,234,0.06)"
        }}>
          {stats.map((s) => (
            <div key={s.label}>
              <p style={{ fontFamily: "Outfit", fontWeight: 800, fontSize: isMobile ? 30 : 40, color: "#8763ea", letterSpacing: -1, lineHeight: 1, marginBottom: 8 }}>
                <AnimatedCounter target={s.value} suffix={s.suffix} />
              </p>
              <p style={{ fontFamily: "Work Sans", fontSize: isMobile ? 12 : 14, color: "#6b6680" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────── */}
      <section id="features" style={{ padding: isMobile ? "60px 20px" : "80px 24px", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
            style={{ textAlign: "center", marginBottom: isMobile ? 40 : 64 }}>
            <p style={{ fontFamily: "Work Sans", fontSize: 13, color: "#8763ea", fontWeight: 600, textTransform: "uppercase", letterSpacing: 2, marginBottom: 12 }}>Everything You Need</p>
            <h2 style={{ fontFamily: "Outfit", fontWeight: 800, fontSize: isMobile ? "clamp(24px,7vw,32px)" : "clamp(30px,4vw,46px)", color: "#1f1b2d", letterSpacing: -1 }}>
              Built for the way you communicate
            </h2>
          </motion.div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(280px, 1fr))", gap: isMobile ? 16 : 24 }}>
            {features.map((f, i) => <FeatureCard key={f.title} {...f} delay={i * 0.08} />)}
          </div>
        </div>
      </section>

      {/* ── REVIEWS ─────────────────────────────────────────── */}
      <section id="reviews" style={{ padding: isMobile ? "60px 20px" : "80px 24px", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
            style={{ textAlign: "center", marginBottom: isMobile ? 36 : 56 }}>
            <p style={{ fontFamily: "Work Sans", fontSize: 13, color: "#8763ea", fontWeight: 600, textTransform: "uppercase", letterSpacing: 2, marginBottom: 12 }}>Loved by Users</p>
            <h2 style={{ fontFamily: "Outfit", fontWeight: 800, fontSize: isMobile ? "clamp(24px,7vw,32px)" : "clamp(28px,4vw,46px)", color: "#1f1b2d", letterSpacing: -1 }}>
              What our users say
            </h2>
          </motion.div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(260px, 1fr))", gap: 32 }}>
            {reviews.map((r, i) => <ReviewCard key={r.name} {...r} delay={i * 0.1} />)}
          </div>
        </div>
      </section>

      {/* ── ABOUT ───────────────────────────────────────────── */}
      <section id="about" style={{ padding: isMobile ? "60px 20px" : "80px 24px", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <p style={{ fontFamily: "Work Sans", fontSize: 13, color: "#8763ea", fontWeight: 600, textTransform: "uppercase", letterSpacing: 2, marginBottom: 12 }}>Our Vision</p>
            <h2 style={{ fontFamily: "Outfit", fontWeight: 800, fontSize: isMobile ? "clamp(22px,7vw,30px)" : "clamp(28px,4vw,42px)", color: "#1f1b2d", letterSpacing: -1, marginBottom: 20 }}>
              Made with ❤️
            </h2>
            <p style={{ fontFamily: "Work Sans", fontSize: isMobile ? 15 : 17, color: "#6b6680", lineHeight: 1.8, marginBottom: 16 }}>
              Linkly was born out of a simple idea: everyone deserves a world-class messaging app that truly values design, privacy, and speed. Built from the ground up with high performance and beautiful aesthetics in mind.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── BOTTOM CTA ──────────────────────────────────────── */}
      <section style={{ padding: isMobile ? "40px 20px 80px" : "80px 24px 120px", position: "relative", zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
          style={{
            maxWidth: 800, margin: "0 auto",
            background: "linear-gradient(135deg, rgba(135,99,234,0.06) 0%, rgba(167,139,250,0.03) 100%)",
            border: "1px solid rgba(135,99,234,0.18)", borderRadius: isMobile ? 24 : 32,
            padding: isMobile ? "48px 24px" : "72px 48px", textAlign: "center", position: "relative", overflow: "hidden",
            boxShadow: "0 10px 40px rgba(135,99,234,0.04)"
          }}>
          <div style={{ position: "absolute", top: -60, left: "50%", transform: "translateX(-50%)", width: 300, height: 200, background: "radial-gradient(circle, rgba(135,99,234,0.1) 0%, transparent 70%)", filter: "blur(40px)", pointerEvents: "none" }} />

          <div style={{
            width: 64, height: 64, borderRadius: "50%", background: "#8763ea",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 24px", boxShadow: "0 8px 25px rgba(135,99,234,0.3)"
          }}>
            <LinklyIcon size={32} />
          </div>

          <h2 style={{ fontFamily: "Outfit", fontWeight: 900, fontSize: isMobile ? "clamp(24px,7vw,34px)" : "clamp(28px,4vw,46px)", color: "#1f1b2d", letterSpacing: -1, marginBottom: 14 }}>
            Start chatting today
          </h2>
          <p style={{ fontFamily: "Work Sans", fontSize: isMobile ? 14 : 17, color: "#6b6680", maxWidth: 500, margin: "0 auto 36px", lineHeight: 1.7 }}>
            Join thousands of users already connecting on Linkly. It's free, it's fast, and it's yours.
          </p>

          <motion.button onClick={handleGoHome} whileHover={{ scale: 1.06, boxShadow: "0 20px 40px rgba(135,99,234,0.25)" }} whileTap={{ scale: 0.97 }}
            style={{
              background: "linear-gradient(135deg,#8763ea,#a78bfa)",
              border: "none",
              borderRadius: isMobile ? 14 : 18,
              padding: isMobile ? "16px 40px" : "20px 52px",
              color: "#fff",
              fontFamily: "Outfit",
              fontWeight: 800,
              fontSize: isMobile ? 16 : 19,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 12,
              boxShadow: "0 10px 30px rgba(135,99,234,0.2)",
              letterSpacing: -0.3
            }}>
            Go to Home
          </motion.button>
        </motion.div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer style={{ borderTop: "1px solid rgba(135,99,234,0.1)", padding: isMobile ? "24px 20px" : "32px 24px", textAlign: "center", position: "relative", zIndex: 1 }}>
        <p style={{ fontFamily: "Work Sans", fontSize: 13, color: "#8b869c" }}>
          © {new Date().getFullYear()} Linkly · Made with love in India 🇮🇳
        </p>
      </footer>
    </div>
  );
}
