import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getMyFeedback } from '../services/feedbackService';

const ProfilePage = () => {
  const { user } = useAuth();
  const [feedbacks, setFeedbacks] = useState([]);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(true);

  useEffect(() => {
    const fetchFeedbacks = async () => {
      if (!user) return;
      try {
        const data = await getMyFeedback({ limit: 50 });
        if (data.success) {
          setFeedbacks(data.feedback);
        }
      } catch (error) {
        console.error('Failed to fetch feedback history:', error);
      } finally {
        setLoadingFeedbacks(false);
      }
    };
    fetchFeedbacks();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center py-4 px-8 relative" style={{ backgroundImage: 'url(/assets/background-images/profile-background.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="absolute inset-0 backdrop-blur-[3px] bg-black/20" />
        <div className="bg-white rounded-xl shadow-2xl p-8">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">Approved</span>;
      case 'rejected':
        return <span className="px-2.5 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">Rejected</span>;
      default:
        return <span className="px-2.5 py-1 bg-yellow-100 text-yellow-700 text-xs font-semibold rounded-full">Pending</span>;
    }
  };

  const getFeedbackTypeLabel = (type) => {
    switch(type) {
      case 'edit_suggestion': return 'Edit Suggestion';
      case 'new_info': return 'New Information';
      case 'correction': return 'Correction';
      default: return 'General Feedback';
    }
  };

  return (
    <div className="min-h-screen py-20 px-4 sm:px-8 relative" style={{ backgroundImage: 'url(/assets/background-images/profile-background.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }}>
      <div className="absolute inset-0 backdrop-blur-[3px] bg-black/20" />
      
      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        
        {/* User Info Card */}
        <div className="bg-white rounded-xl shadow-2xl p-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">My Profile</h1>
            <p className="text-gray-600">Your account information</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <div className="border-b border-gray-200 pb-3">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Username
              </label>
              <p className="text-lg text-gray-800">{user.username}</p>
            </div>
            
            <div className="border-b border-gray-200 pb-3">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Email
              </label>
              <p className="text-lg text-gray-800">{user.email}</p>
            </div>
            
            <div className="border-b border-gray-200 pb-3">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Member Since
              </label>
              <p className="text-lg text-gray-800">
                {user.createdAt 
                  ? new Date(user.createdAt).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })
                  : 'N/A'
                }
              </p>
            </div>
            
            {user.lastLogin && (
              <div className="border-b border-gray-200 pb-3">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Last Login
                </label>
                <p className="text-lg text-gray-800">
                  {new Date(user.lastLogin).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* My Contributions Card */}
        <div className="bg-white rounded-xl shadow-2xl p-8">
          <div className="mb-6 border-b border-gray-200 pb-4">
            <h2 className="text-2xl font-bold text-gray-800">My Contributions</h2>
            <p className="text-gray-600">Track the feedback and edit suggestions you've submitted for artifacts.</p>
          </div>

          {loadingFeedbacks ? (
            <div className="text-center py-8 text-gray-500">Loading your contributions...</div>
          ) : feedbacks.length > 0 ? (
            <div className="space-y-4">
              {feedbacks.map((item) => (
                <div key={item._id} className="border border-gray-100 bg-gray-50 rounded-lg p-5 hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {item.artifactId?.name || 'Unknown Artifact'}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Submitted on {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-medium text-gray-600 bg-gray-200 px-2.5 py-1 rounded-full">
                        {getFeedbackTypeLabel(item.feedbackType)}
                      </span>
                      {getStatusBadge(item.status)}
                    </div>
                  </div>
                  
                  {/* Preview of suggested changes */}
                  <div className="text-sm text-gray-700 bg-white p-3 border border-gray-100 rounded">
                    {item.suggestedChanges && Object.keys(item.suggestedChanges).length > 0 ? (
                      <ul className="list-disc list-inside space-y-1">
                        {Object.entries(item.suggestedChanges).map(([key, value]) => {
                          if (!value) return null;
                          // If it's an array (like tags), join it
                          const displayValue = Array.isArray(value) ? value.join(', ') : value;
                          return (
                            <li key={key} className="truncate">
                              <span className="font-medium capitalize">{key}:</span> {displayValue}
                            </li>
                          );
                        })}
                      </ul>
                    ) : item.suggestedImages && item.suggestedImages.length > 0 ? (
                      <p className="italic text-gray-500">Suggested {item.suggestedImages.length} image(s).</p>
                    ) : (
                      <p className="italic text-gray-500">No details provided.</p>
                    )}
                  </div>
                  
                  {item.status !== 'pending' && item.reviewNote && (
                    <div className="mt-3 text-sm">
                      <span className="font-medium text-gray-700">Curator Note: </span>
                      <span className="text-gray-600 italic">"{item.reviewNote}"</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No contributions yet</h3>
              <p className="text-gray-500">When you suggest edits to artifacts, they will appear here.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ProfilePage;
