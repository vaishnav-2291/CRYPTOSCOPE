function CryptoStats() {
  const stats = [
    {
      title: "Wallets Analyzed",
      value: "50K+",
      icon: "🔍",
    },
    {
      title: "Risk Reports",
      value: "120K+",
      icon: "📊",
    },
    {
      title: "Threats Detected",
      value: "8K+",
      icon: "🛡️",
    },
    {
      title: "AI Accuracy",
      value: "98.7%",
      icon: "🤖",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-20">

      {stats.map((item, index) => (
        <div
          key={index}
          className="
            bg-white/5
            backdrop-blur-xl
            border border-white/10
            rounded-2xl
            p-6
            hover:border-cyan-400/50
            hover:-translate-y-2
            transition-all
            duration-300
          "
        >

          <div className="text-4xl">
            {item.icon}
          </div>

          <h3 className="text-gray-400 mt-5">
            {item.title}
          </h3>

          <p className="text-3xl font-bold text-white mt-2">
            {item.value}
          </p>

        </div>
      ))}

    </div>
  );
}

export default CryptoStats;