from django.shortcuts import render
from django.shortcuts import redirect
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
import json
from collections import defaultdict
from .models import boardpage,PDFItem,ImageItem,textMessage,videoItem
from .forms import PDFForm,ImageForm,textMessageForm,VideoForm
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
import pypdfium2

modeltype={
        'PDF':PDFItem,
        '圖片':ImageItem,
        '影片':videoItem,
        '跑馬燈':textMessage
    }

# 首頁
def home(request):
    context={
        'view_mode':'list',
        'pages': boardpage.objects.all(),
    }
    return render(request,"index.html",context)

# 新增頁面
@login_required
def addPage(request):
    if(request.method == 'POST'):
        # 處理表單提交
        title = request.POST.get('title')
        layout = request.POST.get('Layout')
        if title and layout:
            boardpage.objects.create(pageName=title, pageType=layout)
            return redirect('home')
        
    context={
        'view_mode':'add',
    }
    return render(request,"index.html",context)

# 編輯頁面
@login_required
def editPage(request):
    context={
        'view_mode':'edit',
        'pages': boardpage.objects.all()
    }
    return render(request,"index.html",context)

# 刪除頁面
def deletePage(request,page_id):
    items=[PDFItem,ImageItem,videoItem,textMessage]
    for item in items:
        for ref in item.objects.filter(pageID=page_id):
            ref.delete()

    boardpage.objects.get(id=page_id).delete()
    
    return redirect("edit")

# 編輯頁面詳細資料
@login_required
def editDetail(request,page_id):
    tickerType=[1,3]
    marquee=False
    if(boardpage.objects.get(id=page_id).pageType in tickerType):
        marquee=True

    context={
        'view_mode':'editDetail',
        'page_id':page_id,
        'marquee':marquee,
        "autoPlayDelay":boardpage.objects.get(id=page_id).autoPlayDelay,
        'items':zip(['PDF','圖片','影片','跑馬燈'],
                    [PDFItem.objects.filter(pageID=page_id),
                    ImageItem.objects.filter(pageID=page_id),
                    videoItem.objects.filter(pageID=page_id),
                    textMessage.objects.filter(pageID=page_id)]
                    ),
        'has_items':any([PDFItem.objects.filter(pageID=page_id).exists(),
                    ImageItem.objects.filter(pageID=page_id).exists(),
                    videoItem.objects.filter(pageID=page_id).exists(),
                    textMessage.objects.filter(pageID=page_id).exists()
                    ])
    }
    return render(request,"index.html",context)

# 刪除頁面物件
def deleteItem(request,page_id):
    if(request.method=='POST'):
        selected_item=request.POST.getlist('selected_item')
        if(selected_item):
            for item in selected_item:
                modelName,id=item.split(':')
                try:
                    if(modelName=='跑馬燈'):
                        marqueeText=[]
                        for text in textMessage.objects.filter(pageID=page_id).exclude(id=id):
                            marqueeText.append(text.text)
                        data={
                            "type": "marqueeText",
                            "marqueeText": marqueeText ,
                            "action":'remove'
                        }
                        print(marqueeText)
                    elif(modelName=='圖片'):
                        data={
                            "type": "image",
                            "src": modeltype.get(modelName).objects.get(id=id).image_file.url,
                            "title": modeltype.get(modelName).objects.get(id=id).title,
                            "action":'remove'
                        }
                    elif(modelName=='PDF'):
                        data={
                            "type": "pdf",
                            "src": modeltype.get(modelName).objects.get(id=id).pdf_file.url,
                            "title": modeltype.get(modelName).objects.get(id=id).title,
                            "action":'remove'
                        }
                    elif(modelName=='影片'):
                        data={
                            "type": "video",
                            "src": modeltype.get(modelName).objects.get(id=id).video_file.url,
                            "title": modeltype.get(modelName).objects.get(id=id).title,
                            "action":'remove'
                        }
                    notify_clients_remove(page_id,data)
                    modeltype.get(modelName).objects.get(id=id).delete()
                except:
                    pass
    return redirect('editDetail',page_id=page_id)

# 上傳PDF物件
def uploadPDF(request,page_id):
    if (request.method == 'POST'):
        form = PDFForm(request.POST, request.FILES)
        
        if form.is_valid():
            pdf_instance = form.save()  # 取得instance 存入資料庫 
            pdfdoc=pypdfium2.PdfDocument(pdf_instance.pdf_file.path)#取得文件
            pdflen=len(pdfdoc)#取得頁數
            pdf_instance.pdf_page = pdflen
            pdfdoc.close()#關閉文件
            pdf_instance.save(update_fields=['pdf_page'])#更新資料庫
            notify_clients_add(page_id, {
                "type": "pdf",
                "src": form.instance.pdf_file.url,
                "title": form.instance.title,
                "pdf_page":pdflen,
                "action":'add'
            })
            return redirect('editDetail',page_id=page_id)
    else:
        form=PDFForm()

    context={
        'view_mode':'uploadPDF',
        'page_id':page_id,
        'form':form
    }
    return render(request,'index.html',context)

# 上傳圖片物件
def uploadImage(request,page_id):
    if (request.method == 'POST'):
        form = ImageForm(request.POST, request.FILES)
        if form.is_valid():
            form.save()
            notify_clients_add(page_id, {
                "type": "image",
                "src": form.instance.image_file.url,
                "title": form.instance.title,
                "action":'add'
            })
            return redirect('editDetail',page_id=page_id)
    else:
        form=ImageForm()

    context={
        'view_mode':'uploadImage',
        'page_id':page_id,
        'form':form
    }
    return render(request,'index.html',context)

