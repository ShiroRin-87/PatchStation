# 补丁上传流程

## 匹配规则

整个流程需要保证 **三处一致**：

```
data/games.json          public/patches/
┌─────────────────┐      ┌──────────────────────┐
│ id: "sakura" ◄──┐      │  sakura/             │
│ vndbId: "v562"  │  ==  │  ├── kana-cn-v1.zip  │
│ title: "樱之诗"  │      │  └── kana-cn-v1.json │
└─────────────────┘      │      ↑ 文件名必须一致  │
                         └──────────────────────┘
```

| 匹配项 | 说明 |
|---|---|
| `games.json` 的 `id` ↔ `public/patches/` 目录名 | 必须一致。不填 id 时默认用 vndbId（如 `v562`） |
| `.zip` 文件名 ↔ `.json` 文件名 | 去掉扩展名后必须一致。如 `kana-cn-v1.zip` + `kana-cn-v1.json` |
| `games.json` 的 `vndbId` ↔ VNDB 网站 | 必须是 VNDB 上存在的游戏编号，否则构建报错 |

## 1. 获取 VNDB ID

从 [vndb.org](https://vndb.org) 搜索游戏，URL 中的编号即为 VNDB ID。

例如 `https://vndb.org/v562` → VNDB ID 为 `v562`。

## 2. 注册游戏

编辑 `data/games.json`，添加一条记录：

```json
{ "vndbId": "v562", "title": "樱之诗" }
```

| 字段 | 必填 | 说明 |
|---|---|---|
| `vndbId` | 是 | VNDB 游戏 ID |
| `title` | 是 | 中文显示名称 |
| `id` | 否 | 目录名，默认用 vndbId。已有目录结构时需填写 |
| `tags` | 否 | 标签列表，如 `["汉化", "R18", "剧情"]` |
| `overrides.titleJa` | 否 | 日文名，VNDB 提供的太长或缺失时填写 |

VNDB 会自动填充：`titleJa`、`brand`、`releaseDate`、`cover`、`description`、`nsfw`。

## 3. 放置补丁文件

在 `public/patches/<id>/` 下放入两个文件：

```
public/patches/sakura-no-utage/
├── sakura-cn-v1.zip      ← 补丁本体
└── sakura-cn-v1.json     ← 补丁元信息
```

`<id>` 是 `games.json` 中的 id（未填则为 vndbId）。

### 补丁元信息格式 (`.json`)

```json
{
  "name": "樱之诗 汉化补丁",
  "type": "translation",
  "version": "1.0",
  "date": "2020-03-15",
  "author": "萌译汉化组",
  "description": "完整汉化，包含UI汉化"
}
```

| 字段 | 必填 | 说明 |
|---|---|---|
| `name` | 是 | 补丁显示名称 |
| `type` | 否 | 类型：`translation`/`restoration`/`fix`/`mod`/`other`，默认 `translation` |
| `version` | 否 | 版本号，默认 `1.0` |
| `date` | 否 | 日期，默认取文件修改时间 |
| `author` | 否 | 作者/汉化组 |
| `description` | 否 | 补丁说明 |

`size` 和 `file` 路径由构建脚本自动计算，无需填写。

## 4. 构建 & 部署

```bash
npm run build
```

构建脚本会：
- 从 VNDB API 拉取游戏信息（7天缓存）
- 扫描补丁目录，自动计算文件大小
- 生成 `public/data/games.json` 和搜索索引
- 执行 `vite build` 打包前端

推送到 `main` 分支后，GitHub Actions 自动部署到 Pages。

## 示例：添加新游戏

```bash
# 1. 编辑 data/games.json，添加
#    { "vndbId": "v2", "title": "加奈" }

# 2. 创建补丁目录
mkdir public\patches\v2

# 3. 放入文件
#    public/patches/v2/kana-cn-v1.zip
#    public/patches/v2/kana-cn-v1.json

# 4. 构建
npm run build

# 5. 提交推送
git add data/games.json public/patches/v2/
git commit -m "添加 加奈"
git push
```
