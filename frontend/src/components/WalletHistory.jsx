import { useEffect, useState } from "react";

function WalletHistory() {

  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);


  useEffect(() => {

    fetchHistory();

  }, []);



  const fetchHistory = async () => {

    try {

      setLoading(true);


      const response = await fetch(
        "/api/wallet/history/all",
        {
          headers: {
            Authorization: localStorage.getItem("token"),
          },
        }
      );


      const data = await response.json();


      if(data.success){

        setHistory(data.history);

      }


    } catch(error){

      console.error(error);

    } finally {

      setLoading(false);

    }

  };




  const copyAddress = (address) => {

    navigator.clipboard.writeText(address);

    alert("Wallet Address Copied!");

  };




  const filteredHistory = history.filter((wallet)=>

    wallet.address
    .toLowerCase()
    .includes(search.toLowerCase())

  );




  return (

    <div className="mt-20">


      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-8">


        <h2 className="text-3xl font-bold text-white">

          Wallet Scan History

        </h2>



        <div className="flex gap-3">


          <input

            type="text"

            placeholder="Search Wallet Address..."

            value={search}

            onChange={(e)=>setSearch(e.target.value)}

            className="
              w-full
              md:w-80
              px-4
              py-3
              rounded-xl
              bg-slate-900
              border
              border-cyan-400/30
              text-white
              outline-none
            "

          />



          <button

            onClick={fetchHistory}

            className="
              px-5
              rounded-xl
              bg-cyan-500
              hover:bg-cyan-400
              text-black
              font-bold
            "

          >

            🔄

          </button>


        </div>


      </div>




      {loading ? (

        <div className="text-center text-cyan-400">

          Loading History...

        </div>


      ) : filteredHistory.length === 0 ? (


        <div className="
          bg-slate-900/50
          border
          border-white/10
          rounded-2xl
          p-8
          text-center
          text-gray-400
        ">

          No Wallet Scan History Found

        </div>


      ) : (


        <div className="overflow-x-auto rounded-2xl border border-white/10">


          <table className="w-full text-left">


            <thead className="bg-slate-900">


              <tr>

                <th className="p-4 text-cyan-400">
                  Wallet
                </th>

                <th className="p-4 text-cyan-400">
                  Risk
                </th>

                <th className="p-4 text-cyan-400">
                  Score
                </th>

                <th className="p-4 text-cyan-400">
                  Transactions
                </th>

                <th className="p-4 text-cyan-400">
                  Date
                </th>

                <th className="p-4 text-cyan-400">
                  Action
                </th>

              </tr>


            </thead>




            <tbody>


              {filteredHistory.map((wallet)=>(


                <tr

                  key={wallet._id}

                  className="
                    border-t
                    border-white/10
                    hover:bg-white/5
                    transition
                  "

                >


                  <td className="p-4 text-white font-mono">

                    {wallet.address.substring(0,12)}...
                    {wallet.address.substring(wallet.address.length-8)}

                  </td>



                  <td className="p-4">


                    <span

                      className={`px-3 py-1 rounded-full font-semibold text-sm

                      ${
                        wallet.riskLevel==="High"

                        ? "bg-red-500/20 text-red-400"

                        : wallet.riskLevel==="Medium"

                        ? "bg-yellow-500/20 text-yellow-400"

                        : "bg-green-500/20 text-green-400"

                      }

                      `}

                    >

                      {wallet.riskLevel}


                    </span>


                  </td>




                  <td className="p-4 text-white">

                    {wallet.riskScore}/100

                  </td>




                  <td className="p-4 text-white">

                    {wallet.transactions}

                  </td>




                  <td className="p-4 text-gray-300">

                    {new Date(wallet.createdAt)
                    .toLocaleString()}

                  </td>




                  <td className="p-4">


                    <button

                      onClick={()=>copyAddress(wallet.address)}

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

                      Copy

                    </button>


                  </td>


                </tr>


              ))}


            </tbody>


          </table>


        </div>


      )}



    </div>


  );

}


export default WalletHistory;