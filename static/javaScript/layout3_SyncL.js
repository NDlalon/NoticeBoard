// 日期時間更新功能
function updateDateTime() {
    const now = new Date();
    
    // 格式化日期
    const dateOptions = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        weekday: 'long'
    };
    const dateString = now.toLocaleDateString('zh-TW', dateOptions);
    
    // 格式化時間
    const timeString = now.toLocaleTimeString('zh-TW', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    
    document.getElementById('current-date').textContent = dateString;
    document.getElementById('current-time').textContent = timeString;
}

// 內容輪播功能
class ContentCarousel {
    constructor() {
        this.imagecurrentIndex = 0;
        this.pdfcurrentIndex = 0;
        this.videocurrentIndex = 0;
        this.imagecontentItems = [];
        this.pdfcontentItems=[];
        this.videocontentItems=[];
        this.imageAutoPlayInterval = null;
        this.pdfAutoPlayInterval = null;
        // this.videoAutoPlayInterval = null;
        this.autoPlayDelay = 10000; // 10秒切換一次
        this.videoHandler=()=>{//影片播放結束後換頁事件
            const video=this.videocontentItems[this.videocurrentIndex].querySelector('video');
            video.load();
            this.nextContent('video');}
    }
    
    // 添加內容項目
    addContent(type, src, title = '',pdf_page) {
        const currentIndex={
            'image':this.imagecurrentIndex,
            'pdf':this.pdfcurrentIndex,
            'video':this.videocurrentIndex
        }
        const contentContainer=document.querySelector(`.${type}-container .content-container`);
        const contentItem = document.createElement('div');
        let items=null;
        contentItem.className = 'content-item'; 
        contentItem.dataset.type=type;
        contentItem.dataset.src=src;
        contentItem.dataset.title=title;
        
        if (type === 'image') {
            contentItem.innerHTML=`<img src="${src}" alt="${title}" onload="this.style.opacity=1" style="opacity:0;transition:opacity 0.5s;">`;
            items=this.imagecontentItems;
        } else if (type === 'pdf') {          
            for(let i=0;i<pdf_page;i++){ //確保pdf順序正常
                const contentItem = document.createElement('div');
                contentItem.className = 'content-item'; 
                contentItem.dataset.type='placeholder';
                contentItem.dataset.src=src;
                contentItem.dataset.title=title;
                contentContainer.appendChild(contentItem);  //預先填入佔位物件
                this.pdfcontentItems.push(contentItem);
            }
            // 用 pdf.js 載入 PDF
            window.pdfjsLib.getDocument({'url':src,'wasmUrl':window.wasmUrl}).promise.then(pdfDoc => {
                pdfRenderQueue.push({ pdfDoc, data: { type, src, title } });
                processPDFQueue(); 
            });
            return ;
        } else if (type === 'video') {
            contentItem.innerHTML = `<video src="${src}" style="max-width:100%;max-height:100%;" muted></video>`;
            const videoitem =contentItem.querySelector('video');
            videoitem.addEventListener("ended",this.videoHandler);
            items=this.videocontentItems;
        }
        
        // 新增物件
        contentContainer.appendChild(contentItem);
        items.push(contentItem);
        this.showContent(currentIndex[type],items,type);

        //開始自動播放
        this.startAutoPlay(type);
    }

    // 移除內容項目
    removeContent(type, src, title = ''){
        let index;
        while(index!=-1){
            index=this[type+'contentItems'].findIndex(item=>
                item.dataset.type===type &&
                item.dataset.src===src && 
                item.dataset.title===title
            );
            if(index!=-1){
                const contentContainer = document.querySelector(`.${type}-container .content-container`);
                const item=this[type+'contentItems'][index];
                
                if(type=='video'){
                    const video=item.querySelector('video');
                    video.removeEventListener("ended", this.videoHandler);
                }

                contentContainer.removeChild(item);
                this[type+'contentItems'].splice(index,1);
                this.showContent(this[type+'currentIndex']%this[type+'contentItems'].length,this[type+'contentItems'],type);
            }
        }
        // 停止自動播放
        if(this[type+'contentItems'].length==0){
            this.stopAutoPlay(type);
        }
    }

    // 顯示指定索引的內容
    showContent(index,contentItems,type) {
        contentItems.forEach((item,i)=>{
            item.classList.remove('active');
        });

        if(isNaN(index)){
            index=0;
        }
        else{
            contentItems[index].classList.add('active');
            //影片物件處理
            if(contentItems[index].dataset.type=="video"){
                const video=contentItems[index].querySelector('video');
                video.play();
            }
        }

        this[type+'currentIndex']=index;
        this.updatePageIndicator();
    }

    // 下一個內容
    nextContent(type) {
        const nextIndex = (this[type+'currentIndex'] + 1) % this[type+'contentItems'].length;
        this.showContent(nextIndex,this[type+'contentItems'],type);
    }
    // 上一個內容
    lastContent(type) {
        const lastIndex = (((this[type+'currentIndex'] - 1) % this[type+'contentItems'].length)+this[type+'contentItems'].length)%this[type+'contentItems'].length;
        this.showContent(lastIndex,this[type+'contentItems'],type);
    }

