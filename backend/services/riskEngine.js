function calculateRisk(data) {


    let riskScore = 0;

    let riskFactors = [];



    // =====================================
    // Transaction Activity Analysis
    // =====================================


    if (data.n_tx > 5000) {


        riskScore += 30;


        riskFactors.push(
            "Very high transaction activity detected"
        );


    }

    else if (data.n_tx > 1000) {


        riskScore += 20;


        riskFactors.push(
            "High transaction frequency detected"
        );


    }

    else if (data.n_tx > 100) {


        riskScore += 10;


        riskFactors.push(
            "Active wallet transaction pattern"
        );


    }

    else {


        riskScore += 5;


    }





    // =====================================
    // Balance Analysis
    // =====================================


    if (data.balance > 1000) {


        riskScore += 25;


        riskFactors.push(
            "Large BTC balance detected"
        );


    }

    else if (data.balance > 100) {


        riskScore += 15;


        riskFactors.push(
            "High value wallet detected"
        );


    }





    // =====================================
    // Incoming vs Outgoing Pattern
    // =====================================


    if (

        data.total_received >

        data.total_sent * 3

    ) {


        riskScore += 15;


        riskFactors.push(
            "Large incoming transaction pattern detected"
        );


    }




    // =====================================
    // Low Activity Wallet
    // =====================================


    if (data.n_tx < 10) {


        riskScore += 5;


        riskFactors.push(
            "Low wallet activity"
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
    // AI Report
    // =====================================


    let aiReport;



    if (riskLevel === "High") {


        aiReport =

        "⚠️ High risk wallet detected. Multiple abnormal transaction patterns and high-value activity found.";


    }


    else if (riskLevel === "Medium") {


        aiReport =

        "🟡 Medium risk wallet detected. The wallet shows noticeable activity patterns that require monitoring.";


    }


    else {


        aiReport =

        "🟢 Low risk wallet detected. Current transaction behaviour appears normal.";


    }





    return {


        riskScore,


        riskLevel,


        riskFactors,


        aiReport


    };


}



module.exports = {

    calculateRisk

};