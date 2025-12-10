"""
URL configuration for NoticeBoard project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.contrib.auth import views as auth_views
from django.urls import path
from board import views as board

urlpatterns = [
    path('admin/', admin.site.urls),

    path('login/',auth_views.LoginView.as_view(template_name='login.html'),name='login'),#登入畫面
    path('',board.home,name='home'),#首頁
    path('add_page/',board.addPage,name='add'),#新增頁面
    path('edit_page/',board.editPage,name='edit'),#編輯頁面
    path('edit_page/<int:page_id>/deletePage/',board.deletePage,name='deletePage'),#刪除頁面
    path('edit_page/<int:page_id>/',board.editDetail,name='editDetail'),#詳細資料編輯頁面
    path('edit_page/<int:page_id>/deleteItem/',board.deleteItem,name='deleteItem'),#刪除物件
    path('edit_page/<int:page_id>/uploadPDF/',board.uploadPDF,name='uploadPDF'),#新增PDF
    path('edit_page/<int:page_id>/uploadImage/',board.uploadImage,name='uploadImage'),#新增Image
    path('edit_page/<int:page_id>/uploadVideo/',board.uploadVideo,name='uploadVideo'),#新增video
    path('edit_page/<int:page_id>/uploadTextMessage/',board.uploadTextMessage,name='uploadTextMessage'),#編輯跑馬燈
    
    path('board/<int:page_id>',board.noticeBoardPage,name='board'),#顯示頁面

    path("api/setDisplayOrder/<int:page_id>/<str:initial>",board.setDisplayOrder,name="setDisplayOrder"),#修改物件順序
    path("api/getinfo/<int:page_id>", board.getLayoutInfo, name="getInfo"),#取得頁面物件
    path("api/reload/<int:page_id>",board.reloadPage,name='reload'),#重整頁面
    path("api/updateAutoPlayDelay/<int:page_id>",board.updateAutoPlayDelay,name='updateAutoPlayDelay'),#設定畫面更新時間
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)