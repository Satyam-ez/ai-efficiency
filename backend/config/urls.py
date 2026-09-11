from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.accounts import views as accounts_views
from apps.bugs import views as bugs_views
from apps.projects.views import ProjectViewSet

# No trailing slashes anywhere in the API.
#
# The frontend reaches this through a Next.js rewrite, and that rewrite
# consumes the trailing slash when it forwards the path — which left
# Django's APPEND_SLASH redirecting straight back and every call looping.
# Dropping the slash on this side removes the mismatch for good.
router = DefaultRouter(trailing_slash=False)
router.register("bugs", bugs_views.BugViewSet, basename="bug")
router.register("projects", ProjectViewSet, basename="project")
router.register("comments", bugs_views.CommentViewSet, basename="comment")
router.register("attachments", bugs_views.AttachmentViewSet, basename="attachment")
router.register("people", accounts_views.PeopleViewSet, basename="person")

auth_patterns = [
    path("csrf", accounts_views.csrf, name="csrf"),
    path("login", accounts_views.login_view, name="login"),
    path("logout", accounts_views.logout_view, name="logout"),
    path("me", accounts_views.me, name="me"),
]

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/", include(auth_patterns)),
    path("api/meta", bugs_views.meta, name="meta"),
    path("api/", include(router.urls)),
]

if settings.DEBUG:
    # Uploaded evidence is served by Django in development only; in production
    # this is the web server's or object store's job.
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
