function calculateRisk(data) {

    let riskScore = 0;

    let riskFactors = [];



    // Transaction Activity

    if (data.n_tx > 5000) {

        riskScore += 30;

        riskFactors.push(
            "Very high transaction activity detected"
        );

    } 
    else if (data.n_tx > 1000) {

        riskScore += 20;

        riskFactors.push(
            "High transaction frequency"
        );

    }
    else {

        riskScore += 5;

    }



    // Balance Activity

    if (data.balance > 100000000) {

        riskScore += 25;

        riskFactors.push(
            "Large wallet balance detected"
        );

    }



    // Received vs Sent Analysis

    if (data.total_received > data.total_sent * 3) {

        riskScore += 15;

        riskFactors.push(
            "Large incoming transaction pattern"
        );

    }



    // Wallet Activity

    if (data.n_tx < 50) {

        riskScore += 5;

        riskFactors.push(
            "Low wallet activity"
        );

    }



    // Risk Limit

    if (riskScore > 100) {

        riskScore = 100;

    }



    let riskLevel = "Low";


    if (riskScore >= 70) {

        riskLevel = "High";

    } 
    else if (riskScore >= 40) {

        riskLevel = "Medium";

    }



    let aiReport = "";


    if (riskLevel === "High") {

        aiReport =
        "⚠️ High risk wallet detected. Multiple suspicious activity patterns found.";

    }
    else if (riskLevel === "Medium") {

        aiReport =
        "🟡 Moderate risk detected. Wallet activity requires monitoring.";

    }
    else {

        aiReport =
        "🟢 Wallet activity appears normal.";

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