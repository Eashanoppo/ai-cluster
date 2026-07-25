import random
import time
from threading import Thread
from typing import List, Dict, Any
from .scenario_engine import ScenarioEngine
from .workload_engine import TASK_SPECS

class TrafficGenerator:
    """
    Traffic Generator simulates incoming user requests.
    Translates scenario patterns into Workload requests.
    """
    
    _running = False
    _thread = None
    _queue = []
    
    @classmethod
    def start(cls):
        if not cls._running:
            cls._running = True
            cls._thread = Thread(target=cls._generate_loop, daemon=True)
            cls._thread.start()
            
    @classmethod
    def stop(cls):
        cls._running = False
        if cls._thread:
            cls._thread.join()
            
    @classmethod
    def pop_requests(cls) -> List[Dict[str, Any]]:
        reqs = cls._queue.copy()
        cls._queue.clear()
        return reqs
            
    @classmethod
    def _generate_loop(cls):
        from .models import SimulationRun
        while cls._running:
            state = ScenarioEngine.get_state()
            if state["expired"]:
                cls._running = False
                break
                
            scenario = state["scenario"]
            acceleration = state.get("acceleration", 1)
            allowed_tasks = state.get("allowed_tasks", [])
            
            # Determine requests per second based on pattern
            rps = 1
            if scenario["traffic_pattern"] == "peak_hours":
                rps = random.randint(5, 20)
            elif scenario["traffic_pattern"] == "viral_event":
                rps = random.randint(50, 200)
            else:
                rps = random.randint(1, 5)
                
            rps = rps * acceleration
            
            available_tasks = allowed_tasks if allowed_tasks else list(TASK_SPECS.keys())
            
            runs_to_create = []
            for _ in range(rps):
                task_type = random.choice(available_tasks)
                spec = TASK_SPECS.get(task_type, {})
                min_tier = spec.get("min_tier", 1)
                nodes = spec.get("base_nodes", 4)
                
                runs_to_create.append(SimulationRun(
                    task_type=task_type,
                    status='queued',
                    priority=random.choice(["Normal", "High", "Critical"]),
                    selected_tier=min_tier,
                    required_nodes=nodes,
                    allocated_nodes=nodes,
                    efficiency_pct=0.0
                ))
            
            if runs_to_create:
                SimulationRun.objects.bulk_create(runs_to_create)
                
            # Sleep takes acceleration into account by generating more per loop, or sleeping less.
            # We already multiplied RPS by acceleration, so sleep for 1 real second.
            time.sleep(1)
