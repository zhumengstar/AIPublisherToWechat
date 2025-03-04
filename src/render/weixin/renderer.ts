import fs from "fs";
import path from "path";
import ejs from "ejs";
import { WeixinTemplate } from "../interfaces/template.interface";

export class WeixinTemplateRenderer {
  private template: string;

  constructor() {
    // 读取模板文件
    const templatePath = path.join(__dirname, "../../templates/article.ejs");
    this.template = fs.readFileSync(templatePath, "utf-8");
  }

  /**
   * 渲染微信文章模板
   * @param articles 微信文章模板数组
   * @returns 渲染后的 HTML
   */
  render(articles: WeixinTemplate[]): string {
    try {
      // 使用 EJS 渲染模板
      return ejs.render(
        this.template,
        { articles },
        {
          rmWhitespace: true,
        }
      );
    } catch (error) {
      console.error("模板渲染失败:", error);
      throw error;
    }
  }
}
