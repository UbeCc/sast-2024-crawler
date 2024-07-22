import logging
import scrapy
from scrapy import Request
from scrapy_douban.items import ScrapyDoubanItem
from scrapy_playwright.page import PageMethod

class DoubanSpider(scrapy.Spider):
    name = 'douban'
    allowed_domains = ['book.douban.com']
    start_urls = ['https://book.douban.com/tag/%E5%B0%8F%E8%AF%B4?start=0']
    output_file = 'output.json'
    
    # custom_settings = {
    #     'PLAYWRIGHT_LAUNCH_OPTIONS': {
    #         'headless': True,
    #     }
    # }

    # 尝试过滤其他请求，无果，有同学若会欢迎联系 ubecwang@gmail.com，感谢！
    # async def handle_route(self, route):
    #     logging.log(logging.CRITICAL, "HELO")
    #     if route.request.resource_type in ['image', 'stylesheet', 'font', 'script']:
    #         await route.abort()
    #     else:
    #         await route.continue_()

    # async def handle_page(self, page):
    #     await page.route('**/*', self.handle_route)

        
    def parse(self, response):
        brief_list = response.xpath('//*[@id="subject_list"]/ul/li')
        for brief in brief_list:
            item = ScrapyDoubanItem()
            item["url"] = brief.xpath('div[2]/h2/a/@href').get()            
            yield response.follow(
                item["url"], 
                callback=self.parse_book_details, 
                meta={
                    "item": item,
                    # "playwright": True,
                    # "playwright_page_methods": [
                    #     PageMethod('wait_for_selector', '//*[@id="link-report"]/span[1]/div'),
                    #     PageMethod('click', '//*[@id="link-report"]/span[1]/div/p[last()]/a'),  # Click '展开全部' button
                    # ]
                })

        next_page = response.xpath('//*[@id="subject_list"]/div[2]/span[4]/a/@href').get()
        if next_page:
            next_page = response.urljoin(next_page)
            yield scrapy.Request(
                next_page,
                callback=self.parse,
                meta={
                    # "playwright": True,
                    # "playwright_context": {
                    #     "route": ('**/*', self.handle_route),
                    # },
                    # "playwright_page_methods": [
                    #     PageMethod("wait_for_selector", '//*[@id="subject_list"]/ul/li'),
                    # ]
                }
            )
    
    def parse_book_details(self, response):
        item = response.meta["item"]
        
        # Detailed information
        info = response.xpath('//*[@id="info"]')
        
        item["title"] = info.xpath('//*[@id="wrapper"]/h1/span/text()').get()
        item['author'] = info.xpath('span[contains(.," 作者")]/following-sibling::a/text()').get()
        item['publisher'] = info.xpath('span[text()="出版社:"]/following-sibling::a/text()').get()
        item['producer'] = info.xpath('span[text()="出品方:"]/following-sibling::a/text()').get()
        item['original_title'] = info.xpath('span[text()="原作名:"]/following::text()[1]').get()
        item['translator'] = info.xpath('span[contains(.," 译者")]/following-sibling::a/text()').get()
        item['pub_year'] = info.xpath('span[text()="出版年:"]/following::text()[1]').get()
        item['pages'] = info.xpath('span[text()="页数:"]/following::text()[1]').get()
        item['price'] = info.xpath('span[text="定价:"]/following::text()[1]').get()
        item['binding'] = info.xpath('span[text()="装帧:"]/following::text()[1]').get()
        item['series'] = info.xpath('span[text()="丛书:"]/following-sibling::a/text()').get()
        item['ISBN'] = info.xpath('span[text="ISBN:"]/following::text()[1]').get()
        
        # Ratings
        item["comment_star"] = response.xpath('//*[@id="interest_sectl"]/div/div[2]/strong/text()').get()
        item["comment_count"] = response.xpath('//*[@id="interest_sectl"]/div/div[2]/div/div[2]/span/a/span/text()').get()
        item["comment_5star"] = response.xpath('//*[@id="interest_sectl"]/div/span[2]/text()').get()
        item["comment_4star"] = response.xpath('//*[@id="interest_sectl"]/div/span[4]/text()').get()
        item["comment_3star"] = response.xpath('//*[@id="interest_sectl"]/div/span[6]/text()').get()
        item["comment_2star"] = response.xpath('//*[@id="interest_sectl"]/div/span[8]/text()').get()
        item["comment_1star"] = response.xpath('//*[@id="interest_sectl"]/div/span[10]/text()').get()
        
        # Introduction
        item['intro'] = response.xpath('//*[@id="link-report"]/span[2]/div/div').css('.intro p::text').getall()
        
        logging.log(logging.CRITICAL, item)
        yield item
        
        
    # TODO: 怎么从书籍信息界面起，继续爬书评，保存为同一个文件