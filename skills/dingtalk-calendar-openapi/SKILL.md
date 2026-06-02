---
name: dingtalk-calendar-openapi
description: 当用户要求查询钉钉日程、创建钉钉会议、回查会议详情、邀请或追加参会人，或询问钉钉日历 OpenAPI 配置和权限时，使用此技能。
---

# 钉钉日历 OpenAPI

## 核心原则

本技能只负责钉钉日历/日程/会议操作，不处理钉钉文档同步。优先使用本技能自带脚本，不要每次临时拼 Node 命令。

## 环境变量

必填：

```env
DINGTALK_APP_KEY=your_app_key
DINGTALK_APP_SECRET=your_app_secret
DINGTALK_OPERATOR_UNION_ID=your_operator_union_id
```

可选：

```env
DINGTALK_CALENDAR_ID=primary
DINGTALK_CONTACTS_FILE=/absolute/path/to/contacts.json
DINGTALK_DEFAULT_TIMEZONE=Asia/Shanghai
DINGTALK_DEFAULT_REMINDER_MINUTES=15
```

配置可以放在当前工作目录的 `.env`，脚本会自动读取。不要把 `AppSecret`、accessToken 或用户凭据写进代码、提交到仓库或打印到回复里。

## 常用脚本

脚本路径中的 `<skill>` 指本技能目录。

- 查询今天日程：
  `node <skill>/scripts/list-events.mjs --today`
- 查询指定日期：
  `node <skill>/scripts/list-events.mjs --date 2026-06-02`
- 查询时间段：
  `node <skill>/scripts/list-events.mjs --start 2026-06-02T10:00:00+08:00 --end 2026-06-02T12:00:00+08:00`
- 创建会议：
  `node <skill>/scripts/create-event.mjs --summary "项目沟通" --start 2026-06-02T10:30:00+08:00 --end 2026-06-02T11:00:00+08:00 --online-meeting`
- 创建并邀请参会人：
  `node <skill>/scripts/create-event.mjs --summary "项目沟通" --start 2026-06-02T10:30:00+08:00 --duration-minutes 30 --attendee 董超 --attendee 雷艾琳 --online-meeting`
- 追加参会人：
  `node <skill>/scripts/add-attendees.mjs --event-id EVENT_ID --attendee 董超 --attendee 雷艾琳`
- 回查会议详情：
  `node <skill>/scripts/get-event.mjs EVENT_ID`

## 联系人映射

如果用户用姓名邀请参会人，优先读取 `contacts.json` 或 `DINGTALK_CONTACTS_FILE` 中的姓名到 unionId 映射。格式：

```json
{
  "董超": "unionId",
  "雷艾琳": "unionId"
}
```

如果没有映射，脚本会把传入值当作 unionId 使用；遇到中文姓名但没有映射时，应先提醒用户补充 `contacts.json`，避免把姓名误发给 OpenAPI。

## 权限

在钉钉开放平台的内部应用里申请并发布权限：

- 查询日程、回查详情：日历应用中日程读权限。
- 创建会议、修改/追加参会人：日历应用中日程写权限。
- 如需按 userId/手机号解析 unionId，可继续复用 `dingdingdocx` 技能里的通讯录查询脚本和对应通讯录权限。

如果接口返回 `requiredScopes` 或 `permissionDeny`，按返回内容补充权限后重新发布应用。

## AI 注意事项

- 默认 `calendarId` 使用 `primary`，除非用户指定其他日历。
- 默认时区使用 `Asia/Shanghai`。
- 创建会议后必须回传 `event.id`、标题、起止时间、参会人和在线会议链接。
- 执行写操作前，确保开始时间、结束时间、标题和参会人来源明确；不要猜测未确认的参会人 unionId。
- 不要删除日程；本技能没有提供删除脚本。
