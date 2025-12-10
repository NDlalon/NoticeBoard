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
        this.currentIndex = 0;
        this.contentItems = [];
        this.autoPlayInterval = null;
        this.autoPlayDelay = 10000; // 10秒切換一次
        this.IntervalLock=false;
        this.videoHandler=()=>{//影片播放結束後換頁事件
            const video=this.contentItems[this.currentIndex].querySelector('video');
            video.load();
            this.IntervalLock=false;
            this.startAutoPlay();
            this.nextContent();}
            
    }
    
    // 添加內容項目
    addContent(type, src, title = '',pdf_page) {
        const contentContainer = document.querySelector('.content-container');
        const contentItem = document.createElement('div');
        contentItem.className = 'content-item'; 
        contentItem.dataset.type=type;
        contentItem.dataset.src=src;
        contentItem.dataset.title=title;
        
        if (type === 'image') {
            contentItem.innerHTML=`<img src="${src}" alt="${title}" onload="this.style.opacity=1" style="opacity:0;transition:opacity 0.5s;">`;
        } else if (type === 'pdf') {          
            for(let i=0;i<pdf_page;i++){ //確保pdf順序正常
                const contentItem = document.createElement('div');
                contentItem.className = 'content-item'; 
                contentItem.dataset.type='placeholder';
                contentItem.dataset.src=src;
                contentItem.dataset.title=title;
                contentContainer.appendChild(contentItem);  //預先填入佔位物件
                this.contentItems.push(contentItem);
            }
            // 用 pdf.js 載入 PDF
            window.pdfjsLib.getDocument({'url':src,'wasmUrl':window.wasmUrl}).promise.then(pdfDoc => {
                renderPDFpage(pdfDoc,{'type':type,'src':src,'title':title});
            });
            return ;
        } else if (type === 'video') {
            contentItem.innerHTML = `<video src="${src}" style="max-width:100%;max-height:100%;" muted></video>`;
            const item =contentItem.querySelector('video');
            item.addEventListener("ended",this.videoHandler);
        }
               
        // 新增物件
        contentContainer.appendChild(contentItem);
        this.contentItems.push(contentItem);
        this.showContent(this.currentIndex);

        //開始自動播放
        this.startAutoPlay();
    }

    // 移除內容項目
    removeContent(type, src, title = ''){
        let index;
        while(index!=-1){
            index=this.contentItems.findIndex(item=>
                item.dataset.type===type &&
                item.dataset.src===src && 
                item.dataset.title===title
            );
            if(index!=-1){
                const contentContainer = document.querySelector('.content-container');
                const item=this.contentItems[index];
                
                if(item.dataset.type=='video'){
                    const video=item.querySelector('video');
                    video.removeEventListener("ended", this.videoHandler);
                    this.IntervalLock=false;
                    this.startAutoPlay();
                }

                contentContainer.removeChild(item);
                this.contentItems.splice(index,1);
                this.showContent(this.currentIndex%this.contentItems.length);
            }
        }
        // 停止自動播放
        if(this.contentItems.length==0){
            this.stopAutoPlay();
        }
    }

    // 顯示指定索引的內容
    showContent(index) {
        this.contentItems.forEach((item, i) => {
            if (i === index) {
                //影片物件處理
                if(item.dataset.type=="video"){
                    this.stopAutoPlay();
                    if(!this.IntervalLock){  //避免調整視窗時重播影片
                        this.IntervalLock=true;
                        const video=item.querySelector('video');
                        video.play();
                    }
                }
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
        isNaN(index)?this.currentIndex =0:this.currentIndex = index;
        this.updatePageIndicator();
    }

    // 下一個內容
    nextContent() {
        const nextIndex = (this.currentIndex + 1) % this.contentItems.length;
        this.showContent(nextIndex);
    }
    // 上一個內容
    lastContent() {
        const lastIndex = (((this.currentIndex - 1) % this.contentItems.length)+this.contentItems.length)%this.contentItems.length;
        this.showContent(lastIndex);
    }

    // 更新頁面指示器
    updatePageIndicator() {
        document.getElementById('current-page').textContent =this.contentItems.length>0?this.currentIndex + 1:this.currentIndex=0;
        document.getElementById('total-pages').textContent = this.contentItems.length;
    }

    // 開始自動播放
    startAutoPlay() {
        if(this.IntervalLock)return;
        
        if (this.contentItems.length > 1) {
            clearInterval(this.autoPlayInterval);
            this.autoPlayInterval = setInterval(() => {
                this.nextContent();
            }, this.autoPlayDelay);
        }
    }

    // 停止自動播放
    stopAutoPlay() {
        if(this.IntervalLock)return;

        if (this.autoPlayInterval) {
            clearInterval(this.autoPlayInterval);
            this.autoPlayInterval = null;
        }
    }

    //回傳是否自動撥放
    isAutoplay(){
        return this.autoPlayInterval===null?false:true;
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

//渲染pdf頁面
function renderPDFpage(pdfDoc,data){
    const contentContainer = document.querySelector('.content-container');
    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
        pdfDoc.getPage(pageNum).then(page => {
            const containerWidth = contentContainer.clientWidth;
            const containerHeight = contentContainer.clientHeight;
            const unscaledViewport = page.getViewport({ scale: 1 });
            const scale = Math.min(
                containerWidth / unscaledViewport.width,
                containerHeight / unscaledViewport.height
            );
            const viewport = page.getViewport({ scale });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = viewport.width;
            canvas.height = viewport.height;

            const renderContext = {
                canvasContext: context,
                viewport: viewport
            };
            
            page.render(renderContext).promise.then(() => {
                const contentItem = document.createElement('div');
                contentItem.className = 'content-item';
                contentItem.dataset.type=data.type;
                contentItem.dataset.src=data.src;
                contentItem.dataset.title=data.title;
                contentItem.appendChild(canvas);
                
                const firstIndex = carousel.contentItems.findIndex(item => {
                    return item.dataset.src === data.src;
                });
                const items=contentContainer.querySelectorAll(`div[data-src="${contentItem.dataset.src}"]`);
                carousel.contentItems[firstIndex+pageNum-1]=contentItem;
                items[pageNum-1].replaceWith(contentItem);

                carousel.showContent(carousel.currentIndex);
                carousel.startAutoPlay();
            });
        });
    }
}

// 初始化
const carousel = new ContentCarousel();
let isInitialized = false;

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
            const container = document.querySelector('.content-container');
            container.innerHTML = `
                <div class="page-indicator">
                    <span id="current-page">0</span> / <span id="total-pages">0</span>
                </div>
            `;
            
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
            carousel.contentItems.sort((a,b)=>{
                const Aoder=data.uploadItem.find(obj=>obj.src===a.dataset.src).order
                const Boder=data.uploadItem.find(obj=>obj.src===b.dataset.src).order
                return Aoder-Boder
            })

        }else if(data.action==='updateAutoPlayDelay'){
            carousel.autoPlayDelay=data.item*1000
            carousel.startAutoPlay()
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
            //判斷當前頁面是否影片
            if(carousel.IntervalLock){
                carousel.IntervalLock=false;
                const item=carousel.contentItems[carousel.currentIndex].querySelector('video');
                item.load(); 
                carousel.startAutoPlay();
            }
            carousel.nextContent();
        }
        if (e.key === 'ArrowLeft') {
            //判斷當前頁面是否影片
            if(carousel.IntervalLock){
                carousel.IntervalLock=false;
                const item=carousel.contentItems[carousel.currentIndex].querySelector('video');
                item.load();
                carousel.startAutoPlay();
            }
            carousel.lastContent();
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
    resizeTimer = setTimeout(() => {
        //調整跑馬燈速度
        setTextSpeed();

        //調整pdf大小
        const contentContainer = document.querySelector('.content-container');
        const pdfItem=contentContainer.querySelectorAll('div[data-type="pdf"]');
        const pdfsrc=new Set();
        const pdftitle=new Set();
        pdfItem.forEach(pdf => {
            pdfsrc.add(pdf.dataset.src);
            pdftitle.add(pdf.dataset.title);
        });
        const srcArray=Array.from(pdfsrc);
        const titleArray= Array.from(pdftitle);
        srcArray.forEach((src,i)=>{
            window.pdfjsLib.getDocument({'url':src,'wasmUrl':window.wasmUrl}).promise.then(pdfDoc => {
                renderPDFpage(pdfDoc,{'type':'pdf','src':src,'title':titleArray[i]});
            });
        });
    }, 500);
});