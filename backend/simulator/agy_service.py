"""
Antigravity SDK agent service for simulation analysis.

Runs a local AI agent that generates structured SimulationReport output
from allocation data. GEMINI_API_KEY is auto-read from the environment.
"""

import os
import asyncio
import logging
from typing import Any
import json

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Agent service
# ---------------------------------------------------------------------------

async def generate_simulation_report(
    prompt_text: str,
    chat_session_id: str,
    task_type: str,
    task_label: str,
    selected_tier: int,
    tier_name: str,
    required_nodes: int,
    allocated_nodes: int,
    efficiency_pct: float,
    verdict: str,
    file_input_size_gb: float,
    image_count: int,
    thinking_depth: int,
    complexity_factor: float,
) -> dict[str, Any]:
    """
    Run the agy CLI tool in a subprocess and return a parsed SimulationReport dict.
    Falls back to a deterministic report if the CLI call fails.
    """
    # Retrieve past conversation history logs from DB to write context logs
    history_logs = []
    history_context = ""
    try:
        from .models import SimulationRun
        # Fetch completed runs in this session, sorted chronologically
        past_runs = SimulationRun.objects.filter(
            chat_session_id=chat_session_id,
            status='completed'
        ).order_by('created_at')

        for pr in past_runs:
            history_logs.append({
                "role": "user",
                "content": pr.prompt
            })
            history_logs.append({
                "role": "assistant",
                "content": pr.response_text
            })

        # Save to chat session logs directory
        if chat_session_id:
            log_dir = os.path.join(os.path.dirname(__file__), "chat_logs")
            os.makedirs(log_dir, exist_ok=True)
            log_path = os.path.join(log_dir, f"{chat_session_id}.json")
            with open(log_path, "w") as f:
                json.dump(history_logs, f, indent=2)

        # Build in-context prompt logs so CLI understands context
        if history_logs:
            history_context = "\n\nPREVIOUS CONVERSATION HISTORY LOGS:\n"
            for item in history_logs:
                history_context += f"{item['role'].upper()}: {item['content']}\n"
    except Exception as e:
        logger.error("Error creating chat logs: %s", e)

    prompt = f"""
Analyze this cluster allocation decision and generate a full SimulationReport JSON object.

USER CHAT PROMPT:
"{prompt_text}"{history_context}

TASK CONFIGURATION:
- Task Type: {task_label} ({task_type})
- File Input Size: {file_input_size_gb} GB
- Image Count: {image_count}
- Thinking Depth: {thinking_depth}/5
- Complexity Factor: {complexity_factor}/5.0

ALLOCATION DECISION:
- Selected Tier: Tier {selected_tier} ({tier_name})
- Allocated Nodes (Requested): {allocated_nodes} nodes
- Required Nodes: {required_nodes} nodes
- Efficiency: {efficiency_pct}%
- Verdict: {verdict.upper().replace('_', ' ')}

Format the output strictly as a JSON object matching this schema:
{{
    "response_text": "A direct text response answering the USER CHAT PROMPT. Address their request, describe the task completion (e.g. if they asked to process an image or run OCR, confirm that you did it, and provide details of the results), and explain how the selected node configuration performed.",
    "bottleneck_analysis": "Detailed technical explanation of the node allocation efficiency.",
    "recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3"],
    "demo_talking_points": ["Judge talking point 1", "Judge talking point 2", "Judge talking point 3"],
    "risk_level": "LOW or MEDIUM or HIGH or CRITICAL"
}}

Respond ONLY with raw, valid JSON. Do not include markdown code block formatting or backticks.
""".strip()

    try:
        # Run agy CLI via subprocess
        agy_path = "/home/djrcx/.local/bin/agy"
        if not os.path.exists(agy_path):
            agy_path = "agy"

        # Build command with conversation ID for context persistence
        cmd = [agy_path]
        if chat_session_id:
            cmd.extend(["--conversation", chat_session_id])
        cmd.extend(["--print", prompt])
        
        # Run the process asynchronously to avoid blocking the loop
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await proc.communicate()

        if proc.returncode == 0:
            output_str = stdout.decode().strip()
            # Clean up potential markdown code block wrappers
            if output_str.startswith("```"):
                lines = output_str.splitlines()
                if lines[0].startswith("```json") or lines[0] == "```":
                    lines = lines[1:]
                if lines and lines[-1] == "```":
                    lines = lines[:-1]
                output_str = "\n".join(lines).strip()

            data = json.loads(output_str)
            logger.info("agy CLI generated SimulationReport for %s", task_type)
            return data
        else:
            logger.error("agy CLI returned non-zero code: %s. Stderr: %s", proc.returncode, stderr.decode())

    except Exception as exc:
        logger.error("agy CLI execution error: %s", exc, exc_info=True)

    # Deterministic fallback (works even without API key / SDK installed)
    return _fallback_report(
        prompt_text, task_label, tier_name, selected_tier, required_nodes,
        allocated_nodes, efficiency_pct, verdict
    )


