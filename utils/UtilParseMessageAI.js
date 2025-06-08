const API_KEY = "AIzaSyDjpMYWwqd3Zr9s2xS2oWpRjdG69yfzsbs"; // <-- reemplaza con tu clave real
const ENDPOINT = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

export async function parseMessage(text, day, extraPrompt) {
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

    const cleaned = textResponse
      .replace(/```json\s*/g, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(cleaned); // Devuelve como arreglo de objetos
  } catch (error) {
    console.error("Error al parsear mensaje:", error);
    return [];
  }
}
