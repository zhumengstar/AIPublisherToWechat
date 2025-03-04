import { IConfigSource } from "../interfaces/config-source.interface";

export class EnvConfigSource implements IConfigSource {
  constructor(public priority: number = 100) {}

  async get<T>(key: string): Promise<T | null> {
    const value = process.env[key];
    if (value === undefined) {
      return null;
    }

    try {
      // 尝试解析JSON格式的值
      return JSON.parse(value) as T;
    } catch {
      // 如果不是JSON格式，直接返回字符串值
      return value as unknown as T;
    }
  }
}
