"""
Simulator views.

POST /api/simulator/runs/       — submit a simulation, triggers AGY analysis
GET  /api/simulator/runs/       — list all runs (history)
GET  /api/simulator/runs/<id>/  — detail view for one run
POST /api/simulator/runs/<id>/acknowledge/ — mark run as acknowledged
GET  /api/simulator/config/     — return task specs + tier config (no auth)
"""

import asyncio
import logging
from datetime import datetime, timezone
from django.conf import settings

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.request import Request
from rest_framework.response import Response

from .models import SimulationRun, CompanyProfile
from .serializers import (
    SimulationRunCreateSerializer,
    SimulationRunSerializer,
    SimulationRunListSerializer,
    CompanyProfileSerializer,
)

from rest_framework import viewsets

class CompanyProfileViewSet(viewsets.ModelViewSet):
    queryset = CompanyProfile.objects.all().order_by('-created_at')
    serializer_class = CompanyProfileSerializer
    permission_classes = [IsAuthenticated]

from .workload_engine import (
    assess_allocation,
    TASK_SPECS,
    TIERS,
    TOTAL_NODES,
)

NODES_PER_TIER = 32
from .agy_service import generate_simulation_report

logger = logging.getLogger(__name__)


def _generate_task_image(run, public_gen_dir, target_img_name):
    import os
    from PIL import Image, ImageDraw
    width, height = 800, 450
    
    # Nord palette colors
    nord_bg = '#2e3440'      # Dark background (Polar Night)
    nord_frost = '#88c0d0'   # Light blue
    nord_text = '#eceff4'    # Light text (Snow Storm)
    nord_green = '#a3be8c'   # Green
    nord_yellow = '#ebcb8b'  # Yellow
    nord_red = '#bf616a'     # Red
    nord_card = '#3b4252'    # Dark gray-blue card
    
    img = Image.new('RGB', (width, height), color=nord_bg)
    draw = ImageDraw.Draw(img)
    
    # Outer double border
    draw.rectangle([(10, 10), (width - 10, height - 10)], outline=nord_frost, width=2)
    draw.rectangle([(15, 15), (width - 15, height - 15)], outline='#4c566a', width=1)
    
    # Header area
    draw.rectangle([(20, 20), (width - 20, 70)], fill=nord_card)
    draw.text((40, 35), "CLUSTROCONNECT CLUSTER WORKSTATION // IMAGE GENERATOR", fill=nord_text)
    draw.text((width - 180, 35), f"RUN #{run.id}", fill=nord_frost)
    
    # Render different designs based on task_type
    if run.task_type == "image_generation":
        # Business Card layout
        draw.rectangle([(150, 120), (650, 380)], fill='#3b4252', outline=nord_frost, width=2)
        draw.rectangle([(170, 140), (180, 360)], fill=nord_green)
        draw.text((210, 150), "ORCHESTRATOR CLI", fill=nord_text)
        draw.text((210, 180), "Artificial Intelligence Systems", fill=nord_frost)
        
        user_name = "DJRCX Cluster Developer"
        draw.text((210, 240), f"Name: {user_name}", fill=nord_text)
        draw.text((210, 270), f"Task: {run.prompt[:40]}...", fill='#d8dee9')
        draw.text((210, 300), f"Hardware: Blackwell B200", fill=nord_yellow)
        draw.text((210, 330), "Contact: djrcx@clustroconnect.local", fill=nord_frost)
        
    elif run.task_type == "image_editing":
        # Draw a grid layer on the left
        for x in range(50, 380, 30):
            draw.line([(x, 100), (x, 400)], fill='#434c5e', width=1)
        for y in range(100, 400, 30):
            draw.line([(50, y), (380, y)], fill='#434c5e', width=1)
        draw.text((70, 120), "BEFORE (Original Layer)", fill=nord_frost)
        draw.rectangle([(100, 180), (300, 340)], fill=nord_red, outline='#4c566a', width=2)
        draw.text((120, 250), "Artifact Area", fill=nord_text)
        
        # Arrow pointer
        draw.line([(400, 250), (450, 250)], fill=nord_text, width=3)
        draw.line([(450, 250), (440, 240)], fill=nord_text, width=3)
        draw.line([(450, 250), (440, 260)], fill=nord_text, width=3)
        
        # After on the right
        draw.rectangle([(470, 100), (750, 400)], fill='#434c5e', outline=nord_green, width=2)
        draw.text((490, 120), "AFTER (Inpainted Output)", fill=nord_green)
        draw.rectangle([(520, 180), (720, 340)], fill=nord_green, outline='#88c0d0', width=2)
        draw.text((540, 250), "Inpainted Fill", fill=nord_text)
        
    elif run.task_type == "batch_vision":
        # Multi-face bounding boxes
        draw.text((40, 90), "Vision Batch Classification Output:", fill=nord_text)
        for idx in range(3):
            lx = 50 + idx * 240
            draw.rectangle([(lx, 130), (lx + 220, 370)], fill='#3b4252', outline='#4c566a', width=1)
            draw.rectangle([(lx + 40, 160), (lx + 180, 300)], outline=nord_green, width=2)
            draw.rectangle([(lx + 40, 310), (lx + 180, 350)], fill=nord_green)
            draw.text((lx + 50, 320), f"DETECTED PERSON {idx+1}", fill='#2e3440')
            draw.text((lx + 50, 140), f"Frame_0{idx+1}.png - 99.4%", fill=nord_frost)
            
    elif run.task_type == "ocr_data_retrieval":
        # OCR PDF text extraction representation
        draw.text((40, 90), "Parsed PDF Document Text Zones:", fill=nord_text)
        draw.rectangle([(50, 130), (300, 390)], fill='#eceff4')
        draw.rectangle([(70, 160), (280, 175)], fill='#d8dee9')
        draw.rectangle([(70, 190), (240, 205)], fill='#88c0d0') 
        draw.rectangle([(70, 220), (280, 235)], fill='#d8dee9')
        
        draw.rectangle([(70, 190), (240, 205)], outline=nord_red, width=2)
        draw.text((245, 192), "[ZONE 1]", fill=nord_red)
        
        draw.rectangle([(350, 130), (750, 390)], fill='#3b4252', outline='#4c566a', width=1)
        draw.text((370, 150), "METADATA DICTIONARY OUT:", fill=nord_frost)
        draw.text((370, 190), '"document_type": "PDF_ARCHIVE"', fill=nord_green)
        draw.text((370, 220), '"extracted_records": 14', fill=nord_green)
        draw.text((370, 250), '"confidence_score": 0.988', fill=nord_green)
        draw.text((370, 280), '"status": "SUCCESS"', fill=nord_green)
        
    else:
        # Default fallback
        draw.text((40, 100), f"Task Output Report for {run.task_type.upper()}", fill=nord_frost)
        draw.text((40, 150), f"Query: {run.prompt[:60]}...", fill=nord_text)
        draw.text((40, 200), f"Nodes Allocated: {run.allocated_nodes} / {run.allocated_nodes_actual}", fill=nord_yellow)
        draw.text((40, 250), f"Verdict: {run.verdict.upper()}", fill=nord_green)
        
    target_path = os.path.join(public_gen_dir, target_img_name)
    img.save(target_path)


