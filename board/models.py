from django.db import models
from django.db.models.signals import post_delete
from django.dispatch import receiver

class boardpage(models.Model):
    pageName=models.CharField(unique=True,max_length=200)
    pageType=models.IntegerField(default=1)
    autoPlayDelay=models.IntegerField(default=10)
    creatTime=models.DateTimeField(auto_now_add=True)

class PDFItem(models.Model):
    pageID=models.IntegerField()
    title=models.CharField(max_length=200)
    pdf_file = models.FileField(upload_to='pdfs/')
    pdf_page=models.IntegerField(default=0)
    creatTime=models.DateTimeField(auto_now_add=True)   
    display_order = models.IntegerField(default=-1)

class ImageItem(models.Model):
    pageID=models.IntegerField()
    title=models.CharField(max_length=200)
    image_file = models.FileField(upload_to='images/')
    creatTime=models.DateTimeField(auto_now_add=True)
    display_order = models.IntegerField(default=-1)

class videoItem(models.Model):
    pageID=models.IntegerField()
    title=models.CharField(max_length=200)
    video_file=models.FileField(upload_to='videos/')
    creatTime=models.DateTimeField(auto_now_add=True)
    display_order = models.IntegerField(default=-1)

class textMessage(models.Model):
    pageID=models.IntegerField()
    text=models.TextField()
    creatTime=models.DateTimeField(auto_now_add=True)
    display_order = models.IntegerField(default=-1)

#=================================================
# post_delete signal 刪除檔案
#=================================================
@receiver(post_delete, sender=PDFItem)
def delete_pdf_file(sender, instance, **kwargs):
    if instance.pdf_file:
        instance.pdf_file.delete(False)

@receiver(post_delete, sender=ImageItem)
def delete_image_file(sender, instance, **kwargs):
    if instance.image_file:
        instance.image_file.delete(False)

@receiver(post_delete,sender=videoItem)
def delete_video_file(sender,instance,**kwargs):
    if instance.video_file:
        instance.video_file.delete(False)