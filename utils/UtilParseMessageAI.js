const API_KEY = "AIzaSyDjpMYWwqd3Zr9s2xS2oWpRjdG69yfzsbs"; // <-- reemplaza con tu clave real
const ENDPOINT = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

export async function parseMessage(text, day, extraPrompt) {
  let cleaned;
  try {
    const prompt = `Hoy es: ${day}, ${extraPrompt}${text.trim().replace(/"/g, '\\"')}"`;

    const body = {
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
    };

    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const responseJson = await response.json();

    if (!response.ok) {
      console.error("Error HTTP:", response.status, responseJson);
      return [];
    }

    const textResponse =
      responseJson.candidates?.[0]?.content?.parts?.[0]?.text || "";

    cleaned = textResponse
      .replace(/```json\s*/g, "")
      .replace(/```/g, "")
      .trim()
      .replace(/"numero": (\d{1})\b/g, '"numero": "0$1"') // 1 dígito → agrega cero
      .replace(/"numero": (\d{2})\b/g, (_, d) => `"numero": "${d}"`); // 2 dígitos como string
    console.log("Mensaje cleaned:", cleaned);
    return JSON.parse(cleaned); // Devuelve como arreglo de objetos
  } catch (error) {
    console.error("Error al parsear mensaje:", error);
    console.error("Error al parsear mensaje cleaned:", cleaned);
    return [];
  }
}
