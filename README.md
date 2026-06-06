# smsolo skills

个人维护的 Codex skills 仓库。

## 目录结构

- `skills/`：每个子目录对应一个独立 skill。
- `skills/<skill-name>/SKILL.md`：skill 的主说明文件。
- `skills/<skill-name>/agents/openai.yaml`：可选的界面展示元数据。
- `skills/<skill-name>/scripts/`：可复用脚本。
- `skills/<skill-name>/references/`：技能使用时可按需读取的参考资料。

## 已维护技能

- `ai-development-standards`：AI 协作开发规范，覆盖双通道沟通、安全红线、TDD 反馈闭环、代码规范、提交纪律和用户协作习惯。
- `thesis-defense-ppt-generator`：硕士论文答辩 PPT 生成器。
- `custom-codex-pet-generator`：自定义 Codex 宠物生成器。
- `experience-distiller`：把任务中沉淀出的偏好、流程、项目状态、失败案例、权限规则和校验逻辑分流到合适的 Codex 记忆资产。
- `dingdingdocx`：将 Codex 生成的 Markdown 调研报告、会议总结或本地 `.md` 文件同步到钉钉文档“我的文档”，支持 userId/unionId 查询、首次创建和后续覆写更新。
- `dingtalk-calendar-openapi`：通过钉钉日历 OpenAPI 查询日程、创建会议、追加参会人并回查会议详情。

## 使用建议

- 安装 `experience-distiller` 后，建议在全局 `AGENTS.md` 中加入任务结束触发规则：任务结束时主动检查是否有经验值得进入 `AGENTS.md`、`Skill`、`vault`、`eval`、`.rules` 或 `hooks`，让可复用经验沉淀成可持续进化的 Codex 记忆资产。
