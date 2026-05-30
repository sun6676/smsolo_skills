---
name: dingdingdocx
description: 将 Codex 生成的 Markdown 调研报告、会议总结、笔记或任意本地 .md 文件同步到钉钉文档“我的文档”。当用户要求创建、上传、更新、覆写或同步本地 Markdown 到钉钉文档，或询问钉钉文档 API 配置、所需权限、userId/unionId 查询、Codex 输出文档重复同步时，使用此技能。
---

# 钉钉文档同步

## 核心流程

当用户希望把 Codex 生成的内容保存到钉钉文档时使用此技能。优先使用本技能自带脚本，不要临时重写钉钉 API 请求。

1. 先把内容保存为本地 Markdown 文件，例如 `docs/report.md`。
2. 确认 `.env` 或系统环境变量里已经配置钉钉应用凭证。
3. 如有需要，解析钉钉操作人身份：
   - `node <skill>/scripts/get-userid.mjs`
   - `node <skill>/scripts/userid-to-unionid.mjs`
4. 同步任意本地 Markdown 文件：
   - `node <skill>/scripts/sync-dingtalk-doc.mjs path/to/file.md`

Markdown 文件可以位于 Codex 能访问到的任意本地路径，不要求在当前项目中，也不要求在本技能目录中。

## 环境变量

必填：

```env
DINGTALK_APP_KEY=your_client_id
DINGTALK_APP_SECRET=your_secret
```

通常需要填写，或者由脚本自动解析：

```env
DINGTALK_USER_ID=your_dingtalk_userid
DINGTALK_OPERATOR_ID=your_unionid
```

可选：

```env
DINGTALK_DOC_TITLE=文档标题覆盖值
DINGTALK_DOC_KEY=指定要覆写的已有文档 docKey
DINGTALK_WORKSPACE_ID=指定已有 workspaceId
DINGTALK_STATE_FILE=.dingdingdocx-state.json
DINGTALK_MOBILE=用于查询 userId 的手机号
DINGTALK_DEPT_ID=1
DINGTALK_USER_NAME=姓名过滤
```

如果没有提供 `DINGTALK_DOC_KEY`，`sync-dingtalk-doc.mjs` 会在第一次同步时创建钉钉文档，并把返回的 `docKey` 记录到状态文件。之后同步同一个本地路径时，会更新同一篇钉钉文档，避免重复创建。

## 脚本

- `scripts/sync-dingtalk-doc.mjs <markdown-file>`：从任意本地 Markdown 文件创建或更新钉钉文档。
- `scripts/get-userid.mjs [mobile]`：通过 `DINGTALK_MOBILE` 查询钉钉 `userId`，或列出/过滤部门成员。
- `scripts/userid-to-unionid.mjs [userId]`：把钉钉 `userId` 转成 `unionId`，文档接口会把它作为 `operatorId` 使用。
- `scripts/load-env.mjs`：共用 `.env` 加载器。

## 参考资料

遇到以下情况时读取 `references/dingtalk-doc-sync.md`：

- 权限或 scope 报错；
- 判断 `operatorId` 应该填什么；
- 向用户解释配置步骤；
- 避免重复文档或密钥泄露。

## AI 注意事项

- 不要把 `AppSecret`、token、用户凭据硬编码进脚本或生成文档。
- 不要打印密钥。日志和最终回复里要脱敏。
- 如果用户曾把 `AppSecret` 发到聊天里，配置完成后建议用户重置密钥。
- 不要自动删除远端钉钉文档。需要删除重复文档时，先让用户确认，或让用户手动删除。
- 本技能用于“创建/更新钉钉在线文档”，不是通用二进制文件上传。若要上传 PDF、DOCX、图片等二进制文件，需要另写钉盘上传脚本。
