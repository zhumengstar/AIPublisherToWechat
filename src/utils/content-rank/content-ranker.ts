import { ScrapedContent } from "../../scrapers/interfaces/scraper.interface";
import { ConfigManager } from "../config/config-manager";

export interface RankResult {
  id: string;
  score: number;
}

export interface APIConfig {
  apiKey: string;
  modelName?: string;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
const DEFAULT_MODEL_NAME = "deepseek-r1";

// API Provider interfaces and implementations
interface APIProvider {
  initialize(): Promise<void>;
  callAPI(messages: any[]): Promise<any>;
}

class DashScopeProvider implements APIProvider {
  private readonly API_BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1";

  constructor(
    private readonly config: APIConfig
  ) {
    this.config.modelName = this.config.modelName || "deepseek-r1";
  }

  async initialize(): Promise<void> {
    // 验证必要的配置
    if (!this.config.apiKey) {
      throw new Error("DashScope API key is required");
    }
  }

  async callAPI(messages: any[]): Promise<any> {
    const response = await fetch(`${this.API_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
        'User-Agent': 'TrendFinder/1.0.0',
        'Accept': '*/*'
      },
      body: JSON.stringify({
        model: this.config.modelName,
        messages,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('API Response:', JSON.stringify(data, null, 2));
    return data;
  }
}

class DeepSeekProvider implements APIProvider {
  private readonly API_BASE_URL = "https://api.deepseek.com/v1";

  constructor(
    private readonly config: APIConfig
  ) {
    this.config.modelName = this.config.modelName || "deepseek-chat";
  }

  async initialize(): Promise<void> {
    // 验证必要的配置
    if (!this.config.apiKey) {
      throw new Error("DeepSeek API key is required");
    }
  }

  async callAPI(messages: any[]): Promise<any> {
    const response = await fetch(`${this.API_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
        'User-Agent': 'TrendFinder/1.0.0'
      },
      body: JSON.stringify({
        model: this.config.modelName,
        messages,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`API request failed with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('API Response:', JSON.stringify(data, null, 2));
    return data;
  }
}

export interface ContentRankerConfig {
  provider: "dashscope" | "deepseek";
  apiKey: string;
  modelName?: string;
}

export class ContentRanker {
  private apiProvider: APIProvider;
  private initialized = false;

  constructor(config: ContentRankerConfig) {
    const apiConfig: APIConfig = {
      apiKey: config.apiKey,
      modelName: config.modelName
    };

    // 根据配置创建对应的provider
    if (config.provider === "deepseek") {
      this.apiProvider = new DeepSeekProvider(apiConfig);
    } else {
      this.apiProvider = new DashScopeProvider(apiConfig);
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.apiProvider.initialize();
      this.initialized = true;
    }
  }

  private async retryOperation<T>(operation: () => Promise<T>): Promise<T> {
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await operation();
      } catch (error) {
        console.error(`Attempt ${attempt} failed with error:`, error);
        if (attempt === MAX_RETRIES) {
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY * attempt));
      }
    }
    throw new Error("Operation failed after max retries");
  }

  private getSystemPrompt(): string {
    return `你是一个专业的科技内容评估专家，特别专注于AI和前沿科技领域。你的任务是评估文章的重要性、创新性和技术价值，并识别相似内容。

            评分标准（总分100分）：

            1. 技术创新与前沿性 (35分)
            - 技术的创新程度和突破性
            - 是否涉及最新的技术发展和研究进展
            - 技术方案的可行性和实用价值
            - AI/科技领域的前沿趋势相关度

            2. 技术深度与专业性 (25分)
            - 技术原理的解释深度
            - 技术实现细节的完整性
            - 专业术语使用的准确性
            - 技术方案的可实施性

            3. 行业影响力 (20分)
            - 对AI/科技行业的潜在影响
            - 商业价值和市场潜力
            - 技术应用场景的广泛性
            - 解决实际问题的效果

            4. 时效性与竞争格局 (20分)
            - 内容的时效性和新闻价值
            - 与竞品/竞争技术的对比分析
            - 技术发展趋势的预测
            - 市场竞争态势的分析

            相似内容处理：
            - 识别主题、技术点或事件相同的文章
            - 对于相似文章，只保留质量最高（分数最高）的一篇
            - 其他相似文章将被过滤，不出现在最终结果中

            请仔细阅读文章，并按照以下格式返回评分结果：
            文章ID: 分数
            文章ID: 分数
            ...

            注意事项：
            1. 分数范围为0-100，精确到小数点后一位
            2. 每篇文章占一行
            3. 只返回ID和分数，不要有其他文字说明
            4. 分数要有区分度，避免所有文章分数过于接近
            5. 重点关注技术创新性和行业影响力
            6. 对于深度技术文章，应在技术深度上给予更高权重
            7. 相似文章组中只返回分数最高的一篇，其他相似文章不返回`;
  }

  private getUserPrompt(contents: ScrapedContent[]): string {
    return contents.map(content => (
      `文章ID: ${content.id}\n` +
      `标题: ${content.title}\n` +
      `发布时间: ${content.publishDate}\n` +
      `内容:\n${content.content}\n` +
      `---\n`
    )).join('\n');
  }

  private parseRankingResult(result: string): RankResult[] {
    const lines = result.trim().split('\n');
    return lines.map(line => {
      // Remove any potential Chinese characters and extra spaces
      const cleanedLine = line.replace(/文章ID[:：]?/i, '').trim();

      // Match either space-separated or colon-separated formats
      const match = cleanedLine.match(/^(\S+)(?:[\s:：]+)(\d+(?:\.\d+)?)$/);

      if (!match) {
        throw new Error(`Invalid format for line: ${line}`);
      }

      const [, id, scoreStr] = match;
      const score = parseFloat(scoreStr);

      if (isNaN(score)) {
        throw new Error(`Invalid score format for line: ${line}`);
      }

      return { id, score };
    });
  }

  public async rankContents(contents: ScrapedContent[]): Promise<RankResult[]> {
    if (!contents.length) {
      return [];
    }

    await this.ensureInitialized();

    return this.retryOperation(async () => {
      try {
        const messages = [
          {
            role: "system",
            content: this.getSystemPrompt(),
          },
          {
            role: "user",
            content: this.getUserPrompt(contents),
          },
        ];
        const response = await this.apiProvider.callAPI(messages);
        const result = response.choices?.[0]?.message?.content;

        if (!result) {
          throw new Error("未获取到有效的评分结果");
        }

        return this.parseRankingResult(result);
      } catch (error) {
        console.error("API调用失败:", error);
        if (error instanceof Error) {
          console.error("详细错误信息:", error.message);
          console.error("错误堆栈:", error.stack);
        }
        throw error;
      }
    });
  }

  public async rankContentsBatch(
    contents: ScrapedContent[],
    batchSize: number = 5
  ): Promise<RankResult[]> {
    const results: RankResult[] = [];

    for (let i = 0; i < contents.length; i += batchSize) {
      const batch = contents.slice(i, i + batchSize);
      const batchResults = await this.rankContents(batch);
      results.push(...batchResults);

      // 添加延迟以避免API限制
      if (i + batchSize < contents.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }
}



