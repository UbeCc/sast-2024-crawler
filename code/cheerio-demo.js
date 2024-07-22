// 在这里，我们只用到了如下函数：
// 1. axios.get(url, config)：发送 GET 请求，获取网页内容
// 2. cheerio.load(data)：解析 HTML
// 3. $(selector).each((index, element) => {})：遍历 cheerio 对象
// 4. $(selector).find(selector)：查找子元素
// 5. $(selector).text()：获取元素文本
// 6. $(selector).attr(attr)：获取元素属性

const axios = require('axios');
const cheerio = require('cheerio');

// 爬取的目标 URL
const url = 'https://www.zhihu.com';
// 试试看，如果不给 cookie，是不是不能登陆？
const cookies = process.env.ZHIHU_COOKIE;
async function scrapeZhihu() {
  try {
    // 使用 axios 获取网页内容
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        'Cookie': cookies
      }
    });
    // 使用 cheerio 解析 HTML
    const $ = cheerio.load(data);
    const hotTopics = [];
    // 提取首页热门话题
    const divElements = $('div.TopstoryItem.TopstoryItem-isRecommend');
    let printed = false;
    console.log(`div length: ${divElements.length}`);
    divElements.each((index, element) => {
      const titleElement = $(element).find('h2.ContentItem-title a');
      if (!printed) {
        printed = true;
        console.log(titleElement);
      }
      const title = titleElement.text().trim();
      const link = titleElement.attr('href');
      if (title && link) {
        hotTopics.push({
          title,
          link: `https://www.zhihu.com${link}`
        });
      }
    });

    // 提取首页推荐回答
    const recommendedAnswers = [];
    $('div.TopstoryItem.TopstoryItem-isRecommend').each((index, element) => {
      const questionTitleElement = $(element).find('h2.ContentItem-title a');
      const questionTitle = questionTitleElement.text().trim();
      const answerExcerptElement = $(element).find('span.RichText.ztext');
      const answerExcerpt = answerExcerptElement.text().trim();
      const link = questionTitleElement.attr('href');
      if (questionTitle && answerExcerpt && link) {
        recommendedAnswers.push({
          questionTitle,
          answerExcerpt,
          link: `https://www.zhihu.com${link}`
        });
      }
    });

    // 打印提取的信息
    console.log('Hot Topics:', hotTopics[0]);
    console.log('Hot Topic length:', hotTopics.length);
    console.log('Recommended Answers:', recommendedAnswers[0]);
    console.log('Recommended Answers length:', recommendedAnswers.length);
  } catch (error) {
    console.error('Error fetching the webpage:', error);
  }
}

// 运行爬虫
scrapeZhihu();