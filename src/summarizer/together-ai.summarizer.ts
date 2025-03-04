import Together from "together-ai";
import { ContentSummarizer, Summary } from "./interfaces/summarizer.interface";
import { ConfigManager } from "../utils/config/config-manager";
import {
  getSummarizerSystemPrompt,
  getSummarizerUserPrompt,
  getTitleSystemPrompt,
  getTitleUserPrompt
} from "../prompts/summarizer.prompt";

const MODEL_NAME = "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo";

export class TogetherAISummarizer implements ContentSummarizer {
  private together!: Together;

  constructor() {
    this.refresh();
  }

  async refresh(): Promise<void> {
    await this.validateConfig();
    this.together = new Together();
  }

  async validateConfig(): Promise<void> {
    if (!(await ConfigManager.getInstance().get("TOGETHER_API_KEY"))) {
      throw new Error("TOGETHER_API_KEY is not set");
    }
  }

  async summarize(
    content: string,
    options?: Record<string, any>
  ): Promise<Summary> {
    try {
      const completion = await this.together.chat.completions.create({
        model: MODEL_NAME,
        messages: [
          {
            role: "system",
            content: getSummarizerSystemPrompt(),
          },
          {
            role: "user",
            content: getSummarizerUserPrompt({
              content,
              language: options?.language,
              minLength: options?.minLength,
              maxLength: options?.maxLength,
            }),
          },
        ],
        response_format: {
          type: "json_object",
          schema: {
            title: "string",
            content: "string",
            keywords: "array",
            score: "number"
          },
        },
      });

      const rawJSON = completion?.choices?.[0]?.message?.content;
      if (!rawJSON) {
        throw new Error("未获取到有效的摘要结果");
      }

      const summary = JSON.parse(rawJSON) as Summary;

      // 验证必要字段
      if (
        !summary.title ||
        !summary.content ||
        !Array.isArray(summary.keywords) ||
        typeof summary.score !== 'number'
      ) {
        throw new Error("摘要结果格式不正确");
      }

      return summary;
    } catch (error) {
      console.error("生成摘要时出错:", error);
      throw error;
    }
  }

  async generateTitle(
    content: string,
    options?: Record<string, any>
  ): Promise<string> {
    try {
      const completion = await this.together.chat.completions.create({
        model: MODEL_NAME,
        messages: [
          {
            role: "system",
            content: getTitleSystemPrompt(),
          },
          {
            role: "user",
            content: getTitleUserPrompt({
              content,
              language: options?.language,
            }),
          },
        ],
      });

      const title = completion?.choices?.[0]?.message?.content;
      if (!title) {
        throw new Error("未获取到有效的标题");
      }

      return title;
    } catch (error) {
      console.error("生成标题时出错:", error);
      throw error;
    }
  }
}