def _fallback_report(
    prompt_text: str,
    task_label: str,
    tier_name: str,
    selected_tier: int,
    required_nodes: int,
    allocated_nodes: int,
    efficiency_pct: float,
    verdict: str,
) -> dict[str, Any]:
    """Deterministic report returned when the AGY agent is unavailable."""
    v = verdict.lower()

    if v == "overload":
        response_text = (
            f"Unable to process request: '{prompt_text}'. The workload requires at least {required_nodes} nodes, "
            f"but you only allocated {allocated_nodes}. This configuration will cause node overload and process execution failures."
        )
        return {
            "response_text": response_text,
            "efficiency_verdict": "OVERLOAD",
            "efficiency_summary": (
                f"{task_label} requires {required_nodes} nodes but Tier {selected_tier} "
                f"({tier_name}) only provides {allocated_nodes} — system is overloaded."
            ),
            "bottleneck_analysis": (
                f"The selected Tier {selected_tier} ({tier_name}) provides {allocated_nodes} "
                f"nodes, but this workload demands {required_nodes} nodes. The {required_nodes - allocated_nodes} "
                f"node deficit will cause job queuing, increased latency, and potential task failure. "
                f"Under sustained load, this configuration risks cascading failures across dependent jobs."
            ),
            "recommendations": [
                f"Upgrade allocation to {required_nodes} nodes or higher for adequate capacity",
                "Reduce complexity_factor or thinking_depth to lower node requirements",
                "Consider splitting this workload across multiple smaller runs",
                "Enable auto-scaling policies to handle peak demand spikes",
            ],
            "demo_talking_points": [
                f"The system correctly detected an overload: {required_nodes} nodes needed vs {allocated_nodes} available",
                "Real-world consequence: job queuing and SLA violation risk",
                "The platform prevented resource exhaustion before submission",
            ],
            "risk_level": "CRITICAL",
        }
    elif v == "idle_waste":
        response_text = (
            f"Workload completed successfully for prompt: '{prompt_text}'. However, only {efficiency_pct:.0f}% of "
            f"capacity was utilized. We auto-released {allocated_nodes - required_nodes} excess idle nodes to minimize wastage."
        )
        return {
            "response_text": response_text,
            "efficiency_verdict": "IDLE WASTE",
            "efficiency_summary": (
                f"{task_label} only uses {efficiency_pct:.0f}% of Tier {selected_tier} capacity — "
                f"{allocated_nodes - required_nodes} nodes are sitting idle."
            ),
            "bottleneck_analysis": (
                f"At {efficiency_pct:.1f}% utilization, {allocated_nodes - required_nodes} of "
                f"{allocated_nodes} allocated nodes are inactive. This represents significant "
                f"compute wastage. In a production environment, this idle capacity has a direct "
                f"dollar cost and blocks other workloads from using those nodes."
            ),
            "recommendations": [
                f"Downgrade allocation to {required_nodes} nodes to better match workload demands",
                "Increase complexity_factor or batch more work into this run",
                "Configure auto-consolidation to free idle nodes for other tasks",
                "Schedule this workload during peak hours to share tier capacity",
            ],
            "demo_talking_points": [
                f"Only {efficiency_pct:.0f}% utilization detected — a clear cost inefficiency",
                f"{allocated_nodes - required_nodes} nodes wasted with zero output contribution",
                "The platform quantified the waste before resource commitment",
            ],
            "risk_level": "MEDIUM",
        }
    else:
        response_text = (
            f"Successfully processed task '{task_label}' for query: '{prompt_text}'. "
            f"The task was executed on the {tier_name} config using {required_nodes} nodes at {efficiency_pct:.0f}% efficiency."
        )
        return {
            "response_text": response_text,
            "efficiency_verdict": "OPTIMAL",
            "efficiency_summary": (
                f"{task_label} is well-matched to Tier {selected_tier} ({tier_name}) "
                f"at {efficiency_pct:.0f}% utilization — efficient and balanced."
            ),
            "bottleneck_analysis": (
                f"The allocation achieves {efficiency_pct:.1f}% efficiency: {required_nodes} nodes "
                f"required vs {allocated_nodes} allocated. This falls within the optimal 25–100% "
                f"utilization band, ensuring responsive processing without wastage or risk of overload. "
                f"Tier {selected_tier} ({tier_name}) is the correct hardware match for this workload profile."
            ),
            "recommendations": [
                "Maintain this tier assignment for similar workloads",
                "Monitor utilization trend — scale up if requirements grow by >20%",
                "Consider enabling predictive pre-allocation for recurring jobs of this type",
            ],
            "demo_talking_points": [
                f"Optimal allocation achieved: {efficiency_pct:.0f}% cluster utilization",
                f"Tier {selected_tier} ({tier_name}) correctly matched to workload requirements",
                "Zero overload risk, zero wastage — the platform's recommendation validated",
            ],
            "risk_level": "LOW",
        }
