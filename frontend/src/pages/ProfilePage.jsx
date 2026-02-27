import { useAuth } from '../contexts/AuthContext';

const ProfilePage = () => {
  const { user } = useAuth();

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

  return (
    <div className="min-h-screen flex items-center justify-center py-4 px-8 relative" style={{ backgroundImage: 'url(/assets/background-images/profile-background.png)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="absolute inset-0 backdrop-blur-[3px] bg-black/20" />
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-2xl relative z-10">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">My Profile</h1>
          <p className="text-gray-600">Your account information</p>
        </div>

        <div className="space-y-4">
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
    </div>
  );
};

export default ProfilePage;
