import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, useInView, useMotionValue, useSpring, AnimatePresence } from "framer-motion";

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
function LinklyIcon({ size = 22 }) {
  return (
    <svg fill="#000000" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style={{ width: size, height: size }}>
      <polyline
        points="16 11 13 13 11 11 8 13"
        style={{ fill: "none", stroke: "#fff", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2 }}
      />
      <path
        d="M20.88,13.46A9,9,0,0,1,7.88,20L3,21l1-4.88a9,9,0,1,1,16.88-2.66Z"
        style={{ fill: "none", stroke: "#fff", strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2 }}
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
      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(135,99,234,0.2)", borderRadius: 20, padding: "32px 28px", backdropFilter: "blur(12px)", cursor: "default" }}
      whileHover={{ scale: 1.03, borderColor: "rgba(135,99,234,0.6)", boxShadow: "0 12px 40px rgba(135,99,234,0.18)" }}
    >
      <div style={{ width: 52, height: 52, borderRadius: 14, background: "linear-gradient(135deg,#8763ea,#a78bfa)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18, boxShadow: "0 4px 16px rgba(135,99,234,0.35)" }}>
        {icon}
      </div>
      <h3 style={{ fontFamily: "Outfit", fontWeight: 700, fontSize: 18, color: "#fff", marginBottom: 10 }}>{title}</h3>
      <p style={{ fontFamily: "Work Sans", fontSize: 14, color: "rgba(255,255,255,0.6)", lineHeight: 1.7 }}>{desc}</p>
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
      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 18, padding: "28px 24px" }}
    >
      <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
        {Array.from({ length: stars }).map((_, i) => (
          <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="#FBBF24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        ))}
      </div>
      <p style={{ fontFamily: "Work Sans", fontSize: 14, color: "rgba(255,255,255,0.75)", lineHeight: 1.7, marginBottom: 20 }}>"{text}"</p>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", background: `linear-gradient(135deg, ${avatar}, #8763ea)`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Outfit", fontWeight: 700, color: "#fff", fontSize: 16 }}>
          {name[0]}
        </div>
        <div>
          <p style={{ fontFamily: "Outfit", fontWeight: 600, fontSize: 14, color: "#fff" }}>{name}</p>
          <p style={{ fontFamily: "Work Sans", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{role}</p>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Floating Orb ──────────────────────────────────────────── */
function FloatingOrb({ size, top, left, color, duration }) {
  return (
    <motion.div
      style={{ position: "absolute", width: size, height: size, borderRadius: "50%", background: color, filter: "blur(80px)", top, left, pointerEvents: "none", zIndex: 0 }}
      animate={{ y: [0, -30, 0], scale: [1, 1.08, 1] }}
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
      style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "0 0 0 0" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        style={{ background: "linear-gradient(160deg, #130d27 0%, #0f0a1f 100%)", border: "1px solid rgba(135,99,234,0.3)", borderRadius: "28px 28px 0 0", padding: "36px 28px 48px", width: "100%", maxWidth: 480, textAlign: "center", position: "relative" }}
      >
        {/* Drag handle */}
        <div style={{ width: 40, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.2)", margin: "0 auto 28px" }} />

        {/* Close button */}
        <button
          onClick={onClose}
          style={{ position: "absolute", top: 20, right: 20, background: "rgba(255,255,255,0.08)", border: "none", borderRadius: "50%", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Logo */}
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "#8763ea", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", boxShadow: "0 8px 30px rgba(135,99,234,0.45)" }}>
          <LinklyIcon size={36} />
        </div>

        {/* Glow */}
        <div style={{ position: "absolute", top: 80, left: "50%", transform: "translateX(-50%)", width: 200, height: 100, background: "radial-gradient(circle, rgba(135,99,234,0.25) 0%, transparent 70%)", filter: "blur(20px)", pointerEvents: "none" }} />

        <p style={{ fontFamily: "Work Sans", fontSize: 12, fontWeight: 600, color: "#8763ea", textTransform: "uppercase", letterSpacing: 2, marginBottom: 10 }}>
          You're on mobile!
        </p>
        <h2 style={{ fontFamily: "Outfit", fontWeight: 900, fontSize: 26, color: "#fff", letterSpacing: -0.8, marginBottom: 12, lineHeight: 1.2 }}>
          Get Linkly on your phone
        </h2>
        <p style={{ fontFamily: "Work Sans", fontSize: 15, color: "rgba(255,255,255,0.5)", lineHeight: 1.7, marginBottom: 32 }}>
          Linkly is a mobile-first app. Download it now to start chatting with friends and family — for free!
        </p>

        <motion.button
          onClick={onDownload}
          whileTap={{ scale: 0.96 }}
          style={{ background: "linear-gradient(135deg,#8763ea,#a78bfa)", border: "none", borderRadius: 16, padding: "16px 0", width: "100%", color: "#fff", fontFamily: "Outfit", fontWeight: 800, fontSize: 17, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: "0 8px 30px rgba(135,99,234,0.4)", marginBottom: 12 }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Download Linkly Free
        </motion.button>

        <button onClick={onClose} style={{ background: "none", border: "none", fontFamily: "Work Sans", fontSize: 14, color: "rgba(255,255,255,0.35)", cursor: "pointer", padding: "8px 0" }}>
          Maybe later
        </button>
      </motion.div>
    </motion.div>
  );
}

/* ─── Main DownloadPage ─────────────────────────────────────── */
export default function DownloadPage() {
  const { w } = useWindowSize();
  const isMobile = w <= 640;
  const isTablet = w <= 1024;
  const isSmall = w <= 1024; // mobile OR tablet

  const [scrolled, setScrolled] = useState(false);
  const [showMobilePopup, setShowMobilePopup] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    // Show popup for mobile/tablet once per session
    if (isSmall && !sessionStorage.getItem("linkly-popup-shown")) {
      const t = setTimeout(() => {
        setShowMobilePopup(true);
        sessionStorage.setItem("linkly-popup-shown", "1");
      }, 800);
      return () => clearTimeout(t);
    }
  }, []); // eslint-disable-line

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleDownload = () => {
    setShowMobilePopup(false);
    alert("Download coming soon! 🚀");
  };

  /* ── Data ─────────────────────────────────────────────────── */
  const features = [
    {
      icon: (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>),
      title: "Instant Messaging",
      desc: "Send text messages, voice notes, and rich media to anyone in your contacts instantly with real-time delivery.",
    },
    {
      icon: (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>),
      title: "Full Privacy",
      desc: "Your data belongs to you. Linkly never sells, tracks, or shares your personal information. Zero data collection, full control.",
    },
    {
      icon: (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>),
      title: "Groups & Channels",
      desc: "Create groups for up to 1,000 members or broadcast channels for your audience. Perfect for communities.",
    },
    {
      icon: (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" /><line x1="7" y1="2" x2="7" y2="22" /><line x1="17" y1="2" x2="17" y2="22" /><line x1="2" y1="12" x2="22" y2="12" /></svg>),
      title: "Media Sharing",
      desc: "Share photos, videos, documents, and locations in high quality. No compression.",
    },
    {
      icon: (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>),
      title: "Reactions & Replies",
      desc: "React to any message with emoji reactions. Reply to specific messages to keep conversations organized.",
    },
    {
      icon: (<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>),
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
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0a0612 0%, #0f0a1f 40%, #130d27 70%, #0a0612 100%)", fontFamily: "Work Sans, sans-serif", overflowX: "hidden", position: "relative", userSelect: "none" }}>

      {/* ── Mobile/Tablet Popup ──────────────────────────────── */}
      <AnimatePresence>
        {showMobilePopup && (
          <MobilePopup onDownload={handleDownload} onClose={() => setShowMobilePopup(false)} />
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
          background: scrolled ? "rgba(10,6,18,0.92)" : "rgba(255,255,255,0.04)",
          border: "1px solid rgba(135,99,234,0.2)", backdropFilter: "blur(20px)",
          transition: "background 0.4s ease",
          boxShadow: scrolled ? "0 8px 40px rgba(0,0,0,0.4)" : "none",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#8763ea", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(135,99,234,0.4)", flexShrink: 0 }}>
            <LinklyIcon size={20} />
          </div>
          <span style={{ fontFamily: "Outfit", fontWeight: 800, fontSize: isMobile ? 18 : 20, color: "#fff", letterSpacing: -0.5 }}>Linkly</span>
        </div>

        {/* Desktop Nav Links */}
        {!isSmall && (
          <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
            {["Features", "Reviews", "About"].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`}
                style={{ fontFamily: "Work Sans", fontWeight: 500, fontSize: 14, color: "rgba(255,255,255,0.65)", textDecoration: "none", transition: "color 0.2s" }}
                onMouseEnter={(e) => (e.target.style.color = "#a78bfa")}
                onMouseLeave={(e) => (e.target.style.color = "rgba(255,255,255,0.65)")}
              >{item}</a>
            ))}
          </div>
        )}

        {/* Download CTA */}
        <motion.button
          onClick={handleDownload}
          whileHover={{ scale: 1.05, boxShadow: "0 8px 30px rgba(135,99,234,0.5)" }}
          whileTap={{ scale: 0.97 }}
          style={{ background: "linear-gradient(135deg,#8763ea,#a78bfa)", border: "none", borderRadius: isMobile ? 10 : 12, padding: isMobile ? "8px 14px" : "10px 22px", color: "#fff", fontFamily: "Outfit", fontWeight: 700, fontSize: isMobile ? 13 : 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          {isMobile ? "Download" : "Download"}
        </motion.button>
      </motion.nav>

      {/* ── Background Orbs ─────────────────────────────────── */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
        <FloatingOrb size={isMobile ? 260 : 500} top="-10%" left="-10%" color="rgba(135,99,234,0.12)" duration={8} />
        <FloatingOrb size={isMobile ? 200 : 400} top="30%" left="65%" color="rgba(167,139,250,0.08)" duration={10} />
        <FloatingOrb size={isMobile ? 180 : 300} top="70%" left="10%" color="rgba(135,99,234,0.07)" duration={7} />
      </div>

      {/* ── HERO ────────────────────────────────────────────── */}
      <section style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: isMobile ? "100px 20px 60px" : isTablet ? "110px 32px 70px" : "120px 24px 80px", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 1100, width: "100%", display: "grid", gridTemplateColumns: isMobile ? "1fr" : isTablet ? "1fr" : "1fr 1fr", gap: isMobile ? 48 : 64, alignItems: "center" }}>

          {/* Left Text */}
          <div style={{ textAlign: isMobile || isTablet ? "center" : "left" }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
              style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(135,99,234,0.15)", border: "1px solid rgba(135,99,234,0.35)", borderRadius: 100, padding: "6px 16px", marginBottom: 24 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#8763ea", boxShadow: "0 0 8px #8763ea" }} />
              <span style={{ fontFamily: "Work Sans", fontSize: 13, color: "#c4b5fd", fontWeight: 500 }}>Available in India</span>
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
              style={{ fontFamily: "Outfit", fontWeight: 900, fontSize: isMobile ? "clamp(32px,9vw,42px)" : "clamp(38px, 5vw, 62px)", color: "#fff", lineHeight: 1.1, letterSpacing: -1.5, marginBottom: 20 }}>
              Chat Smarter,<br />
              <span style={{ background: "linear-gradient(135deg,#8763ea,#c4b5fd)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Connect Better</span>
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
              style={{ fontFamily: "Work Sans", fontSize: isMobile ? 15 : 18, color: "rgba(255,255,255,0.55)", lineHeight: 1.7, marginBottom: 36, maxWidth: isMobile || isTablet ? "100%" : 480, margin: isMobile || isTablet ? "0 auto 36px" : "0 0 36px" }}>
              Linkly is the fastest, most secure messaging app built for India. Send messages, share media, create groups, and stay connected — all in one beautiful app.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
              style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: isMobile || isTablet ? "center" : "flex-start" }}>
              <motion.button onClick={handleDownload} whileHover={{ scale: 1.04, boxShadow: "0 16px 50px rgba(135,99,234,0.55)" }} whileTap={{ scale: 0.97 }}
                style={{ background: "linear-gradient(135deg,#8763ea,#a78bfa)", border: "none", borderRadius: 16, padding: isMobile ? "15px 28px" : "18px 36px", color: "#fff", fontFamily: "Outfit", fontWeight: 700, fontSize: isMobile ? 15 : 17, cursor: "pointer", display: "flex", alignItems: "center", gap: 10, boxShadow: "0 8px 30px rgba(135,99,234,0.35)" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download Linkly
              </motion.button>

              <motion.button whileHover={{ scale: 1.04, background: "rgba(135,99,234,0.12)" }} whileTap={{ scale: 0.97 }}
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(135,99,234,0.3)", borderRadius: 16, padding: isMobile ? "15px 24px" : "18px 32px", color: "#c4b5fd", fontFamily: "Outfit", fontWeight: 600, fontSize: isMobile ? 14 : 16, cursor: "pointer", display: "flex", alignItems: "center", gap: 10, transition: "background 0.2s" }}
                onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><polygon points="10 8 16 12 10 16 10 8" />
                </svg>
                See Features
              </motion.button>
            </motion.div>

            {/* Trust Badges */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.5 }}
              style={{ display: "flex", alignItems: "center", gap: isMobile ? 16 : 24, marginTop: 36, flexWrap: "wrap", justifyContent: isMobile || isTablet ? "center" : "flex-start" }}>
              {["Free Forever", "No Ads", "Made in India"].map((b) => (
                <div key={b} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="#8763ea"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  <span style={{ fontFamily: "Work Sans", fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{b}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right — Phone Mockup (hidden on mobile to save space, shown on tablet/desktop) */}
          {!isMobile && (
            <motion.div initial={{ opacity: 0, x: isTablet ? 0 : 60, y: isTablet ? 30 : 0 }} animate={{ opacity: 1, x: 0, y: 0 }} transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              style={{ display: "flex", justifyContent: "center", alignItems: "center", position: "relative" }}>
              <div style={{ position: "absolute", width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle, rgba(135,99,234,0.22) 0%, transparent 70%)", filter: "blur(30px)" }} />
              <motion.img
                src="/linkly_phone_mockup.png" alt="Linkly App Screenshot"
                animate={{ y: [0, -14, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                style={{ maxWidth: isTablet ? 260 : 340, width: "100%", borderRadius: 28, boxShadow: "0 30px 80px rgba(135,99,234,0.3), 0 0 0 1px rgba(135,99,234,0.1)", position: "relative", zIndex: 1 }}
              />
            </motion.div>
          )}
        </div>
      </section>

      {/* ── STATS ───────────────────────────────────────────── */}
      <section style={{ padding: isMobile ? "40px 20px" : "60px 24px", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 900, margin: "0 auto", background: "rgba(135,99,234,0.08)", border: "1px solid rgba(135,99,234,0.2)", borderRadius: isMobile ? 18 : 24, padding: isMobile ? "32px 20px" : "48px 40px", display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: isMobile ? 24 : 40, textAlign: "center" }}>
          {stats.map((s) => (
            <div key={s.label}>
              <p style={{ fontFamily: "Outfit", fontWeight: 800, fontSize: isMobile ? 30 : 40, color: "#c4b5fd", letterSpacing: -1, lineHeight: 1, marginBottom: 8 }}>
                <AnimatedCounter target={s.value} suffix={s.suffix} />
              </p>
              <p style={{ fontFamily: "Work Sans", fontSize: isMobile ? 12 : 14, color: "rgba(255,255,255,0.45)" }}>{s.label}</p>
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
            <h2 style={{ fontFamily: "Outfit", fontWeight: 800, fontSize: isMobile ? "clamp(24px,7vw,32px)" : "clamp(30px,4vw,46px)", color: "#fff", letterSpacing: -1 }}>
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
            <h2 style={{ fontFamily: "Outfit", fontWeight: 800, fontSize: isMobile ? "clamp(24px,7vw,32px)" : "clamp(28px,4vw,46px)", color: "#fff", letterSpacing: -1 }}>
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
            <p style={{ fontFamily: "Work Sans", fontSize: 13, color: "#8763ea", fontWeight: 600, textTransform: "uppercase", letterSpacing: 2, marginBottom: 12 }}>Our Story</p>
            <h2 style={{ fontFamily: "Outfit", fontWeight: 800, fontSize: isMobile ? "clamp(22px,7vw,30px)" : "clamp(28px,4vw,42px)", color: "#fff", letterSpacing: -1, marginBottom: 20 }}>
              Made with ❤️ in India
            </h2>
            <p style={{ fontFamily: "Work Sans", fontSize: isMobile ? 15 : 17, color: "rgba(255,255,255,0.55)", lineHeight: 1.8, marginBottom: 16 }}>
              Linkly was born out of a simple idea: India deserves a world-class messaging app that truly understands its users. Built from the ground up with performance, privacy, and a beautiful design in mind.
            </p>
            <p style={{ fontFamily: "Work Sans", fontSize: isMobile ? 15 : 17, color: "rgba(255,255,255,0.55)", lineHeight: 1.8 }}>
              Currently available exclusively for India, we're growing fast and building the future of communication — one message at a time.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── DOWNLOAD CTA ────────────────────────────────────── */}
      <section style={{ padding: isMobile ? "40px 20px 80px" : "80px 24px 120px", position: "relative", zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
          style={{ maxWidth: 800, margin: "0 auto", background: "linear-gradient(135deg, rgba(135,99,234,0.22) 0%, rgba(167,139,250,0.1) 100%)", border: "1px solid rgba(135,99,234,0.35)", borderRadius: isMobile ? 24 : 32, padding: isMobile ? "48px 24px" : "72px 48px", textAlign: "center", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -60, left: "50%", transform: "translateX(-50%)", width: 300, height: 200, background: "radial-gradient(circle, rgba(135,99,234,0.3) 0%, transparent 70%)", filter: "blur(40px)", pointerEvents: "none" }} />

          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#8763ea", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", boxShadow: "0 8px 30px rgba(135,99,234,0.45)" }}>
            <LinklyIcon size={32} />
          </div>

          <h2 style={{ fontFamily: "Outfit", fontWeight: 900, fontSize: isMobile ? "clamp(24px,7vw,34px)" : "clamp(28px,4vw,46px)", color: "#fff", letterSpacing: -1, marginBottom: 14 }}>
            Start chatting today
          </h2>
          <p style={{ fontFamily: "Work Sans", fontSize: isMobile ? 14 : 17, color: "rgba(255,255,255,0.5)", maxWidth: 500, margin: "0 auto 36px", lineHeight: 1.7 }}>
            Join thousands of users already connecting on Linkly. It's free, it's fast, and it's yours.
          </p>

          <motion.button onClick={handleDownload} whileHover={{ scale: 1.06, boxShadow: "0 20px 60px rgba(135,99,234,0.6)" }} whileTap={{ scale: 0.97 }}
            style={{ background: "linear-gradient(135deg,#8763ea,#a78bfa)", border: "none", borderRadius: isMobile ? 14 : 18, padding: isMobile ? "16px 40px" : "20px 52px", color: "#fff", fontFamily: "Outfit", fontWeight: 800, fontSize: isMobile ? 16 : 19, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 12, boxShadow: "0 10px 40px rgba(135,99,234,0.4)", letterSpacing: -0.3 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download Free
          </motion.button>

          <p style={{ fontFamily: "Work Sans", fontSize: 13, color: "rgba(255,255,255,0.3)", marginTop: 20 }}>
            Available on Android · Currently India Only
          </p>
        </motion.div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: isMobile ? "24px 20px" : "32px 24px", textAlign: "center", position: "relative", zIndex: 1 }}>
        <p style={{ fontFamily: "Work Sans", fontSize: 13, color: "rgba(255,255,255,0.25)" }}>
          © {new Date().getFullYear()} Linkly · Made with love in India 🇮🇳
        </p>
      </footer>
    </div>
  );
}
