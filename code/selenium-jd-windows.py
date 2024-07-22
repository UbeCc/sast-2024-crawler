# TODO: requirements.txt
import os
os.environ['JD_USERNAME'] = 'MyUsername'
os.environ['JD_PASSWORD'] = 'MyPassword'
   
import json
from pynput import mouse
import math
import os
import time
import random
from urllib import request
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
import cv2
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import pyautogui
CHROME_OFFSET_X = 850
#此处有改动
CHROME_OFFSET_Y = 650
MAX_RETRY = 5

def calc_dist():
    click_positions = []

    def on_click(x, y, button, pressed):
        if pressed:
            print(f"Mouse clicked at ({x}, {y})")
            click_positions.append((x, y))
            if len(click_positions) == 2:
                return False

    def calculate_distance_and_y_diff(pos1, pos2):
        x1, y1 = pos1
        x2, y2 = pos2
        distance = math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
        y_diff = y2 - y1
        return distance, y_diff

    with mouse.Listener(on_click=on_click) as listener:
        listener.join()

    if len(click_positions) == 2:
        pos1, pos2 = click_positions
        distance, y_diff = calculate_distance_and_y_diff(pos1, pos2)
        print(f"Distance between points: {distance}")
        print(f"Difference in y values: {y_diff}")
    else:
        print("Catch less than 2 points.")

def login_jd(driver):
    driver.get("https://passport.jd.com/new/login.aspx")
    driver.find_element(By.XPATH, '//*[@id="loginname"]').send_keys(os.environ["JD_USERNAME"])
    driver.find_element(By.XPATH, '//*[@id="nloginpwd"]').send_keys(os.environ["JD_PASSWORD"])
    login_button = driver.find_element(By.XPATH, '//*[@id="loginsubmit"]')

    retry = 0
    while retry < MAX_RETRY:
        try:
            login_button.click()
            break
        except:
            time.sleep(0.5)
            retry += 1

    while True:
        try:
            base_selector = WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.XPATH, '//*[@id="JDJRV-wrap-loginsubmit"]/div/div/div/div[1]/div[2]/div[1]/img'))
            )
            
            slider_selector = WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.XPATH, '//*[@id="JDJRV-wrap-loginsubmit"]/div/div/div/div[1]/div[2]/div[2]/img'))
            )

            base_name = "base.jpg.tmp"
            slider_name = "slider.jpg.tmp"
            request.urlretrieve(base_selector.get_attribute("src"), base_name)
            request.urlretrieve(slider_selector.get_attribute("src"), slider_name)

            base_rgb = cv2.imread(base_name)
            base_gray = cv2.cvtColor(base_rgb, cv2.COLOR_BGR2GRAY)
            slider_rgb = cv2.imread(slider_name, 0)
            
            # 使用 TM_CCOEFF_NORMED 匹配，这是一种归一化相关系数匹配方法
            res = cv2.matchTemplate(base_gray, slider_rgb, cv2.TM_CCOEFF_NORMED)
            value = cv2.minMaxLoc(res)
            # value: (min_val, max_val, min_loc, max_loc)
            x = value[2][0]
            
            # WebDriverWait(driver, 1000).until(EC.element_to_be_clickable((By.XPATH, '//*[@id="content"]/div[2]/div[1]/div/div[3]/a')))
            base_image_width = cv2.imread(base_name).shape[1] 
            base_browser_width = base_selector.size['width']
            
            x = x / base_image_width * base_browser_width
            
            # 滑块的起始坐标，需要根据浏览器添加 offset
            # (0, 0) 为左上，x 轴向右，y 轴向下
            slider = driver.find_element(By.XPATH, '//*[@id="JDJRV-wrap-loginsubmit"]/div/div/div/div[2]/div[3]')
            slider_location = slider.location
            slider_size = slider.size
            offset_x = slider_location['x'] + slider_size['width'] / 2
            offset_y = slider_location['y'] + slider_size['height'] / 2
            
            # 获取浏览器窗口的位置，需要用到 JavaScript
            window_x = driver.execute_script("return window.screenLeft;")
            window_y = driver.execute_script("return window.screenTop;")
            
            # pyautogui.moveTo(window_x, window_y, duration=0.5)
            # WebDriverWait(driver, 1000).until(EC.element_to_be_clickable((By.XPATH, '//*[@id="content"]/div[2]/div[1]/div/div[3]/a')))
            
            # 滑块的起始坐标，【注意这里要根据自己的浏览器补一个 offset，offset 测量方法看 calc_dist】
            screen_x = offset_x + window_x +CHROME_OFFSET_X
            screen_y = offset_y + window_y + CHROME_OFFSET_Y
            
            # 使用 pyautogui 模拟滑动
            # WebDriverWait(driver, 1000).until(EC.element_to_be_clickable((By.XPATH, '//*[@id="content"]/div[2]/div[1]/div/div[3]/a')))
            pyautogui.moveTo(screen_x, screen_y, duration=0.5)
            pyautogui.mouseDown() # 按下鼠标左键

            # 滑动路径，京东不允许一步到位...
            # 也就是说，滑动路径上一定要有起伏
            pyautogui.moveTo(screen_x + int(x), screen_y + random.uniform(-0.01, 0.01), duration = 0.2 + random.uniform(0, 0.1))
            #此处有改动
            pyautogui.moveTo(screen_x + int(x*2), screen_y + random.uniform(-0.01, 0.01), duration = 0.2 + random.uniform(0, 0.1))
            pyautogui.mouseUp() # 释放鼠标左键
            
            os.remove(base_name)
            os.remove(slider_name)
            time.sleep(1)

            if driver.current_url == "https://www.jd.com/":
                break
        except:
            continue

