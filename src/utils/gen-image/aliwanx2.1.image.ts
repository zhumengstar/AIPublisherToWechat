import axios from "axios";
import { ConfigManager } from "../config/config-manager";

interface ApiResponse {
  output: {
    task_status: "PENDING" | "SUCCEEDED" | "FAILED";
    task_id: string;
    results?: Array<{
      url: string;
      orig_prompt?: string;
      actual_prompt?: string;
    }>;
  };
  request_id: string;
}

export class AliWanX21ImageGenerator {
  private apiKey!: string;
  private baseUrl =
    "https://dashscope.aliyuncs.com/api/v1/services/aigc/text2image/image-synthesis";
  private readonly model = "wanx2.1-t2i-turbo";

  constructor() {
    this.refresh();
  }

  async refresh() {
    const apiKey = await ConfigManager.getInstance().get<string>(
      "DASHSCOPE_API_KEY"
    );
    if (!apiKey) {
      throw new Error("DASHSCOPE_API_KEY environment variable is not set");
    }
    this.apiKey = apiKey;
  }

  /**
   * 生成图片
   * @param prompt 提示词
   * @param size 图片尺寸
   * @param n 生成数量
   * @returns 图片生成结果
   */
  async generateImage(
    prompt: string,
    size: string = "1024*1024",
    n: number = 1
  ): Promise<ApiResponse> {
    try {
      const response = await axios.post<ApiResponse>(
        this.baseUrl,
        {
          model: this.model,
          input: { prompt },
          parameters: {
            size,
            n,
            seed: Math.floor(Math.random() * 4294967290) + 1,
          },
        },
        {
          headers: {
            "X-DashScope-Async": "enable",
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Image generation failed: ${
            error.response?.data?.message || error.message
          }`
        );
      }
      throw error;
    }
  }

  async checkTaskStatus(taskId: string): Promise<ApiResponse["output"]> {
    try {
      const response = await axios.get<ApiResponse>(
        `https://dashscope.aliyuncs.com/api/v1/tasks/${taskId}`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
          },
        }
      );

      return response.data.output;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(
          `Task status check failed: ${
            error.response?.data?.message || error.message
          }`
        );
      }
      throw error;
    }
  }

  async waitForCompletion(
    taskId: string,
    maxAttempts: number = 30,
    interval: number = 2000
  ): Promise<ApiResponse["output"]> {
    let attempts = 0;

    while (attempts < maxAttempts) {
      const status = await this.checkTaskStatus(taskId);

      if (status.task_status === "SUCCEEDED") {
        return status;
      }

      if (status.task_status === "FAILED") {
        throw new Error("Image generation task failed");
      }

      await new Promise((resolve) => setTimeout(resolve, interval));
      attempts++;
    }

    throw new Error("Timeout waiting for image generation");
  }
}

// Example usage:
// const generator = new AliWanX21ImageGenerator();
// const response = await generator.generateImage('一间有着精致窗户的花店，漂亮的木质门，摆放着花朵');
// const result = await generator.waitForCompletion(response.output.task_id);