# ---------------------------------------------------------------------------
# Config endpoint (public — used for workstation real-time preview)
# ---------------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def simulator_config(request: Request) -> Response:
    """Return static task specs and tier definitions for the workstation UI."""
    return Response({
        "tasks": {
            key: {
                "label": spec["label"],
                "min_tier": spec["min_tier"],
                "base_nodes": spec["base_nodes"],
            }
            for key, spec in TASK_SPECS.items()
        },
        "tiers": {
            str(tier_id): {
                "name": info["name"],
                "color": info["color"],
                "nodes": NODES_PER_TIER,
                "ram": info.get("ram", ""),
                "vram": info.get("vram", ""),
                "temp": info.get("temp", 0),
                "power": info.get("power", 0),
            }
            for tier_id, info in TIERS.items()
        },
        "total_nodes": TOTAL_NODES,
    })


# ---------------------------------------------------------------------------
# Workload preview (real-time, no DB write)
# ---------------------------------------------------------------------------

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def workload_preview(request: Request) -> Response:
    """
    Compute workload assessment without saving. Used for real-time slider
    updates in the workstation UI.
    """
    s = SimulationRunCreateSerializer(data=request.data)
    if not s.is_valid():
        return Response(s.errors, status=status.HTTP_400_BAD_REQUEST)

    d = s.validated_data
    result = assess_allocation(
        task_type=d["task_type"],
        allocated_nodes=d["allocated_nodes"],
        user_count=d.get("user_count", 1),
        file_input_size_gb=d["file_input_size_gb"],
        image_count=d["image_count"],
        thinking_depth=d["thinking_depth"],
        complexity_factor=d["complexity_factor"],
    )

    return Response({
        "required_nodes": result.required_nodes,
        "allocated_nodes_requested": result.allocated_nodes_requested,
        "allocated_nodes_actual": result.allocated_nodes_actual,
        "efficiency_pct": result.efficiency_pct,
        "verdict": result.verdict,
        "verdict_label": result.verdict_label,
        "selected_tier": result.selected_tier,
        "tier_name": result.tier_name,
        "warning_message": result.warning_message,
        "requires_intervention": result.requires_intervention,
    })


