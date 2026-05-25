# Custom Codex Pet Request Template

Use this template when the user wants a reusable prompt for creating a Codex pet.

```text
请使用 $custom-codex-pet-generator 创建一个名为 <pet_id> 的自定义 Codex 宠物。

视觉灵感：
<写入人物气质、品牌线索、动物、物品、角色氛围或参考图片说明>

设计要求：
- 做成原创、非精确复刻、不可识别为真实个人或受保护角色的 Q 版数字宠物。
- 保留灵感中的核心气质：<例如友好、聪明、贪吃、安静、活泼、专业、治愈>。
- 风格为可爱的 chibi sticker mascot，轮廓清晰，颜色稳定，适合 192x208 的 Codex 宠物格子。
- 可以加入一个小型身份道具或图案：<例如零食袋、小围巾、小终端、小背包>。
- 不要文字、logo、截图、场景背景、阴影、发光、漂浮特效或可读标记。

执行要求：
- 如有需要，可以使用子代理并行生成动作行。
- 如果任何动作行失败或 QA 不通过，只重试失败行。
- 最终生成完整 9 个状态：idle、running-right、running-left、waving、jumping、failed、waiting、running、review。
- 完成后打包到 `${CODEX_HOME:-$HOME/.codex}/pets/<pet_id>/`。

完成后请告诉我：
- 宠物保存路径。
- `pet.json` 和 `spritesheet.webp` 的位置。
- QA/run 文件夹位置。
- 如何在 Codex 设置中启用，并提醒我可以用 `/pet` 唤醒。
```

Example:

```text
请使用 $custom-codex-pet-generator 创建一个名为 cutepet 的自定义 Codex 宠物。

视觉灵感：
参考“大胃袋良子”的友好、可爱、爱吃东西的气质，但不要复刻真人长相。

设计要求：
- 做成原创、非精确复刻、不可识别为真实个人的 Q 版数字宠物。
- 保留友好、贪吃、陪伴感强的气质。
- 风格为可爱的 chibi sticker mascot，轮廓清晰，颜色稳定，适合 Codex 宠物。
- 可以加入小零食袋作为身份道具。

执行要求：
- 可以使用子代理生成并完成宠物。
- 如果任何行失败，重试失败行。
- 完成后打包到 `${CODEX_HOME:-$HOME/.codex}/pets/cutepet/`。
```
