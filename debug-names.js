const apiKey = "AIzaSyDZz2vH2NEHwNnfiqkZGYD3YeSzmnpME6Y";

async function listNames() {
    try {
        const responseV1 = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`);
        const dataV1 = await responseV1.json();
        console.log("V1 Model Names:");
        if (dataV1.models) {
            dataV1.models.forEach(m => console.log(`- ${m.name}`));
        } else {
            console.log("No models in V1:", dataV1);
        }

        const responseBeta = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const dataBeta = await responseBeta.json();
        console.log("\nV1Beta Model Names:");
        if (dataBeta.models) {
            dataBeta.models.forEach(m => console.log(`- ${m.name}`));
        } else {
            console.log("No models in V1Beta:", dataBeta);
        }
    } catch (err) {
        console.error("Error:", err);
    }
}

listNames();
