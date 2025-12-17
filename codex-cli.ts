
// codex-cli.ts
import OpenAI from "openai";
import "dotenv/config";

async function main() {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // terminalden prompt al
  const prompt = process.argv.slice(2).join(" ") || "Hello, write a TypeScript hello world";

  const res = await client.completions.create({
    model: "gpt-3.5-turbo-instruct",
    prompt,
    max_tokens: 200,
  });

  console.log(">>> Prompt:", prompt);
  console.log(">>> Output:");
  console.log(res.choices[0]?.text?.trim() ?? "⚠️ No response");
}

main().catch(console.error);