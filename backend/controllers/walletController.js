const Wallet = require("../models/walletModel");
const { getWalletData } = require("../services/blockcypherService");
const { calculateRisk } = require("../services/riskEngine");


// =====================================
// ANALYZE WALLET
// =====================================

exports.fetchWallet = async (req, res) => {

    try {

        const address = req.params.address;


        const data = await getWalletData(address);


        console.log("Wallet Data:", data);



        // AI Risk Engine

        const risk = calculateRisk(data);




        // Save Wallet Scan

        const wallet = new Wallet({

            user: req.user?.id,


            address: data.address,


            balance: data.balance,


            totalReceived: data.total_received,


            totalSent: data.total_sent,


            transactions: data.n_tx,



            riskScore: risk.riskScore,


            riskLevel: risk.riskLevel,


            riskFactors: risk.riskFactors,


            aiReport: risk.aiReport,


            scoreBreakdown: risk.breakdown

        });



        await wallet.save();





        // Send Response

        res.json({

            success: true,


            address: data.address,


            balance: data.balance,


            totalReceived: data.total_received,


            totalSent: data.total_sent,


            transactionCount: data.n_tx,


            transactions: data.transactions,



            riskScore: risk.riskScore,


            riskLevel: risk.riskLevel,


            security: risk.riskLevel,


            riskFactors: risk.riskFactors,


            aiReport: risk.aiReport,


            breakdown: risk.breakdown

        });



    } catch(err) {


        console.error("Wallet Error:", err.message);



        res.status(500).json({

            success:false,

            error:err.message

        });


    }

};








// =====================================
// WALLET HISTORY
// =====================================

exports.getHistory = async (req,res)=>{


    try{


        const history = await Wallet.find({

            user:req.user.id

        })
        .sort({

            createdAt:-1

        });




        res.json({

            success:true,

            history

        });



    }catch(err){


        console.error(err);



        res.status(500).json({

            success:false,

            error:err.message

        });


    }


};









// =====================================
// DASHBOARD STATISTICS
// =====================================

exports.getDashboardStats = async(req,res)=>{


    try{


        const wallets = await Wallet.find({

            user:req.user.id

        });





        const totalScans = wallets.length;




        const highRiskWallets = wallets.filter(

            wallet => wallet.riskLevel === "High"

        ).length;




        const mediumRiskWallets = wallets.filter(

            wallet => wallet.riskLevel === "Medium"

        ).length;




        const lowRiskWallets = wallets.filter(

            wallet => wallet.riskLevel === "Low"

        ).length;








        const totalTransactions = wallets.reduce(

            (sum,wallet)=>sum + wallet.transactions,

            0

        );








        const averageRiskScore =

            totalScans > 0

            ?

            Math.round(

                wallets.reduce(

                    (sum,wallet)=>sum + wallet.riskScore,

                    0

                ) / totalScans

            )

            :

            0;









        res.json({

            success:true,


            totalScans,


            highRiskWallets,


            mediumRiskWallets,


            lowRiskWallets,


            averageRiskScore,


            totalTransactions

        });





    }catch(err){



        console.error(err);



        res.status(500).json({

            success:false,

            error:err.message

        });


    }


};