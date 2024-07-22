# 在这里，我们使用 selenium 模拟点击按钮，点击 100000 次，然后获取按钮点击次数。
# 函数解释如下：
# 1. WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.ID, "clickButton"))):
#    等待页面中的 clickButton 元素加载完成。
# 2. button = driver.find_element(By.ID, "clickButton"):
#    获取页面中的 clickButton 元素。
# 3. button.click():
#    点击按钮。
# 4. driver.find_element(By.ID, "clickCount").text:
#    获取页面中的 clickCount 元素的文本内容。
# 5. driver.quit():
#    关闭浏览器。

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import os

driver = webdriver.Chrome()

try:
    path = os.getcwd()
    driver.get(f"file:///{path}/html/click.html")
    
    WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.ID, "clickButton"))
    )
    
    button = driver.find_element(By.ID, "clickButton")
    
    for _ in range(100000):
        button.click()
        time.sleep(0.0001)
    
    click_count = driver.find_element(By.ID, "clickCount").text
    print(f"按钮被点击了 {click_count} 次")
finally:
    driver.quit()