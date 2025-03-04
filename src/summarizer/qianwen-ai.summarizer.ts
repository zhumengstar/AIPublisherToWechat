import OpenAI from "openai";
import { ContentSummarizer, Summary } from "./interfaces/summarizer.interface";
import { ConfigManager } from "../utils/config/config-manager";
import {
  getSummarizerSystemPrompt,
  getSummarizerUserPrompt,
  getTitleSystemPrompt,
  getTitleUserPrompt
} from "../prompts/summarizer.prompt";

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
const MODEL_NAME = "qwen-max";

export class QianwenAISummarizer implements ContentSummarizer {
  private client!: OpenAI;

  constructor() {
    this.refresh();
  }

  async refresh(): Promise<void> {
    await this.validateConfig();
    this.client = new OpenAI({
      apiKey: await ConfigManager.getInstance().get("DASHSCOPE_API_KEY"),
      baseURL: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    });
  }

  async validateConfig(): Promise<void> {
    if (!(await ConfigManager.getInstance().get("DASHSCOPE_API_KEY"))) {
      throw new Error("DashScope API key is required");
    }
  }

  private async retryOperation<T>(operation: () => Promise<T>): Promise<T> {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === MAX_RETRIES) {
          throw error;
        }
        await new Promise((resolve) =>
          setTimeout(resolve, RETRY_DELAY * attempt)
        );
        console.error(`Retry attempt ${attempt} failed:`, error);
      }
    }
    throw new Error("Operation failed after max retries");
  }

  async summarize(
    content: string,
    options?: Record<string, any>
  ): Promise<Summary> {
    if (!content) {
      throw new Error("Content is required for summarization");
    }

    return this.retryOperation(async () => {
      const response = await this.client.chat.completions.create({
        model: MODEL_NAME,
        messages: [
          { 
            role: "system", 
            content: getSummarizerSystemPrompt() 
          },
          { 
            role: "user", 
            content: getSummarizerUserPrompt({
              content,
              language: options?.language,
              minLength: options?.minLength,
              maxLength: options?.maxLength,
            })
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.7
      });

      const completion = response.choices[0]?.message?.content;
      if (!completion) {
        throw new Error("未获取到有效的摘要结果");
      }

      try {
        const summary = JSON.parse(completion) as Summary;
        if (
          !summary.title ||
          !summary.content
        ) {
          throw new Error("摘要结果格式不正确");
        }
        return summary;
      } catch (error) {
        throw new Error(
          `解析摘要结果失败: ${
            error instanceof Error ? error.message : "未知错误"
          }`
        );
      }
    });
  }

  async generateTitle(
    content: string,
    options?: Record<string, any>
  ): Promise<string> {
    return this.retryOperation(async () => {
      const response = await this.client.chat.completions.create({
        model: MODEL_NAME,
        messages: [
          { 
            role: "system", 
            content: getTitleSystemPrompt() 
          },
          { 
            role: "user", 
            content: getTitleUserPrompt({
              content,
              language: options?.language,
            })
          },
        ],
        temperature: 0.7,
        max_tokens: 100,
      });

      const title = response.choices[0]?.message?.content;
      if (!title) {
        throw new Error("未获取到有效的标题");
      }
      return title;
    });
  }
} 