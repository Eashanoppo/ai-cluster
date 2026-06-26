from rest_framework.views import exception_handler

def standardized_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        custom_response_data = {
            "success": False,
            "error": {
                "code": exc.__class__.__name__.upper(),
                "message": str(exc.detail) if hasattr(exc, 'detail') else str(exc)
            }
        }
        response.data = custom_response_data

    return response
