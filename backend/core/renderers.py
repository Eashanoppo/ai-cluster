from rest_framework.renderers import JSONRenderer

class StandardizedJSONRenderer(JSONRenderer):
    def render(self, data, accepted_media_type=None, renderer_context=None):
        # Check if the response is already formatted (e.g., from CopilotQueryView)
        if isinstance(data, dict) and "success" in data:
            return super().render(data, accepted_media_type, renderer_context)

        # Skip wrapping for non-success responses (handled by custom exception handler)
        if renderer_context is None:
            return super().render(data, accepted_media_type, renderer_context)
        response = renderer_context.get('response')
        if response is None:
            return super().render(data, accepted_media_type, renderer_context)
        status_code = response.status_code
        if status_code >= 400:
            return super().render(data, accepted_media_type, renderer_context)

        # Wrap successful responses
        standardized_data = {
            "success": True,
            "data": data
        }
        return super().render(standardized_data, accepted_media_type, renderer_context)
