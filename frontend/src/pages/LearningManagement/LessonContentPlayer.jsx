import { useState, useEffect } from 'react';
import { FaArrowLeft, FaArrowRight, FaChevronLeft, FaChevronRight, FaPlay, FaCheckCircle } from 'react-icons/fa';
import {exercisesAPI} from "../../services/learningAPI.js";
import { useAuth } from '../../contexts/AuthContext';

const LessonContentPlayer = ({ lesson, category, allLessons, onBack, onPractice }) => {
  const { user } = useAuth();
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [currentLesson, setCurrentLesson] = useState(lesson);
  const [lessonDone, setLessonDone] = useState(false);

  useEffect(() => {
    // Find the index of the current lesson in the category's lessons
    const index = allLessons.findIndex(l => l.id === lesson.id);
    setCurrentLessonIndex(index);
    setCurrentLesson(lesson);
    setLessonDone(false);
    const userId = user?.id;

    if (lesson) {
      exercisesAPI.startExercise({
        user_id: userId,
        lesson_id: lesson._id,
        completed: false
      });
    }

  }, [lesson, allLessons]);

  const handlePrevious = () => {
    if (currentLessonIndex > 0) {
      const prevLesson = allLessons[currentLessonIndex - 1];
      setCurrentLesson(prevLesson);
      setCurrentLessonIndex(currentLessonIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentLessonIndex < allLessons.length - 1) {
      const nextLesson = allLessons[currentLessonIndex + 1];
      setCurrentLesson(nextLesson);
      setCurrentLessonIndex(currentLessonIndex + 1);
    }
    
  };

  const handleMarkAsDone = async () => {
    const userId = user?.id;
    if (currentLesson) {
      exercisesAPI.startExercise({
        user_id: userId,
        lesson_id: currentLesson._id,
        completed: true
      });
    }
    setLessonDone(true);
  };

  const handlePractice = () => {

    onPractice(currentLesson);
  };

  const hasPrevious = currentLessonIndex > 0;
  const hasNext = currentLessonIndex < allLessons.length - 1;

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
              Back to Lessons
            </button>
            <div
              style={{
                color: '#d4b483',
                fontFamily: 'system-ui, sans-serif',
                fontWeight: '600',
                fontSize: '0.9rem',
              }}
            >
              {category.name} &mdash; Lesson {currentLessonIndex + 1} of {allLessons.length}
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
            fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
            fontWeight: '800',
            color: '#1c1409',
            lineHeight: 1.2,
            margin: '0 auto 0.4rem',
            maxWidth: '800px',
            fontFamily: "'Georgia', serif",
            letterSpacing: '-0.3px',
            textShadow: '0 1px 0 rgba(255,255,255,0.8)',
            padding: '0 1rem',
          }}
        >
          {currentLesson.topic}
        </h1>
        <p
          style={{
            fontSize: '0.95rem',
            color: '#9a6f2a',
            fontFamily: 'system-ui, sans-serif',
            fontWeight: '600',
          }}
        >
          Lesson {currentLessonIndex + 1} of {allLessons.length}
        </p>
        <div
          style={{
            width: '52px',
            height: '3px',
            background: 'linear-gradient(90deg, #9a6f2a, #c9943a)',
            margin: '0.8rem auto 0',
            borderRadius: '99px',
          }}
        />
      </div>

      {/* ── Content ── */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Content Container */}
        <div
          className="rounded-2xl p-8 mb-6 min-h-[400px]"
          style={{
            background: 'rgba(255,255,255,0.88)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(200,170,100,0.25)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
          }}
        >
          {/* Description */}
          {currentLesson.description && (
            <div
              className="mb-6 pb-6"
              style={{ borderBottom: '1px solid rgba(200,170,100,0.30)' }}
            >
              <p
                className="text-lg leading-relaxed"
                style={{ color: '#3d2e0f', fontFamily: "'Georgia', serif", fontStyle: 'italic' }}
              >
                {currentLesson.description}
              </p>
            </div>
          )}

          {/* Rich Text Content */}
          <div
            className="prose prose-lg max-w-none mb-6 lesson-content"
            dangerouslySetInnerHTML={{ __html: currentLesson.content || '<p class="text-gray-500">No content available for this lesson.</p>' }}
          />

          {/* Image Display */}
          {currentLesson.imageUrl && (
            <div className="my-8">
              <img
                src={currentLesson.imageUrl}
                alt={currentLesson.topic}
                className="max-w-full h-auto rounded-lg shadow-md mx-auto"
                style={{ maxHeight: '400px', objectFit: 'contain' }}
              />
            </div>
          )}

          {/* Audio Player */}
          {currentLesson.audioUrl && (
            <div
              className="my-8 rounded-lg p-6"
              style={{ background: 'rgba(200,170,100,0.10)', border: '1px solid rgba(200,170,100,0.25)' }}
            >
              <h3
                className="text-lg font-semibold mb-3 flex items-center gap-2"
                style={{ color: '#5c4a1e', fontFamily: "'Georgia', serif" }}
              >
                <FaPlay style={{ color: '#9a6f2a' }} /> Audio Pronunciation
              </h3>
              <audio controls className="w-full" style={{ maxWidth: '600px' }}>
                <source src={currentLesson.audioUrl} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            </div>
          )}

          {/* Rewards Info */}
          <div
            className="mt-8 pt-6"
            style={{ borderTop: '1px solid rgba(200,170,100,0.30)' }}
          >
            <div className="flex items-center justify-center gap-6">
              <div
                className="rounded-lg px-6 py-3"
                style={{
                  background: 'rgba(200,170,100,0.15)',
                  border: '2px solid rgba(200,165,90,0.50)',
                }}
              >
                <div
                  className="text-2xl font-bold"
                  style={{ color: '#9a6f2a', fontFamily: "'Georgia', serif" }}
                >
                  {currentLesson.xp} XP
                </div>
              </div>
              <button
                onClick={handleMarkAsDone}
                disabled={lessonDone}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-base border-2 transition-all ${
                  lessonDone
                    ? 'bg-green-100 border-green-400 text-green-700 cursor-not-allowed'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-green-50 hover:border-green-400 hover:text-green-700'
                }`}
              >
                <FaCheckCircle className={lessonDone ? 'text-green-500' : 'text-gray-400'} />
                {lessonDone ? 'Completed' : 'Mark as Done'}
              </button>
            </div>
          </div>
        </div>

        {/* Navigation and Actions Footer */}
        <div
          className="rounded-2xl p-6"
          style={{
            background: 'rgba(255,255,255,0.88)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(200,170,100,0.25)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
          }}
        >
          <div className="flex items-center justify-between gap-4">
            {/* Previous Button */}
            <button
              onClick={handlePrevious}
              disabled={!hasPrevious}
              style={
                hasPrevious
                  ? {
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      background: 'rgba(200,170,100,0.12)',
                      border: '2px solid rgba(200,165,90,0.40)',
                      color: '#5c4a1e',
                      borderRadius: '8px',
                      padding: '0.65rem 1.2rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                    }
                  : {
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      background: 'rgba(200,200,200,0.15)',
                      border: '2px solid rgba(200,200,200,0.30)',
                      color: '#aaa',
                      borderRadius: '8px',
                      padding: '0.65rem 1.2rem',
                      fontWeight: '600',
                      cursor: 'not-allowed',
                    }
              }
            >
              <FaChevronLeft />
              <span className="hidden sm:inline">Previous</span>
            </button>

            {/* Practice Button */}
            <button
              onClick={handlePractice}
              className="flex-1 max-w-md text-white px-8 py-4 rounded-lg font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #9a6f2a, #c9943a)',
              }}
            >
              Start Practice Exercises
            </button>

            {/* Next Button */}
            <button
              onClick={handleNext}
              disabled={!hasNext}
              style={
                hasNext
                  ? {
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      background: 'rgba(200,170,100,0.12)',
                      border: '2px solid rgba(200,165,90,0.40)',
                      color: '#5c4a1e',
                      borderRadius: '8px',
                      padding: '0.65rem 1.2rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                    }
                  : {
                      display: 'flex', alignItems: 'center', gap: '0.5rem',
                      background: 'rgba(200,200,200,0.15)',
                      border: '2px solid rgba(200,200,200,0.30)',
                      color: '#aaa',
                      borderRadius: '8px',
                      padding: '0.65rem 1.2rem',
                      fontWeight: '600',
                      cursor: 'not-allowed',
                    }
              }
            >
              <span className="hidden sm:inline">Next</span>
              <FaChevronRight />
            </button>
          </div>

          {/* Lesson Progress Indicator */}
          <div className="mt-6">
            <div className="flex items-center justify-center gap-2">
              {allLessons.map((_, index) => (
                <div
                  key={index}
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: index === currentLessonIndex ? '2rem' : '0.5rem',
                    background:
                      index === currentLessonIndex
                        ? '#9a6f2a'
                        : index < currentLessonIndex
                        ? '#c9943a'
                        : 'rgba(200,170,100,0.30)',
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Custom styles for lesson content */}
      <style>{`
        .lesson-content img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 1.5rem auto;
          display: block;
        }
        
        .lesson-content p {
          margin-bottom: 1rem;
          line-height: 1.8;
          color: #3d2e0f;
        }
        
        .lesson-content h1,
        .lesson-content h2,
        .lesson-content h3 {
          margin-top: 1.5rem;
          margin-bottom: 1rem;
          font-weight: 700;
          color: #1c1409;
          font-family: 'Georgia', serif;
        }
        
        .lesson-content ul,
        .lesson-content ol {
          margin-left: 1.5rem;
          margin-bottom: 1rem;
        }
        
        .lesson-content li {
          margin-bottom: 0.5rem;
          color: #3d2e0f;
        }

        .lesson-content strong {
          color: #9a6f2a;
        }
      `}</style>
    </div>
  );
};

export default LessonContentPlayer;
