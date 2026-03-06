import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FaArrowLeft, FaBook } from 'react-icons/fa';
import { categoriesAPI } from '../../services/learningAPI';
import LoadingScreen from '../../components/ui/LoadingScreen';

const LessonSelection = ({ onBack, onCategorySelect }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Color palette for categories (glassmorphic)
  const colorPalette = [
    { bg: 'linear-gradient(135deg, rgba(34,197,94,0.72) 0%, rgba(22,163,74,0.72) 100%)',   shadow: 'rgba(22,163,74,0.30)' },
    { bg: 'linear-gradient(135deg, rgba(249,115,22,0.72) 0%, rgba(234,88,12,0.72) 100%)',  shadow: 'rgba(234,88,12,0.30)' },
    { bg: 'linear-gradient(135deg, rgba(234,179,8,0.72) 0%, rgba(202,138,4,0.72) 100%)',   shadow: 'rgba(202,138,4,0.30)' },
    { bg: 'linear-gradient(135deg, rgba(59,130,246,0.72) 0%, rgba(37,99,235,0.72) 100%)',  shadow: 'rgba(37,99,235,0.30)' },
    { bg: 'linear-gradient(135deg, rgba(239,68,68,0.72) 0%, rgba(220,38,38,0.72) 100%)',   shadow: 'rgba(220,38,38,0.30)' },
    { bg: 'linear-gradient(135deg, rgba(168,85,247,0.72) 0%, rgba(147,51,234,0.72) 100%)', shadow: 'rgba(147,51,234,0.28)' },
    { bg: 'linear-gradient(135deg, rgba(236,72,153,0.72) 0%, rgba(219,39,119,0.72) 100%)', shadow: 'rgba(219,39,119,0.28)' },
    { bg: 'linear-gradient(135deg, rgba(99,102,241,0.72) 0%, rgba(79,70,229,0.72) 100%)',  shadow: 'rgba(79,70,229,0.28)' },
    { bg: 'linear-gradient(135deg, rgba(20,184,166,0.72) 0%, rgba(13,148,136,0.72) 100%)', shadow: 'rgba(13,148,136,0.28)' },
    { bg: 'linear-gradient(135deg, rgba(6,182,212,0.72) 0%, rgba(8,145,178,0.72) 100%)',   shadow: 'rgba(8,145,178,0.28)' },
  ];

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await categoriesAPI.getAll();
      setCategories(response.data);
    } catch (error) {
      toast.error('Failed to load categories');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (category) => {
    onCategorySelect(category);
  };

  const getColorClass = (index) => {
    return colorPalette[index % colorPalette.length];
  };

  if (loading) {
    return <LoadingScreen message="Loading categories..." />;
  }

  return (
    <div
      className="min-h-screen mt-[60px]"
      style={{
        backgroundImage: `url('/assets/background-images/background-1.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* ── Glassmorphic nav bar ── */}
      <div
        style={{
          background: 'rgba(28,20,8,0.55)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          borderBottom: '1px solid rgba(200,170,100,0.18)',
          boxShadow: '0 2px 16px rgba(0,0,0,0.20)',
        }}
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: 'rgba(255,248,230,0.90)',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(200,165,90,0.25)',
                borderRadius: '9px',
                padding: '0.4rem 0.9rem',
                fontFamily: 'system-ui, sans-serif',
                fontWeight: '600',
                fontSize: '0.88rem',
                cursor: 'pointer',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = 'rgba(200,165,90,0.18)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')
              }
            >
              <FaArrowLeft style={{ fontSize: '0.8rem' }} />
              Back to Learning Hub
            </button>
            <div
              style={{
                color: '#d4b483',
                fontFamily: 'system-ui, sans-serif',
                fontWeight: '600',
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <FaBook style={{ fontSize: '0.85rem' }} />
              Vedda Lessons
            </div>
          </div>
        </div>
      </div>

      {/* ── Hero section ── */}
      <div
        style={{
          background:
            'linear-gradient(to bottom, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0.65) 60%, rgba(255,255,255,0) 100%)',
          paddingTop: '1.5rem',
          paddingBottom: '1.5rem',
          textAlign: 'center',
        }}
      >
        <span
          style={{
            display: 'inline-block',
            background: 'rgba(255,255,255,0.60)',
            border: '1px solid rgba(100,80,40,0.22)',
            borderRadius: '999px',
            padding: '0.28rem 1rem',
            fontSize: '0.73rem',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: '#5c4a1e',
            marginBottom: '0.6rem',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          📚 Language Learning
        </span>
        <h1
          style={{
            fontSize: '45px',
            fontWeight: '800',
            color: '#1c1409',
            lineHeight: 1.2,
            margin: '0 auto 0.5rem',
            maxWidth: '720px',
            fontFamily: "'Georgia', serif",
            letterSpacing: '-0.3px',
            textShadow: '0 1px 0 rgba(255,255,255,0.8)',
            padding: '0 1rem',
          }}
        >
          Vedda{' '}
          <span
            style={{
              color: '#9a6f2a',
              textShadow:
                '0 1px 0 rgba(255,255,255,0.9), 0 2px 8px rgba(255,255,255,0.5)',
            }}
          >
            Lessons
          </span>
        </h1>
        <p
          style={{
            fontSize: 'clamp(0.9rem,1.8vw,1.08rem)',
            color: '#3d2e0f',
            maxWidth: '540px',
            margin: '0 auto 0.5rem',
            lineHeight: 1.75,
            fontFamily: "'Georgia', serif",
            fontStyle: 'italic',
            padding: '0 1rem',
          }}
        >
          Select a category to start learning the indigenous Vedda language.
        </p>
        <div
          style={{
            width: '52px',
            height: '3px',
            background: 'linear-gradient(90deg, #9a6f2a, #c9943a)',
            margin: '1rem auto 0',
            borderRadius: '99px',
          }}
        />
      </div>

      {/* ── Content ── */}
      <div className="container mx-auto px-4 py-8">
        {/* Categories Grid */}
        {categories.length === 0 ? (
          <div className="text-center py-20">
            <div
              className="rounded-xl p-12 max-w-md mx-auto"
              style={{
                background: 'rgba(255,255,255,0.82)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(200,170,100,0.25)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
              }}
            >
              <p
                className="text-lg mb-4"
                style={{ color: '#5c4a1e', fontFamily: "'Georgia', serif" }}
              >
                No categories available yet
              </p>
              <p style={{ color: '#8a7550', fontFamily: 'system-ui, sans-serif' }}>
                Categories will appear here once an admin creates them
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {categories.map((category, index) => (
              <div
                key={category.id}
                onClick={() => handleCategoryClick(category)}
                className="group cursor-pointer transform transition-all duration-300 hover:scale-105"
              >
                <div
                  className="rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 p-12 text-white h-48 flex flex-col items-center justify-center text-center relative overflow-hidden"
                  style={{
                    background: getColorClass(index).bg,
                    backdropFilter: 'blur(14px)',
                    WebkitBackdropFilter: 'blur(14px)',
                    border: '1px solid rgba(255,255,255,0.25)',
                    boxShadow: `0 8px 32px ${getColorClass(index).shadow}, inset 0 1px 0 rgba(255,255,255,0.20)`,
                  }}
                >
                  <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 55%)' }} />
                  <h2 className="text-3xl font-bold mb-3 relative z-10">{category.name}</h2>
                  {category.description && (
                    <p className="text-white/90 text-lg relative z-10">
                      {category.description}
                    </p>
                  )}
                  <div className="mt-4 flex items-center text-white font-semibold opacity-0 group-hover:opacity-100 transition-opacity relative z-10">
                    <span>Start Learning</span>
                    <svg
                      className="w-5 h-5 ml-2 transform group-hover:translate-x-2 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LessonSelection;
