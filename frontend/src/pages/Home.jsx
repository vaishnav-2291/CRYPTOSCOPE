import Navbar from "../components/Navbar";
import HeroBackground from "../components/HeroBackground";
import AnimatedGradient from "../components/AnimatedGradient";
import MotionWrapper from "../components/MotionWrapper";

import CryptoStats from "../components/CryptoStats";
import DashboardStats from "../components/DashboardStats";
import CryptoMarket from "../components/CryptoMarket";
import WalletAnalyzer from "../components/WalletAnalyzer";
import WalletHistory from "../components/WalletHistory";

function Home() {
  return (
    <section
      id="home"
      className="relative min-h-screen bg-slate-950 px-6 overflow-hidden"
    >
      <Navbar />

      <HeroBackground />
      <AnimatedGradient />

      <div className="max-w-7xl mx-auto pt-32 text-center relative z-10">

        {/* Hero Section */}

        <MotionWrapper delay={0.2}>
          <span className="inline-block px-5 py-2 rounded-full bg-cyan-500/10 border border-cyan-400/40 text-cyan-400 text-sm">
            AI Powered Blockchain Intelligence
          </span>
        </MotionWrapper>


        <MotionWrapper delay={0.4}>
          <h1 className="mt-8 text-6xl md:text-7xl font-bold text-white leading-tight">
            Analyze
            <span className="text-cyan-400"> Crypto Wallets </span>
            with AI
          </h1>
        </MotionWrapper>


        <MotionWrapper delay={0.6}>
          <p className="mt-8 text-xl text-gray-400 max-w-3xl mx-auto">
            Detect suspicious transactions, calculate wallet risk scores,
            visualize blockchain intelligence and generate enterprise
            security reports using AI.
          </p>
        </MotionWrapper>


        <MotionWrapper delay={0.8}>
          <div className="mt-12 flex flex-col md:flex-row justify-center gap-6">

            <a href="#wallet">
              <button className="px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl transition shadow-lg shadow-cyan-500/30">
                Analyze Wallet
              </button>
            </a>


            <a href="#market">
              <button className="px-8 py-4 border border-cyan-400 text-cyan-400 hover:bg-cyan-400 hover:text-black rounded-xl transition">
                Live Market
              </button>
            </a>

          </div>
        </MotionWrapper>



        {/* Platform Stats */}

        <div id="stats" className="mt-24">

          <MotionWrapper delay={1}>
            <CryptoStats />
          </MotionWrapper>

        </div>



        {/* Dashboard */}

        <MotionWrapper delay={1.1}>
          <DashboardStats />
        </MotionWrapper>



        {/* Live Market */}

        <div id="market">

          <MotionWrapper delay={1.3}>
            <CryptoMarket />
          </MotionWrapper>

        </div>



        {/* Wallet Analyzer */}

        <div id="wallet">

          <MotionWrapper delay={1.4}>
            <WalletAnalyzer />
          </MotionWrapper>

        </div>



        {/* Wallet History */}

        <MotionWrapper delay={1.5}>
          <WalletHistory />
        </MotionWrapper>


      </div>
    </section>
  );
}

export default Home;