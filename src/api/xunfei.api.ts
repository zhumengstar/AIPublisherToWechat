import axios from "axios";
import { ConfigManager } from "../utils/config/config-manager";

interface XunfeiMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface XunfeiResponse {
  code: number;
  message: string;
  sid: string;
  choices: {
    message: {
      role: "assistant" | "user";
      content: string;
    };
    index: number;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class XunfeiAPI {
  private baseURL = "https://spark-api-open.xf-yun.com/v1/chat/completions";
  private token!: string;
  private defaultModel = "4.0Ultra";

  constructor() {
    this.refresh();
  }

  async refresh() {
    this.token = await ConfigManager.getInstance().get("XUNFEI_API_KEY");
    if (!this.token) {
      throw new Error("Xunfei API key is not set");
    }
  }

  /**
   * Send a message to the Xunfei API and get a response
   * @param content The message content to send
   * @param systemPrompt Optional system prompt to set context
   * @param enableWebSearch Optional flag to enable web search
   * @returns Promise<string> The assistant's response text
   */
  async sendMessage(
    content: string,
    systemPrompt?: string,
    enableWebSearch?: boolean
  ): Promise<string> {
    try {
      const messages: XunfeiMessage[] = [];
      if (systemPrompt) {
        messages.push({
          role: "system",
          content: systemPrompt,
        });
      }

      messages.push({
        role: "user",
        content,
      });

      const response = await axios.post<XunfeiResponse>(
        this.baseURL,
        {
          model: this.defaultModel,
          messages,
          stream: false,
          ...(enableWebSearch && {
            tools: [
              {
                type: "web_search",
                web_search: {
                  enable: true,
                },
              },
            ],
          }),
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.token}`,
          },
        }
      );

      if (response.data.code !== 0) {
        throw new Error(`API Error: ${response.data.message}`);
      }

      if (!response.data.choices || response.data.choices.length === 0) {
        throw new Error("No response choices available");
      }

      return response.data.choices[0].message.content;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Failed to send message: ${
            error.response?.data?.message || error.message
          }`
        );
      }
      throw error;
    }
  }
}
