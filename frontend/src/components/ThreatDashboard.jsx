import { useEffect, useState } from "react";


function ThreatDashboard() {


    const [stats, setStats] = useState({

        totalScans: 0,

        highRiskWallets: 0,

        mediumRiskWallets: 0,

        lowRiskWallets: 0,

        averageRiskScore: 0,

        totalTransactions: 0

    });


    const [loading, setLoading] = useState(true);





    useEffect(()=>{


        fetchThreatStats();


    }, []);






    const fetchThreatStats = async()=>{


        try{


            const response = await fetch(

                "/api/wallet/dashboard/stats",

                {

                    headers: {

                        Authorization: localStorage.getItem("token")

                    }

                }

            );



            const data = await response.json();



            if(data.success){

                setStats(data);

            }



        }

        catch(error){


            console.error(error);


        }

        finally{


            setLoading(false);


        }


    };









    const total = stats.totalScans || 1;




    const highPercentage = Math.round(

        (stats.highRiskWallets / total) * 100

    );



    const mediumPercentage = Math.round(

        (stats.mediumRiskWallets / total) * 100

    );



    const lowPercentage = Math.round(

        (stats.lowRiskWallets / total) * 100

    );







    const threatCards = [


        {

            title:"Wallets Analyzed",

            value:stats.totalScans,

            icon:"🔍"

        },


        {

            title:"High Risk Wallets",

            value:stats.highRiskWallets,

            icon:"🚨"

        },


        {

            title:"Suspicious Activities",

            value:stats.highRiskWallets + stats.mediumRiskWallets,

            icon:"⚠️"

        },


        {

            title:"AI Risk Score",

            value:`${stats.averageRiskScore}/100`,

            icon:"🤖"

        }


    ];







    const threats = [


        "Suspicious Transaction Patterns",

        "High Volume Fund Movement",

        "Unknown Address Interaction",

        "Abnormal Wallet Behaviour"


    ];








    if(loading){


        return (

            <div className="text-center text-cyan-400 mt-10">

                Loading Threat Intelligence...

            </div>

        );


    }







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





            <h2

            className="
            text-3xl
            font-bold
            text-white
            text-center
            "

            >

                🧠 AI Threat Intelligence Dashboard


            </h2>





            <p

            className="
            text-gray-400
            text-center
            mt-3
            "

            >

                Blockchain security insights generated using AI risk analysis.

            </p>








            <div

            className="
            mt-8
            grid
            grid-cols-1
            md:grid-cols-4
            gap-5
            "

            >



            {

            threatCards.map((item,index)=>(


                <div

                key={index}

                className="
                bg-slate-900/50
                rounded-xl
                p-5
                "

                >



                    <p className="text-3xl">

                        {item.icon}

                    </p>



                    <p className="text-gray-400 mt-3">

                        {item.title}

                    </p>




                    <h3

                    className="
                    text-3xl
                    font-bold
                    text-cyan-400
                    mt-2
                    "

                    >

                        {item.value}

                    </h3>



                </div>



            ))


            }



            </div>









            <div

            className="
            mt-8
            grid
            grid-cols-1
            md:grid-cols-2
            gap-6
            "

            >







            <div

            className="
            bg-slate-900/50
            rounded-xl
            p-6
            "

            >



                <h3

                className="
                text-xl
                font-bold
                text-cyan-400
                "

                >

                    ⚠️ Common Threats


                </h3>





                <div className="mt-4 space-y-3">



                {

                threats.map((threat,index)=>(


                    <div

                    key={index}

                    className="
                    bg-white/5
                    rounded-lg
                    p-3
                    text-gray-300
                    "

                    >

                        ⚠️ {threat}


                    </div>


                ))


                }


                </div>



            </div>









            <div

            className="
            bg-slate-900/50
            rounded-xl
            p-6
            "

            >



                <h3

                className="
                text-xl
                font-bold
                text-cyan-400
                "

                >

                    📊 Risk Distribution


                </h3>








                <div className="mt-5 space-y-5">







                <div>

                    <p className="text-gray-300">

                        Low Risk - {lowPercentage}%

                    </p>


                    <div className="h-3 bg-green-500/20 rounded-full mt-2">

                        <div

                        className="
                        h-3
                        bg-green-500
                        rounded-full
                        "

                        style={{

                            width:`${lowPercentage}%`

                        }}

                        />


                    </div>


                </div>









                <div>

                    <p className="text-gray-300">

                        Medium Risk - {mediumPercentage}%

                    </p>



                    <div className="h-3 bg-yellow-500/20 rounded-full mt-2">

                        <div

                        className="
                        h-3
                        bg-yellow-500
                        rounded-full
                        "

                        style={{

                            width:`${mediumPercentage}%`

                        }}

                        />

                    </div>


                </div>









                <div>

                    <p className="text-gray-300">

                        High Risk - {highPercentage}%

                    </p>



                    <div className="h-3 bg-red-500/20 rounded-full mt-2">


                        <div

                        className="
                        h-3
                        bg-red-500
                        rounded-full
                        "

                        style={{

                            width:`${highPercentage}%`

                        }}

                        />


                    </div>


                </div>







                </div>





            </div>







            </div>







        </div>


    );


}



export default ThreatDashboard;