# 爬取有关原神的商品信息
def crawl_tsinghua(driver):
    search_box = driver.find_element(By.XPATH, '//*[@id="key"]')
    search_box.send_keys("原神")
    search_button = driver.find_element(By.XPATH, '//*[@id="search"]/div/div[2]/button')
    search_button.click()

    # 等待页面加载完成
    # driver.implicitly_wait(0.5)
    WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.XPATH, '//*[@id="J_goodsList"]/ul/li[2]/div/div[1]/a/img'))
    )

    # 获取商品信息
    goods = driver.find_elements(By.XPATH, '//*[@id="J_goodsList"]/ul/li')
    
    good_data = []
    for good in goods:
        sku = good.get_attribute('data-sku')

        link_element = good.find_element(By.XPATH, './/div[@class="p-img"]/a')
        link = link_element.get_attribute('href')
        
        title = link_element.get_attribute('title')
        
        price_element = good.find_element(By.XPATH, './/div[@class="p-price"]/strong/i')
        price = price_element.text
        
        comment_element = good.find_element(By.XPATH, './/div[@class="p-commit"]/strong/a')
        comments = comment_element.text
        
        shop_element = good.find_element(By.XPATH, './/div[@class="p-shop"]/span/a')
        shop_name = shop_element.text
        
        good_data.append({
            "sku": sku,
            "link": link,
            "title": title,
            "price": price,
            "comments": comments,
            "shop_name": shop_name
        })

    driver.quit()
    return good_data

def crawl_jd(driver, page_count=2, keyword='原神'):
    search_box = driver.find_element(By.XPATH, '//*[@id="key"]')
    search_box.send_keys(keyword)
    search_button = driver.find_element(By.XPATH, '//*[@id="search"]/div/div[2]/button')
    search_button.click()

    # 等待页面加载完成
    WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.XPATH, '//*[@id="J_goodsList"]/ul/li[2]/div/div[1]/a/img'))
    )

    # 获取商品信息
    good_data = []
    for _ in range(0, page_count):
        goods = driver.find_elements(By.XPATH, '//*[@id="J_goodsList"]/ul/li')
        print("QWQ")
        
        for good in goods:
            sku = good.get_attribute('data-sku')

            link_element = good.find_element(By.XPATH, './/div[@class="p-img"]/a')
            link = link_element.get_attribute('href')
            
            title = link_element.get_attribute('title')
            
            price_element = good.find_element(By.XPATH, './/div[@class="p-price"]/strong/i')
            price = price_element.text
            
            comment_element = good.find_element(By.XPATH, './/div[@class="p-commit"]/strong/a')
            comments = comment_element.text
            
            shop_element = good.find_element(By.XPATH, './/div[@class="p-shop"]/span/a')
            shop_name = shop_element.text
            
            good_data.append({
                "sku": sku,
                "link": link,
                "title": title,
                "price": price,
                "comments": comments,
                "shop_name": shop_name
            })

        next_page = driver.find_element(By.XPATH, '//*[@id="J_bottomPage"]/span[1]/a[9]')
        next_page.click()

        # 等待页面加载完成
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.XPATH, '//*[@id="J_goodsList"]/ul/li[2]/div/div[1]/a/img'))
        )

    driver.quit()
    return good_data

if __name__ == "__main__":
    keyword = "清华大学文创"
    page_count = 2

    chrome_options = Options()
    driver = webdriver.Chrome(options=chrome_options)
    driver.maximize_window()

    login_jd(driver=driver)

    data = crawl_jd(driver=driver, page_count=page_count, keyword=keyword)
    print(data)
    timestamp = time.strftime("%Y-%m-%d-%H-%M-%S", time.localtime())
    with open(f"{keyword}-{page_count}pages-{timestamp}.json", "w") as f:
        json.dump(data, f)

    # calc_dist()