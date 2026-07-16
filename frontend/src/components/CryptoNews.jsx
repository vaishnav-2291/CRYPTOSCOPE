import { useEffect, useState } from "react";

function CryptoNews() {

  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNews = async () => {

    try {

      setLoading(true);

      const response = await fetch("/api/crypto/news");

      const data = await response.json();

      if (data.success) {

        setArticles(data.articles || []);

      }

    } catch (err) {

      console.error(err);

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

        ) : articles.length === 0 ? (

          <p className="text-red-400">

            No news available.

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

                        {article.source?.name}

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