# ---------------------------------------------------------------------------
# Simulation run list + create
# ---------------------------------------------------------------------------

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def simulation_runs(request: Request) -> Response:
    if request.method == "GET":
        runs = SimulationRun.objects.all().order_by('-id')[:50]
        serializer = SimulationRunListSerializer(runs, many=True)
        return Response(serializer.data)

    # POST — create and trigger AGY analysis
    s = SimulationRunCreateSerializer(data=request.data)
    if not s.is_valid():
        return Response(s.errors, status=status.HTTP_400_BAD_REQUEST)

    d = s.validated_data
    result = assess_allocation(
        task_type=d["task_type"],
        allocated_nodes=d["allocated_nodes"],
        user_count=d.get("user_count", 1),
        file_input_size_gb=d["file_input_size_gb"],
        image_count=d["image_count"],
        thinking_depth=d["thinking_depth"],
        complexity_factor=d["complexity_factor"],
    )

    # Create run record with 'analyzing' status
    run = SimulationRun.objects.create(
        task_type=d["task_type"],
        prompt=d["prompt"],
        chat_session_id=d.get("chat_session_id") or "",
        user_count=d.get("user_count", 1),
        file_input_size_gb=d["file_input_size_gb"],
        image_count=d["image_count"],
        thinking_depth=d["thinking_depth"],
        complexity_factor=d["complexity_factor"],
        selected_tier=result.selected_tier,
        allocated_nodes=d["allocated_nodes"],
        allocated_nodes_actual=result.allocated_nodes_actual,
        required_nodes=result.required_nodes,
        efficiency_pct=result.efficiency_pct,
        verdict=result.verdict,
        status="analyzing",
    )

    # Check if the allocation requires human intervention (e.g., due to cluster overload)
    if result.requires_intervention:
        run.status = "pending"
        run.response_text = result.warning_message
        run.save()

        # Create human approval request in the database
        from gate.models import ApprovalRequest
        next_tier = min(4, result.selected_tier + 1)
        ApprovalRequest.objects.create(
            action_type="MIGRATE",
            target_resource=f"Tier {result.selected_tier}",
            reason=f"Build quadrant Tier {result.selected_tier} ({result.tier_name}) is overloaded by another active simulation. System requests migration to a higher spec quadrant (Tier {next_tier}) to execute.",
            status="PENDING"
        )

        return Response(
            SimulationRunSerializer(run).data,
            status=status.HTTP_201_CREATED,
        )

    # Run AGY analysis synchronously (Django sync view wrapping async)
    try:
        run.status = "processing"
        run.save(update_fields=["status"])

        # Scan directory for image files before executing agy CLI
        import glob
        import shutil
        import os
        
        cwd = os.getcwd()
        pre_images = set(
            glob.glob(os.path.join(cwd, "*.png")) +
            glob.glob(os.path.join(cwd, "**/*.png"), recursive=True) +
            glob.glob(os.path.join(cwd, "*.jpg")) +
            glob.glob(os.path.join(cwd, "**/*.jpg"), recursive=True)
        )

        task_spec = TASK_SPECS.get(d["task_type"], {})
        report = asyncio.run(generate_simulation_report(
            prompt_text=d["prompt"],
            chat_session_id=run.chat_session_id,
            task_type=d["task_type"],
            task_label=str(task_spec.get("label") or d["task_type"]),
            selected_tier=result.selected_tier,
            tier_name=result.tier_name,
            required_nodes=result.required_nodes,
            allocated_nodes=d["allocated_nodes"],
            efficiency_pct=result.efficiency_pct,
            verdict=result.verdict,
            file_input_size_gb=d["file_input_size_gb"],
            image_count=d["image_count"],
            thinking_depth=d["thinking_depth"],
            complexity_factor=d["complexity_factor"],
        ))

        # Scan directory for image files after executing agy CLI
        post_images = set(
            glob.glob(os.path.join(cwd, "*.png")) +
            glob.glob(os.path.join(cwd, "**/*.png"), recursive=True) +
            glob.glob(os.path.join(cwd, "*.jpg")) +
            glob.glob(os.path.join(cwd, "**/*.jpg"), recursive=True)
        )
        
        new_images = post_images - pre_images
        
        public_gen_dir = os.path.join(settings.MEDIA_ROOT, "generated")
        os.makedirs(public_gen_dir, exist_ok=True)
        target_img_name = f"run-{run.id}.png"
        target_path = os.path.join(public_gen_dir, target_img_name)
        
        image_found = False
        media_url_path = f"{settings.MEDIA_URL}generated/{target_img_name}"
        
        # If the CLI generated a new image file in the directory, copy and display it
        if new_images:
            # Sort by modification time to get the latest created image
            sorted_new = sorted(list(new_images), key=lambda x: os.path.getmtime(x), reverse=True)
            new_img_path = sorted_new[0]
            try:
                shutil.copy(new_img_path, target_path)
                report["generated_image_url"] = request.build_absolute_uri(media_url_path)
                image_found = True
                logger.info("Detected new image created by agy CLI: %s. Copied to media folder.", new_img_path)
            except Exception as ecp:
                logger.error("Failed to copy agy-generated image: %s", ecp)

        # Fallback 1: If it's image_generation, try to copy the pre-existing visiting card design
        if not image_found and run.task_type == "image_generation":
            source_img = "/home/djrcx/.gemini/antigravity-ide/brain/d0268efc-a8de-41af-a134-4d4d9ebcfbf5/visiting_card.png"
            if os.path.exists(source_img):
                shutil.copy(source_img, target_path)
                report["generated_image_url"] = request.build_absolute_uri(media_url_path)
                image_found = True
                logger.info("Copied visiting_card.png to media static folder for run %s", run.id)

        # Fallback 2: Generate dynamic task illustration
        if not image_found:
            try:
                _generate_task_image(run, public_gen_dir, target_img_name)
                report["generated_image_url"] = request.build_absolute_uri(media_url_path)
                image_found = True
                logger.info("Generated dynamic task illustration in media folder for run %s", run.id)
            except Exception as eimg:
                logger.error("Failed to generate dynamic task illustration: %s", eimg)

        run.response_text = report.get("response_text", "")
        run.bottleneck_analysis = report.get("bottleneck_analysis", "")
        run.recommendations = report.get("recommendations", [])
        run.demo_talking_points = report.get("demo_talking_points", [])
        run.ai_raw_report = report
        run.status = "completed"
        run.completed_at = datetime.now(timezone.utc)
        run.save()

    except Exception as exc:
        logger.error("Simulation run %s failed: %s", run.pk, exc, exc_info=True)
        run.status = "failed"
        run.save(update_fields=["status"])

    return Response(
        SimulationRunSerializer(run).data,
        status=status.HTTP_201_CREATED,
    )