    // 更新頁面指示器
    updatePageIndicator() {
        // 此版面未做指示器，以下為layout1內容
        // document.getElementById('current-page').textContent = this.currentIndex + 1;
        // document.getElementById('total-pages').textContent = this.contentItems.length;
    }

    // 開始自動播放
    startAutoPlay(type) {
        if(type=='video'){return;}

        if (this[type+'contentItems'].length > 1) {
            clearInterval(this[type+'AutoPlayInterval']);
            this[type+'AutoPlayInterval'] = setInterval(() => {
                this.nextContent(type);
            }, this.autoPlayDelay);
        }
    }

    // 停止自動播放
    stopAutoPlay(type) {
        if(type=='video'){return};

        if (this[type+'autoPlayInterval']) {
            clearInterval(this[type+'autoPlayInterval']);
            this[type+'autoPlayInterval'] = null;
        }
    }

    //回傳是否自動撥放
    isAutoplay(){
        return this.imageAutoPlayInterval||this.pdfAutoPlayInterval===null?false:true;
    }
}

// 跑馬燈文字更新功能
function updateMarqueeText(text) {
    let marquee_text=document.getElementById('marquee-text');
    const wrapper = document.querySelector('.marquee-container');
    
    marquee_text.innerHTML=text+text;
    while(marquee_text.scrollWidth<(wrapper.offsetWidth)*2 && text.length >0){
        marquee_text.innerHTML+=text+text;
    }
    
    setTextSpeed();
}

// 設定跑馬燈文字速度
function setTextSpeed(){
    const text = document.querySelector('.marquee-text');
    const wrapper = document.querySelector('.marquee-container');

    // 設定速度 (像素/秒)
    const speed = 300;

    // 文字總寬度
    const textWidth = text.scrollWidth;
    const wrapperWidth = wrapper.offsetWidth;

    // 總距離 = 文字寬度 + wrapper寬度
    const distance = textWidth + wrapperWidth;

    // 動畫時間 = 距離 / 速度
    const duration = distance / speed;

    text.style.animationDuration = `${duration}s`;
}

// PDF渲染序列
async function processPDFQueue() {
    if (isRenderingPDF)return; 

    isRenderingPDF = true;
    while(pdfRenderQueue!=0){
        const task = pdfRenderQueue.shift();
        await renderPDFpage(task.pdfDoc, task.data);
    }
    isRenderingPDF=false;
    if(isResize)pageResize();
}

//渲染pdf頁面
async function renderPDFpage(pdfDoc,data){
    const contentContainer = document.querySelector('.pdf-container .content-container');
    const containerWidth = contentContainer.clientWidth;
    const containerHeight = contentContainer.clientHeight;

    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {

        const page = await pdfDoc.getPage(pageNum);

        const unscaledViewport = page.getViewport({ scale: 1 });
        const scale = Math.min(
            containerWidth / unscaledViewport.width,
            containerHeight / unscaledViewport.height
        );
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const context = canvas.getContext('2d');

        await page.render({ canvasContext: context, viewport }).promise;

        const contentItem = document.createElement('div');
        contentItem.className = 'content-item';
        contentItem.dataset.type = data.type;
        contentItem.dataset.src = data.src;
        contentItem.dataset.title = data.title;
        contentItem.appendChild(canvas);

        // 找 placeholder
        const index = carousel.pdfcontentItems.findIndex(
            item => item.dataset.src === data.src && item.dataset.type=== 'placeholder'
        );

        // 替換 placeholder
        if (index !== -1) {
            contentContainer.replaceChild(contentItem, carousel.pdfcontentItems[index]);
            carousel.pdfcontentItems[index] = contentItem;
        }

        //更新顯示
        carousel.showContent(carousel.pdfcurrentIndex,carousel.pdfcontentItems,'pdf');
    }
    pdfDoc.cleanup();
    pdfDoc.destroy();
    //全部渲染完成後
    carousel.startAutoPlay(data.type);
}

// 初始化
const carousel = new ContentCarousel();
let isInitialized = false;
const pdfRenderQueue = [];
let isRenderingPDF = false;
let isResize=false;

