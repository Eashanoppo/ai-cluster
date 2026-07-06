/**
 * Workload calculation engine (client-side).
 * Mirrors the Python workload_engine.py for zero-latency real-time preview.
 * No API calls — pure deterministic math.
 */

export const TOTAL_NODES = 128;

export type Verdict = "optimal" | "overload" | "idle_waste";

export interface TierInfo {
  name: string;
  color: string;
  borderColor: string;
  vram: string;
  ram: string;
  temp: number;
  power: number;
}

export const TIERS: Record<number, TierInfo> = {
  1: {
    name: "RTX 3090 Build",
    color: "#a3be8c", // Nord14 Green
    borderColor: "#88a872",
    vram: "24GB GDDR6X",
    ram: "16GB DDR5",
    temp: 65,
    power: 350,
  },
  2: {
    name: "RTX 4090 Build",
    color: "#ebcb8b", // Nord13 Yellow
    borderColor: "#d4b070",
    vram: "24GB GDDR6X",
    ram: "32GB DDR5",
    temp: 60,
    power: 450,
  },
  3: {
    name: "RTX 5090 Build",
    color: "#d08770", // Nord12 Orange
    borderColor: "#b86d56",
    vram: "32GB GDDR7",
    ram: "64GB DDR5",
    temp: 58,
    power: 600,
  },
  4: {
    name: "Blackwell B200 Build",
    color: "#bf616a", // Nord11 Red
    borderColor: "#a54c54",
    vram: "192GB HBM3",
    ram: "128GB LPDDR5",
    temp: 55,
    power: 700,
  },
};

export interface TaskSpec {
  label: string;
  description: string;
  icon: string;
  baseNodes: number;
  minTier: number;
}

export const TASK_SPECS: Record<string, TaskSpec> = {
  ocr_data_retrieval: {
    label: "OCR & Data Retrieval",
    description: "Scan documents, extract metadata, search directories",
    icon: "📄",
    baseNodes: 8,
    minTier: 1,
  },
  image_generation: {
    label: "Image Generation",
    description: "Draw new visual assets from descriptions",
    icon: "🎨",
    baseNodes: 16,
    minTier: 2,
  },
  batch_vision: {
    label: "Batch Vision Processing",
    description: "Multi-image analysis, visual matching, scaling count",
    icon: "🖼️",
    baseNodes: 24,
    minTier: 3,
  },
  image_editing: {
    label: "Image Editing",
    description: "Inpaint, crop, erase, or modify existing designs",
    icon: "✂️",
    baseNodes: 12,
    minTier: 2,
  },
  large_ml_project: {
    label: "Large ML Project",
    description: "Deep research, fine-tuning, training foundation models",
    icon: "🧠",
    baseNodes: 64,
    minTier: 4,
  },
};

export interface WorkloadParams {
  taskType: string;
  fileInputSizeGb: number;
  imageCount: number;
  thinkingDepth: number;
  complexityFactor: number;
}

export interface AllocationResult {
  requiredNodes: number;
  allocatedNodesRequested: number;
  allocatedNodesActual: number;
  selectedTier: number;
  tierName: string;
  efficiencyPct: number;
  verdict: Verdict;
  verdictLabel: string;
  verdictColor: string;
  warningMessage: string;
  requiresIntervention: boolean;
}

export function calculateRequiredNodes(params: WorkloadParams): number {
  const spec = TASK_SPECS[params.taskType];
  if (!spec) return 8;

  const base = spec.baseNodes;
  const depthMultiplier = 1.0 + params.thinkingDepth * 0.1;
  const complexityMultiplier = params.complexityFactor;

  let nodes = base * depthMultiplier * complexityMultiplier;

  if (params.taskType === "ocr_data_retrieval" && params.fileInputSizeGb > 1.0) {
    nodes += params.fileInputSizeGb * 1.5;
  } else if (params.taskType === "batch_vision" && params.imageCount > 1) {
    nodes += (params.imageCount - 1) * 4;
  }

  return Math.max(1, Math.min(32, Math.floor(nodes)));
}

export function assessAllocation(
  params: WorkloadParams,
  allocatedNodes: number
): AllocationResult {
  const spec = TASK_SPECS[params.taskType] || TASK_SPECS["ocr_data_retrieval"];
  const required = calculateRequiredNodes(params);
  const tier = spec.minTier;
  const tierInfo = TIERS[tier];

  let actualAllocated = allocatedNodes;
  let verdict: Verdict = "optimal";
  let verdictLabel = "OPTIMAL";
  let verdictColor = "#a3be8c"; // Nord Green
  let warningMessage = "";
  let requiresIntervention = false;

  if (allocatedNodes < required) {
    const deficitPct = (required - allocatedNodes) / required;
    if (deficitPct <= 0.20) {
      // Deficit under 20%: auto-scale up
      actualAllocated = required;
      verdict = "optimal";
      verdictLabel = "OPTIMAL (AUTO-SCALED UP)";
      verdictColor = "#a3be8c";
      warningMessage = `Slight deficit under 20%. Auto-scaling allocation from ${allocatedNodes} to required ${required} nodes.`;
    } else {
      // Deficit over 20%: block and request human intervention
      actualAllocated = allocatedNodes;
      verdict = "overload";
      verdictLabel = "OVERLOAD (INTERVENTION REQUIRED)";
      verdictColor = "#bf616a"; // Nord Red
      requiresIntervention = true;
      warningMessage = `CRITICAL: Deficit too large (${Math.round(deficitPct * 100)}%). Allocate at least ${required} nodes to run.`;
    }
  } else if (allocatedNodes > required) {
    // Excess allocation: auto-scale down
    actualAllocated = required;
    verdict = "optimal";
    verdictLabel = "OPTIMAL (AUTO-RELEASED SURPLUS)";
    verdictColor = "#a3be8c";
    warningMessage = `Released ${allocatedNodes - required} excess idle nodes to reduce cluster waste.`;
  } else {
    // Perfect match
    actualAllocated = required;
    verdict = "optimal";
    verdictLabel = "OPTIMAL";
    verdictColor = "#a3be8c";
  }

  const efficiencyPct = Math.min(100, (required / Math.max(1, actualAllocated)) * 100);

  return {
    requiredNodes: required,
    allocatedNodesRequested: allocatedNodes,
    allocatedNodesActual: actualAllocated,
    selectedTier: tier,
    tierName: tierInfo.name,
    efficiencyPct: Math.round(efficiencyPct * 10) / 10,
    verdict,
    verdictLabel,
    verdictColor,
    warningMessage,
    requiresIntervention,
  };
}
