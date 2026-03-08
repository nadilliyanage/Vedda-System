import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FaArrowLeft, FaBook, FaCheckCircle } from 'react-icons/fa';
import { lessonsAPI } from '../../services/learningAPI';
import LoadingScreen from '../../components/ui/LoadingScreen';

const LessonsList = ({ category, onBack, onLessonSelect }) => {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  // Color palette for lessons (glassmorphic)
  const colorPalette = [
    { bg: 'linear-gradient(135deg, rgba(249,115,22,0.72) 0%, rgba(234,88,12,0.72) 100%)',  shadow: 'rgba(234,88,12,0.30)' },
    { bg: 'linear-gradient(135deg, rgba(59,130,246,0.72) 0%, rgba(37,99,235,0.72) 100%)',  shadow: 'rgba(37,99,235,0.30)' },
    { bg: 'linear-gradient(135deg, rgba(34,197,94,0.72) 0%, rgba(22,163,74,0.72) 100%)',   shadow: 'rgba(22,163,74,0.30)' },
    { bg: 'linear-gradient(135deg, rgba(168,85,247,0.72) 0%, rgba(147,51,234,0.72) 100%)', shadow: 'rgba(147,51,234,0.28)' },
    { bg: 'linear-gradient(135deg, rgba(239,68,68,0.72) 0%, rgba(220,38,38,0.72) 100%)',   shadow: 'rgba(220,38,38,0.30)' },
    { bg: 'linear-gradient(135deg, rgba(99,102,241,0.72) 0%, rgba(79,70,229,0.72) 100%)',  shadow: 'rgba(79,70,229,0.28)' },
    { bg: 'linear-gradient(135deg, rgba(236,72,153,0.72) 0%, rgba(219,39,119,0.72) 100%)', shadow: 'rgba(219,39,119,0.28)' },
    { bg: 'linear-gradient(135deg, rgba(20,184,166,0.72) 0%, rgba(13,148,136,0.72) 100%)', shadow: 'rgba(13,148,136,0.28)' },
    { bg: 'linear-gradient(135deg, rgba(234,179,8,0.72) 0%, rgba(202,138,4,0.72) 100%)',   shadow: 'rgba(202,138,4,0.30)' },
    { bg: 'linear-gradient(135deg, rgba(6,182,212,0.72) 0%, rgba(8,145,178,0.72) 100%)',   shadow: 'rgba(8,145,178,0.28)' },
  ];

  const fetchLessons = async () => {
    try {
      setLoading(true);
      const response = await lessonsAPI.getAll();
      
      // Filter lessons by selected category
      const filteredLessons = response.data.filter(
        lesson => lesson.categoryId === category.id
      );
      
      setLessons(filteredLessons);
    } catch (error) {
      toast.error('Failed to load lessons');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (category) {
      fetchLessons();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  const handleLessonClick = (lesson) => {
    onLessonSelect(lesson, lessons);
  };

  const getColorClass = (index) => {
    return colorPalette[index % colorPalette.length];
  };

  if (loading) {
    return <LoadingScreen message="Loading lessons..." />;
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
              Back to Categories
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
              {category.name}
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
          📖 {category.name}
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
          Lessons &mdash;{' '}
          <span
            style={{
              color: '#9a6f2a',
              textShadow:
                '0 1px 0 rgba(255,255,255,0.9), 0 2px 8px rgba(255,255,255,0.5)',
            }}
          >
            {category.name}
          </span>
        </h1>
        {category.description && (
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
            {category.description}
          </p>
        )}
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
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Lessons List */}
        {lessons.length === 0 ? (
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
              <FaBook
                className="text-5xl mx-auto mb-4"
                style={{ color: '#c9943a' }}
              />
              <p
                className="text-lg mb-4"
                style={{ color: '#5c4a1e', fontFamily: "'Georgia', serif" }}
              >
                No lessons available in this category yet
              </p>
              <p style={{ color: '#8a7550', fontFamily: 'system-ui, sans-serif' }}>
                Check back soon for new lessons!
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {lessons.map((lesson, index) => (
              <div
                key={lesson.id}
                onClick={() => handleLessonClick(lesson)}
                className="group cursor-pointer transform transition-all duration-300 hover:scale-102"
              >
                <div
                  className="rounded-xl hover:shadow-2xl transition-all duration-300 p-8 text-white relative overflow-hidden"
                  style={{
                    background: getColorClass(index).bg,
                    backdropFilter: 'blur(14px)',
                    WebkitBackdropFilter: 'blur(14px)',
                    border: '1px solid rgba(255,255,255,0.25)',
                    boxShadow: `0 8px 32px ${getColorClass(index).shadow}, inset 0 1px 0 rgba(255,255,255,0.20)`,
                  }}
                >
                  <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, transparent 55%)' }} />

                  {/* Completed Badge */}
                  {lesson.completed && (
                    <div
                      className="absolute top-4 right-4 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full font-semibold text-sm"
                      style={{
                        background: 'rgba(34, 197, 94, 0.95)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      }}
                    >
                      <FaCheckCircle />
                      <span>Completed</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold mb-2">
                        {lesson.topic}
                      </h2>
                      {lesson.description && (
                        <p className="text-white/90 text-lg">
                          {lesson.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-3 text-sm">
                        <span className="bg-white/20 px-3 py-1 rounded-full">
                          {lesson.xp} XP
                        </span>
                        <span className="bg-white/20 px-3 py-1 rounded-full">
                          {lesson.coins} Coins
                        </span>
                      </div>
                    </div>
                    <div className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg
                        className="w-8 h-8 transform group-hover:translate-x-2 transition-transform"
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
              </div>
            ))}
          </div>
        )}

        {/* Progress Info */}
        {/*{lessons.length > 0 && (*/}
        {/*  <div className="mt-8">*/}
        {/*    <div*/}
        {/*      className="rounded-xl p-6"*/}
        {/*      style={{*/}
        {/*        background: 'rgba(255,255,255,0.82)',*/}
        {/*        backdropFilter: 'blur(10px)',*/}
        {/*        WebkitBackdropFilter: 'blur(10px)',*/}
        {/*        border: '1px solid rgba(200,170,100,0.25)',*/}
        {/*        boxShadow: '0 4px 24px rgba(0,0,0,0.10)',*/}
        {/*      }}*/}
        {/*    >*/}
        {/*      <div className="flex items-center justify-between">*/}
        {/*        <div>*/}
        {/*          <h3*/}
        {/*            className="text-lg font-bold mb-1"*/}
        {/*            style={{ color: '#1c1409', fontFamily: "'Georgia', serif" }}*/}
        {/*          >*/}
        {/*            Your Progress*/}
        {/*          </h3>*/}
        {/*          <p style={{ color: '#5c4a1e', fontFamily: 'system-ui, sans-serif' }}>*/}
        {/*            {lessons.length} lesson{lessons.length !== 1 ? 's' : ''} available in this category*/}
        {/*          </p>*/}
        {/*        </div>*/}
        {/*        <div className="text-right">*/}
        {/*          <div*/}
        {/*            className="text-3xl font-bold"*/}
        {/*            style={{ color: '#9a6f2a', fontFamily: "'Georgia', serif" }}*/}
        {/*          >*/}
        {/*            0/{lessons.length}*/}
        {/*          </div>*/}
        {/*          <p*/}
        {/*            className="text-sm"*/}
        {/*            style={{ color: '#8a7550', fontFamily: 'system-ui, sans-serif' }}*/}
        {/*          >*/}
        {/*            Completed*/}
        {/*          </p>*/}
        {/*        </div>*/}
        {/*      </div>*/}
        {/*    </div>*/}
        {/*  </div>*/}
        {/*)}*/}
      </div>
    </div>
  );
};

export default LessonsList;
