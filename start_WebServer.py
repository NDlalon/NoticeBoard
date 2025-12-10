import logging 
logging.basicConfig(level=logging.DEBUG)
import os
import sys
import subprocess
import signal
import win32con # type: ignore
import win32api # type: ignore
from daphne.server import Server
from NoticeBoard.asgi import application

# For PyInstaller to include dependencies
if False:
    import daphne
    import channels
    import channels.generic
    import channels.generic.websocket
    import django

#=========================================
# Daphne IP/Port 設定
#=========================================
D_IP = "127.0.0.1"
D_PORT = "8000"

#=========================================
# 路徑設定（可相容 PyInstaller）
#=========================================

if getattr(sys, 'frozen', False):
    BASE_DIR = sys._MEIPASS  # runtime folder
    EXEC_DIR = os.path.dirname(sys.executable)  # dist/noticeboard/
    STAC_DIR=os.path.join(BASE_DIR,"NoticeBoard")
else:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    EXEC_DIR = BASE_DIR
    STAC_DIR=BASE_DIR

NGINX_DIR = os.path.join(EXEC_DIR, "nginx")
NGINX_EXE = os.path.join(NGINX_DIR, "nginx")
PROJECT_DIR = os.path.join(BASE_DIR, "NoticeBoard")

#=========================================
# 動態修改 Django 設定以確保模板路徑
#=========================================
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "NoticeBoard.settings")
sys.path.insert(0, PROJECT_DIR)
os.chdir(PROJECT_DIR)

import django
django.setup()  # 初始化 Django

from django.conf import settings
# 添加模板目錄到 TEMPLATES['DIRS']
settings.TEMPLATES[0]['DIRS'].append(os.path.join(PROJECT_DIR, 'board/templates'))

#=========================================
# Nginx靜態檔案路徑修正
#=========================================
file=open(NGINX_DIR+'\conf\\nginx.conf','r')
staticflag=False
mediaflag=False
newconf=[]

for f in file:
    if(staticflag):
        spaces = len(f) - len(f.lstrip(" "))
        newline=f"{' '*spaces}alias \"{STAC_DIR}\static\\\";\n"
        newline=newline.replace('\\','/')
        newconf.append(newline)
        staticflag=False
        continue
    elif(mediaflag):
        spaces = len(f) - len(f.lstrip(" "))
        newline=f"{' '*spaces}alias \"{BASE_DIR}\media\\\";\n"
        newline=newline.replace('\\','/')
        newconf.append(newline)
        mediaflag=False
        continue
    if('location /static/' in f):
        staticflag=True
    elif('location /media/' in f):
        mediaflag=True
    newconf.append(f)
file.close()

file=open(NGINX_DIR+'\conf\\nginx.conf','w')
for line in newconf:
    file.writelines(line)
file.close()
#=========================================
# 停止服務
#=========================================
def stop_all(signum=None, frame=None):
    print("\nStopping all processes...")

    try:
        subprocess.run([NGINX_EXE, "-s", "stop"], cwd=NGINX_DIR)
    except Exception as e:
        print(f"Failed to stop nginx: {e}")

    sys.exit(0)

def windows_close_handler(event):
    if event == win32con.CTRL_CLOSE_EVENT:
        print("Console window closed!")
        stop_all()
        return True
    return False

if os.name == 'nt':  # Windows
    win32api.SetConsoleCtrlHandler(windows_close_handler, True)

#=========================================
# 註冊 Ctrl+C 終止信號
#=========================================
signal.signal(signal.SIGINT, stop_all)
signal.signal(signal.SIGTERM, stop_all)

#=========================================
# 啟動 Nginx
#=========================================
print("Starting nginx...")
nginx_proc = subprocess.Popen([NGINX_EXE], cwd=NGINX_DIR)

#=========================================
# 啟動 Daphne
#=========================================
print("Starting Daphne...")

daphne_process = Server(
    application=application,
    endpoints=[f"tcp:port={D_PORT}:interface={D_IP}"],  # 可換 port
    signal_handlers=False,  # 若你要自行控制 signal，可改 True
)

#=========================================
# Daphne 主執行
#=========================================
daphne_process.run()

#=========================================
# Daphne 結束 → 停止 nginx
#=========================================
stop_all()