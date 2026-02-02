const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center z-50">
      <div className="text-center">
        {/* Logo with pulse animation */}
        <div className="mb-8 animate-pulse">
          <img
            src="/logo.png"
            alt="Vedda System"
            className="w-32 h-32 mx-auto object-contain"
          />
        </div>

        {/* Loading spinner */}
        <div className="flex justify-center mb-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-blue-200 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-blue-600 rounded-full animate-spin border-t-transparent absolute top-0 left-0"></div>
          </div>
        </div>

        {/* Loading text */}
        <p className="text-gray-700 text-lg font-medium">
          Loading Vedda System...
        </p>
        <p className="text-gray-500 text-sm mt-2">Please wait</p>
      </div>
    </div>
  );
};

export default LoadingScreen;