# ---------------------------------------------------------------------------
# Simulation run detail
# ---------------------------------------------------------------------------

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def simulation_run_detail(request: Request, pk: int) -> Response:
    try:
        run = SimulationRun.objects.get(pk=pk)
    except SimulationRun.DoesNotExist:
        return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)
    return Response(SimulationRunSerializer(run).data)


# ---------------------------------------------------------------------------
# Acknowledge run
# ---------------------------------------------------------------------------

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def acknowledge_run(request: Request, pk: int) -> Response:
    try:
        run = SimulationRun.objects.get(pk=pk)
    except SimulationRun.DoesNotExist:
        return Response({"error": "Not found"}, status=status.HTTP_404_NOT_FOUND)
    run.acknowledged = True
    run.save(update_fields=['acknowledged'])
    return Response({"status": "acknowledged"})


import json
import os

@api_view(['POST'])
@permission_classes([AllowAny])
def inject_failure(request: Request):
    """
    Phase 6: Failure Injection Panel.
    Writes the requested disaster scenario to a state file that telemetry_generator.py reads.
    """
    scenario = request.data.get('scenario', 'manual')  # type: ignore
    state_file = os.path.join(settings.BASE_DIR, 'disaster_state.json')
    
    try:
        with open(state_file, 'w') as f:
            json.dump({'scenario': scenario, 'timestamp': datetime.now().isoformat()}, f)
        return Response({"status": "success", "scenario": scenario})
    except Exception as e:
        return Response({"error": str(e)}, status=500)


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
        
    action = request.data.get('action')  # type: ignore
    if action == 'start':
        scenario_id = request.data.get('scenario_id', 'startup')  # type: ignore
        acceleration = int(request.data.get('acceleration', 1))  # type: ignore
        duration = int(request.data.get('duration_mins', 0))  # type: ignore
        allowed_tasks = request.data.get('allowed_tasks', [])  # type: ignore
        
        ScenarioEngine.set_scenario(scenario_id, acceleration, duration, allowed_tasks)
        TrafficGenerator.start()
        return Response({"status": "started"})
        
    elif action == 'stop':
        TrafficGenerator.stop()
        return Response({"status": "stopped"})
        
    return Response({"error": "Invalid action"}, status=status.HTTP_400_BAD_REQUEST)


