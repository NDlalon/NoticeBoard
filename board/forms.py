from django import forms
from .models import PDFItem,ImageItem,textMessage,videoItem

class PDFForm(forms.ModelForm):
    class Meta:
        model = PDFItem
        fields = ['pageID', 'title','pdf_file']

    def clean_pdf_file(self):
        file = self.cleaned_data.get('pdf_file')
        if file:
            # 檢查副檔名
            if not file.name.endswith('.pdf'):
                raise forms.ValidationError("上傳失敗 只能上傳 PDF 檔案")
            # 檢查 MIME 類型
            if file.content_type != 'application/pdf':
                raise forms.ValidationError("上傳失敗 檔案格式不正確，請上傳 PDF")
        return file

class ImageForm(forms.ModelForm):
    class Meta:
        model = ImageItem
        fields = ['pageID', 'title','image_file']

    def clean_image_file(self):
        file = self.cleaned_data.get('image_file')
        if file:
            # 檢查副檔名
            if not file.name.endswith(('.jpg', '.jpeg', '.png')):
                raise forms.ValidationError("上傳失敗 只能上傳 JPG、JPEG 或 PNG 圖檔")
            # 檢查 MIME 類型
            if file.content_type not in ['image/jpeg', 'image/png']:
                raise forms.ValidationError("上傳失敗 檔案格式不正確，請上傳 JPG 或 PNG 圖檔")
        return file

class VideoForm(forms.ModelForm):
    class Meta:
        model=videoItem
        fields=['pageID', 'title','video_file']
    
    def clean_video_file(self):
        file=self.cleaned_data.get('video_file')
        if file:
            # 檢查副檔名
            if not file.name.endswith(('.mp4')):
                raise forms.ValidationError("上傳失敗 只能上傳 mp4 影片")
            # 檢查 MIME 類型
            if file.content_type not in ['video/mp4']:
                raise forms.ValidationError("上傳失敗 檔案格式不正確，請上傳 mp4 影片")
        return file
    
class textMessageForm(forms.ModelForm):
    class Meta:
        model=textMessage
        fields=['pageID','text']