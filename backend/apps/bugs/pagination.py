from rest_framework.pagination import PageNumberPagination


class BoardPagination(PageNumberPagination):
    """Matches the board's own pager: `page` + `pageSize` of 10, 25 or 50."""

    page_size = 10
    page_size_query_param = "pageSize"
    max_page_size = 100