# ---------------------------------------------------------------------------
# Judge Mode — scripted autonomous demo endpoint
# ---------------------------------------------------------------------------

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def judge_mode(request: Request):
    """
    Trigger the full pre-scripted demo sequence.
    """
    import random
    import time
    from django.contrib.auth.models import User
    from scheduler.models import WorkloadPlacement
    from sentinel.models import Alert, Prediction
    from costwatch.models import CostReport
    from gate.models import ApprovalRequest

    data = getattr(request, 'data', {})
    scenario = data.get('scenario', 'thermal_runaway') if isinstance(data, dict) else 'thermal_runaway'

    try:
        admin_user = User.objects.filter(is_superuser=True).first()
    except Exception:
        admin_user = None

    if scenario == 'traffic_spike':
        run = SimulationRun.objects.create(
            task_type="production_saas",
            prompt="[JUDGE MODE] Production SaaS experiencing massive Black Friday traffic spike (10x load)",
            allocated_nodes=12,
            file_input_size_gb=10.0,
            image_count=0,
            thinking_depth=4,
            complexity_factor=2.0,
            required_nodes=24,
            status="analyzing",
            company_name="ClustroConnect Demo Corp",
            priority="Critical",
            selected_tier=1,
        )

        timeline = [
            {"step": 1, "delay_ms": 0,    "event": "traffic_surge",     "label": "Massive 10x traffic spike detected on ingress", "icon": "activity"},
            {"step": 2, "delay_ms": 2000, "event": "ai_analyzing",      "label": "AI predicting capacity exhaustion in 45s...", "icon": "cpu"},
            {"step": 3, "delay_ms": 4500, "event": "auto_scale",        "label": "Autonomous Auto-Scale triggered: +12 Nodes", "icon": "layers"},
            {"step": 4, "delay_ms": 7000, "event": "load_balance",      "label": "Rebalancing traffic across expanded cluster...", "icon": "check"},
            {"step": 5, "delay_ms": 10000,"event": "stabilized",        "label": "Cluster stabilized. Zero dropped requests.", "icon": "shield"}
        ]

        Alert.objects.create(node_id="Ingress", severity="HIGH", message="[JUDGE MODE] 10x Traffic Spike Detected. Auto-scaling initiated.")
        WorkloadPlacement.objects.create(
            job_id=f"JM-SCALE-{run.id}",
            source_node="auto-scaler",
            target_node="Cluster-Wide",
            reason="[JUDGE MODE] Autonomous scaling applied (+12 nodes) to handle Black Friday load.",
            status="COMPLETED",
        )

        scheduling_reasons = {
            "cost_delta": {
                "baseline_monthly_usd": 12500,
                "optimized_monthly_usd": 10200,
                "savings_pct": 22,
                "gpu_hours_saved": 45.2,
                "downtime_prevented_sec": 120,
                "carbon_saved_kg": 25,
            }
        }

        return Response({
            "status": "judge_mode_initiated",
            "run_id": run.id,
            "timeline": timeline,
            "scenario": scenario,
            "scheduling_reasons": scheduling_reasons
        })

    elif scenario == 'network_partition':
        run = SimulationRun.objects.create(
            task_type="large_ml_project",
            prompt="[JUDGE MODE] Distributed training cluster partition fault",
            allocated_nodes=32,
            file_input_size_gb=50.0,
            image_count=0,
            thinking_depth=5,
            complexity_factor=3.0,
            required_nodes=32,
            status="analyzing",
            company_name="ClustroConnect Demo Corp",
            priority="Critical",
            selected_tier=1,
        )

        timeline = [
            {"step": 1, "delay_ms": 0,    "event": "fault_detected",    "label": "Network Partition: Spine Switch B unreachable", "icon": "alert"},
            {"step": 2, "delay_ms": 2500, "event": "ai_analyzing",      "label": "AI detecting isolated nodes (16 GPUs offline)", "icon": "cpu"},
            {"step": 3, "delay_ms": 5000, "event": "reroute",           "label": "Rerouting gradient sync via Spine Switch A...", "icon": "arrow"},
            {"step": 4, "delay_ms": 7500, "event": "checkpoint",        "label": "Loading last checkpoint to prevent data loss", "icon": "layers"},
            {"step": 5, "delay_ms": 10500,"event": "resumed",           "label": "Training resumed at degraded capacity (16 GPUs).", "icon": "shield"}
        ]

        Alert.objects.create(node_id="Spine-B", severity="CRITICAL", message="[JUDGE MODE] Network Partition. 16 nodes isolated.")
        WorkloadPlacement.objects.create(
            job_id=f"JM-ROUTE-{run.id}",
            source_node="Spine-B",
            target_node="Spine-A",
            reason="[JUDGE MODE] Autonomous network reroute to bypass isolated spine switch.",
            status="COMPLETED",
        )

        scheduling_reasons = {
            "cost_delta": {
                "baseline_monthly_usd": 8900,
                "optimized_monthly_usd": 8900,
                "savings_pct": 0,
                "gpu_hours_saved": 12.0,
                "downtime_prevented_sec": 45,
                "carbon_saved_kg": 5,
            }
        }

        return Response({
            "status": "judge_mode_initiated",
            "run_id": run.id,
            "timeline": timeline,
            "scenario": scenario,
            "scheduling_reasons": scheduling_reasons
        })

    else:
        # --- Default: Thermal Runaway Scenario ---
        run = SimulationRun.objects.create(
            task_type="llm_inference",
            prompt="[JUDGE MODE] GPT-4 scale LLM inference — distributed across GPU cluster",
            allocated_nodes=8,
            file_input_size_gb=2.5,
            image_count=0,
            thinking_depth=5,
            complexity_factor=0.9,
            required_nodes=8,
            status="analyzing",
            company_name="ClustroConnect Demo Corp",
            priority="Critical",
            selected_tier=1,
        )

        selected_node = "Node-087"
        selected_node_name = "Titan"
        thermal_node = "Node-012"
        thermal_node_name = "Atlas"

        scheduling_reasons = {
            "selected_node": selected_node,
            "selected_node_name": selected_node_name,
            "reasons": [
                {"icon": "check", "text": "Lowest queue depth (0 jobs)", "weight": 0.35},
                {"icon": "check", "text": "Lowest thermal risk (42°C baseline)", "weight": 0.23},
                {"icon": "check", "text": "Sufficient VRAM available (18.4 GB free)", "weight": 0.31},
                {"icon": "check", "text": "Estimated completion 31% faster than alternatives", "weight": 0.11},
            ],
            "confidence_breakdown": {
                "scheduling_confidence": 98,
                "thermal_prediction": 94,
                "resource_availability": 97,
                "historical_accuracy": 95,
                "final_confidence": 96,
            },
            "cost_delta": {
                "baseline_monthly_usd": 7200,
                "optimized_monthly_usd": 5860,
                "savings_pct": 19,
                "gpu_hours_saved": 18.4,
                "downtime_prevented_sec": 12,
                "carbon_saved_kg": 18,
            }
        }

        run.status = "processing"
        run.save()

        WorkloadPlacement.objects.create(
            job_id=f"JM-{run.id}",
            source_node="queue",
            target_node=selected_node,
            reason=f"[JUDGE MODE] AI selected {selected_node_name} ({selected_node}): optimal thermal + VRAM profile",
            status="COMPLETED",
        )

        state_file = os.path.join(settings.BASE_DIR, 'disaster_state.json')
        try:
            with open(state_file, 'w') as f:
                json.dump({
                    'scenario': 'thermal_runaway',
                    'target_node': thermal_node,
                    'timestamp': datetime.now(timezone.utc).isoformat()
                }, f)
        except Exception:
            pass

        Prediction.objects.create(
            node_id=thermal_node,
            failure_probability=0.91,
            reason=f"[JUDGE MODE] IsolationForest anomaly detected: rapid thermal escalation on {thermal_node_name} ({thermal_node}). Temperature trajectory: 68°C→83°C→91°C in 90s. Pattern matches historical GPU thermal runaway event (2024-11-14). Failure imminent.",
        )

        Alert.objects.create(
            node_id=thermal_node,
            severity="CRITICAL",
            message=f"[JUDGE MODE] INCIDENT-{random.randint(200, 299)}: Thermal runaway on {thermal_node_name} ({thermal_node}). Failure probability 91%. Auto-migration initiated.",
        )

        migration_target = "Node-034"
        migration_target_name = "Orion"
        WorkloadPlacement.objects.create(
            job_id=f"MIG-JM-{int(time.time())}",
            source_node=thermal_node,
            target_node=migration_target,
            reason=f"[JUDGE MODE] AUTONOMOUS MIGRATION: {thermal_node_name}→{migration_target_name}. Thermal breach 91°C. Zero downtime. Learning engine updated.",
            status="COMPLETED",
        )

        ApprovalRequest.objects.create(
            action_type="LIVE MIGRATION",
            target_resource=thermal_node,
            reason=f"[JUDGE MODE] Thermal anomaly on {thermal_node_name}. AI autonomously migrated workload to {migration_target_name}. Downtime: 0ms.",
            status="APPROVED",
            approved_by=admin_user,
        )

        CostReport.objects.create(
            node_id=thermal_node,
            idle_time_hours=0.2,
            wasted_cost_usd=0.003,
        )

        timeline = [
            {"step": 1, "delay_ms": 0,    "event": "job_submitted",     "label": "AI Training Job submitted to queue",              "icon": "upload"},
            {"step": 2, "delay_ms": 1500, "event": "ai_analyzing",      "label": "Scanning 128 GPUs...",                             "icon": "cpu"},
            {"step": 3, "delay_ms": 4000, "event": "ai_decided",        "label": f"GPU Selected: {selected_node_name} ({selected_node})", "icon": "check", "data": scheduling_reasons},
            {"step": 4, "delay_ms": 6000, "event": "twin_updated",      "label": "Digital Twin updated — workload assigned",          "icon": "layers"},
            {"step": 5, "delay_ms": 8000, "event": "thermal_spike",     "label": f"⚠ Thermal anomaly: {thermal_node_name} ({thermal_node}) — 91°C", "icon": "flame"},
            {"step": 6, "delay_ms": 11000,"event": "prediction",        "label": "Failure Probability: 91% — Migration recommended",  "icon": "alert"},
            {"step": 7, "delay_ms": 14000,"event": "migration_start",   "label": "Autonomous migration initiated — countdown 3...2...1", "icon": "arrow"},
            {"step": 8, "delay_ms": 17500,"event": "migration_complete","label": f"Migration complete: {thermal_node_name}→{migration_target_name}. Cluster stable.", "icon": "shield", "data": scheduling_reasons["cost_delta"]},
        ]

        return Response({
            "status": "judge_mode_initiated",
            "run_id": run.id,
            "timeline": timeline,
            "scenario": scenario,
            "scheduling_reasons": scheduling_reasons,
            "selected_node": selected_node,
            "selected_node_name": selected_node_name,
            "thermal_node": thermal_node,
            "thermal_node_name": thermal_node_name,
            "migration_target": migration_target,
            "migration_target_name": migration_target_name,
        })
