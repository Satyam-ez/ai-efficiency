from django.contrib.auth import get_user_model
from rest_framework import serializers

User = get_user_model()


class PersonSerializer(serializers.ModelSerializer):
    """Matches the `Person` interface the frontend already types against.

    `id` is the username, because the board's person ids are slugs like
    `ishita` and every seeded reference uses them.
    """

    id = serializers.CharField(source="username", read_only=True)

    class Meta:
        model = User
        fields = ["id", "name", "initials", "role"]


class CurrentUserSerializer(PersonSerializer):
    class Meta(PersonSerializer.Meta):
        fields = PersonSerializer.Meta.fields + ["email", "is_staff"]


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(style={"input_type": "password"})
