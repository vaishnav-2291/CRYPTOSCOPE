import React from "react";


function Sidebar() {


  const menuItems = [

    {
      name: "Dashboard",
      link: "#stats",
      icon: "📊"
    },

    {
      name: "Wallet Analyzer",
      link: "#wallet",
      icon: "🔍"
    },

    {
      name: "Compare Wallet",
      link: "#compare",
      icon: "⚖️"
    },

    {
      name: "Threat Intelligence",
      link: "#threat",
      icon: "🧠"
    },

    {
      name: "SOC Center",
      link: "#soc",
      icon: "🛡️"
    },

    {
      name: "Wallet History",
      link: "#history",
      icon: "📜"
    },

    {
      name: "Market",
      link: "#market",
      icon: "📈"
    }

  ];





  return (



    <aside
      className="
        fixed
        left-5
        top-24
        w-64
        bg-slate-900/80
        backdrop-blur-xl
        border
        border-white/10
        rounded-2xl
        p-5
        hidden
        lg:block
        z-50
      "
    >






      <h2
        className="
          text-2xl
          font-bold
          text-cyan-400
          text-center
          mb-8
        "
      >


        🚀 CryptoScope AI


      </h2>









      <div className="space-y-3">





        {


          menuItems.map((item,index)=>(



            <a

              key={index}

              href={item.link}

              className="
                flex
                items-center
                gap-3
                px-4
                py-3
                rounded-xl
                text-gray-300
                hover:bg-cyan-500/20
                hover:text-cyan-400
                transition
              "

            >



              <span className="text-xl">

                {item.icon}

              </span>




              <span>


                {item.name}


              </span>




            </a>



          ))



        }





      </div>






    </aside>



  );


}



export default Sidebar;