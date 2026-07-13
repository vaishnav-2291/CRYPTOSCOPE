import { useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function WalletAnalyzer() {

  const [wallet, setWallet] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);


  const analyzeWallet = async () => {

    if (!wallet) {

      alert("Enter wallet address");
      return;

    }


    try {

      setLoading(true);


      const response = await fetch(`/api/wallet/${wallet}`, {

        headers: {

          Authorization: localStorage.getItem("token"),

        },

      });



      const data = await response.json();


      console.log("Response:", data);



      if (!response.ok) {

        alert(data.error || "Request Failed");
        return;

      }


      setResult(data);



    } catch(error) {

      console.error(error);
      alert("Wallet analysis failed");


    } finally {

      setLoading(false);

    }

  };





  const downloadPDF = () => {


    if(!result){

      alert("Analyze a wallet first!");
      return;

    }



    const doc = new jsPDF();



    doc.setFontSize(22);

    doc.text("CryptoScope AI",14,20);



    doc.setFontSize(16);

    doc.text(
      "Wallet Risk Analysis Report",
      14,
      32
    );



    autoTable(doc,{

      startY:50,

      head:[["Field","Value"]],

      body:[

        ["Wallet Address",wallet],

        ["Risk Score",`${result.riskScore}/100`],

        ["Risk Level",result.riskLevel],

        ["Transactions",result.transactionCount],

        ["Security",result.security],

      ]

    });



    doc.save("Wallet_Risk_Report.pdf");


  };






  return (

    <div className="mt-24 max-w-6xl mx-auto">


      <div className="
        bg-white/5
        backdrop-blur-xl
        border
        border-white/10
        rounded-3xl
        p-8
      ">



        <h2 className="text-3xl font-bold text-white text-center">

          Analyze Wallet Address

        </h2>




        <p className="text-gray-400 text-center mt-3">

          Enter blockchain wallet address and get AI-powered risk analysis.

        </p>





        <div className="mt-8 flex flex-col md:flex-row gap-4">



          <input

            type="text"

            value={wallet}

            onChange={(e)=>setWallet(e.target.value)}

            placeholder="Enter BTC Wallet Address..."

            className="
              flex-1
              px-6
              py-4
              rounded-xl
              bg-slate-900
              border
              border-cyan-400/30
              text-white
              outline-none
            "

          />



          <button

            onClick={analyzeWallet}

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

            {loading ? "Analyzing..." : "Analyze"}

          </button>



        </div>







        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-10">



          <div className="bg-slate-900/50 rounded-xl p-5">

            <p className="text-gray-400">
              Risk Score
            </p>


            <h2 className="text-3xl font-bold text-yellow-400">

              {result?.riskScore ?? 0}/100

            </h2>


          </div>





          <div className="bg-slate-900/50 rounded-xl p-5">


            <p className="text-gray-400">
              Transactions
            </p>


            <h2 className="text-3xl font-bold text-white">

              {result?.transactionCount ?? 0}

            </h2>


          </div>






          <div className="bg-slate-900/50 rounded-xl p-5">


            <p className="text-gray-400">
              Security
            </p>


            <h2 className="text-3xl font-bold text-cyan-400">

              {result?.security ?? "Normal"}

            </h2>


          </div>



        </div>








        {/* AI RISK ANALYSIS */}



        {result && (


          <div className="
            mt-8
            bg-slate-900/50
            border
            border-cyan-500/20
            rounded-xl
            p-6
          ">



            <h3 className="text-xl font-bold text-cyan-400">

              🤖 AI Risk Analysis

            </h3>





            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">


              <div className="bg-black/20 rounded-xl p-5">

                <p className="text-gray-400">
                  Risk Level
                </p>


                <h2 className="text-3xl font-bold text-red-400">

                  {result.riskLevel}

                </h2>


              </div>





              <div className="bg-black/20 rounded-xl p-5">


                <p className="text-gray-400">
                  Score
                </p>


                <h2 className="text-3xl font-bold text-white">

                  {result.riskScore}/100

                </h2>


              </div>



            </div>





            <h4 className="text-white font-bold mt-6">

              Detected Factors

            </h4>





            {

              result.riskFactors?.length > 0 ?


              (

                <div className="mt-3 space-y-2">


                  {result.riskFactors.map((factor,index)=>(


                    <div

                      key={index}

                      className="
                        bg-white/5
                        rounded-lg
                        p-3
                        text-gray-300
                      "

                    >

                      ⚠️ {factor}

                    </div>


                  ))}


                </div>


              )


              :

              (

                <p className="text-gray-400 mt-3">

                  No suspicious activity detected.

                </p>

              )


            }






            <div className="
              mt-6
              bg-cyan-500/10
              rounded-xl
              p-4
            ">


              <h4 className="text-cyan-400 font-bold">

                AI Report

              </h4>


              <p className="text-gray-300 mt-2">

                {result.aiReport}

              </p>


            </div>




          </div>


        )}







        {result && (


          <div className="mt-8 flex justify-center">


            <button

              onClick={downloadPDF}

              className="
                px-8
                py-4
                rounded-xl
                bg-green-500
                hover:bg-green-400
                text-white
                font-bold
              "

            >

              📄 Download PDF Report

            </button>


          </div>


        )}







      </div>


    </div>

  );

}


export default WalletAnalyzer;