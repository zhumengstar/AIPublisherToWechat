import { WeixinWorkflow } from "./services/weixin-article.workflow";
import { ConfigManager } from "./utils/config/config-manager";
import { EnvConfigSource } from "./utils/config/sources/env-config.source";
import { DbConfigSource } from "./utils/config/sources/db-config.source";
import { MySQLDB } from "./utils/db/mysql.db";
import { WeixinAIBenchWorkflow } from "./services/weixin-aibench.workflow";
import { WeixinHelloGithubWorkflow } from "./services/weixin-hellogithub.workflow";
async function bootstrap() {
  const configManager = ConfigManager.getInstance();
  await configManager.initDefaultConfigSources();


  const weixinWorkflow = new WeixinWorkflow();

  await weixinWorkflow.refresh();
  await weixinWorkflow.process();

  // const weixinAIBenchWorkflow = new WeixinAIBenchWorkflow();
  // await weixinAIBenchWorkflow.refresh();
  // await weixinAIBenchWorkflow.process();

  // const weixinHelloGithubWorkflow = new WeixinHelloGithubWorkflow();
  // await weixinHelloGithubWorkflow.refresh();
  // await weixinHelloGithubWorkflow.process();
}

bootstrap().catch(console.error);
