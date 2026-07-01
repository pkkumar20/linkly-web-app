import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from "framer-motion";
import { useNavigate } from "react-router";

/* ─── Google Fonts ─────────────────────────────────────────── */
const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Work+Sans:wght@300;400;500;600;700&display=swap";
document.head.appendChild(fontLink);

function useWindowSize() {
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    const handleResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
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

export default function DownloadPage() {
  const { w } = useWindowSize();
  const isMobile = w <= 640;
  const isTablet = w <= 1024;
  const navigate = useNavigate();

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const scale = useTransform(scrollYProgress, [0, 0.3], [1, 0.95]);
  const opacity = useTransform(scrollYProgress, [0, 0.3], [1, 0.8]);
  const y = useTransform(scrollYProgress, [0, 0.3], [0, -50]);

  const springScale = useSpring(scale, { stiffness: 100, damping: 20 });
  const springOpacity = useSpring(opacity, { stiffness: 100, damping: 20 });

  const appFeatures = [
    { title: "Light-speed Performance", desc: "Built with cutting edge tech to ensure messages deliver in milliseconds.", icon: "⚡" },
    { title: "Zero Compression Media", desc: "Send photos, videos and files without losing any quality.", icon: "📂" },
    { title: "Ultimate Privacy Control", desc: "No tracker, no ads, no sell-outs. Your data is purely yours.", icon: "🛡️" },
    { title: "Smart Group Management", desc: "Host large communities up to 1000 members with robust admin controls.", icon: "👥" }
  ];

  return (
    <div
      ref={containerRef}
      style={{
        minHeight: "100vh",
        background: "#ffffff",
        color: "#0f172a",
        fontFamily: "Work Sans, sans-serif",
        overflowX: "hidden",
        position: "relative"
      }}
    >
      {/* ── Floating Navbar ─────────────────────────────────── */}
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{
          position: "fixed",
          top: isMobile ? 12 : 20,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 100,
          width: `calc(100% - ${isMobile ? 24 : 48}px)`,
          maxWidth: 1100,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: isMobile ? "12px 18px" : "14px 32px",
          borderRadius: 24,
          background: scrolled ? "rgba(255, 255, 255, 0.85)" : "rgba(255, 255, 255, 0.4)",
          border: "1px solid rgba(135,99,234,0.15)",
          backdropFilter: "blur(20px)",
          boxShadow: scrolled ? "0 10px 30px -10px rgba(135,99,234,0.08)" : "none",
          transition: "background 0.3s, border 0.3s, box-shadow 0.3s"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => navigate("/")}>
          <div style={{
            width: 36, height: 36, borderRadius: "50%",
            background: "linear-gradient(135deg, #8763ea, #a78bfa)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 6px 16px rgba(135,99,234,0.25)"
          }}>
            <LinklyIcon size={20} />
          </div>
          <span style={{ fontFamily: "Outfit", fontWeight: 800, fontSize: isMobile ? 19 : 22, color: "#1f1b2d", letterSpacing: -0.6 }}>Linkly</span>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <motion.button
            onClick={() => navigate("/")}
            whileHover={{ scale: 1.05, background: "rgba(135,99,234,0.06)" }}
            whileTap={{ scale: 0.97 }}
            style={{
              background: "none",
              border: "1px solid rgba(135,99,234,0.3)",
              borderRadius: 14,
              padding: isMobile ? "8px 16px" : "10px 24px",
              color: "#8763ea",
              fontFamily: "Outfit",
              fontWeight: 700,
              fontSize: isMobile ? 13 : 14.5,
              cursor: "pointer"
            }}
          >
            Go to Home
          </motion.button>
        </div>
      </motion.nav>

      {/* ── Background Blobs ─────────────────────────────────── */}
      <div style={{ position: "absolute", width: "100%", height: "100%", pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: [0, 45, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(135,99,234,0.08) 0%, transparent 60%)", top: "-10%", left: "-15%", filter: "blur(60px)" }}
        />
        <motion.div
          animate={{ scale: [1, 1.15, 1], rotate: [0, -45, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(236,72,153,0.06) 0%, transparent 65%)", top: "25%", right: "-10%", filter: "blur(60px)" }}
        />
      </div>

      {/* ── HERO SECTION ────────────────────────────────────── */}
      <motion.section
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: isMobile ? "120px 24px 60px" : "150px 48px 80px",
          position: "relative",
          zIndex: 1,
          scale: springScale,
          opacity: springOpacity,
          y
        }}
      >
        <div style={{ maxWidth: 1100, width: "100%", display: "grid", gridTemplateColumns: isMobile || isTablet ? "1fr" : "1.2fr 1fr", gap: 64, alignItems: "center" }}>
          
          <div style={{ textAlign: isMobile || isTablet ? "center" : "left" }}>
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(135,99,234,0.08)",
                border: "1px solid rgba(135,99,234,0.18)",
                borderRadius: 100,
                padding: "6px 18px",
                marginBottom: 28
              }}
            >
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#8763ea" }} />
              <span style={{ fontSize: 13.5, color: "#8763ea", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1.5 }}>
                Available on Mobile & Web
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              style={{
                fontFamily: "Outfit",
                fontWeight: 900,
                fontSize: isMobile ? "clamp(34px, 10vw, 44px)" : "clamp(44px, 5vw, 68px)",
                lineHeight: 1.08,
                letterSpacing: -1.8,
                color: "#1e1b4b",
                marginBottom: 24
              }}
            >
              Experience light speed<br />
              <span style={{ background: "linear-gradient(135deg, #8763ea 0%, #ec4899 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>conversations</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              style={{
                fontSize: isMobile ? 15.5 : 18.5,
                color: "#475569",
                lineHeight: 1.75,
                marginBottom: 44,
                maxWidth: 540,
                margin: isMobile || isTablet ? "0 auto 44px" : "0 0 44px"
              }}
            >
              Download Linkly for Android, iOS, or access it directly on your browser. Seamless cross-platform synchronization with unmatched messaging speeds.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              style={{
                display: "flex",
                gap: 16,
                flexWrap: "wrap",
                justifyContent: isMobile || isTablet ? "center" : "flex-start"
              }}
            >
              {/* Android Download */}
              <motion.a
                href="#"
                whileHover={{ scale: 1.04, boxShadow: "0 12px 30px rgba(135,99,234,0.3)" }}
                whileTap={{ scale: 0.97 }}
                style={{
                  background: "linear-gradient(135deg, #8763ea 0%, #7c3aed 100%)",
                  color: "#fff",
                  textDecoration: "none",
                  borderRadius: 18,
                  padding: "14px 28px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  fontFamily: "Outfit",
                  fontWeight: 700,
                  fontSize: 16,
                  boxShadow: "0 8px 20px rgba(135,99,234,0.15)"
                }}
                onClick={(e) => { e.preventDefault(); alert("Direct APK download coming soon! 🚀"); }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                <span>Download for Android</span>
              </motion.a>

              {/* iOS / Web App */}
              <motion.a
                href="#"
                whileHover={{ scale: 1.04, background: "rgba(15, 23, 42, 0.05)" }}
                whileTap={{ scale: 0.97 }}
                style={{
                  background: "none",
                  border: "1px solid #0f172a",
                  color: "#0f172a",
                  textDecoration: "none",
                  borderRadius: 18,
                  padding: "14px 28px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  fontFamily: "Outfit",
                  fontWeight: 700,
                  fontSize: 16
                }}
                onClick={(e) => { e.preventDefault(); navigate("/"); }}
              >
                <span>Launch Web Client</span>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </motion.a>
            </motion.div>
          </div>

          {/* Right Graphical Device Mockup */}
          <div style={{ display: "flex", justifyContent: "center", position: "relative" }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              style={{
                width: isMobile ? 260 : 320,
                height: isMobile ? 420 : 520,
                borderRadius: 40,
                background: "#ffffff",
                border: "8px solid #0f172a",
                boxShadow: "0 30px 60px -15px rgba(15,23,42,0.25), 0 0 0 1px rgba(15,23,42,0.05)",
                overflow: "hidden",
                position: "relative",
                display: "flex",
                flexDirection: "column"
              }}
            >
              {/* Notch */}
              <div style={{ width: 140, height: 26, background: "#0f172a", borderRadius: "0 0 16px 16px", margin: "0 auto", position: "absolute", top: 0, left: 50, right: 50, zIndex: 10 }} />
              
              {/* Phone Content Screen */}
              <div style={{ flex: 1, background: "#f8fafc", padding: "40px 16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
                {/* Header preview */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #e2e8f0", paddingBottom: 10 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#8763ea" }} />
                    <div>
                      <div style={{ width: 60, height: 8, background: "#0f172a", borderRadius: 4 }} />
                      <div style={{ width: 35, height: 5, background: "#94a3b8", borderRadius: 4, marginTop: 4 }} />
                    </div>
                  </div>
                  <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid #8763ea" }} />
                </div>

                {/* Animated Chat bubbles mockup */}
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7, duration: 0.5 }}
                  style={{ background: "#ffffff", padding: 12, borderRadius: "18px 18px 18px 4px", alignSelf: "flex-start", maxWidth: "80%", boxShadow: "0 2px 8px rgba(0,0,0,0.02)", border: "1px solid #f1f5f9" }}
                >
                  <p style={{ fontSize: 13, color: "#1e293b", margin: 0, fontWeight: 500 }}>Hey, did you download the new client? It's so clean!</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.1, duration: 0.5 }}
                  style={{ background: "#8763ea", color: "#fff", padding: 12, borderRadius: "18px 18px 4px 18px", alignSelf: "flex-end", maxWidth: "80%", boxShadow: "0 4px 12px rgba(135,99,234,0.15)" }}
                >
                  <p style={{ fontSize: 13, margin: 0, fontWeight: 500 }}>Yeah, the layout feels light-years ahead. Everything syncs instantly.</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.5, duration: 0.5 }}
                  style={{ background: "#ffffff", padding: 12, borderRadius: "18px 18px 18px 4px", alignSelf: "flex-start", maxWidth: "80%", boxShadow: "0 2px 8px rgba(0,0,0,0.02)", border: "1px solid #f1f5f9" }}
                >
                  <p style={{ fontSize: 13, color: "#1e293b", margin: 0, fontWeight: 500 }}>Let's start using Linkly full-time. 🚀</p>
                </motion.div>
              </div>
            </motion.div>
          </div>

        </div>
      </motion.section>

      {/* ── SCROLL ANIMATED FEATURES ────────────────────────── */}
      <section style={{ padding: "100px 24px", background: "#f8fafc", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <h2 style={{ fontFamily: "Outfit", fontWeight: 800, fontSize: isMobile ? 28 : 42, color: "#0f172a", letterSpacing: -1 }}>
              Stunning modern messaging features
            </h2>
            <p style={{ fontSize: 15.5, color: "#64748b", marginTop: 12 }}>
              Everything you need from a modern chat application in one minimal workspace.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile || isTablet ? "1fr" : "repeat(2, 1fr)", gap: 24 }}>
            {appFeatures.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                style={{
                  background: "#ffffff",
                  padding: "36px",
                  borderRadius: 24,
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 10px 30px -15px rgba(15,23,42,0.05)",
                  display: "flex",
                  gap: 20
                }}
                whileHover={{ y: -5, borderColor: "rgba(135,99,234,0.3)" }}
              >
                <div style={{ fontSize: 28 }}>{f.icon}</div>
                <div>
                  <h3 style={{ fontFamily: "Outfit", fontWeight: 700, fontSize: 18, color: "#0f172a", marginBottom: 8 }}>
                    {f.title}
                  </h3>
                  <p style={{ fontSize: 14.5, color: "#475569", lineHeight: 1.6 }}>
                    {f.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      {/* ── QR CODE PARALLAX SECTION ────────────────────────── */}
      <section style={{ padding: "100px 24px", position: "relative", zIndex: 1 }}>
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            style={{
              background: "linear-gradient(135deg, rgba(135,99,234,0.03) 0%, rgba(236,72,153,0.02) 100%)",
              border: "1px solid rgba(135,99,234,0.18)",
              borderRadius: 32,
              padding: isMobile ? "48px 24px" : "60px 48px",
              boxShadow: "0 20px 40px -20px rgba(135,99,234,0.08)"
            }}
          >
            <h2 style={{ fontFamily: "Outfit", fontWeight: 800, fontSize: isMobile ? 26 : 38, color: "#0f172a", letterSpacing: -1, marginBottom: 14 }}>
              Scan to Download Instantly
            </h2>
            <p style={{ fontSize: 15.5, color: "#475569", maxWidth: 500, margin: "0 auto 36px", lineHeight: 1.6 }}>
              Point your phone camera at this QR code to access download pages and grab the client instantly.
            </p>

            {/* QR Code mockup */}
            <div style={{
              width: 180,
              height: 180,
              margin: "0 auto 20px",
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: 24,
              padding: 16,
              boxShadow: "0 10px 25px -10px rgba(15,23,42,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              {/* QR Pattern Representation */}
              <div style={{
                width: "100%",
                height: "100%",
                background: "radial-gradient(circle, #0f172a 75%, transparent 75%)",
                backgroundSize: "12px 12px",
                opacity: 0.9,
                position: "relative"
              }}>
                {/* Simulated QR Corners */}
                <div style={{ position: "absolute", top: 0, left: 0, width: 36, height: 36, border: "6px solid #0f172a", background: "#fff" }} />
                <div style={{ position: "absolute", top: 0, right: 0, width: 36, height: 36, border: "6px solid #0f172a", background: "#fff" }} />
                <div style={{ position: "absolute", bottom: 0, left: 0, width: 36, height: 36, border: "6px solid #0f172a", background: "#fff" }} />
              </div>
            </div>

            <p style={{ fontSize: 13.5, color: "#64748b", fontWeight: 500 }}>
              Supports Android 9.0+ & iOS 14.0+
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────── */}
      <footer style={{ borderTop: "1px solid #f1f5f9", padding: "32px 24px", textAlign: "center", position: "relative", zIndex: 1 }}>
        <p style={{ fontSize: 13.5, color: "#94a3b8" }}>
          © {new Date().getFullYear()} Linkly · Made with love 🇮🇳
        </p>
      </footer>
    </div>
  );
}
