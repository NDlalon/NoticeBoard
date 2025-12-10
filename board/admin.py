from django.contrib import admin
from .models import boardpage,PDFItem,ImageItem,textMessage,videoItem

admin.site.register(boardpage)
admin.site.register(PDFItem)
admin.site.register(ImageItem)
admin.site.register(textMessage)
admin.site.register(videoItem)
# Register your models here.
