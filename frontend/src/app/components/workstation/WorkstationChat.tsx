"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Paperclip, Sliders, AlertTriangle, Cpu, Check, Play, RefreshCw } from "lucide-react";
import { assessAllocation, TASK_SPECS, TIERS, WorkloadParams } from "../../services/workloadEngine";
import { createSimulationRun } from "../../services/api";
import { cn } from "../../../lib/utils";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
  timestamp: Date;
  details?: any; // To store SimulationRun result info if completed
}

interface WorkstationChatProps {
  activeSessionId: string;
  messages: Message[];
  onAddMessage: (msg: Message) => void;
  onRefreshHistory: () => void;
}

export default function WorkstationChat({
  activeSessionId,
  messages,
  onAddMessage,
  onRefreshHistory,
}: WorkstationChatProps) {
  const [inputText, setInputText] = useState("");
  const [taskType, setTaskType] = useState("ocr_data_retrieval");
  const [allocatedNodes, setAllocatedNodes] = useState(16);
  
  // Workload configuration state
  const [fileInputSizeGb, setFileInputSizeGb] = useState(1.0);
  const [imageCount, setImageCount] = useState(0);
  const [thinkingDepth, setThinkingDepth] = useState(1);
  const [complexityFactor, setComplexityFactor] = useState(1.0);

  const [showConfigDrawer, setShowConfigDrawer] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [logIndex, setLogIndex] = useState(0);
  const [simulationLogs, setSimulationLogs] = useState<string[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const attachmentMenuRef = useRef<HTMLDivElement>(null);
  const configDrawerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, simulationLogs, isRunning]);

  // Click outside to close modals/popups
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Retract attachment menu
      if (
        showAttachmentMenu &&
        attachmentMenuRef.current &&
        !attachmentMenuRef.current.contains(e.target as Node)
      ) {
        setShowAttachmentMenu(false);
      }

      // Retract config drawer
      if (
        showConfigDrawer &&
        configDrawerRef.current &&
        !configDrawerRef.current.contains(e.target as Node) &&
        !target.closest("#toggle-sliders-btn")
      ) {
        setShowConfigDrawer(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showAttachmentMenu, showConfigDrawer]);

  // Compute real-time allocation result based on sliders
  const params: WorkloadParams = useMemo(() => ({
    taskType,
    fileInputSizeGb,
    imageCount,
    thinkingDepth,
    complexityFactor,
  }), [taskType, fileInputSizeGb, imageCount, thinkingDepth, complexityFactor]);

  const result = useMemo(() => {
    return assessAllocation(params, allocatedNodes);
  }, [params, allocatedNodes]);

  // Set default nodes when task type changes
  const handleTaskSelect = (type: string) => {
    setTaskType(type);
    const spec = TASK_SPECS[type];
    if (spec) {
      setAllocatedNodes(spec.baseNodes);
      
      const prefilledPrompts: Record<string, string> = {
        ocr_data_retrieval: "Extract layout text and tabular metadata from /dataset/archive_pdf/.",
        image_generation: "Synthesize a high-resolution marketing visiting card layout matching Nord theme guidelines.",
        batch_vision: "Perform facial recognition classification across 10 uploaded client headshot photos.",
        image_editing: "Erase visual artifacts and inpaint missing backdrop patterns on background_layer_0.png.",
        large_ml_project: "Fine-tune Blackwell Llama-3-70B model using custom telemetry log datasets.",
      };
      setInputText(prefilledPrompts[type] || "");
      
      if (type === "batch_vision") {
        setImageCount(10);
      } else {
        setImageCount(0);
      }
      if (type === "ocr_data_retrieval") {
        setFileInputSizeGb(5.0);
      } else {
        setFileInputSizeGb(1.0);
      }
    }
    setShowAttachmentMenu(false);
  };

  // Run simulation
  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isRunning || result.requiresIntervention) return;

    const userPrompt = inputText;
    setInputText("");
    
    const userMsgId = Math.random().toString();
    onAddMessage({
      id: userMsgId,
      role: "user",
      text: userPrompt,
      timestamp: new Date(),
    });

    setIsRunning(true);
    setLogIndex(0);

    const logsSequenceMap: Record<string, string[]> = {
      ocr_data_retrieval: [
        "Initializing OCR data pipeline...",
        "Scanning directory structure...",
        "Resolving PDF layout matrices...",
        "Parsing metadata fields with local LLM parser...",
        "Piping results to agy CLI..."
      ],
      image_generation: [
        "Initializing image diffusion model...",
        "Loading Blackwell B200 weights...",
        "Generating latent tensor masks...",
        "Rendering visiting card layout canvas...",
        "Writing visiting_card.png artifact..."
      ],
      batch_vision: [
        "Initializing vision classification pipeline...",
        "Caching image batch frames...",
        "Running feature extraction on RTX 5090 cluster...",
        "Running face-landmark neural alignment...",
        "Compiling batch vision classifications..."
      ],
      image_editing: [
        "Initializing image inpainting process...",
        "Extracting target image layers...",
        "Loading standard RTX 4090 editor weights...",
        "Synthesizing backdrop pattern fillers...",
        "Applying visual layers consolidation..."
      ],
      large_ml_project: [
        "Initializing large ML fine-tuning project...",
        "Allocating full Blackwell B200 quadrant nodes...",
        "Loading model weights into 192GB HBM3 VRAM...",
        "Starting epoch 1 validation sequence...",
        "Optimizing cluster parallel training paths..."
      ]
    };

    const taskLogs = logsSequenceMap[taskType] || ["Initializing simulation...", "Piping parameters to agy CLI..."];
    setSimulationLogs([taskLogs[0]]);

    const logInterval = setInterval(() => {
      setLogIndex((prevIndex) => {
        const nextIndex = prevIndex + 1;
        if (nextIndex < taskLogs.length) {
          setSimulationLogs((prev) => [...prev, taskLogs[nextIndex]]);
          return nextIndex;
        } else {
          clearInterval(logInterval);
          return prevIndex;
        }
      });
    }, 800);

    try {
      const simRun = await createSimulationRun({
        prompt: userPrompt,
        chat_session_id: activeSessionId,
        task_type: taskType,
        allocated_nodes: allocatedNodes,
        file_input_size_gb: fileInputSizeGb,
        image_count: imageCount,
        thinking_depth: thinkingDepth,
        complexity_factor: complexityFactor,
      });

      clearInterval(logInterval);
      setSimulationLogs([]);
      setIsRunning(false);

      onAddMessage({
        id: Math.random().toString(),
        role: "assistant",
        text: simRun.response_text || "Simulation completed successfully with CLI response.",
        timestamp: new Date(),
        details: simRun,
      });

      onRefreshHistory();
    } catch (err: any) {
      clearInterval(logInterval);
      setSimulationLogs([]);
      setIsRunning(false);

      onAddMessage({
        id: Math.random().toString(),
        role: "system",
        text: `Simulation run failed: ${err.message || "Unknown error during CLI execution."}`,
        timestamp: new Date(),
      });
    }
  };

  const isNewChat = messages.length <= 1;

  const renderInputForm = () => {
    return (
      <div className={cn(
        "select-none transition-all duration-300 w-full flex flex-col gap-4",
        isNewChat ? "max-w-2xl" : "ws-chat-input-bar bg-ws-surface border-t border-nord3/10 px-6 py-4"
      )}>
        {/* Node Selection Card — Dedicated, separate, matches Dashboard cards shadow/hover style */}
        <div className="ws-card p-4 space-y-3 animate-fade-up delay-75 shadow-sm">
          <div className="flex justify-between items-center">
            <span className="ws-label-mono text-nord2 flex items-center gap-1.5 font-bold text-[10px]">
              <Cpu size={14} className="text-ws-interactive" />
              Allocated Nodes
            </span>
            <span className="font-mono text-xs font-bold text-nord0 bg-ws-surface-raised px-2.5 py-0.5 rounded-lg border border-nord3/10 shadow-sm">
              {allocatedNodes} nodes
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-nord3">1</span>
            <input
              type="range"
              min="1"
              max="32"
              value={allocatedNodes}
              onChange={(e) => setAllocatedNodes(parseInt(e.target.value))}
              className="ws-slider flex-1"
              disabled={isRunning}
              style={{ '--slider-pct': `${((allocatedNodes - 1) / 31) * 100}%` } as React.CSSProperties}
            />
            <span className="text-[10px] font-mono text-nord3">32</span>
          </div>
        </div>

        {/* Unified Chat Input Form (Low-contrast, premium border, shadows matching Dashboard Copilot input container) */}
        <form onSubmit={handleSend} className="w-full">
          <div className="flex items-center gap-3 bg-ws-surface-raised border border-nord3/10 rounded-xl px-4 py-2 focus-within:border-ws-interactive transition-all duration-200 shadow-sm">
            
            {/* Attachment dropdown */}
            <div className="relative" ref={attachmentMenuRef}>
              <button
                type="button"
                onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                className={cn(
                  "p-1.5 rounded-lg text-nord2 hover:bg-ws-surface transition-colors cursor-pointer outline-none glow-focus flex items-center justify-center",
                  showAttachmentMenu && "bg-ws-surface text-ws-interactive"
                )}
                title="Select Workload Task Type"
                disabled={isRunning}
              >
                <Paperclip size={16} />
              </button>

              {/* Attachment tasks dropdown */}
              {showAttachmentMenu && (
                <div className="absolute bottom-full left-0 mb-2.5 w-64 bg-ws-surface rounded-xl border border-nord3/15 shadow-lg z-50 p-2 space-y-1 animate-ws-fade-in">
                  <div className="px-2.5 py-1 text-[9px] font-mono font-bold text-nord3 uppercase border-b border-nord3/10 mb-1">
                    Select Task Workload
                  </div>
                  {Object.entries(TASK_SPECS).map(([type, spec]) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleTaskSelect(type)}
                      className={cn(
                        "w-full text-left px-2.5 py-2 rounded-lg flex items-center gap-2 hover:bg-ws-surface-raised transition-colors text-xs cursor-pointer",
                        taskType === type ? "bg-ws-interactive/10 text-ws-interactive font-semibold" : "text-nord1"
                      )}
                    >
                      <span className="text-sm">{spec.icon}</span>
                      <div className="flex-1">
                        <div>{spec.label}</div>
                        <div className="text-[9px] text-nord3 font-mono">Min Tier: {spec.minTier} · Base Nodes: {spec.baseNodes}</div>
                      </div>
                      {taskType === type && <Check size={12} className="text-ws-interactive" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Main Text Input */}
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Ask CLI to run simulation (${TASK_SPECS[taskType]?.label})...`}
              className="flex-1 bg-transparent py-2 text-sm text-nord0 outline-none placeholder:text-nord3 font-sans"
              disabled={isRunning}
            />

            {/* Run Button */}
            <button
              type="submit"
              disabled={isRunning || !inputText.trim()}
              className="p-2 bg-ws-interactive hover:bg-ws-interactive-hover text-white rounded-xl shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer outline-none glow-focus flex items-center justify-center"
              title="Run Simulation"
            >
              {isRunning ? (
                <RefreshCw size={15} className="animate-spin" />
              ) : (
                <Play size={14} fill="white" className="ml-0.5" />
              )}
            </button>
          </div>
        </form>
      </div>
    );
  };



  return (
    <div className="flex-1 flex flex-col h-full bg-ws-bg overflow-hidden relative font-sans">
      
      {/* Top Telemetry Header Summary */}
      <div className="h-16 bg-ws-surface border-b border-nord3/10 px-6 flex items-center justify-between text-xs select-none flex-shrink-0 z-10 shadow-sm animate-fade-up">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 font-semibold text-nord1">
            <Cpu size={14} className="text-ws-interactive" />
            <span>Task Profile:</span>
            <span className="font-mono text-ws-interactive">{TASK_SPECS[taskType]?.label}</span>
          </div>
          <div className="h-4 w-px bg-nord3/20"></div>
          <div className="flex items-center gap-1.5 font-semibold text-nord1">
            <span>Required Nodes:</span>
            <span className="font-mono bg-ws-surface-raised px-1.5 py-0.5 rounded-lg text-nord0">{result.requiredNodes}</span>
          </div>
        </div>

        {/* Selected build specs info */}
        <div className="hidden md:flex items-center gap-3 font-mono text-[10px] text-nord2 bg-ws-surface-raised px-2.5 py-1 rounded-xl border border-nord3/10 shadow-sm">
          <span className="font-bold text-ws-interactive">{TIERS[result.selectedTier]?.name}</span>
          <span>·</span>
          <span>VRAM: {TIERS[result.selectedTier]?.vram}</span>
          <span>·</span>
          <span>RAM: {TIERS[result.selectedTier]?.ram}</span>
          <span>·</span>
          <span>Nominal Temp: {TIERS[result.selectedTier]?.temp}°C</span>
          <span>·</span>
          <span>Power: {TIERS[result.selectedTier]?.power}W</span>
        </div>
      </div>

      {isNewChat ? (
        // Centered Greeting and Input Layout for New Chats
        <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-2xl mx-auto w-full space-y-6 overflow-y-auto no-scrollbar animate-fade-up">
          <div className="text-center space-y-2 select-none">
            <h1 className="text-3xl font-bold text-nord0 tracking-tight font-sans">
              What's the plan for today?
            </h1>
            <p className="text-xs text-nord2 font-mono max-w-md mx-auto">
              Initialize a containerized simulator workload run on the NeuronOps cluster. Use the attachment icon to select presets.
            </p>
          </div>
          {renderInputForm()}
        </div>
      ) : (
        // Chat Flow Layout
        <>
          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
            {messages.map((msg) => (
              <div key={msg.id} className="space-y-1 animate-fade-up">
                <div
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={cn(
                      "ws-chat-bubble shadow-sm border",
                      msg.role === "user"
                        ? "ws-chat-bubble-user border-transparent"
                        : msg.role === "system"
                        ? "ws-chat-bubble-system rounded-xl font-mono text-[11px] bg-ws-surface-raised border-nord3/25 max-w-[85%]"
                        : "ws-chat-bubble-assistant border-nord3/10"
                    )}
                  >
                    {msg.text}

                    {/* Render additional simulation run metadata inside Assistant bubble */}
                    {msg.role === "assistant" && msg.details && (
                      <div className="mt-4 pt-4 border-t border-nord3/20 space-y-4 font-sans text-xs text-nord0">
                        
                        {/* Render generated image if present */}
                        {msg.details.ai_raw_report?.generated_image_url && (
                          <div className="space-y-1.5 bg-ws-surface-raised p-3 rounded-xl border border-nord3/15 shadow-sm flex flex-col items-center animate-fade-up">
                            <h4 className="font-mono font-bold text-[9px] text-ws-interactive uppercase tracking-wider self-start">
                              Generated Image Output
                            </h4>
                            <img 
                              src={msg.details.ai_raw_report.generated_image_url} 
                              className="rounded-lg mt-1 border border-nord3/15 max-w-full md:max-w-md shadow-sm hover:scale-[1.01] transition-transform duration-200" 
                              alt="Generated Image Output" 
                            />
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                          {/* Left: Allocation results */}
                          <div className="space-y-2 bg-ws-surface-raised p-3 rounded-xl border border-nord3/15 shadow-sm animate-fade-up">
                            <h4 className="font-mono font-bold text-[9px] text-ws-interactive uppercase tracking-wider">
                              Allocation Verdict
                            </h4>
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-sm font-black">
                                {msg.details.verdict_display}
                              </span>
                              <span className="font-mono text-xs text-nord1 bg-ws-surface border border-nord3/10 px-1.5 py-0.5 rounded-lg shadow-sm">
                                {msg.details.efficiency_pct}% Utilized
                              </span>
                            </div>
                            <div className="text-[10px] text-nord2 leading-relaxed mt-1">
                              {msg.details.bottleneck_analysis}
                            </div>
                          </div>

                          {/* Right: Presenter bullets */}
                          <div className="space-y-2 bg-ws-surface-raised p-3 rounded-xl border border-nord3/15 shadow-sm animate-fade-up">
                            <h4 className="font-mono font-bold text-[9px] text-ws-teal uppercase tracking-wider">
                              Presenter Talking Points
                            </h4>
                            <ul className="list-disc pl-4 space-y-1 text-[10px] text-nord1 leading-relaxed">
                              {msg.details.demo_talking_points?.map((pt: string, i: number) => (
                                <li key={i}>{pt}</li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Recommendations */}
                        {msg.details.recommendations?.length > 0 && (
                          <div className="p-3 bg-ws-surface-raised rounded-xl border border-nord3/15 shadow-sm space-y-1.5 animate-fade-up">
                            <h4 className="font-mono font-bold text-[9px] text-status-advanced uppercase tracking-wider">
                              Recommendations
                            </h4>
                            <div className="grid grid-cols-2 gap-2 text-[10px] text-nord1">
                              {msg.details.recommendations.map((rec: string, i: number) => (
                                <div key={i} className="flex items-start gap-1.5">
                                  <span className="text-status-optimal mt-0.5"><Check size={10} /></span>
                                  <span>{rec}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {/* Timestamp label */}
                <div
                  className={`text-[8px] font-mono text-nord3 ${
                    msg.role === "user" ? "text-right mr-1.5" : "text-left ml-1.5"
                  }`}
                >
                  {msg.role === "user" ? "You" : msg.role === "system" ? "SYSTEM LOG" : "CLI AGENT"} ·{" "}
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            ))}

            {/* Simulated progressive log cycles while CLI runs */}
            {isRunning && simulationLogs.length > 0 && (
              <div className="space-y-2">
                <div className="flex justify-start">
                  <div className="ws-chat-bubble ws-chat-bubble-system bg-ws-surface rounded-xl border border-nord3/15 shadow-sm text-nord2 font-mono text-[10px] flex flex-col gap-1.5 max-w-[85%] p-3">
                    {simulationLogs.map((log, index) => (
                      <div key={index} className="flex items-center gap-2">
                        {index === simulationLogs.length - 1 ? (
                          <RefreshCw size={10} className="animate-spin text-ws-interactive" />
                        ) : (
                          <Check size={10} className="text-status-optimal" />
                        )}
                        <span>{log}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Render input form at the bottom */}
          {renderInputForm()}
        </>
      )}
    </div>
  );
}
