import os
from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from django.contrib.staticfiles.handlers import ASGIStaticFilesHandler
import board.routing

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "NoticeBoard.settings")

# 原生 Django ASGI app
django_asgi_app = get_asgi_application()

# ProtocolTypeRouter
application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AuthMiddlewareStack(
        URLRouter(board.routing.websocket_urlpatterns)
    ),
})

# 將整個 ASGI app 包在 ASGIStaticFilesHandler
application = ASGIStaticFilesHandler(application)
