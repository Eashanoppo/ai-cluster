code = """

@api_view(['POST', 'GET'])
@permission_classes([AllowAny])
def scenario_control(request: Request):
    from .scenario_engine import ScenarioEngine
    from .traffic_generator import TrafficGenerator
    
    if request.method == 'GET':
        state = ScenarioEngine.get_state()
        return Response({
            "status": "running" if TrafficGenerator._running else "stopped",
            "state": state
        })
        
    action = request.data.get('action')
    if action == 'start':
        scenario_id = request.data.get('scenario_id', 'startup')
        acceleration = int(request.data.get('acceleration', 1))
        duration = int(request.data.get('duration_mins', 0))
        allowed_tasks = request.data.get('allowed_tasks', [])
        
        ScenarioEngine.set_scenario(scenario_id, acceleration, duration, allowed_tasks)
        TrafficGenerator.start()
        return Response({"status": "started"})
        
    elif action == 'stop':
        TrafficGenerator.stop()
        return Response({"status": "stopped"})
        
    return Response({"error": "Invalid action"}, status=status.HTTP_400_BAD_REQUEST)
"""
with open('simulator/views.py', 'a', encoding='utf-8') as f:
    f.write(code)
