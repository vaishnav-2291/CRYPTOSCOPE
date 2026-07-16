import { useEffect, useState } from "react";

function CryptoNews() {

  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  const fallbackNews = [

    {
      title: "Bitcoin Adoption Continues to Grow",
      description:
        "Global adoption of Bitcoin continues to increase as institutions and businesses expand cryptocurrency services.",
      source: { name: "CryptoScope AI" },
      url: "https://bitcoin.org",
      image: "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=1200"
    },

    {
      title: "Blockchain Security Remains a Top Priority",
      description:
        "Security experts recommend monitoring wallet activity and enabling strong authentication to reduce crypto fraud.",
      source: { name: "CryptoScope AI" },
      url: "https://ethereum.org",
      image: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1200"
    },

    {
      title: "AI Improves Fraud Detection in Crypto",
      description:
        "Artificial Intelligence is increasingly being used to detect suspicious blockchain transactions and wallet behaviour.",
      source: { name: "CryptoScope AI" },
      url: "https://solana.com",
      image: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=1200"
    },

    {
      title: "Crypto Exchanges Strengthen Security",
      description:
        "Major exchanges continue investing in security infrastructure to protect users from phishing and cyber attacks.",
      source: { name: "CryptoScope AI" },
      url: "https://www.binance.com",
      image: "https://images.unsplash.com/photo-1640161704729-cbe966a08476?w=1200"
    },

    {
      title: "Wallet Monitoring Helps Prevent Fraud",
      description:
        "Continuous wallet monitoring enables early detection of abnormal transaction patterns and suspicious fund movement.",
      source: { name: "CryptoScope AI" },
      url: "https://www.coinbase.com",
      image: "https://images.unsplash.com/photo-1621504450181-5d356f61d307?w=1200"
    },

    {
      title: "Cybersecurity is Essential for Web3",
      description:
        "As Web3 adoption grows, blockchain intelligence and AI-driven threat detection become increasingly important.",
      source: { name: "CryptoScope AI" },
      url: "https://consensys.io",
      image: "https://images.unsplash.com/photo-1639322537228-f710d846310a?w=1200"
    }

  ];

  const fetchNews = async () => {

    try {

      setLoading(true);

      const response = await fetch("/api/crypto/news");

      const data = await response.json();

      if (response.ok && data.success && data.articles?.length > 0) {

        setArticles(data.articles);

      } else {

        setArticles(fallbackNews);

      }

    } catch (err) {

      console.error("Crypto News Error:", err);

      setArticles(fallbackNews);

    } finally {

      setLoading(false);

    }

  };

  useEffect(() => {

    fetchNews();

    const interval = setInterval(fetchNews, 60000);

    return () => clearInterval(interval);

  }, []);

  return (

    <div className="mt-20">

      <div className="flex items-center justify-between mb-8">

        <h2 className="text-4xl font-bold text-white">

          📰 Live Crypto News

        </h2>

      </div>

      {

        loading ? (

          <p className="text-gray-400">

            Loading latest news...

          </p>

        ) : (

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

            {

              articles.map((article, index) => (

                <div
                  key={index}
                  className="
                    bg-white/5
                    backdrop-blur-xl
                    border
                    border-white/10
                    rounded-2xl
                    overflow-hidden
                    hover:border-cyan-400
                    transition
                  "
                >

                  {

                    article.image && (

                      <img
                        src={article.image}
                        alt={article.title}
                        className="w-full h-52 object-cover"
                      />

                    )

                  }

                  <div className="p-5">

                    <h3 className="text-white text-lg font-bold line-clamp-2">

                      {article.title}

                    </h3>

                    <p className="text-gray-400 mt-3 line-clamp-3">

                      {article.description}

                    </p>

                    <div className="mt-5 flex justify-between items-center">

                      <span className="text-cyan-400 text-sm">

                        {article.source?.name || "CryptoScope AI"}

                      </span>

                      <a
                        href={article.url}
                        target="_blank"
                        rel="noreferrer"
                        className="
                          px-4
                          py-2
                          rounded-lg
                          bg-cyan-500
                          hover:bg-cyan-400
                          text-black
                          font-semibold
                        "
                      >

                        Read More

                      </a>

                    </div>

                  </div>

                </div>

              ))

            }

          </div>

        )

      }

    </div>

  );

}

export default CryptoNews;