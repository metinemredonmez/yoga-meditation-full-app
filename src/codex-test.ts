import OpenAI from "openai";

async function main() {
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const response = await client.completions.create({
    // Eski Codex modelleri kapandı. Bunun yerine "gpt-3.5-turbo-instruct" ya da "gpt-4.1" kullanabilirsin.
    model: "gpt-3.5-turbo-instruct",
    prompt: "Write a TypeScript function that reverses a string",
    max_tokens: 150,
  });

  console.log("Model cevabı:");
  const firstChoice = response.choices[0];
  if (!firstChoice) {
    throw new Error("No completion choices returned");
  }

  console.log(firstChoice.text ?? "");
}

main().catch(console.error);
