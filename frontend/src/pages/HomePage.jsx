import { useNavigate } from "react-router-dom";
import { FaLanguage, FaBookOpen, FaLandmark, FaCube, FaArrowRight } from "react-icons/fa";

/* ─── Per-card accent colours ─── */
const ACCENTS = {
  1: { from: "#1e6fa8", to: "#3b9fd1", glow: "rgba(30,111,168,0.30)" },
  2: { from: "#2d7a4f", to: "#4aad72", glow: "rgba(45,122,79,0.30)" },
  3: { from: "#7c3fa8", to: "#b06bd6", glow: "rgba(124,63,168,0.30)" },
  4: { from: "#b85c10", to: "#e88033", glow: "rgba(184,92,16,0.30)" },
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

/* ── Feature Card ── */
const FeatureCard = ({ feature, onClick }) => {
  const Icon = feature.icon;
  const accent = ACCENTS[feature.id];

  return (
    <div
      onClick={onClick}
      style={{
        cursor: "pointer",
        borderRadius: "18px",
        overflow: "hidden",
        background: "#ffffff",
        boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
        transition: "transform 0.28s cubic-bezier(.25,.8,.25,1), box-shadow 0.28s",
        display: "flex",
        flexDirection: "column",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = "translateY(-6px)";
        e.currentTarget.style.boxShadow = `0 16px 48px ${accent.glow}, 0 4px 16px rgba(0,0,0,0.14)`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.12)";
      }}
    >
      {/* Coloured image banner */}
      <div style={{ position: "relative", height: "175px", overflow: "hidden" }}>
        {/* Feature background image */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `url(${feature.bgImage})`,
          backgroundSize: "cover", backgroundPosition: "center",
        }} />
        {/* Colour gradient overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: `linear-gradient(135deg, ${accent.from}bb 0%, ${accent.to}88 100%)`,
        }} />
        {/* Title chip at bottom-left */}
        <div style={{
          position: "absolute", bottom: "1rem", left: "1rem",
          display: "flex", alignItems: "center", gap: "0.55rem",
          background: "rgba(0,0,0,0.40)",
          backdropFilter: "blur(6px)",
          border: "1px solid rgba(255,255,255,0.22)",
          borderRadius: "10px",
          padding: "0.45rem 0.85rem",
        }}>
          <Icon style={{ color: "#fff", fontSize: "1.25rem", flexShrink: 0 }} />
          <span style={{ color: "#fff", fontWeight: "700", fontSize: "0.95rem", fontFamily: "system-ui, sans-serif" }}>
            {feature.title}
          </span>
        </div>
      </div>

      {/* White body */}
      <div style={{ padding: "1.25rem 1.4rem 1.5rem", flexGrow: 1, display: "flex", flexDirection: "column" }}>
        <p style={{
          margin: 0,
          color: "#4b5563",
          fontSize: "0.95rem",
          lineHeight: 1.65,
          fontFamily: "system-ui, sans-serif",
        }}>
          {feature.description}
        </p>
        <div style={{
          marginTop: "1.1rem",
          display: "flex", alignItems: "center", gap: "0.4rem",
          fontFamily: "system-ui, sans-serif",
          fontWeight: "600", fontSize: "0.88rem",
          color: accent.from,
          letterSpacing: "0.03em",
        }}>
          <span>Explore</span>
          <FaArrowRight style={{ fontSize: "0.75rem" }} />
        </div>
      </div>
    </div>
  );
};

/* ── Page ── */
const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: "100vh",
      backgroundImage: `url('/assets/background-images/background-1.png')`,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundAttachment: "fixed",
    }}>
      {/* ── Hero area: only the top strip gets a subtle white fade so text is readable ── */}
      <div style={{
        paddingTop: "5rem",
        paddingBottom: "3.5rem",
        textAlign: "center",
        background: "linear-gradient(to bottom, rgba(255,255,255,0.90) 0%, rgba(255,255,255,0.70) 55%, rgba(255,255,255,0) 100%)",
      }}>
        {/* Badge */}
        <span style={{
          display: "inline-block",
          background: "rgba(255,255,255,0.70)",
          border: "1px solid rgba(100,80,40,0.22)",
          borderRadius: "999px",
          padding: "0.3rem 1.1rem",
          fontSize: "0.75rem",
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "#5c4a1e",
          marginBottom: "1.25rem",
          fontFamily: "system-ui, sans-serif",
          backdropFilter: "blur(6px)",
        }}>
          🌿 Indigenous Heritage Platform
        </span>

        {/* Headline */}
        <h1 style={{
          fontSize: "clamp(2rem, 5vw, 3.8rem)",
          fontWeight: "800",
          color: "#1c1409",
          lineHeight: 1.15,
          margin: "0 auto 1rem",
          maxWidth: "780px",
          fontFamily: "'Georgia', serif",
          letterSpacing: "-0.5px",
          textShadow: "0 1px 0 rgba(255,255,255,0.8)",
          padding: "0 1rem",
        }}>
          Vedda Culture{" "}
          <span style={{
            color: "#9a6f2a",
            textShadow: "0 1px 0 rgba(255,255,255,0.9), 0 2px 8px rgba(255,255,255,0.6)",
          }}>
            Preservation
          </span>{" "}
          System
        </h1>

        {/* Subtitle */}
        <p style={{
          fontSize: "clamp(0.95rem, 2vw, 1.15rem)",
          color: "#3d2e0f",
          maxWidth: "520px",
          margin: "0 auto",
          lineHeight: 1.8,
          fontFamily: "'Georgia', serif",
          fontStyle: "italic",
          padding: "0 1rem",
        }}>
          Preserving and celebrating the indigenous Vedda people of Sri Lanka
          through immersive digital experiences.
        </p>
      </div>

      {/* ── Cards section: sits directly on the background image ── */}
      <div style={{ padding: "0 1.25rem 5rem" }}>
        {/* Thin gold divider */}
        <div style={{
          width: "56px", height: "3px",
          background: "linear-gradient(90deg, #9a6f2a, #c9943a)",
          margin: "0 auto 2.75rem",
          borderRadius: "99px",
        }} />

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 400px), 1fr))",
          gap: "1.5rem",
          maxWidth: "900px",
          margin: "0 auto",
        }}>
          {features.map(feature => (
            <FeatureCard
              key={feature.id}
              feature={feature}
              onClick={() => navigate(feature.path)}
            />
          ))}
        </div>

        {/* ── About section: card on the background ── */}
        <div style={{
          maxWidth: "680px",
          margin: "4rem auto 0",
          background: "rgba(255,255,255,0.88)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderRadius: "20px",
          padding: "2.5rem 2.75rem",
          textAlign: "center",
          boxShadow: "0 8px 40px rgba(0,0,0,0.10)",
          border: "1px solid rgba(255,255,255,0.60)",
        }}>
          <div style={{
            width: "36px", height: "2px",
            background: "linear-gradient(90deg, #9a6f2a, #c9943a)",
            margin: "0 auto 1.5rem",
            borderRadius: "99px",
          }} />
          <h2 style={{
            fontSize: "1.55rem", fontWeight: "700",
            color: "#1c1409", marginBottom: "1rem",
            fontFamily: "'Georgia', serif",
          }}>
            About the Vedda Culture
          </h2>
          <p style={{
            fontSize: "1rem", color: "#4b5563",
            lineHeight: 1.85, margin: 0,
            fontFamily: "'Georgia', serif",
            fontStyle: "italic",
          }}>
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
