import { useState } from "react";

function WalletCompare() {


  const [walletA, setWalletA] = useState("");

  const [walletB, setWalletB] = useState("");

  const [result, setResult] = useState(null);

  const [loading, setLoading] = useState(false);





  const fetchWallet = async (address) => {


    const response = await fetch(`/api/wallet/${address}`, {


      headers: {

        Authorization: localStorage.getItem("token"),

      },


    });



    const data = await response.json();


    return data;


  };







  const compareWallets = async () => {


    if (!walletA || !walletB) {


      alert("Enter both wallet addresses");

      return;


    }





    try {


      setLoading(true);



      const dataA = await fetchWallet(walletA);


      const dataB = await fetchWallet(walletB);





      setResult({

        walletA: dataA,

        walletB: dataB

      });





    } catch(error) {


      console.error(error);

      alert("Wallet comparison failed");



    } finally {


      setLoading(false);


    }


  };









  const getBetterWallet = () => {


    if (!result) return "";



    if (
      result.walletA.riskScore <
      result.walletB.riskScore
    ) {


      return "Wallet A";

    }


    return "Wallet B";


  };







  return (



    <div
      className="
        mt-10
        bg-white/5
        backdrop-blur-xl
        border
        border-white/10
        rounded-3xl
        p-8
      "
    >





      <h2 className="
        text-3xl
        font-bold
        text-white
        text-center
      ">



        ⚖️ Wallet Comparison



      </h2>






      <p className="
        text-gray-400
        text-center
        mt-3
      ">



        Compare two wallets using AI risk analysis.



      </p>








      <div className="
        mt-8
        grid
        grid-cols-1
        md:grid-cols-2
        gap-5
      ">





        <input


          type="text"


          placeholder="Wallet A Address"


          value={walletA}


          onChange={(e)=>setWalletA(e.target.value)}



          className="
            px-5
            py-4
            rounded-xl
            bg-slate-900
            border
            border-cyan-400/30
            text-white
            outline-none
          "


        />







        <input


          type="text"


          placeholder="Wallet B Address"


          value={walletB}


          onChange={(e)=>setWalletB(e.target.value)}



          className="
            px-5
            py-4
            rounded-xl
            bg-slate-900
            border
            border-cyan-400/30
            text-white
            outline-none
          "


        />






      </div>








      <div className="flex justify-center mt-6">



        <button


          onClick={compareWallets}


          className="
            px-8
            py-4
            rounded-xl
            bg-cyan-500
            hover:bg-cyan-400
            text-black
            font-bold
          "



        >




          {loading
            ? "Comparing..."
            : "Compare Wallets"
          }





        </button>




      </div>









      {

        result && (



          <div className="
            mt-8
            grid
            grid-cols-1
            md:grid-cols-2
            gap-6
          ">







            <div className="
              bg-slate-900/50
              rounded-xl
              p-6
            ">



              <h3 className="
                text-xl
                text-cyan-400
                font-bold
              ">


                Wallet A


              </h3>




              <p className="text-gray-400 mt-3">


                Risk Score


              </p>



              <h2 className="
                text-4xl
                text-white
                font-bold
              ">


                {result.walletA.riskScore}/100



              </h2>




            </div>








            <div className="
              bg-slate-900/50
              rounded-xl
              p-6
            ">



              <h3 className="
                text-xl
                text-cyan-400
                font-bold
              ">


                Wallet B


              </h3>




              <p className="text-gray-400 mt-3">


                Risk Score


              </p>



              <h2 className="
                text-4xl
                text-white
                font-bold
              ">


                {result.walletB.riskScore}/100



              </h2>




            </div>







          </div>



        )


      }







      {

        result && (



          <div className="
            mt-8
            bg-green-500/10
            rounded-xl
            p-5
            text-center
          ">



            <h3 className="
              text-green-400
              font-bold
              text-xl
            ">



              Recommended Wallet



            </h3>




            <p className="
              text-white
              text-3xl
              font-bold
              mt-2
            ">



              {getBetterWallet()}



            </p>




          </div>



        )


      }







    </div>



  );


}



export default WalletCompare;