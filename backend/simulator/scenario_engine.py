from typing import Dict, Any

class ScenarioEngine:
    """
    Scenario Engine for the Simulator.
    Provides predefined scenarios for AI traffic and failure modes.
    """
    
    SCENARIOS = {
        "startup": {
            "name": "Startup",
            "users": 500,
            "traffic_pattern": "normal",
            "failure_rate": 0.01
        },
        "enterprise": {
            "name": "Enterprise",
            "users": 100000,
            "traffic_pattern": "peak_hours",
            "failure_rate": 0.05
        },
        "gpu_failure_storm": {
            "name": "GPU Failure Storm",
            "users": 20000,
            "traffic_pattern": "normal",
            "failure_rate": 0.8
        },
        "black_friday": {
            "name": "Black Friday Traffic Spike",
            "users": 500000,
            "traffic_pattern": "viral_event",
            "failure_rate": 0.05
        }
    }
    
    _current_scenario = "startup"
    _acceleration = 1
    _duration_mins = 0
    _start_time = None
    _allowed_tasks = []
    
    @classmethod
    def set_scenario(cls, scenario_id: str, acceleration: int = 1, duration_mins: int = 0, allowed_tasks: list | None = None):
        import time
        if scenario_id in cls.SCENARIOS:
            cls._current_scenario = scenario_id
        cls._acceleration = acceleration
        cls._duration_mins = duration_mins
        cls._start_time = time.time()
        cls._allowed_tasks = allowed_tasks or []
            
    @classmethod
    def get_state(cls) -> Dict[str, Any]:
        import time
        elapsed = time.time() - (cls._start_time or time.time())
        expired = False
        if cls._duration_mins > 0 and elapsed > (cls._duration_mins * 60):
            expired = True
        return {
            "expired": expired,
            "scenario": cls.SCENARIOS.get(cls._current_scenario, cls.SCENARIOS["startup"]),
            "acceleration": cls._acceleration,
            "allowed_tasks": cls._allowed_tasks
        }
