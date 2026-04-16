const LoadingScreen = ({ message = "Loading Vedda Heritage..." }) => {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{
        background:
          "linear-gradient(160deg, #13100a 0%, #1a140b 60%, #0f0d07 100%)",
      }}
    >
      {/* Subtle ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 40%, rgba(154,111,42,0.08) 0%, transparent 70%)",
        }}
      />

      <div className="text-center relative z-10">
        {/* Logo with pulse animation */}
        <div className="mb-8 animate-pulse">
          <img
            src="/logo.png"
            alt="Vedda Heritage"
            className="w-32 h-32 mx-auto object-contain"
            style={{ filter: "drop-shadow(0 0 18px rgba(200,165,90,0.30))" }}
          />
        </div>

        {/* Loading spinner */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div
              className="w-16 h-16 rounded-full"
              style={{ border: "4px solid rgba(200,165,90,0.15)" }}
            />
            <div
              className="w-16 h-16 rounded-full animate-spin absolute top-0 left-0"
              style={{
                border: "4px solid transparent",
                borderTopColor: "rgba(212,180,131,0.85)",
                borderRightColor: "rgba(200,165,90,0.35)",
              }}
            />
          </div>
        </div>

        {/* Loading text */}
        <p className="text-lg font-medium" style={{ color: "#f5e9c8" }}>
          {message}
        </p>
        <p className="text-sm mt-2" style={{ color: "rgba(212,180,131,0.55)" }}>
          Please wait
        </p>
      </div>
    </div>
  );
};

export default LoadingScreen;
