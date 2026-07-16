import React from "react";


function AILoader({ message = "AI Engine Processing..." }) {


  const steps = [

    "Scanning blockchain data",

    "Analyzing wallet transactions",

    "Calculating risk score",

    "Generating security report"

  ];




  return (



    <div
      className="
        flex
        flex-col
        items-center
        justify-center
        py-10
      "
    >





      <div
        className="
          w-20
          h-20
          border-4
          border-cyan-400/30
          border-t-cyan-400
          rounded-full
          animate-spin
        "
      >


      </div>








      <h2
        className="
          mt-6
          text-2xl
          font-bold
          text-cyan-400
        "
      >


        {message}


      </h2>








      <div
        className="
          mt-6
          space-y-3
          text-center
        "
      >



        {


          steps.map((step,index)=>(


            <p

              key={index}

              className="
                text-gray-400
              "

            >


              ✓ {step}


            </p>



          ))



        }





      </div>







    </div>



  );


}



export default AILoader;