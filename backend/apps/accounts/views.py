from django.contrib.auth import authenticate, get_user_model, login, logout
from django.middleware.csrf import get_token
from rest_framework import status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .serializers import CurrentUserSerializer, LoginSerializer, PersonSerializer

User = get_user_model()


@api_view(["GET"])
@permission_classes([AllowAny])
def csrf(request):
    """Hands the frontend a CSRF cookie before it posts the login form."""
    return Response({"csrfToken": get_token(request)})


@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    form = LoginSerializer(data=request.data)
    form.is_valid(raise_exception=True)

    user = authenticate(
        request,
        username=form.validated_data["username"],
        password=form.validated_data["password"],
    )
    if user is None:
        # One message for both a wrong username and a wrong password, so the
        # endpoint cannot be used to find out which accounts exist.
        return Response(
            {"detail": "Incorrect username or password."},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    login(request, user)
    return Response(CurrentUserSerializer(user).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_view(request):
    logout(request)
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    """The signed-in person, replacing the hardcoded CURRENT_USER_ID."""
    return Response(CurrentUserSerializer(request.user).data)


class PeopleViewSet(viewsets.ReadOnlyModelViewSet):
    """The people who can report, be assigned, or watch — for the pickers."""

    queryset = User.objects.filter(is_active=True)
    serializer_class = PersonSerializer
    lookup_field = "username"
    pagination_class = None
