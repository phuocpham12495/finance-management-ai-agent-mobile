const { GoogleGenerativeAI } = require('@google/generative-ai');

async function debugModels() {
    const apiKey = "no leak here";
    if (!apiKey) {
        console.error("API Key missing");
        return;
    }

    try {
        console.log("Fetching models for v1...");
        const responseV1 = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`);
        const dataV1 = await responseV1.json();
        console.log("V1 Models:", JSON.stringify(dataV1, null, 2));

        console.log("\nFetching models for v1beta...");
        const responseBeta = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const dataBeta = await responseBeta.json();
        console.log("V1Beta Models:", JSON.stringify(dataBeta, null, 2));
    } catch (err) {
        console.error("Error fetching models:", err);
    }
}

debugModels();
