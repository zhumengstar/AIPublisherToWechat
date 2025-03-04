export interface ContentPublisher {
  // 验证发布配置是否完善
  validateConfig(): void;
  // 刷新配置
  refresh(): Promise<void>;

  // 上传图片到指定平台
  uploadImage(imageUrl: string): Promise<string>;

  // 发布文章到指定平台
  publish(article: string, ...args: any[]): Promise<PublishResult>;
}

export interface PublishResult {
  publishId: string;
  url?: string;
  status: PublishStatus;
  publishedAt: Date;
  platform: string;
}

export type PublishStatus =
  | "pending"
  | "published"
  | "failed"
  | "draft"
  | "scheduled";
