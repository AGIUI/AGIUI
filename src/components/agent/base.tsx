

function addHighlight(dom: any) {
    if (dom) dom.style.backgroundColor = "yellow"
}


function inputByQueryBase(query: string, text: string) {
    const inp: any = document.querySelector(query);
    inp.innerText = text;
    inp.value = text;
    addHighlight(inp)
}

function clickByQueryBase(query: string) {
    const dom: any = document.querySelector(query);
    if (dom) {
        dom.click();
        addHighlight(dom)
    }
}

export {
    inputByQueryBase,
    clickByQueryBase
}