# 上傳影片物件
def uploadVideo(request,page_id):
    if(request.method =='POST'):
        form=VideoForm(request.POST,request.FILES)
        if form.is_valid():
            form.save()
            notify_clients_add(page_id, {
                "type": "video",
                "src": form.instance.video_file.url,
                "title": form.instance.title,
                "action":'add'
            })
            return redirect('editDetail',page_id=page_id)
    else:
        form=VideoForm()

    context={
        'view_mode':'uploadVideo',
        'page_id':page_id,
        'form':form
    }
    return render(request,'index.html',context)

# 上傳跑馬燈文字
def uploadTextMessage(request,page_id):
    if (request.method == 'POST'):
        form = textMessageForm(request.POST, request.FILES)
        if form.is_valid():
            form.save()
            marqueeText=[]
            for text in textMessage.objects.filter(pageID=page_id):
                marqueeText.append(text.text)
            notify_clients_add(page_id, {
                "type": "marqueeText",
                "marqueeText": marqueeText,
                "action":'add'
            })
            return redirect('editDetail',page_id=page_id)
    else:
        form=textMessageForm()

    context={
        'view_mode':'uploadTextMessage',
        'page_id':page_id,
        'form':form
    }
    return render(request,'index.html',context)

# 版面配置
def noticeBoardPage(request,page_id):
    typeList={
        1:'layout/layout1.html',
        3:'layout/layout3.html'
    }
    type=boardpage.objects.get(id=page_id).pageType
    
    context={
            'page_id': page_id
        }
    if(typeList.get(type)):
        return render(request,typeList.get(type),context)
    else:
        return home(request)

# 取得輸出資訊
def getLayoutInfo(request,page_id,API=True):
    marqueeText=[]
    uploadItem=[]
    autoPlayDelay=boardpage.objects.get(id=page_id).autoPlayDelay

    #取得所有跑馬燈   
    for text in textMessage.objects.filter(pageID=page_id).order_by("display_order"):
        marqueeText.append(text.text)

    #取得所有圖片
    for item in ImageItem.objects.filter(pageID=page_id):
        uploadItem.append({"type": "image", "src": item.image_file.url, "title": f"{item.title}","order": item.display_order})

    #取得所有PDF
    for item in PDFItem.objects.filter(pageID=page_id):
        uploadItem.append({"type": "pdf", "src": item.pdf_file.url, "title": f"{item.title}","pdf_page":item.pdf_page,"order": item.display_order})

    #取得所有影片
    for item in videoItem.objects.filter(pageID=page_id):
        uploadItem.append({"type": "video", "src": item.video_file.url, "title": f"{item.title}","order": item.display_order})
        
    uploadItem.sort(key=lambda x:x["order"])
    data={
        'marqueeText':marqueeText,
        'autoPlayDelay':autoPlayDelay,
        'uploadItem':uploadItem,
    }
    
    if(API):
        return JsonResponse(data,json_dumps_params={'ensure_ascii': False})
    else:
        return data

# 設定物件顯示順序
def setDisplayOrder(request,page_id,initial):
    data=json.loads(request.body)
    setList=defaultdict(list)
    for item in data.get('items'):
        obj=modeltype.get(item[0]).objects.get(id=item[1])
        obj.display_order=item[2]
        setList[modeltype.get(item[0])].append(obj)
        
    for modle,item in setList.items():
        modle.objects.bulk_update(item, ["display_order"])

    if(initial=="false"):
        oderItem=getLayoutInfo(request,page_id,False)
        oderItem["action"]="updateOder"
        notify_clients_oder(page_id,oderItem)

    return  JsonResponse({"status": "success"})

# 重新整理頁面
def reloadPage(request,page_id):
    notify_clients_reLoad(page_id)

    return  JsonResponse({"status": "success"})

# 更新物件自動更新時間
def updateAutoPlayDelay(request,page_id):
    data=json.loads(request.body)
    page=boardpage.objects.get(id=page_id)
    page.autoPlayDelay=data.get('items')
    page.save(update_fields=['autoPlayDelay'])
    item={
        "action":"updateAutoPlayDelay",
        "item":data.get('items'),
    }
    notify_clients_AutoPlayDelay(page_id,item)
    return  JsonResponse({"status": "success"})

# =====================================================
# websocket function
# =====================================================

def notify_clients_add(page_id, item):
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"page_{page_id}",
        {
            "type": "send_update",
            "data": item,
        }
    )

def notify_clients_remove(page_id, item):
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"page_{page_id}",
        {
            "type": "send_remove",
            "data": item,
        }   
    )

def notify_clients_oder(page_id, item):
    channel_layer= get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"page_{page_id}",
        {
            "type":"send_displayOder",
            "data":item,
        }
    )

def notify_clients_reLoad(page_id):
    channel_layer=get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"page_{page_id}",
        {
            "type":"send_reload",
            "data":{"action":"reload"},
        }
    )

def notify_clients_AutoPlayDelay(page_id,item):
    channel_layer=get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"page_{page_id}",
        {
            "type":"send_autoPlayDelay",
            "data":item,
        }
    )