import fs from "fs";
import path from "path";
import ejs from "ejs";
import { AIBenchTemplate } from "../interfaces/aibench.template";
import { ModelPerformance } from "../../api/livebench.api";

interface ModelScore {
  name: string;
  score: number;
  organization?: string;
  reasoning?: number;
  coding?: number;
  math?: number;
  dataAnalysis?: number;
  language?: number;
  if?: number;
}

interface CategoryData {
  name: string;
  icon: string;
  models: ModelScore[];
}

export class AIBenchRenderer {
  private static readonly CATEGORIES = [
    { key: "Global Average", name: "总体评分", icon: "🌟" },
    { key: "Reasoning Average", name: "推理能力", icon: "🧠" },
    { key: "Coding Average", name: "编程能力", icon: "💻" },
    { key: "Mathematics Average", name: "数学能力", icon: "📐" },
    { key: "Data Analysis Average", name: "数据分析", icon: "📊" },
    { key: "Language Average", name: "语言能力", icon: "📝" },
    { key: "IF Average", name: "推理框架", icon: "🔍" },
  ];

  private template!: string;
  private weixinTemplate!: string;

  constructor() {
    this.loadTemplate();
    this.loadWeixinTemplate();
  }

  private loadTemplate(): void {
    const templatePath = path.join(__dirname, "../../templates/aibench.ejs");
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template file not found at ${templatePath}`);
    }
    this.template = fs.readFileSync(templatePath, "utf-8");
  }

  private loadWeixinTemplate(): void {
    const templatePath = path.join(
      __dirname,
      "../../templates/aibench-weixin.ejs"
    );
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Weixin template file not found at ${templatePath}`);
    }
    this.weixinTemplate = fs.readFileSync(templatePath, "utf-8");
  }

  public render(data: AIBenchTemplate): string {
    try {
      return ejs.render(this.template, data, {
        rmWhitespace: true,
      });
    } catch (error) {
      console.error("Error rendering AI benchmark template:", error);
      throw error;
    }
  }

  public renderForWeixin(data: AIBenchTemplate): string {
    try {
      return ejs.render(this.weixinTemplate, data, {
        rmWhitespace: true,
      });
    } catch (error) {
      console.error("Error rendering AI benchmark weixin template:", error);
      throw error;
    }
  }

  public async renderToFile(
    data: AIBenchTemplate,
    outputPath: string
  ): Promise<void> {
    try {
      const html = this.render(data);
      const outputDir = path.dirname(outputPath);

      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      await fs.promises.writeFile(outputPath, html);
    } catch (error) {
      console.error("Error writing rendered template to file:", error);
      throw error;
    }
  }

  public static render(data: {
    [key: string]: ModelPerformance;
  }): AIBenchTemplate {
    const categories: CategoryData[] = [];
    const globalTop10: ModelScore[] = [];

    // Process global rankings first
    const globalScores = Object.entries(data)
      .map(([name, performance]) => ({
        name,
        organization: performance.organization,
        score: performance.metrics["Global Average"] || 0,
        reasoning: performance.metrics["Reasoning Average"] || 0,
        coding: performance.metrics["Coding Average"] || 0,
        math: performance.metrics["Mathematics Average"] || 0,
        dataAnalysis: performance.metrics["Data Analysis Average"] || 0,
        language: performance.metrics["Language Average"] || 0,
        if: performance.metrics["IF Average"] || 0,
      }))
      .filter((model) => model.score > 0)
      .sort((a, b) => b.score - a.score);

    // Get top 10 models for global ranking
    globalTop10.push(...globalScores.slice(0, 10));

    // Process each category
    this.CATEGORIES.forEach((category) => {
      const categoryScores = Object.entries(data)
        .map(([name, performance]) => ({
          name,
          organization: performance.organization,
          score: performance.metrics[category.key] || 0,
        }))
        .filter((model) => model.score > 0)
        .sort((a, b) => b.score - a.score);

      categories.push({
        name: category.name,
        icon: category.icon,
        models: categoryScores,
      });
    });

    return {
      title: "AI模型能力评测榜单",
      updateTime: new Date().toLocaleString("zh-CN", {
        timeZone: "Asia/Shanghai",
        hour12: false,
      }),
      categories,
      globalTop10,
    };
  }
}
