// ==UserScript==
// @name         知乎爬虫
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  爬知乎，三个功能：①从首页爬标题；②从单个回答界面爬完整回复；③从所有回答界面爬，仅支持爬取已浏览的部分。
// @author       Haoran Wang
// @match        https://www.zhihu.com/
// @match        https://www.zhihu.com/question/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function createButton(text, onClick) {
        const button = document.createElement('button');
        button.textContent = text;
        button.style.position = 'fixed';
        button.style.top = '10px';
        button.style.right = '10px';
        button.style.zIndex = '9999';
        button.style.backgroundColor = '#0073e6';
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.padding = '10px 20px';
        button.style.borderRadius = '12px';
        button.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        button.style.cursor = 'pointer';
        button.style.transition = 'background-color 0.3s, box-shadow 0.3s';

        button.addEventListener('mouseover', () => {
            button.style.backgroundColor = '#005bb5';
            button.style.boxShadow = '0 6px 8px rgba(0, 0, 0, 0.15)';
        });

        button.addEventListener('mouseout', () => {
            button.style.backgroundColor = '#0073e6';
            button.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        });

        button.addEventListener('click', onClick);
        document.body.appendChild(button);

        // Make the button draggable
        let isDragging = false;
        let offsetX = 0;
        let offsetY = 0;

        button.addEventListener('mousedown', (e) => {
            isDragging = true;
            offsetX = e.clientX - button.getBoundingClientRect().left;
            offsetY = e.clientY - button.getBoundingClientRect().top;
            button.style.cursor = 'grabbing';
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                button.style.left = `${e.clientX - offsetX}px`;
                button.style.top = `${e.clientY - offsetY}px`;
                button.style.right = 'auto'; // Reset the right position to prevent width issues
            }
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
            button.style.cursor = 'pointer';
        });
    }

    function saveAsJSON(data, filename) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filename}_${timestamp}.json`; // Add timestamp to filename
        document.body.appendChild(a);
        a.click();
        // Delay the revocation of the object URL to ensure the download is processed
        setTimeout(() => {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        }, 100); // Slightly increased delay to ensure smooth download
    }

    // Function to scrape content from Zhihu home page
    function scrapeHomePageContent(count) {
        const newsItems = [];
        const elems = document.querySelectorAll('div[class*="TopstoryItem"]');
        console.log(elems);
        elems.forEach((element, index) => {
            if (index < count) {
                const titleElement = element.querySelector('h2.ContentItem-title a');
                const linkElement = element.querySelector('a.ContentItem-main');
                const summaryElement = element.querySelector('div.RichContent-inner');

                const title = titleElement ? titleElement.textContent.trim() : '';
                const link = titleElement ? titleElement.href : '';
                const summary = summaryElement ? summaryElement.textContent.trim() : '';

                console.log(title, link, summary, index, count);
                if (title && link) {
                    newsItems.push({ title, link, summary });
                }
            }
        });

        console.log('Extracted news items:', newsItems);
        alert(`Extracted ${newsItems.length} items from Zhihu home page.`);

        // Save the extracted data as JSON file
        saveAsJSON(newsItems, 'zhihu_home_page_items');
    }

    function scrapeAnswerPage(count) {
        const replies = [];
        document.querySelectorAll('.QuestionAnswer-content').forEach((element, index) => {
            const authorElement = element.querySelector('.AuthorInfo-name a');
            const avatarElement = element.querySelector('.Avatar.AuthorInfo-avatar');
            const contentElement = element.querySelector('.RichText.ztext');
            const upvoteElement = element.querySelector('.VoteButton--up');
            const commentElement = element.querySelector('.Button--withIcon.Button--withLabel');

            const author = authorElement ? authorElement.textContent.trim() : '';
            const avatar = avatarElement ? avatarElement.src : '';
            const content = [];

            if (contentElement) {
                contentElement.childNodes.forEach(node => {
                    if (node.nodeType === Node.TEXT_NODE) {
                        content.push(node.textContent.trim());
                    } else if (node.nodeType === Node.ELEMENT_NODE) {
                        if (node.tagName === 'IMG') {
                            content.push({
                                type: 'image',
                                src: node.getAttribute('src'),
                                alt: node.getAttribute('alt') || ''
                            });
                        } else {
                            content.push(node.textContent.trim());
                        }
                    }
                });
            }

            const upvotes = upvoteElement ? upvoteElement.textContent.replace(/[^\d]/g, '').trim() : '0';
            const comments = commentElement ? commentElement.textContent.replace(/[^\d]/g, '').trim() : '0';

            if (author && content.length > 0) {
                replies.push({
                    author,
                    avatar,
                    content,
                    upvotes: parseInt(upvotes, 10),
                    comments: parseInt(comments, 10)
                });
            }
        });

        console.log('Extracted replies:', replies);
        alert(`Extracted ${replies.length} replies from Zhihu question page.`);
        saveAsJSON(replies, 'zhihu_single_question_reply');
    }

    // Function to scrape replies from Zhihu question page
    function scrapeQuestionPageReplies(count) {
        const questionTitleElement = document.querySelector('h1.QuestionHeader-title');
        const questionTitle = questionTitleElement ? questionTitleElement.textContent.trim() : '';

        function parseQuestionRichText(element) {
            // Click the "Show All" button if it exists to expand the content
            const showAllButton = element.querySelector('.QuestionRichText-more');
            if (showAllButton) {
                showAllButton.click();
            }
            const textElement = element.querySelector('span[itemprop="text"]');
            const textContent = textElement ? textElement.textContent.trim() : '';
            return textContent;
        }
        const questionContentElement = document.querySelector('.QuestionRichText.QuestionRichText--expandable.QuestionRichText--collapsed');
        const questionContent = parseQuestionRichText(questionContentElement);

        const replies = [];
        const elems = document.querySelectorAll('.List-item'); // Find all elements with class "List-item"
        elems.forEach((element, index) => {
            if (index < count) {
                const authorElement = element.querySelector('.AuthorInfo-name a');
                const authorLinkElement = element.querySelector('.UserLink-link');
                const avatarElement = element.querySelector('.Avatar.AuthorInfo-avatar');
                const contentElement = element.querySelector('.RichText.ztext');
                const upvoteElement = element.querySelector('.VoteButton--up');
                const commentElement = element.querySelector('.Button--withIcon.Button--withLabel');
                const timeElement = element.querySelector('.ContentItem-time span');

                const author = authorElement ? authorElement.textContent.trim() : '';
                const authorLink = authorLinkElement ? authorLinkElement.href : '';
                const avatar = avatarElement ? avatarElement.src : '';
                const content = [];
                let publishDate = '';
                let editDate = '';

                if (timeElement) {
                    const timeText = timeElement.getAttribute('aria-label');
                    const publishMatch = timeText.match(/发布于 (\d{4}-\d{2}-\d{2})/);
                    const editMatch = timeText.match(/编辑于 (\d{4}-\d{2}-\d{2})/);
                    if (publishMatch) {
                        publishDate = publishMatch[1];
                    }
                    if (editMatch) {
                        editDate = editMatch[1];
                    }
                }

                if (contentElement) {
                    contentElement.childNodes.forEach(node => {
                        if (node.nodeType === Node.TEXT_NODE) {
                            content.push(node.textContent.trim());
                        } else if (node.nodeType === Node.ELEMENT_NODE) {
                            if (node.tagName === 'IMG') {
                                content.push({
                                    type: 'image',
                                    src: node.getAttribute('src'),
                                    alt: node.getAttribute('alt') || ''
                                });
                            } else {
                                content.push(node.textContent.trim());
                            }
                        }
                    });
                }
                const upvotes = upvoteElement ? upvoteElement.textContent.replace(/[^\d]/g, '').trim() : '0';
                const comments = commentElement ? commentElement.textContent.replace(/[^\d]/g, '').trim() : '0';

                if (author && content.length > 0) {
                    replies.push({
                        questionTitle,
                        questionContent,
                        author,
                        authorLink,
                        avatar,
                        content,
                        upvotes: parseInt(upvotes, 10),
                        comments: parseInt(comments, 10),
                        publishDate,
                        editDate
                    });
                }
            }
        });

        console.log('Extracted replies:', replies);
        alert(`Extracted ${replies.length} replies from Zhihu question page.`);
        saveAsJSON(replies, 'zhihu_question_replies');
    }

    window.addEventListener('load', () => {
        const pathSegments = window.location.pathname.split('/');
        if (window.location.hostname === 'www.zhihu.com') {
            if (pathSegments.length === 3 && pathSegments[1] === 'question') {
                createButton('爬爬爬！', () => {
                    const count = prompt('Enter the number of replies to scrape:', '10');
                    if (count) {
                        scrapeQuestionPageReplies(parseInt(count, 10));
                    }
                });
            } else if (pathSegments.length === 5 && pathSegments[1] === 'question' && pathSegments[3] === 'answer') {
                createButton('爬爬爬！', () => {
                    scrapeAnswerPage();
                });
            } else if (window.location.pathname === '/') {
                // On home page
                createButton('爬爬爬！', () => {
                    const count = prompt('Enter the number of items to scrape:', '10');
                    if (count) {
                        scrapeHomePageContent(parseInt(count, 10));
                    }
                });
            }
        }
    });
})();