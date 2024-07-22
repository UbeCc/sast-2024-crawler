# Define here the models for your scraped items
#
# See documentation in:
# https://docs.scrapy.org/en/latest/topics/items.html

import scrapy


class ScrapyDoubanItem(scrapy.Item):
    # define the fields for your item here like:
    url = scrapy.Field()
    
    title = scrapy.Field()
    author = scrapy.Field()
    publisher = scrapy.Field()
    producer = scrapy.Field()
    original_title = scrapy.Field()
    translator = scrapy.Field()
    pub_year = scrapy.Field()
    pages = scrapy.Field()
    price = scrapy.Field()
    binding = scrapy.Field()
    series = scrapy.Field()
    ISBN = scrapy.Field()

    comment_star = scrapy.Field()
    comment_count = scrapy.Field()
    comment_5star = scrapy.Field()
    comment_4star = scrapy.Field()
    comment_3star = scrapy.Field()
    comment_2star = scrapy.Field()
    comment_1star = scrapy.Field()
    
    intro = scrapy.Field()