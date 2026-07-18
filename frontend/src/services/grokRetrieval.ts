import { Scheme } from "../types";
import { queryGrok } from "./grok";

export const buildGrokPrompt = (query: string, schemes: Scheme[]): string => {
  const schemeSummaries = schemes
    .slice(0, 15)
    .map(
      (scheme) =>
        `- ${scheme.icon} ${scheme.name} (${scheme.category.toUpperCase()}${scheme.state ? `, ${scheme.state}` : ""}): ${scheme.description}. Benefits: ${scheme.benefits}`
    )
    .join("\n");

  return `User question about Indian government schemes: "${query}"

Available schemes:
${schemeSummaries}

Based on the user's question, identify the most relevant schemes and explain:
1. Which schemes are most relevant and why
2. Key eligibility criteria to be aware of
3. How to apply (briefly)

Keep the response conversational and under 200 words.`;
};

export const retrieveWithGrok = async (query: string, schemes: Scheme[]): Promise<string> => {
  const prompt = buildGrokPrompt(query, schemes);
  return queryGrok(prompt);
};
