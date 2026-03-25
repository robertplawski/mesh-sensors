// src/components/AutomaticTasksList.jsx
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

/* --------------------------------------------------------------
   Helper constant arrays – feel free to extend / prune them
   -------------------------------------------------------------- */
const SENSOR_OPTIONS = [
  { key: "humidity", label: "Humidity (%)" },
  { key: "temperature", label: "Temperature (°C)" },
  { key: "pressure", label: "Pressure (hPa)" },
  { key: "gas", label: "Gas (ppm)" },
  { key: "voc", label: "VOC" },
  { key: "co2", label: "CO₂ (ppm)" },
];

const OPERATOR_OPTIONS = [
  { value: ">=", label: "≥" },
  { value: ">", label: ">" },
  { value: "=", label: "=" },
  { value: "<", label: "<" },
  { value: "<=", label: "≤" },
];

const ACTUATOR_TYPES = [
  { value: "motor", label: "Motor" },
  { value: "buzzer", label: "Buzzer" },
  { value: "webhook", label: "Webhook" },
];

const STATE_OPTIONS = [
  { value: "on", label: "ON" },
  { value: "off", label: "OFF" },
];

/* --------------------------------------------------------------
   Automatic‑tasks component (returns a fragment)
   -------------------------------------------------------------- */
export default function AutomaticTasksList({ onChange }) {
  /* ------------------- Form state (new rule) ------------------- */
  // Condition
  const [condNodeId, setCondNodeId] = useState(""); // **required**
  const [sensor, setSensor] = useState("humidity");
  const [operator, setOperator] = useState(">=");
  const [threshold, setThreshold] = useState("");

  // Actuator builder (single actuator being edited before being added)
  const [actuatorType, setActuatorType] = useState("motor");
  const [actuatorNodeId, setActuatorNodeId] = useState(""); // **required**
  const [actuatorUrl, setActuatorUrl] = useState(""); // only for webhook
  const [actuatorState, setActuatorState] = useState("on"); // ON/OFF for motor & buzzer

  // Temporary list of actuators for the rule we are building
  const [actuators, setActuators] = useState([]);

  // Saved rules
  const [tasks, setTasks] = useState([]);

  /* ------------------- Helpers ------------------- */
  const resetForm = () => {
    setCondNodeId("");
    setSensor("humidity");
    setOperator(">=");
    setThreshold("");

    setActuatorType("motor");
    setActuatorNodeId("");
    setActuatorUrl("");
    setActuatorState("on");

    setActuators([]);
  };

  // -----------------------------------------------------------------
  // Add a single actuator to the temporary `actuators` array
  // -----------------------------------------------------------------
  const handleAddActuator = (e) => {
    e.preventDefault();

    // Enforce required target node id
    if (!actuatorNodeId.trim()) {
      alert("Please enter a target Node ID for the actuator.");
      return;
    }

    const newAct = {
      type: actuatorType,
      nodeId: Number(actuatorNodeId), // **always a number**
      ...(actuatorType !== "webhook" && { state: actuatorState }),
      ...(actuatorType === "webhook" && {
        url: actuatorUrl.trim() ? actuatorUrl.trim() : "",
      }),
    };

    setActuators((prev) => [...prev, newAct]);

    // Reset actuator‑builder fields
    setActuatorType("motor");
    setActuatorNodeId("");
    setActuatorUrl("");
    setActuatorState("on");
  };

  // -----------------------------------------------------------------
  // Remove an actuator from the temporary `actuators` array
  // -----------------------------------------------------------------
  const handleRemoveActuator = (index) => {
    setActuators((prev) => prev.filter((_, i) => i !== index));
  };

  // -----------------------------------------------------------------
  // Save the whole rule (condition + actuator list) as a task
  // -----------------------------------------------------------------
  const handleSaveTask = (e) => {
    e.preventDefault();

    // Enforce required source node id
    if (!condNodeId.trim()) {
      alert("Please enter the source Node ID for the condition.");
      return;
    }

    if (actuators.length === 0) {
      alert("Add at least one actuator before saving the task.");
      return;
    }

    const newTask = {
      id: Date.now(),
      condition: {
        nodeId: Number(condNodeId),
        sensor,
        operator,
        threshold: Number(threshold),
      },
      actuators,
    };

    const updated = [...tasks, newTask];
    setTasks(updated);
    onChange?.(updated);
    resetForm();
  };

  const handleDeleteTask = (id) => {
    const updated = tasks.filter((t) => t.id !== id);
    setTasks(updated);
    onChange?.(updated);
  };

  /* ------------------- Render ------------------- */
  return (
    <>
      {/* ==================== FORM ==================== */}
      <form
        onSubmit={handleSaveTask}
        className="
          w-full max-w-2xl
          bg-neutral-800 text-neutral-100
          rounded-xl p-6 mb-8
          shadow-xl border border-neutral-700
        "
      >
        {/* ---- Condition (node, sensor, operator, threshold) ---- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Source node id – required */}
          <div>
            <label className="block mb-1 font-medium">
              Source Node ID
            </label>
            <input
              type="number"
              placeholder="e.g. 1"
              value={condNodeId}
              onChange={(e) => setCondNodeId(e.target.value)}
              required
              className="
                w-full bg-neutral-700 border border-neutral-600 rounded-md
                p-2 focus:outline-none focus:ring-2 focus:ring-neutral-500
              "
            />
          </div>

          {/* Sensor */}
          <div>
            <label className="block mb-1 font-medium">Trigger sensor</label>
            <select
              value={sensor}
              onChange={(e) => setSensor(e.target.value)}
              className="
                w-full bg-neutral-700 border border-neutral-600 rounded-md
                p-2 focus:outline-none focus:ring-2 focus:ring-neutral-500
              "
            >
              {SENSOR_OPTIONS.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Operator + threshold */}
        <div className="flex items-center gap-2 mb-6">
          <label className="font-medium whitespace-nowrap">When</label>

          <select
            value={operator}
            onChange={(e) => setOperator(e.target.value)}
            className="
              bg-neutral-700 border border-neutral-600 rounded-md
              p-2 focus:outline-none focus:ring-2 focus:ring-neutral-500
            "
          >
            {OPERATOR_OPTIONS.map((op) => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </select>

          <input
            type="number"
            placeholder="threshold"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
            required
            className="
              flex-1 bg-neutral-700 border border-neutral-600 rounded-md
              p-2 focus:outline-none focus:ring-2 focus:ring-neutral-500
            "
          />
          <span className="text-neutral-400">
            {SENSOR_OPTIONS.find((o) => o.key === sensor)?.label
              ?.split("(")[0]
              .trim()}
          </span>
        </div>

        {/* ---- ACTUATOR BUILDER ---- */}
        <fieldset className="border border-neutral-600 rounded-md p-4 mb-6">
          <legend className="px-2 text-sm text-neutral-300">
            Add Actuator
          </legend>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            {/* Type */}
            <div>
              <label className="block mb-1 font-medium">Type</label>
              <select
                value={actuatorType}
                onChange={(e) => setActuatorType(e.target.value)}
                className="
                  w-full bg-neutral-700 border border-neutral-600 rounded-md
                  p-2 focus:outline-none focus:ring-2 focus:ring-neutral-500
                "
              >
                {ACTUATOR_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Target node id – required */}
            <div>
              <label className="block mb-1 font-medium">Target Node ID</label>
              <input
                type="number"
                placeholder="e.g. 2"
                value={actuatorNodeId}
                onChange={(e) => setActuatorNodeId(e.target.value)}
                className="
                  w-full bg-neutral-700 border border-neutral-600 rounded-md
                  p-2 focus:outline-none focus:ring-2 focus:ring-neutral-500
                "
              />
            </div>

            {/* Add actuator button */}
            <button
              onClick={handleAddActuator}
              className="
                flex items-center justify-center gap-1
                py-2 px-4 bg-neutral-600 hover:bg-neutral-700
                rounded-md text-white font-semibold transition-colors
              "
            >
              <Plus size={16} />
              Add
            </button>
          </div>

          {/* ON/OFF selector – only for motor or buzzer */}
          {(actuatorType === "motor" || actuatorType === "buzzer") && (
            <div className="mt-4">
              <label className="block mb-1 font-medium">State</label>
              <select
                value={actuatorState}
                onChange={(e) => setActuatorState(e.target.value)}
                className="
                  w-full bg-neutral-700 border border-neutral-600 rounded-md
                  p-2 focus:outline-none focus:ring-2 focus:ring-neutral-500
                "
              >
                {STATE_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Webhook URL – only when type === "webhook" */}
          {actuatorType === "webhook" && (
            <div className="mt-4">
              <label className="block mb-1 font-medium">Webhook URL</label>
              <input
                type="url"
                placeholder="https://example.com/webhook"
                value={actuatorUrl}
                onChange={(e) => setActuatorUrl(e.target.value)}
                required
                className="
                  w-full bg-neutral-700 border border-neutral-600 rounded-md
                  p-2 focus:outline-none focus:ring-2 focus:ring-neutral-500
                "
              />
            </div>
          )}
        </fieldset>

        {/* ---- LIST OF ACTUATORS THAT WILL BELONG TO THIS RULE ---- */}
        {actuators.length > 0 && (
          <ul className="space-y-2 mb-6">
            {actuators.map((act, idx) => (
              <li
                key={idx}
                className="
                  flex items-center justify-between
                  bg-neutral-700 text-neutral-100 p-2 rounded-md
                "
              >
                <span className="flex items-center gap-2">
                  {/* Icon / label */}
                  {act.type === "motor" && (
                    <span>
                      ⚙️ Motor {act.state?.toUpperCase()}
                    </span>
                  )}
                  {act.type === "buzzer" && (
                    <span>
                      🔔 Buzzer {act.state?.toUpperCase()}
                    </span>
                  )}
                  {act.type === "webhook" && <span>🔗 Webhook</span>}

                  {/* target node */}
                  <span className="text-sm text-neutral-300">
                    (node {act.nodeId})
                  </span>

                  {/* webhook URL preview */}
                  {act.type === "webhook" && act.url && (
                    <span className="text-xs text-neutral-300 break-all">
                      {act.url}
                    </span>
                  )}
                </span>

                {/* Remove actuator button */}
                <button
                  onClick={() => handleRemoveActuator(idx)}
                  className="text-neutral-400 hover:text-red-400 transition-colors"
                  title="Remove this actuator"
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* ---- SAVE TASK BUTTON ---- */}
        <button
          type="submit"
          className="
            w-full flex items-center justify-center gap-2
            py-2 bg-neutral-600 hover:bg-neutral-700
            rounded-md font-semibold text-white transition-colors
          "
        >
          <Plus size={18} />
          Save task
        </button>
      </form>

      {/* ==================== LIST OF SAVED TASKS ==================== */}
      <ul className="w-full max-w-2xl space-y-4">
        {tasks.length === 0 ? (
          <p className="text-neutral-400 text-center">
            No automatic tasks yet.
          </p>
        ) : (
          tasks.map((task) => (
            <li
              key={task.id}
              className="
                bg-neutral-800 text-neutral-100 p-4 rounded-lg
                hover:bg-neutral-700 transition-colors
                shadow-md border border-neutral-700 relative
              "
            >
              {/* Delete button */}
              <button
                onClick={() => handleDeleteTask(task.id)}
                className="
                  absolute top-2 right-2 text-neutral-400 hover:text-red-400
                  transition-colors
                "
                title="Delete this rule"
              >
                <Trash2 size={16} />
              </button>

              {/* Condition header */}
              <div className="flex justify-between items-baseline">
                <h3 className="font-semibold capitalize">
                  {task.condition.sensor} {task.condition.operator}{" "}
                  {task.condition.threshold}
                </h3>
                <span className="text-sm text-neutral-500">
                  ID: {task.id.toString().slice(-5)}
                </span>
              </div>

              {/* Source node ID (always present) */}
              <p className="mt-1 text-sm text-neutral-300">
                <strong>Source Node ID:</strong> {task.condition.nodeId}
              </p>

              {/* Actuators */}
              <div className="mt-3 flex flex-col gap-2">
                {task.actuators.map((act, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    {/* type + ON/OFF */}
                    {act.type === "motor" && (
                      <span className="flex items-center gap-1 text-neutral-400">
                        ⚙️ Motor {act.state?.toUpperCase()}
                      </span>
                    )}
                    {act.type === "buzzer" && (
                      <span className="flex items-center gap-1 text-neutral-400">
                        🔔 Buzzer {act.state?.toUpperCase()}
                      </span>
                    )}
                    {act.type === "webhook" && (
                      <span className="flex items-center gap-1 text-neutral-300">
                        🔗 Webhook
                      </span>
                    )}

                    {/* target node badge */}
                    <span className="text-neutral-300">
                      (target node {act.nodeId})
                    </span>

                    {/* webhook URL (always present for webhook) */}
                    {act.type === "webhook" && act.url && (
                      <div className="text-xs text-neutral-300 break-all">
                        {act.url}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </li>
          ))
        )}
      </ul>
    </>
  );
}
