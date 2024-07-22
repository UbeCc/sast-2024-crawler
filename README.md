# 代码食用指南

> 你需要安装 `python` 和 `nodejs` 相关环境

## `python`

首先下载 `python`，然后在本目录运行
```python
pip install -r requirements.txt
```

为了使用 `selenium` 库，你需要先安装 [Chrome Driver](https://developer.chrome.com/docs/chromedriver/downloads?hl=zh-cn)

## `nodejs`

请参考 [官方文档](https://nodejs.org/en/download/package-manager/current) 安装 `nodejs`。随后进入代码目录 (`cd code`)，并为 `npm` 换源

```shell
npm config set registry https://registry.npm.taobao.org
```

随后安装 `node` 所需依赖

```shell
npm install axios cheerio fs path puppeteer path
```