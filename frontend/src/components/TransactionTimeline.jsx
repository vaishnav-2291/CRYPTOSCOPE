import React from "react";

function TransactionTimeline({ transactions = [] }) {


  const getRisk = (index) => {


    if (index % 3 === 0) {

      return {
        level: "High",
        color: "text-red-400",
        dot: "🔴"
      };

    }


    if (index % 2 === 0) {

      return {
        level: "Medium",
        color: "text-yellow-400",
        dot: "🟡"
      };

    }


    return {

      level: "Low",
      color: "text-green-400",
      dot: "🟢"

    };


  };




  return (


    <div
      className="
        bg-slate-900/40
        border
        border-cyan-500/20
        rounded-2xl
        p-6
      "
    >



      <h3 className="
        text-2xl
        font-bold
        text-cyan-400
        mb-6
      ">


        📈 Transaction Risk Timeline


      </h3>





      {

        transactions.length > 0 ?



        (


          <div className="space-y-5">


            {

              transactions.slice(0,5).map((tx,index)=>{


                const risk = getRisk(index);


                return (



                  <div
                    key={index}
                    className="
                      flex
                      items-center
                      gap-4
                      bg-white/5
                      rounded-xl
                      p-4
                    "
                  >



                    <div className="text-2xl">


                      {risk.dot}



                    </div>




                    <div className="flex-1">



                      <p className="text-gray-400 text-sm">


                        Transaction


                      </p>




                      <p className="text-white font-semibold">


                        {tx.hash
                          ? tx.hash.slice(0,18) + "..."
                          : "Unknown Transaction"
                        }



                      </p>




                    </div>





                    <div>


                      <p className="text-gray-400 text-sm">


                        Risk



                      </p>



                      <p className={`font-bold ${risk.color}`}>



                        {risk.level}



                      </p>




                    </div>




                  </div>



                );


              })


            }



          </div>



        )



        :



        (



          <p className="text-gray-400">


            No transaction history available.



          </p>



        )



      }




    </div>



  );


}



export default TransactionTimeline;