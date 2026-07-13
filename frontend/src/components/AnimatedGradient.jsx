function AnimatedGradient() {
  return (
    <div className="absolute inset-0 overflow-hidden -z-10">

      <div className="absolute top-[-200px] left-[-200px] w-[500px] h-[500px] bg-cyan-500/30 rounded-full blur-[120px] animate-pulse"></div>

      <div className="absolute bottom-[-200px] right-[-200px] w-[500px] h-[500px] bg-purple-600/30 rounded-full blur-[120px] animate-pulse"></div>

      <div className="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-blue-500/20 rounded-full blur-[100px] animate-pulse"></div>

    </div>
  );
}

export default AnimatedGradient;