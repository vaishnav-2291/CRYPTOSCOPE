import React from "react";


function FeaturesSection() {


  const features = [


    {
      icon: "🔐",
      title: "Blockchain Security Analysis",
      description:
        "Analyze wallet behaviour, transactions and blockchain activity to identify security risks."
    },


    {
      icon: "🧠",
      title: "AI Risk Detection",
      description:
        "Machine learning based risk scoring helps detect suspicious wallet patterns."
    },


    {
      icon: "📊",
      title: "Real-Time Market Intelligence",
      description:
        "Track cryptocurrency market data and latest blockchain updates."
    },


    {
      icon: "🛡️",
      title: "SOC Monitoring",
      description:
        "Security Operations Center dashboard for threat monitoring and alerts."
    },


    {
      icon: "📄",
      title: "Automated Security Reports",
      description:
        "Generate professional wallet risk analysis reports instantly."
    },


    {
      icon: "⚡",
      title: "Fast AI Processing",
      description:
        "Get wallet insights with optimized blockchain data processing."
    }


  ];






  return (



    <section
      className="
        mt-24
        bg-white/5
        backdrop-blur-xl
        border
        border-white/10
        rounded-3xl
        p-8
      "
    >





      <h2
        className="
          text-4xl
          font-bold
          text-white
          text-center
        "
      >


        🚀 Why CryptoScope AI?


      </h2>







      <p
        className="
          text-gray-400
          text-center
          mt-4
          max-w-3xl
          mx-auto
        "
      >


        Advanced blockchain intelligence platform combining AI,
        cybersecurity and real-time analytics.


      </p>








      <div
        className="
          mt-10
          grid
          grid-cols-1
          md:grid-cols-3
          gap-6
        "
      >





        {


          features.map((feature,index)=>(


            <div

              key={index}

              className="
                bg-slate-900/50
                rounded-2xl
                p-6
                hover:border
                hover:border-cyan-400/40
                transition
              "

            >



              <div className="text-4xl">


                {feature.icon}



              </div>






              <h3
                className="
                  mt-5
                  text-xl
                  font-bold
                  text-cyan-400
                "
              >


                {feature.title}


              </h3>






              <p
                className="
                  mt-3
                  text-gray-400
                "
              >


                {feature.description}


              </p>





            </div>



          ))



        }






      </div>







    </section>



  );


}



export default FeaturesSection;