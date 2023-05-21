import { Readability } from '@mozilla/readability'
import { md5 } from '@components/Utils'

const MAX_LENGTH = 2000;

const userSelectionInit = () => {
    document.addEventListener("selectionchange", () => {
        const text = userSelection();
        if (text != '') localStorage.setItem('___userSelection', text)
        // console.log(text)
        return text
    });
}

const userSelection = () => {
    const selObj: any = window.getSelection();
    // let textContent = selObj.type !== 'None' ? (selObj.getRangeAt(0)).startContainer.textContent : '';
    let textContent = selObj.toString();
    return textContent.trim();
}

const promptBindText = (userText: string, prompt: string) => {
    const text = userText.replace(/\s+/ig, ' ');
    prompt = prompt.trim();
    const count = prompt.length;
    prompt = `'''${MAX_LENGTH - count > 0 ? text.slice(0, MAX_LENGTH - count) : ''}''',` + prompt;
    return prompt
}

const promptBindUserSelection = (prompt: string) => {
    const userText = localStorage.getItem('___userSelection') || ''
    if (prompt && userText) {
        prompt = promptBindText(userText, prompt)
    }
    return prompt
}


const promptBindUserClipboard = async (prompt: string) => {
    let text = await navigator.clipboard.readText()
    // console.log('navigator.clipboard.readText()', text)
    if (text && prompt) {
        prompt = promptBindText(text, prompt)
    }
    return prompt
}


const extractArticle = () => {
    const documentClone: any = document.cloneNode(true);
    let article: any = {};

    let divs: any = [...document.body.children]
    divs = divs.filter((d: any) => d.className != '_agi_ui')

    let elements = Array.from(divs, (div: any) => [...div.querySelectorAll('p')].flat()).flat().filter((f: any) => f);

    article.elements = Array.from(elements, (e: any, index) => {
        e.id = md5(e.innerText.trim())
        return {
            element: e,
            text: e.innerText.trim(),
            html: e.outerHTML
        }
    }).flat().filter((d: any) => d.text);
    // article.elements = Array.from(elements, (t: any) => t.element)


    try {
        article = { ...(new Readability(documentClone, { nbTopCandidates: 10, charThreshold: 800 }).parse()), ...article };
    } catch (error) {
        let d = document.createElement('div');
        d.innerHTML = Array.from(divs, (d: any) => d.innerHTML).join('');
        article.title = document.title;
        article.textContent = (Array.from(['p', 'span', 'h1'], e => Array.from(d.querySelectorAll(e), (t: any) => t.innerText.trim()).filter(f => f)).flat()).join("")
    }
    console.log('_extractArticle', article)
    article.href = window.location.href.replace(/\?.*/ig, '');
    return article
}

const promptBindCurrentSite = (prompt: string, type = 'text') => {
    // 获取当前网页正文信息
    const { length, title, textContent, href, elements } = extractArticle();
    // console.log(prompt,type)
    if (prompt && type == 'text') {
        const text = textContent.trim().replace(/\s+/ig, ' ');
        prompt = prompt.trim();
        const t = `'''标题:${title},网址:${href}'''`
        const count = prompt.length + t.length;
        prompt = `'''${t}${MAX_LENGTH - count > 0 ? `,正文:${text.slice(0, MAX_LENGTH - count)}` : ''}''',` + prompt;
    } else if (prompt && type == 'html') {
        const htmls = Array.from(elements, (t: any) => t.html)
        prompt = `'''${JSON.stringify(htmls)}''',` + prompt;
    } else if (prompt && type == 'url') {
        const htmls = Array.from(elements, (t: any) => t.html)
        prompt = `'''标题:${title},网址:${href}''',` + prompt;
    }
    return prompt
}

// 拆解任务目标
const promptBindTasks = (prompt: string) => {
    prompt = prompt.trim();
    return `'''${prompt}''',针对以上的任务目标，一步步思考如何完成，按照可行的步骤列出来：`
}

// 高亮信息
const promptBindHighlight = (prompt: string) => {
    prompt = prompt.trim();
    return `'''${prompt}''',从以上html元素中选择最值得看的信息，返回top5的元素id号给我`
}

/**
 * 
 * @returns element
 */
const extractDomElement = () => {
    // 获取当前网页正文信息
    const { elements } = extractArticle();
    return Array.from(elements, (t: any) => t.element)
}

export {
    promptBindCurrentSite,
    promptBindUserSelection,
    userSelectionInit,
    promptBindUserClipboard,
    extractDomElement,
    promptBindTasks,
    promptBindHighlight
}