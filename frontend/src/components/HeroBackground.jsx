function HeroBackground() {
  return (
    <>
      {/* Background */}
      <div className="absolute inset-0 -z-10 overflow-hidden">

        {/* Top Left Glow */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl"></div>

        {/* Bottom Right Glow */}
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl"></div>

        {/* Center Glow */}
        <div className="absolute top-1/2 left-1/2 w-[500px] h-[500px] -translate-x-1/2 -translate-y-1/2 bg-cyan-400/10 rounded-full blur-3xl"></div>

      </div>
    </>
  );
}

export default HeroBackground;