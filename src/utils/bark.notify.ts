import axios from "axios";
import dotenv from "dotenv";
import { ConfigManager } from "./config/config-manager";

dotenv.config();

export class BarkNotifier {
  private barkUrl?: string;
  private enabled: boolean = false;

  constructor() {
    this.refresh();
  }

  async refresh(): Promise<void> {
    await this.validateConfig();
  }

  async validateConfig(): Promise<void> {
    const configManager = ConfigManager.getInstance();
    this.enabled = await configManager.get<boolean>("ENABLE_BARK").catch(() => false);
    
    if (this.enabled) {
      this.barkUrl = await configManager.get<string>("BARK_URL").catch(() => undefined);
      if (!this.barkUrl) {
        console.warn("Bark URL not configured but Bark is enabled");
      }
    }
  }

  /**
   * 发送 Bark 通知
   * @param title 通知标题
   * @param content 通知内容
   * @param options 通知选项
   */
  async notify(
    title: string,
    content: string,
    options: {
      level?: "active" | "timeSensitive" | "passive";
      sound?: string;
      icon?: string;
      group?: string;
      url?: string;
      isArchive?: boolean;
    } = {}
  ): Promise<boolean> {
    try {
      if (!this.enabled) {
        console.debug("Bark notifications are disabled");
        return false;
      }

      if (!this.barkUrl) {
        console.warn("Bark URL not configured, skipping notification");
        return false;
      }

      const params = new URLSearchParams();

      // 添加必要参数
      params.append("title", title);
      params.append("body", content);

      // 添加可选参数
      if (options.level) {
        params.append("level", options.level);
      }
      if (options.sound) {
        params.append("sound", options.sound);
      }
      if (options.icon) {
        params.append("icon", options.icon);
      }
      if (options.group) {
        params.append("group", options.group);
      }
      if (options.url) {
        params.append("url", options.url);
      }
      if (options.isArchive !== undefined) {
        params.append("isArchive", options.isArchive.toString());
      }

      // 发送通知
      const response = await axios.get(
        `${this.barkUrl}/${encodeURIComponent(title)}/${encodeURIComponent(
          content
        )}?${params.toString()}`
      );

      if (response.status === 200) {
        return true;
      }

      console.error("Bark 通知发送失败:", response.data);
      return false;
    } catch (error) {
      console.error("Bark 通知发送出错:", error);
      return false;
    }
  }

  /**
   * 发送成功通知
   * @param title 通知标题
   * @param content 通知内容
   */
  async success(title: string, content: string): Promise<boolean> {
    return this.notify(title, content, {
      level: "active",
      sound: "success",
      group: "success",
    });
  }

  /**
   * 发送错误通知
   * @param title 通知标题
   * @param content 通知内容
   */
  async error(title: string, content: string): Promise<boolean> {
    return this.notify(title, content, {
      level: "timeSensitive",
      sound: "error",
      group: "error",
    });
  }

  /**
   * 发送警告通知
   * @param title 通知标题
   * @param content 通知内容
   */
  async warning(title: string, content: string): Promise<boolean> {
    return this.notify(title, content, {
      level: "timeSensitive",
      sound: "warning",
      group: "warning",
    });
  }

  /**
   * 发送信息通知
   * @param title 通知标题
   * @param content 通知内容
   */
  async info(title: string, content: string): Promise<boolean> {
    return this.notify(title, content, {
      level: "passive",
      group: "info",
    });
  }
}
