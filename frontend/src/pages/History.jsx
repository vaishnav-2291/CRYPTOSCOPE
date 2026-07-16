import { useEffect, useState } from "react";


function History() {


    const [history, setHistory] = useState([]);

    const [loading, setLoading] = useState(true);

    const [error, setError] = useState("");






    useEffect(() => {

        fetchHistory();

    }, []);








    const fetchHistory = async () => {


        try {


            setLoading(true);

            setError("");



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

            else{


                setError(data.error || "Failed to load history");


            }



        }


        catch(error){


            console.error("History Error:", error);


            setError("Unable to fetch wallet history");


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









    const formatDate = (date)=>{


        if(!date){


            return "Unknown";


        }



        return new Date(date).toLocaleString();


    };









    return (



        <div className="min-h-screen bg-slate-950 p-8">





            <div className="max-w-6xl mx-auto">







                <div className="flex justify-between items-center mb-10">



                    <h1 className="
                        text-4xl
                        font-bold
                        text-white
                    ">

                        📜 Wallet Scan History

                    </h1>





                    <button

                        onClick={fetchHistory}

                        className="
                            px-5
                            py-3
                            rounded-xl
                            bg-cyan-500
                            hover:bg-cyan-400
                            text-black
                            font-bold
                        "

                    >

                        🔄 Refresh


                    </button>



                </div>









                {

                    loading ?



                    (


                        <p className="
                            text-center
                            text-cyan-400
                            mt-10
                        ">


                            Loading wallet history...


                        </p>


                    )



                    :



                    error ?



                    (


                        <p className="
                            text-center
                            text-red-400
                            mt-10
                        ">


                            {error}


                        </p>


                    )



                    :



                    history.length === 0 ?



                    (


                        <p className="
                            text-center
                            text-gray-400
                            mt-10
                        ">


                            No wallet scans found.


                        </p>


                    )



                    :



                    (



                        <div className="
                            grid
                            grid-cols-1
                            md:grid-cols-2
                            gap-6
                        ">



                            {


                                history.map((wallet,index)=>(



                                    <div

                                        key={wallet._id || index}

                                        className="
                                            bg-white/5
                                            backdrop-blur-xl
                                            border
                                            border-white/10
                                            rounded-2xl
                                            p-6
                                        "

                                    >







                                        <h2 className="
                                            text-xl
                                            font-bold
                                            text-cyan-400
                                        ">


                                            Wallet Address


                                        </h2>







                                        <p className="
                                            text-gray-300
                                            break-all
                                            mt-2
                                        ">


                                            {wallet.address}


                                        </p>









                                        <div className="
                                            grid
                                            grid-cols-2
                                            gap-4
                                            mt-5
                                        ">







                                            <div className="
                                                bg-black/20
                                                rounded-xl
                                                p-4
                                            ">


                                                <p className="
                                                    text-gray-400
                                                ">


                                                    Risk Score


                                                </p>




                                                <h3 className="
                                                    text-2xl
                                                    font-bold
                                                    text-white
                                                ">


                                                    {wallet.riskScore}/100


                                                </h3>




                                            </div>









                                            <div className="
                                                bg-black/20
                                                rounded-xl
                                                p-4
                                            ">


                                                <p className="
                                                    text-gray-400
                                                ">


                                                    Risk Level


                                                </p>




                                                <h3 className={`
                                                    text-2xl
                                                    font-bold
                                                    ${getRiskColor(wallet.riskLevel)}
                                                `}>


                                                    {wallet.riskLevel}


                                                </h3>




                                            </div>







                                        </div>









                                        <div className="
                                            mt-5
                                            bg-cyan-500/10
                                            rounded-xl
                                            p-4
                                        ">



                                            <p className="
                                                text-gray-400
                                            ">


                                                Transactions


                                            </p>



                                            <p className="
                                                text-white
                                                font-bold
                                                text-xl
                                            ">


                                                {wallet.transactions}


                                            </p>



                                        </div>









                                        <p className="
                                            text-gray-400
                                            mt-5
                                        ">


                                            Scanned On:

                                            {" "}

                                            {formatDate(wallet.createdAt)}


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