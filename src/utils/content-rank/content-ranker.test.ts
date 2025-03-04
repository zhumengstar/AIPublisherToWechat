import { ConfigManager } from "../config/config-manager";
import { DbConfigSource } from "../config/sources/db-config.source";
import { EnvConfigSource } from "../config/sources/env-config.source";
import { MySQLDB } from "../db/mysql.db";
import { ContentRanker } from "./content-ranker";
import dotenv from "dotenv";

// 加载环境变量
dotenv.config();

async function main() {
  try {

    // 配置管理器
    const configManager = ConfigManager.getInstance();
    configManager.addSource(new EnvConfigSource());
  
    const db = await MySQLDB.getInstance({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
    });
    configManager.addSource(new DbConfigSource(db));

    
  

    const ranker = new ContentRanker({
      provider: "deepseek",
      apiKey: await configManager.get("DEEPSEEK_API_KEY") as string,
      modelName: "deepseek-reasoner"
    });
    
    // 测试数据
    const testContents = [
      {
        id: "1",
        title: "GPT-4 Turbo发布：更强大的多模态能力和更低的价格",
        content: `OpenAI在开发者大会上发布了GPT-4 Turbo，这是GPT-4的最新版本。新版本带来了多项重要更新：
1. 支持更长的上下文窗口，从32K扩展到128K
2. 知识库更新到2023年4月
3. 更强大的多模态能力，可以理解和生成图像
4. API调用成本降低了3倍
5. 新增了JSON模式输出功能
这些更新将帮助开发者构建更强大的AI应用。`,
        publishDate: "2023-11-06",
        url: "https://example.com/gpt4-turbo",
        score: 0,
        metadata: {}
      },
      {
        id: "2",
        title: "谷歌发布Gemini：超越GPT-4的多模态模型",
        content: `谷歌正式发布了其最新的AI模型Gemini，号称在多个基准测试中超越了GPT-4：
1. 在28个基准测试中的26个超越GPT-4
2. 原生支持多模态，可以同时处理文本、图像、音频和视频
3. 提供三个版本：Ultra、Pro和Nano
4. 已经整合到Bard和Pixel手机中
5. 开发者可以通过API访问
这标志着AI领域的新突破，将推动更多创新应用的出现。`,
        publishDate: "2023-12-07",
        url: "https://example.com/gemini",
        score: 0,
        metadata: {}
      }
    ];

    console.log("开始评分测试...");
    const results = await ranker.rankContents(testContents);
    console.log("评分结果:", results);
    
  } catch (error) {
    console.error("测试失败:", error);
    process.exit(1);
  }
}

// 运行测试
main(); 