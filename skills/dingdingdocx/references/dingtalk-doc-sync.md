# 钉钉文档同步参考

## 用途

此技能用于把本地 Markdown 文件同步到钉钉文档“我的文档”。典型 Codex 工作流是：先把调研报告、会议纪要、总结等内容写成本地 `.md` 文件，再把这份文件同步成钉钉在线文档。

## 需要开通的权限

钉钉企业内部应用需要开通、保存并发布以下权限：

- `qyapi_get_member`：查询成员详情，用于把 `userId` 转成 `unionId`。
- `Wiki.Workspace.Read`：读取用户可访问的钉钉文档空间，包括“我的文档”。
- `Document.WorkspaceDocument.Write`：创建和写入钉钉文档空间中的文档。
- `Storage.File.Write`：写入钉钉文档底层存储内容。

如果接口返回 `requiredScopes`，按返回的 scope 去钉钉开放平台开通对应权限后重试。

## 关键 ID

- `DINGTALK_APP_KEY`：企业内部应用的 Client ID / AppKey。
- `DINGTALK_APP_SECRET`：企业内部应用的 Client Secret / AppSecret。
- `DINGTALK_USER_ID`：钉钉通讯录 userId，不是应用 ID。
- `DINGTALK_OPERATOR_ID`：钉钉 unionId，文档接口把它作为操作人 `operatorId`。

先用 `get-userid.mjs` 查 `userId`，再用 `userid-to-unionid.mjs` 查 `unionId`。

## 推荐 .env

```env
DINGTALK_APP_KEY=your_app_key
DINGTALK_APP_SECRET=...
DINGTALK_USER_ID=...
DINGTALK_OPERATOR_ID=...
DINGTALK_DEPT_ID=1
```

不要提交 `.env`。

## 同步行为

`sync-dingtalk-doc.mjs` 接收任意本地 Markdown 路径：

```powershell
node C:\Users\mo\.codex\skills\dingdingdocx\scripts\sync-dingtalk-doc.mjs E:\reports\research.md
```

脚本会在当前工作目录的 `.dingdingdocx-state.json` 中记录“本地路径 -> docKey”的映射。这样同一个文件再次同步时会更新同一篇钉钉文档，而不是重复创建。

设置 `DINGTALK_DOC_KEY` 可以强制覆写指定的已有钉钉文档。

## AI 注意事项

- 始终先把生成的报告保存到本地 Markdown 文件，再同步这个文件路径。
- 默认标题来自 Markdown 文件名，也可以通过 `DINGTALK_DOC_TITLE` 覆盖。
- 重复同步应通过状态文件更新同一篇文档。
- 如果失败运行期间创建了重复文档，不要自动删除远端文档。先让用户确认，或让用户手动删除。
- 最终回复中要脱敏 `AppSecret`、token、cookie、手机号、文档访问令牌等敏感信息。
- 如果用户曾把 `AppSecret` 贴到聊天里，配置完成后建议用户重置密钥。