function initializeContent(page_id) {
    if (isInitialized) return;
    
    fetch(`/api/getinfo/${page_id}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('網路錯誤');
            }
            return response.json();
        })
        .then(data => {
            // 更新跑馬燈文字
            let text='';
            data.marqueeText.forEach(item=>{
                text+=`<span>   ${item}   </span>`;
            })
            updateMarqueeText(text);
            
            // 清空現有內容
            const image_container = document.querySelector('.image-container .content-container');
            const pdf_container = document.querySelector('.pdf-container .content-container');
            const video_container = document.querySelector('.video-container .content-container');
            image_container.innerHTML = ``;
            pdf_container.innerHTML = ``;
            video_container.innerHTML = ``;

            // 設定自動播放間隔
            if (data.autoPlayDelay) {
                carousel.autoPlayDelay=data.autoPlayDelay*1000;
            }

            // 加入新內容
            data.uploadItem.forEach(item => {
                carousel.addContent(item.type, item.src, item.title,item.pdf_page);
            });

            isInitialized = true;
        })
        .catch(error => {
            console.error('載入內容失敗:', error);
        });
}

function startWebSocket(page_id) {
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const socket = new WebSocket(`${protocol}://${window.location.host}/ws/updates/${page_id}/`);
    
    socket.onmessage = function(e) {
        const data = JSON.parse(e.data);
        
        if(data.action==='add'){
            if(data.type === "marqueeText"){
                let text='';
                data.marqueeText.forEach(item=>{
                    text+=`<span>   ${item}   </span>`;
                })
                updateMarqueeText(text);

            }else if(data.type === "image") {
                carousel.addContent(data.type, data.src, data.title);
            }else if(data.type === "pdf"){
                carousel.addContent(data.type, data.src, data.title,data.pdf_page);
            }else if(data.type==='video'){
                carousel.addContent(data.type,data.src,data.title);
            }
        }else if(data.action==='remove'){
            if(data.type === "pdf" || data.type === "image" ||data.type==="video"){
                carousel.removeContent(data.type, data.src, data.title);
            }
            else if(data.type=="marqueeText"){
                let text='';
                data.marqueeText.forEach(item=>{
                    text+=`<span>   ${item}   </span>`;
                })
                updateMarqueeText(text);
            }
        }else if(data.action==='reload'){
            location.reload();
        }else if(data.action==='updateOder'){
            // 更新跑馬燈順序
            let text='';
            data.marqueeText.forEach(item=>{
                text+=`<span>   ${item}   </span>`;
            })
            updateMarqueeText(text);
            // 更改顯示順序
            const orderMap = Object.fromEntries(    //建立順序map
                data.uploadItem.map(item => [item.src, item.order])
            );

            ['image','pdf','video'].forEach(type=>{
                carousel[type+'contentItems'].sort((a,b)=>{
                    const Aoder=orderMap[a.dataset.src];
                    const Boder=orderMap[b.dataset.src];
                    return Aoder-Boder;
                })
            });
        }else if(data.action==='updateAutoPlayDelay'){
            carousel.autoPlayDelay=data.item*1000;
            ['image','pdf','video'].forEach(type=>{
                carousel.startAutoPlay(type);
            });
        }
    };

    socket.onclose = function() {
        console.log("WebSocket 關閉，嘗試重連");
        setTimeout(() => startWebSocket(page_id), 2000);
    };
}

document.addEventListener("DOMContentLoaded", function() {
    const page_id = document.getElementById('page_id').dataset.page_id;
    startWebSocket(page_id);
});

// 頁面載入完成後執行
document.addEventListener('DOMContentLoaded', function() {
    // 更新日期時間
    updateDateTime();
    setInterval(updateDateTime, 100);

    // 取得pageid
    const page_id=document.getElementById('page_id').dataset.page_id;
    
    // 初始化內容
    initializeContent(page_id);
    
    // 鍵盤控制（用於測試）
    document.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowRight') {
            //停止目前影片
            if(carousel.videocontentItems.length>0){
                const item=carousel.videocontentItems[carousel.videocurrentIndex].querySelector('video');
                item.load(); 
            }
            carousel.nextContent('image');
            carousel.nextContent('pdf');
            carousel.nextContent('video');
        }
        if (e.key === 'ArrowLeft') {
            //停止目前影片
            if(carousel.videocontentItems.length>0){
                const item=carousel.videocontentItems[carousel.videocurrentIndex].querySelector('video');
                item.load(); 
            }
            carousel.lastContent('image');
            carousel.lastContent('pdf');
            carousel.lastContent('video');
        }
        if(e.key=='t'){
            const contentContainer = document.querySelectorAll('.content-item');
            carousel.contentItems.forEach((item,i) => {
                console.log(contentContainer.item(i),item,contentContainer.item(i)==item)
            });
        }
        if (e.key === 'f' || e.key === 'F11') {
            // 切換全螢幕
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
            } else {
                document.exitFullscreen();
            }
        }
    });
});

let resizeTimer = null;
window.addEventListener('resize', () => {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout((pageResize), 500);
});
function pageResize(){
    //調整跑馬燈速度
    setTextSpeed();

    if(isRenderingPDF){
        isResize=true;
        return;
    }
    isResize=false;
    
    //調整pdf大小
    const contentContainer = document.querySelector('.pdf-container .content-container');
    const pdfItem=contentContainer.querySelectorAll('div[data-type="pdf"]');
    const pdfsrc=new Set();
    const pdftitle=new Set();
    pdfItem.forEach(pdf => {
        pdfsrc.add(pdf.dataset.src);
        pdftitle.add(pdf.dataset.title);
        pdf.dataset.type='placeholder';
    });
    const srcArray=Array.from(pdfsrc);
    const titleArray= Array.from(pdftitle);
    srcArray.forEach((src,i)=>{
        window.pdfjsLib.getDocument({'url':src,'wasmUrl':window.wasmUrl}).promise.then(pdfDoc => {
            pdfRenderQueue.push({ pdfDoc, data: {'type':'pdf','src':src,'title':titleArray[i]} });
            processPDFQueue(); 
        });
    });
}