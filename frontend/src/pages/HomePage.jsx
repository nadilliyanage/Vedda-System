import { useNavigate } from "react-router-dom";
import { FaLanguage, FaBookOpen, FaLandmark, FaCube, FaArrowRight } from "react-icons/fa";

/* ─── Accent palette matching the earthy forest bg ─── */
const ACCENTS = {
  1: { from: "#1e6fa8", to: "#3b9fd1", shadow: "rgba(30,111,168,0.45)" },   // Blue
  2: { from: "#2d7a4f", to: "#4aad72", shadow: "rgba(45,122,79,0.45)" },    // Green
  3: { from: "#7c3fa8", to: "#b06bd6", shadow: "rgba(124,63,168,0.45)" },   // Purple
  4: { from: "#b85c10", to: "#e88033", shadow: "rgba(184,92,16,0.45)" },    // Orange
};

const features = [
  {
    id: 1,
    title: "Vedda Translator",
    description: "Translate between Vedda, Sinhala, English and other languages seamlessly.",
    icon: FaLanguage,
    path: "/translator",
    bgImage: "/assets/background-images/vedda-translator-bg.png",
  },
  {
    id: 2,
    title: "Vocabulary Learning",
    description: "Learn, practise, and test your Vedda vocabulary with guided exercises.",
    icon: FaBookOpen,
    path: "/learning",
    bgImage: "/assets/background-images/vocabulary-learning-bg.png",
  },
  {
    id: 3,
    title: "Artifact Preservation",
    description: "Explore and learn about Vedda cultural artefacts and rich history.",
    icon: FaLandmark,
    path: "/artifacts",
    bgImage: "/assets/background-images/artifact-learning-bg.png",
  },
  {
    id: 4,
    title: "3D Word Explorer",
    description: "Experience Vedda words through immersive interactive 3D visualisations.",
    icon: FaCube,
    path: "/3d-visuals",
    bgImage: "/assets/background-images/3d-visuals-bg.png",
  },
];

/* ─── Inline styles (no Tailwind required for new additions) ─── */
const styles = {
  page: {
    minHeight: "100vh",
    backgroundImage: `url('/assets/background-images/background-1.png')`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundAttachment: "fixed",
    fontFamily: "'Georgia', 'Times New Roman', serif",
  },
  overlay: {
    minHeight: "100vh",
    background: "linear-gradient(160deg, rgba(10,15,10,0.72) 0%, rgba(20,30,20,0.55) 60%, rgba(5,10,5,0.80) 100%)",
  },
  heroSection: {
    paddingTop: "6rem",
    paddingBottom: "4rem",
    textAlign: "center",
    position: "relative",
  },
  badge: {
    display: "inline-block",
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.25)",
    borderRadius: "999px",
    padding: "0.35rem 1.2rem",
    fontSize: "0.78rem",
    letterSpacing: "0.18em",
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.82)",
    marginBottom: "1.5rem",
    backdropFilter: "blur(8px)",
  },
  heroTitle: {
    fontSize: "clamp(2.2rem, 5vw, 4rem)",
    fontWeight: "800",
    color: "#ffffff",
    lineHeight: 1.18,
    margin: "0 auto 1.25rem",
    maxWidth: "820px",
    textShadow: "0 2px 24px rgba(0,0,0,0.55)",
    letterSpacing: "-0.5px",
  },
  heroTitle_em: {
    background: "linear-gradient(90deg, #a78c5d, #d4b483, #c49a52)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  heroSub: {
    fontSize: "clamp(1rem, 2vw, 1.22rem)",
    color: "rgba(255,255,255,0.72)",
    maxWidth: "560px",
    margin: "0 auto 2.5rem",
    lineHeight: 1.75,
    fontFamily: "'Georgia', serif",
    fontStyle: "italic",
  },
  divider: {
    width: "64px",
    height: "3px",
    background: "linear-gradient(90deg, #a78c5d, #d4b483)",
    margin: "0 auto 4rem",
    borderRadius: "99px",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 420px), 1fr))",
    gap: "1.75rem",
    maxWidth: "960px",
    margin: "0 auto",
    padding: "0 1.25rem",
  },
  aboutSection: {
    maxWidth: "700px",
    margin: "5rem auto 5rem",
    padding: "0 1.25rem",
    textAlign: "center",
  },
  aboutTitle: {
    fontSize: "1.6rem",
    fontWeight: "700",
    color: "#d4b483",
    marginBottom: "1rem",
    letterSpacing: "0.02em",
  },
  aboutText: {
    fontSize: "1.05rem",
    color: "rgba(255,255,255,0.68)",
    lineHeight: 1.9,
    fontStyle: "italic",
  },
  aboutDividerTop: {
    width: "40px",
    height: "2px",
    background: "rgba(212,180,131,0.45)",
    margin: "0 auto 2rem",
    borderRadius: "99px",
  },
};

