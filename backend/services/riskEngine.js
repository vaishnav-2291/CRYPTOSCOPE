function calculateRisk(data) {


    let riskScore = 0;

    let riskFactors = [];


    let breakdown = {

        transactionRisk: 0,

        balanceRisk: 0,

        transactionPatternRisk: 0,

        activityRisk: 0

    };



    // =====================================
    // Transaction Activity Analysis
    // =====================================


    if (data.n_tx > 10000) {


        riskScore += 40;

        breakdown.transactionRisk = 40;


        riskFactors.push(
            "Extremely high transaction activity detected"
        );


    }

    else if (data.n_tx > 5000) {


        riskScore += 30;

        breakdown.transactionRisk = 30;


        riskFactors.push(
            "Very high transaction activity detected"
        );


    }

    else if (data.n_tx > 1000) {


        riskScore += 20;

        breakdown.transactionRisk = 20;


        riskFactors.push(
            "High transaction frequency detected"
        );


    }

    else if (data.n_tx > 100) {


        riskScore += 10;

        breakdown.transactionRisk = 10;


        riskFactors.push(
            "Active wallet transaction pattern detected"
        );


    }

    else {


        riskScore += 5;

        breakdown.transactionRisk = 5;


    }





    // =====================================
    // Balance Risk Analysis
    // =====================================


    if (data.balance > 1000) {


        riskScore += 25;

        breakdown.balanceRisk = 25;


        riskFactors.push(
            "Very large BTC balance detected"
        );


    }

    else if (data.balance > 100) {


        riskScore += 15;

        breakdown.balanceRisk = 15;


        riskFactors.push(
            "High value wallet detected"
        );


    }







    // =====================================
    // Incoming / Outgoing Pattern
    // =====================================


    if (

        data.total_received >

        data.total_sent * 3

    ) {


        riskScore += 15;

        breakdown.transactionPatternRisk = 15;


        riskFactors.push(
            "Large incoming transaction pattern detected"
        );


    }





    // =====================================
    // Wallet Activity Behaviour
    // =====================================


    if (data.n_tx < 10) {


        riskScore += 5;

        breakdown.activityRisk = 5;


        riskFactors.push(
            "Low wallet activity detected"
        );


    }





    // =====================================
    // Risk Score Limit
    // =====================================


    if (riskScore > 100) {


        riskScore = 100;


    }






    // =====================================
    // Risk Level
    // =====================================


    let riskLevel = "Low";



    if (riskScore >= 70) {


        riskLevel = "High";


    }

    else if (riskScore >= 40) {


        riskLevel = "Medium";


    }







    // =====================================
    // AI Security Report
    // =====================================


    let aiReport;



    if (riskLevel === "High") {


        aiReport =

        "⚠️ High risk wallet detected. The wallet shows abnormal transaction activity, high value movement, or suspicious financial patterns. Immediate monitoring is recommended.";



    }


    else if (riskLevel === "Medium") {


        aiReport =

        "🟡 Medium risk wallet detected. The wallet demonstrates noticeable activity patterns that should be monitored for unusual behaviour.";



    }


    else {


        aiReport =

        "🟢 Low risk wallet detected. The wallet activity appears normal based on current blockchain behaviour analysis.";



    }







    return {


        riskScore,


        riskLevel,


        riskFactors,


        aiReport,


        breakdown,


        // keeping old name also
        scoreBreakdown: breakdown


    };


}





module.exports = {

    calculateRisk

};