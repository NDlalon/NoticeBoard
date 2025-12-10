# Django多媒體告示板  
此系統使用 Django 框架來開發 Web 應用，Daphne 作為 ASGI 伺服器來處理 WebSocket 等連接，並且使用 Nginx 作為反向代理伺服器來處理靜態資源。  
### 操作環境  
#### 首頁:
首頁會顯示已建立頁面，作為告示板電腦可直接點即進入撥放
#### 登入畫面:
`新增頁面`與`編輯頁面`需要登入，未登入情況下進入會轉至登入頁面，帳號密碼皆為admin
#### 新增頁面:
輸入頁面名稱並選擇對應版面，頁面名稱的命名建議具辨別性
#### 編輯頁面:
- 可對頁面的物件進行新增、排序與刪除，可設定物件為圖片、PDF、影片、跑馬燈。  
- 針對頁面可設定每頁更新時間，單位為秒數，當有復數物件時會自動啟用輪撥，間隔則以此秒數為準。  
- 重新整理功能-讓所有連線到此頁面的網頁重新整理。  
- 以上設定皆會同步透過websocket進行即時控制，可無須頻繁操作告示板電腦
### 初始環境配置
#### 1.環境設定(可略過)
``` start_WebServer.py啟動時會自動設定Nginx靜態檔案路徑，若使用start_WebServer.py啟動則無需設定```  

在安裝完資料夾後，須至nginx設定靜態檔案路徑  
`.\NoticeBoard\nginx\conf\nginx.conf`
```
location /static/ {
        alias "";
    }
    location /media/ {
        alias "";
    }
```
static與media須設定完整路徑,例如:  
```alias "C:\NoticeBoard\NoticeBoard\static";```  
```alias "C:\NoticeBoard\NoticeBoard\media";```  
若後續有移動資料夾位置，皆須重新設定location
#### 2.server網路環境設置  
若配置於私人網路環境，則需確保電腦使用內部固定ip  
nginx與daphne的配置文件則詳見於`更改網路設定`部分

#### 3.開啟伺服器並安裝依賴
開啟根目錄中的`start_server.bat`，初次開啟時會自動安裝所需依賴，安裝完畢後會自動開啟nginx與daphne server，嘗試連線127.0.0.1成功後即設定完成
### 更改網路設定  
於正式環境中，可自行修改nginx與daphne的ip與port設定  
#### nginx設定
於`nginx\conf\`中開啟`nginx.conf`，可自行設定ip與port  
```
server {
    listen       80;
    server_name  localhost;
    ...
}
```
#### daphne設定  
於`start_WebServer.py`中設定daphne的ip與port  
預設為`ip:127.0.0.1`，`port:8000`
```py
#=========================================
# Daphne IP/Port 設定
#=========================================
D_IP = "127.0.0.1"
D_PORT = "8000"
```
修改完daphne設定後須至`nginx.conf`中修改server設定
```
server {
    ...
    location / {
        proxy_pass http://127.0.0.1:8000;
        ...
    }
}
```

### 新增版面  
若要新增多媒體頁面的版面，可以照以下步驟  
1. 於index.html新增  
    於index頁面中的`<!-- 新增頁面 -->`部分依照以下範例新增  
    ```html
        <label>
        <input type="radio" name="Layout" value="1" checked required>
        <img src="{% static 'contain/yourlayout.jpg' %}" alt="版面1" class="radio-image">
        </label>
    ```
    需替換掉value與yourlayout.jpg，且須確保value不重複。  
    yourlayout.jpg為版面配置的示意圖，可自行任意設定，需先將圖片放置指定資料夾。 

2. 建立html檔案  
    依照版面需求建立html檔案，並放入board/templates/layout資料夾中  

3. 建立css/js檔案  
    依照版面需求建立css/js檔案，並放入靜態資料夾中

4. 配置於views  
    於views中的`#版面配置`部分新增於typeList字典中  
    ```py
        typeList={
            1:'layout/layout1.html'
        } 
    ```
    前面的數字對應html中設定的value值，後面為版面的html路徑。

#### 版面js配置  
1.pdfjs配置:  
若要在html中顯示pdf則需要新增以下js於html版面中，以便於js中使用pdfjs
```html
    <script type="module">
        import * as pdfjsLib from "{% static 'javaScript/pdfjs/pdf.mjs' %}";
        pdfjsLib.GlobalWorkerOptions.workerSrc = "{% static 'javaScript/pdfjs/pdf.worker.mjs' %}"; 
        const wasmUrl = "{% static 'javaScript/pdfjs/wasm/' %}";      

        // 讓全域可用
        window.pdfjsLib = pdfjsLib;
        window.wasmUrl=wasmUrl;
    </script>
```
2.websocket配置:  
可參考layout1.js中的`function startWebSocket(page_id)`為參考依照需求調整  
