import { useEffect, useState } from "react";


function History() {


    const [history, setHistory] = useState([]);

    const [loading, setLoading] = useState(true);





    useEffect(() => {

        fetchHistory();

    }, []);






    const fetchHistory = async () => {


        try {


            const response = await fetch(

                "/api/wallet/history",

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


        }


        catch(error){


            console.error(error);


        }


        finally{


            setLoading(false);


        }


    };







    const getRiskColor = (level) => {


        if(level === "High"){

            return "text-red-400";

        }


        if(level === "Medium"){

            return "text-yellow-400";

        }


        return "text-green-400";


    };







    return (


        <div className="min-h-screen bg-slate-950 p-8">



            <div className="max-w-6xl mx-auto">





                <h1 className="text-4xl font-bold text-white text-center mb-10">

                    📜 Wallet Scan History

                </h1>






                {
                    loading ?


                    (

                        <p className="text-center text-gray-400">

                            Loading history...

                        </p>

                    )


                    :


                    history.length === 0 ?


                    (

                        <p className="text-center text-gray-400">

                            No wallet scans found.

                        </p>

                    )


                    :


                    (

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">



                            {
                                history.map((wallet,index)=>(



                                    <div

                                        key={index}

                                        className="
                                            bg-white/5
                                            backdrop-blur-xl
                                            border
                                            border-white/10
                                            rounded-2xl
                                            p-6
                                        "

                                    >



                                        <h2 className="text-xl font-bold text-cyan-400">

                                            Wallet Address

                                        </h2>



                                        <p className="text-gray-300 break-all mt-2">

                                            {wallet.address}

                                        </p>






                                        <div className="grid grid-cols-2 gap-4 mt-5">



                                            <div className="bg-black/20 rounded-xl p-4">


                                                <p className="text-gray-400">

                                                    Risk Score

                                                </p>


                                                <h3 className="text-2xl font-bold text-white">

                                                    {wallet.riskScore}/100

                                                </h3>


                                            </div>






                                            <div className="bg-black/20 rounded-xl p-4">


                                                <p className="text-gray-400">

                                                    Risk Level

                                                </p>


                                                <h3 className={`text-2xl font-bold ${getRiskColor(wallet.riskLevel)}`}>

                                                    {wallet.riskLevel}

                                                </h3>


                                            </div>



                                        </div>






                                        <p className="text-gray-400 mt-5">

                                            Scanned On:

                                            {" "}

                                            {new Date(wallet.createdAt).toLocaleDateString()}

                                        </p>





                                    </div>



                                ))
                            }



                        </div>

                    )

                }





            </div>


        </div>


    );


}



export default History;