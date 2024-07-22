import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

// 访问知乎主页并截图
const demo1 = async () => {
  const browser = await puppeteer.launch({
    headless: false, // 开启浏览器界面
    defaultViewport: null,
    args: ["--start-maximized"],
    slowMo: 100, // 每一步放慢 100ms
    executablePath: CHROME_PATH
  });

  const page = await browser.newPage();
  await page.goto('https://www.zhihu.com', {
    waitUntil: 'networkidle2', // 等待网络空闲时再继续执行
  });

  // 截图
  // 要检查和创建的文件夹路径
  const folderPath = path.join(__dirname, 'assets');
  if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });
  await page.screenshot({ path: 'assets/zhihu_home.png' });

  await browser.close();
};

// 登录知乎并查看个人主页
const demo2 = async () => {
  const username = process.env.ZHIHU_USERNAME;
  const password = process.env.ZHIHU_PASSWORD;
  const browser = await puppeteer.launch({
    headless: false, // 开启浏览器界面
    defaultViewport: null,
    args: ["--start-maximized"],
    slowMo: 100, // 每一步放慢 100ms
    executablePath: CHROME_PATH
  });

  const page = await browser.newPage();
  await page.goto('https://www.zhihu.com/signin', {
    waitUntil: 'networkidle2',
  });

  await page.waitForSelector('.SignFlow-tabs', { visible: true });
  await page.evaluate(() => {
    const tabs = document.querySelectorAll('.SignFlow-tabs .SignFlow-tab');
    if (tabs.length > 1) {
      tabs[1].click();
    }
  });
  // 输入账号和密码
  await page.type('input[name="username"]', username);
  await page.type('input[name="password"]', password);

  // 点击登录按钮
  await page.click('button[type="submit"]');

  // 等待页面导航
  await page.waitForNavigation({ waitUntil: 'networkidle2' });

  // 截图个人主页
  await page.goto('https://www.zhihu.com/people/your_username', {
    waitUntil: 'networkidle2',
  });
  await page.screenshot({ path: 'assets/zhihu_profile.png' });
};

// 搜索结果并打印标题
const demo3 = async (browser) => {
  const page = await browser.newPage();
  await page.goto('https://www.zhihu.com', {
    waitUntil: 'networkidle2',
  });

  // 输入搜索内容
  await page.type('input[name="q"]', 'Puppeteer');

  // 提交搜索
  await page.keyboard.press('Enter');

  // 等待搜索结果加载
  await page.waitForSelector('.List-item');

  // 获取搜索结果的标题
  const titles = await page.evaluate(() => {
    const elements = document.querySelectorAll('.List-item h2');
    return Array.from(elements).map(el => el.innerText);
  });

  // 打印标题
  console.log('搜索结果标题:');
  titles.forEach(title => console.log(title));

  await browser.close();
};

// 抓取知乎首页的热门话题
const demo4 = async () => {
  const browser = await puppeteer.launch({
    headless: false, // 开启浏览器界面
    defaultViewport: null,
    args: ["--start-maximized"],
    slowMo: 100, // 每一步放慢 100ms
    executablePath: CHROME_PATH
  });

  const page = await browser.newPage();
  await page.goto('https://www.zhihu.com', {
    waitUntil: 'networkidle2',
  });

  // 抓取热门话题
  const hotTopics = await page.evaluate(() => {
    const elements = document.querySelectorAll('.HotItem-content h2');
    return Array.from(elements).map(el => el.innerText);
  });

  // 打印热门话题
  console.log('热门话题:');
  hotTopics.forEach(topic => console.log(topic));

  await browser.close();
};

// 抓取知乎问题答案
const demo5 = async () => {
  const browser = await puppeteer.launch({
    headless: false, // 开启浏览器界面
    defaultViewport: null,
    args: ["--start-maximized"],
    slowMo: 100, // 每一步放慢 100ms
    executablePath: CHROME_PATH
  });

  const page = await browser.newPage();
  await page.goto('https://www.zhihu.com/question/24399025', {
    waitUntil: 'networkidle2',
  });

  // 抓取答案
  const answers = await page.evaluate(() => {
    const elements = document.querySelectorAll('.List-item .RichContent-inner');
    return Array.from(elements).map(el => el.innerText);
  });

  // 打印答案
  console.log('答案:');
  answers.forEach(answer => console.log(answer));

  await browser.close();
};

// demo1();
const browser = await demo2();
demo3(browser);
// demo4();
// demo5();