document.addEventListener("DOMContentLoaded", () => {


    const button = document.getElementById("analyzeBtn");

    const walletInput = document.getElementById("walletAddress");

    const loading = document.getElementById("loading");

    const result = document.getElementById("result");

    const chartSection = document.getElementById("chartSection");

    let walletChart;




    button.addEventListener("click", async () => {



        const token = localStorage.getItem("token");



        if(!token){


            alert("Please login first");


            window.location.href="/auth";


            return;


        }





        const wallet = walletInput.value.trim();




        if(wallet === ""){


            alert("Enter Bitcoin Wallet Address");


            return;


        }






        loading.classList.remove("d-none");


        result.innerHTML="";





        try{


            const response = await fetch(`/api/wallet/${wallet}`, {



                method:"GET",



                headers:{



                    "Authorization": token



                }



            });






            const data = await response.json();




            loading.classList.add("d-none");






            if(response.status !== 200){



                result.innerHTML = `

                <div class="alert alert-danger">

                ${data.message || data.error}

                </div>

                `;


                return;


            }






            displayResult(data);



            createChart(data);




        }



        catch(error){



            console.log(error);



            loading.classList.add("d-none");



            result.innerHTML = `

            <div class="alert alert-danger">

            Server Error

            </div>

            `;



        }




    });







    function displayResult(data){



        result.innerHTML = `




        <div class="dashboard">





        <div class="card-box">


        <h5>Wallet Address</h5>


        <h6>${data.address}</h6>


        </div>






        <div class="card-box">


        <h5>Total Transactions</h5>


        <h2>${data.n_tx}</h2>


        </div>






        <div class="card-box">


        <h5>Balance</h5>


        <h2>${data.balance} Satoshi</h2>


        </div>







        <div class="card-box">


        <h5>Total Received</h5>


        <h2>${data.total_received}</h2>


        </div>







        <div class="card-box">


        <h5>Total Sent</h5>


        <h2>${data.total_sent}</h2>


        </div>






        <div class="card-box">


        <h5>Risk Level</h5>


        <h2>

        ${data.riskLevel || "Medium"}

        </h2>


        </div>





        </div>






        <div class="glass-card mt-4">


        <h3>

        🤖 AI Security Report

        </h3>



        <p>

        ${data.aiReport || 
        "Wallet activity analysed successfully"}

        </p>



        </div>






        <div class="table-section mt-4">


        <h3>

        Recent Transactions

        </h3>





        <table class="table table-dark">


        <thead>


        <tr>


        <th>Transaction ID</th>


        <th>Value</th>


        </tr>


        </thead>



        <tbody>



        ${

        data.txrefs ?

        data.txrefs.slice(0,5).map(tx=>`


        <tr>


        <td>

        ${tx.tx_hash.substring(0,25)}...

        </td>



        <td>

        ${tx.value} Satoshi

        </td>


        </tr>



        `).join("")

        :

        `

        <tr>

        <td colspan="2">

        No Transactions Found

        </td>

        </tr>

        `


        }



        </tbody>



        </table>


        </div>




        `;



    }









    function createChart(data){



        chartSection.classList.remove("d-none");



        const ctx = document
        .getElementById("walletChart");




        if(walletChart){


            walletChart.destroy();


        }






        walletChart = new Chart(ctx, {



            type:"bar",



            data:{



                labels:[

                    "Received",

                    "Sent",

                    "Transactions"

                ],



                datasets:[{




                    label:"Wallet Analytics",




                    data:[



                        data.total_received || 0,



                        data.total_sent || 0,



                        data.n_tx || 0



                    ]



                }]



            },



            options:{



                responsive:true



            }



        });




    }





});