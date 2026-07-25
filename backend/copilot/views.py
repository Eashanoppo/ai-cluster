from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from pydantic import BaseModel, ValidationError, Field
from typing import Optional
from django.conf import settings
from openai import OpenAI

class CopilotQuerySchema(BaseModel):
    query: str = Field(..., max_length=10000)
    provider: Optional[str] = None
    model: Optional[str] = None

class CopilotQueryView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            # Validate using Pydantic
            validated_data = CopilotQuerySchema(**request.data)
            query = validated_data.query
            provider = validated_data.provider or getattr(settings, 'LLM_PROVIDER', 'ollama') or 'ollama'
            model = validated_data.model or getattr(settings, 'LLM_MODEL', 'llama3') or 'llama3'
        except ValidationError as e:
            print("Validation error in CopilotQueryView:", e)
            return Response({
                "success": False,
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": f"Invalid input: {str(e)}"
                }
            }, status=400)

        # Configure OpenAI Client
        try:
            if provider.lower() == 'openrouter':
                client = OpenAI(
                    base_url="https://openrouter.ai/api/v1",
                    api_key=settings.OPENROUTER_API_KEY,
                    default_headers={
                        "HTTP-Referer": "http://localhost:3000",
                        "X-Title": "ClustroConnect Cluster AI",
                    }
                )
            else:
                # Default to Ollama
                client = OpenAI(
                    base_url=settings.OLLAMA_BASE_URL,
                    api_key="ollama", # required, but unused
                    timeout=300.0, # 5 minutes timeout for slow local model loading
                )
            
            response = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": "You are ClustroConnect Copilot, an AI cluster management assistant. You analyze cluster telemetry, predict GPU failures, and schedule workloads. Give concise, operational responses."},
                    {"role": "user", "content": query}
                ],
                max_tokens=200,
            )
            
            message = response.choices[0].message.content
            
            return Response({
                "success": True,
                "data": {
                    "message": message
                }
            })
        except Exception as e:
            return Response({
                "success": False,
                "error": {
                    "code": "LLM_ERROR",
                    "message": str(e)
                }
            }, status=500)
