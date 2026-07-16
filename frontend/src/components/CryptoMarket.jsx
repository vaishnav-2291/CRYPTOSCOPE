import { useEffect, useState } from "react";
import CryptoNews from "./CryptoNews";

function CryptoMarket() {

  const [market, setMarket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("");

  const fetchMarket = async () => {

    try {

      setLoading(true);

      const response = await fetch("/api/crypto/market");

      const data = await response.json();

      if (data.success) {

        setMarket(data.data);

        setLastUpdated(new Date().toLocaleTimeString());

      }

    } catch (err) {

      console.error(err);

    } finally {

      setLoading(false);

    }

  };

  useEffect(() => {

    fetchMarket();

    const interval = setInterval(fetchMarket, 30000);

    return () => clearInterval(interval);

  }, []);

  if (!market) {

    return (

      <div className="mt-20 text-center text-white">

        Loading Crypto Market...

      </div>

    );

  }

  const coins = [

    {

      name: "Bitcoin",

      symbol: "BTC",

      icon: "₿",

      data: market.bitcoin

    },

    {

      name: "Ethereum",

      symbol: "ETH",

      icon: "Ξ",

      data: market.ethereum

    },

    {

      name: "Solana",

      symbol: "SOL",

      icon: "◎",

      data: market.solana

    }

  ];

  return (

    <>

      <div className="mt-20">

        <div className="flex flex-col md:flex-row justify-between items-center mb-10">

          <h2 className="text-4xl font-bold text-white">

            📈 Live Crypto Market

          </h2>

          <div className="mt-4 md:mt-0 flex gap-4 items-center">

            <p className="text-gray-400 text-sm">

              Updated: {lastUpdated}

            </p>

            <button

              onClick={fetchMarket}

              className="
              px-5
              py-2
              rounded-xl
              bg-cyan-500
              hover:bg-cyan-400
              text-black
              font-bold
              "

            >

              {loading ? "Refreshing..." : "Refresh"}

            </button>

          </div>

        </div>

        <div className="grid md:grid-cols-3 gap-6">

          {coins.map((coin) => (

            <div

              key={coin.symbol}

              className="
              bg-white/5
              backdrop-blur-xl
              border
              border-white/10
              rounded-3xl
              p-6
              hover:border-cyan-400
              transition
              "

            >

              <div className="flex justify-between items-start">

                <div>

                  <h3 className="text-4xl">

                    {coin.icon}

                  </h3>

                  <h2 className="text-2xl font-bold text-white mt-3">

                    {coin.name}

                  </h2>

                  <p className="text-gray-400">

                    {coin.symbol}

                  </p>

                </div>

                <span

                  className={`
                  px-3
                  py-1
                  rounded-full
                  text-sm
                  font-bold
                  ${coin.data.usd_24h_change >= 0
                    ? "bg-green-500/20 text-green-400"
                    : "bg-red-500/20 text-red-400"}
                  `}

                >

                  {coin.data.usd_24h_change.toFixed(2)}%

                </span>

              </div>

              <div className="mt-8">

                <p className="text-gray-400">

                  Current Price

                </p>

                <h2 className="text-3xl font-bold text-cyan-400">

                  ${coin.data.usd.toLocaleString()}

                </h2>

              </div>

              <div className="mt-6 space-y-3">

                <div className="flex justify-between">

                  <span className="text-gray-400">

                    Market Cap

                  </span>

                  <span className="text-white font-semibold">

                    ${Math.round(
                      coin.data.usd_market_cap
                    ).toLocaleString()}

                  </span>

                </div>

                <div className="flex justify-between">

                  <span className="text-gray-400">

                    Volume

                  </span>

                  <span className="text-white font-semibold">

                    ${Math.round(
                      coin.data.usd_24h_vol
                    ).toLocaleString()}

                  </span>

                </div>

              </div>

            </div>

          ))}

        </div>

      </div>

      <CryptoNews />

    </>

  );

}

export default CryptoMarket;