/* ─── Feature Card ─── */
const FeatureCard = ({ feature, onClick }) => {
  const Icon = feature.icon;
  const accent = ACCENTS[feature.id];

  return (
    <div
      onClick={onClick}
      style={{
        cursor: "pointer",
        borderRadius: "20px",
        overflow: "hidden",
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.14)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.35)",
        transition: "transform 0.32s cubic-bezier(.25,.8,.25,1), box-shadow 0.32s",
        display: "flex",
        flexDirection: "column",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-8px) scale(1.015)";
        e.currentTarget.style.boxShadow = `0 20px 48px ${accent.shadow}, 0 4px 16px rgba(0,0,0,0.4)`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "translateY(0) scale(1)";
        e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.35)";
      }}
    >
      {/* Image Banner */}
      <div style={{ position: "relative", height: "180px", overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${feature.bgImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            transition: "transform 0.5s ease",
          }}
        />
        {/* Gradient over image */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(135deg, ${accent.from}cc 0%, ${accent.to}99 100%)`,
          }}
        />
        {/* Icon badge */}
        <div
          style={{
            position: "absolute",
            bottom: "1rem",
            left: "1.25rem",
            background: "rgba(0,0,0,0.35)",
            border: "1px solid rgba(255,255,255,0.25)",
            borderRadius: "12px",
            padding: "0.55rem 0.75rem",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
          }}
        >
          <Icon style={{ color: "#fff", fontSize: "1.4rem" }} />
          <span style={{ color: "#fff", fontWeight: "700", fontSize: "1rem", fontFamily: "sans-serif" }}>
            {feature.title}
          </span>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "1.4rem 1.5rem 1.6rem", display: "flex", flexDirection: "column", flexGrow: 1 }}>
        <p style={{ color: "rgba(255,255,255,0.72)", fontSize: "0.96rem", lineHeight: 1.7, margin: 0, fontFamily: "sans-serif" }}>
          {feature.description}
        </p>
        <div
          style={{
            marginTop: "1.25rem",
            display: "flex",
            alignItems: "center",
            gap: "0.45rem",
            color: "#d4b483",
            fontFamily: "sans-serif",
            fontWeight: "600",
            fontSize: "0.9rem",
            letterSpacing: "0.04em",
            transition: "gap 0.2s",
          }}
        >
          <span>Explore</span>
          <FaArrowRight style={{ fontSize: "0.8rem" }} />
        </div>
      </div>
    </div>
  );
};

/* ─── Page ─── */
const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div style={styles.page}>
      <div style={styles.overlay}>
        {/* ── Hero ── */}
        <div style={styles.heroSection}>
          <div style={styles.badge}>🌿 Indigenous Heritage Platform</div>

          <h1 style={styles.heroTitle}>
            Vedda Culture{" "}
            <span style={styles.heroTitle_em}>Preservation</span>{" "}
            System
          </h1>

          <p style={styles.heroSub}>
            Preserving and celebrating the indigenous Vedda people of Sri Lanka
            through immersive digital experiences.
          </p>

          <div style={styles.divider} />

          {/* ── Feature Cards ── */}
          <div style={styles.grid}>
            {features.map((feature) => (
              <FeatureCard
                key={feature.id}
                feature={feature}
                onClick={() => navigate(feature.path)}
              />
            ))}
          </div>
        </div>

        {/* ── About ── */}
        <div style={styles.aboutSection}>
          <div style={styles.aboutDividerTop} />
          <h2 style={styles.aboutTitle}>About the Vedda Culture</h2>
          <p style={styles.aboutText}>
            The Vedda people are the indigenous inhabitants of Sri Lanka, with a history
            stretching back thousands of years. This platform is dedicated to safeguarding
            their language, traditions, and cultural artefacts — bridging ancient wisdom
            with modern technology for generations to come.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
