document.addEventListener('DOMContentLoaded', function () {
    const selectAllCheckbox = document.getElementById('selectAll');
    const rowCheckboxes = document.querySelectorAll('.DetailCheckbox');
    const deleteButton = document.getElementById('deleteButton');
    const tableBody = document.getElementById('DetailTableBody');
    const table=document.getElementById('DetailTable');
    const headers = table.querySelectorAll('thead th');
    const deleteForm=document.getElementById('deleteForm');
    const deletePage=document.getElementById('pageDeleteForm');
    const arrangeButton=document.getElementById('arrangeButton');
    const arrangeButton_cancel=this.getElementById('arrangeButton-cancel');
    const reloadButton=document.getElementById('reloadButton');
    const autoPlayDelayButton=document.getElementById('autoPlayDelayButton');
    const autoPlayDelayInput=document.getElementById('autoPlayDelayInput');
    const page_id=document.getElementById('page_id').dataset.page_id;
    let sortDirection = {};

    //全選功能
    selectAllCheckbox?.addEventListener('change', function () {
        rowCheckboxes.forEach(cb => cb.checked = this.checked);
        updateDeleteButton();
    });

    //勾選變化時更新狀態
    rowCheckboxes.forEach(cb => {
        cb.addEventListener('change', function () {
            updateSelectAllStatus();
            updateDeleteButton();
        });
    });

    // 
    function updateSelectAllStatus() {
        const allChecked = Array.from(rowCheckboxes).every(cb => cb.checked);
        selectAllCheckbox.checked = allChecked;
    }

    function updateDeleteButton() {
        const anyChecked = Array.from(rowCheckboxes).some(cb => cb.checked);
        deleteButton.disabled = !anyChecked;
    }

    //顯示順序排序功能
    function setDisplayOder(){
        const rows=Array.from(tableBody.querySelectorAll('tr')) 

        rows.sort((a,b)=>{
            let valueA=parseInt(a.getAttribute('value'));
            let valueB=parseInt(b.getAttribute('value'));
            if (valueA === -1)valueA=Infinity;
            if (valueB === -1)valueB=Infinity;
            let result=0;
            
            if(valueA>valueB){
                result=1;
            }
            else if(valueA<valueB){
                result=-1;
            }
            else{
                result=0;
            }
            
            return result;
        });
        
        // 重新渲染排序後的 rows
        rows.forEach(row => tableBody.appendChild(row));
    }

    function sendOder(initial="false"){
        let oderIndex=[];
            tableBody.querySelectorAll(".DetailCheckbox").forEach((row,index)=>{
                item=row.getAttribute('value').split(":");
                oderIndex.push([item[0],item[1],index]);
            });
            
            // 送出新的順序到後端
            fetch(`/api/setDisplayOrder/${page_id}/${initial}`,{
                method:"POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-CSRFToken": csrftoken,
                },
                body:JSON.stringify({
                    'items':oderIndex
                })
            })
    }
    
    // 表格標題排序功能
    headers.forEach((header, index) => {
        if (header.querySelector('input')) return;  // 跳過 checkbox 欄

        header.addEventListener('click', function () {
            const rows = Array.from(tableBody.querySelectorAll('tr'));
            const key = header.innerText.trim();
            const isAsc = sortDirection[key] = !sortDirection[key];
            const indexType=["checkbox","類型","標題","內容","新增時間"]

            rows.sort((a, b) => {
                const textA = a.cells[index].innerText.trim();
                const textB = b.cells[index].innerText.trim();

                // 如果是時間格式，轉為 Date 比較
                if (indexType[index]=="新增時間") {
                    let result=0;
                    if(new Date(textA)>new Date(textB)){
                        result=1;
                    }
                    else if(new Date(textA)<new Date(textB)){
                        result=-1;
                    }
                    if(!isAsc){
                        result*=-1;
                    }
                    return result
                }

                // 一般文字比對（含內容）
                if(isAsc){
                    return textA.localeCompare(textB, 'zh-Hant');
                }
                else{
                    return textB.localeCompare(textA, 'zh-Hant');
                }
            });

            // 重新渲染排序後的 rows
            rows.forEach(row => tableBody.appendChild(row));
        });
    });

    //物件順序更改
    arrangeButton?.addEventListener('click',function(e){
        if (arrangeButton.innerText === "更改顯示順序") {
            arrangeButton.innerText = "保存";
            arrangeButton_cancel.hidden = false;

        // 把checkbox替換成上下箭頭
            tableBody.querySelectorAll("tr").forEach((row, idx) => {
                const cell = row.querySelector(".checkbox-cell");
                if (!cell) return;
                const upBtn = document.createElement("button");
                upBtn.innerText = "▲";
                upBtn.classList.add("move-up");
                upBtn.type = "button";
                
                const downBtn = document.createElement("button");
                downBtn.innerText = "▼";
                downBtn.classList.add("move-down");
                downBtn.type = "button";

                const wrapper = document.createElement("div");
                wrapper.classList.add("move-wrapper");
                wrapper.appendChild(upBtn);
                wrapper.appendChild(downBtn);

                cell.querySelector('.rowCheckbox').hidden=true;
                cell.appendChild(wrapper);

                // 綁定事件
                upBtn.addEventListener("click", () => {
                    const prev = row.previousElementSibling;
                    if (prev) tableBody.insertBefore(row, prev);
                });

                downBtn.addEventListener("click", () => {
                    const next = row.nextElementSibling;
                    if (next) tableBody.insertBefore(next, row);
                });
            });

        } else {
            arrangeButton.innerText = "更改顯示順序";
            arrangeButton_cancel.hidden = true;
            
            sendOder();

            // 這裡只是恢復checkbox
            tableBody.querySelectorAll("tr").forEach((row,index) => {
                const cell = row.querySelector(".checkbox-cell");
                cell.querySelector('.move-wrapper').remove();
                cell.querySelector('.rowCheckbox').hidden=false;
                row.setAttribute('value',index)
            });
        }
    });

    arrangeButton_cancel?.addEventListener('click',function(e){
        arrangeButton.innerText = "更改顯示順序";
        arrangeButton_cancel.hidden = true;

        // 還原成 checkbox
        tableBody.querySelectorAll("tr").forEach(row => {
            const cell = row.querySelector(".checkbox-cell");
            cell.querySelector('.move-wrapper').remove();
            cell.querySelector('.rowCheckbox').hidden=false;
        });
        //還原排序
        setDisplayOder();
    });

    autoPlayDelayButton?.addEventListener('click',function(e){
        if(autoPlayDelayInput.hidden){
            autoPlayDelayInput.hidden=false;
            autoPlayDelayButton.innerHTML="保存";
        }
        else{
            autoPlayDelayInput.hidden=true;
            //判斷是否錯誤格式
            if(autoPlayDelayInput.value===''||autoPlayDelayInput.value==='0'){
                autoPlayDelayButton.innerHTML='每頁更新時間:'+autoPlayDelayButton.value+'秒';
                autoPlayDelayInput.value=autoPlayDelayButton.value;
            }
            else{
                autoPlayDelayButton.innerHTML='每頁更新時間:'+autoPlayDelayInput.value+'秒';
                autoPlayDelayButton.value=autoPlayDelayInput.value;
                fetch(`/api/updateAutoPlayDelay/${page_id}`,{
                    method:"POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-CSRFToken": csrftoken,
                    },
                    body:JSON.stringify({
                        'items':parseInt(autoPlayDelayInput.value)
                    })
                })
            }
        }
    });

    // 頁面重新整理
    reloadButton?.addEventListener('click',function(e){
        // 送出重新整理的需求到後端
        fetch(`/api/reload/${page_id}`,{
            method:"POST",
            headers: {
                "Content-Type": "application/json",
                "X-CSRFToken": csrftoken,
            },
        })
        
    });

    // 物件刪除確認
    deleteForm?.addEventListener('submit',function(e){
        if(!confirm("確定是否要刪除這筆資料\n已刪除的資料將無法復原")){
            e.preventDefault();
        }
    });
    
    // 刪除確認
    deletePage?.addEventListener('submit',function(e){
        if(confirm("確定是否要刪除這筆資料\n已刪除的資料將無法復原")){
           if(prompt("請在輸入框中輸入「確認刪除」已進行刪除")==="確認刪除"){
                return ;
           } 
        }
        alert("已取消刪除");
        e.preventDefault();
    });

    //===============初始化===============
    setDisplayOder();
    sendOder("true");
});