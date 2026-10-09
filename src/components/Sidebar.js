import React from "react";

const categories = ["Motion", "Looks", "Control"];
const blocks = {
  Motion: [{ type: "move", label: "move", suffix: "steps", field: "steps", value: 10 }, { type: "turn", label: "turn ↻", suffix: "degrees", field: "degrees", value: 15 }, { type: "goto", label: "go to x", field: "x", value: 0, secondField: "y", secondValue: 0 }],
  Looks: [{ type: "say", label: "say", suffix: "for", field: "text", value: "Hello!", secondField: "seconds", secondValue: 2 }, { type: "think", label: "think", suffix: "for", field: "text", value: "Hmm...", secondField: "seconds", secondValue: 2 }],
  Control: [{ type: "repeat", label: "repeat", field: "times", value: 4, container: true }]
};

export default function Sidebar({ category, setCategory, onAddBlock }) {
  const palette = blocks[category];
  const addFromPalette = (definition) => {
    const block = { type: definition.type, id: `${Date.now()}-${Math.random()}`, children: [] };
    if (definition.type === "move") block.steps = definition.value;
    if (definition.type === "turn") block.degrees = definition.value;
    if (definition.type === "goto") { block.x = definition.value; block.y = definition.secondValue; }
    if (definition.type === "say" || definition.type === "think") { block.text = definition.value; block.seconds = definition.secondValue; }
    if (definition.type === "repeat") block.times = definition.value;
    onAddBlock(block);
  };
  return <aside className="sidebar"><div className="category-rail">{categories.map((item, index) => <button key={item} className={`category-button ${category === item ? "selected" : ""}`} onClick={() => setCategory(item)}><span className={`category-dot dot-${item.toLowerCase()}`}>{["↗", "◉", "↻"][index]}</span><span>{item}</span></button>)}</div><div className="block-palette"><div className="palette-head"><span className="eyebrow">BLOCKS</span><span className="palette-category">{category}</span></div><div className="palette-items">{palette.map((block) => <div key={block.type} className={`palette-block block-${category.toLowerCase()}`} draggable onDragStart={(event) => { event.dataTransfer.setData("application/scratch-block", JSON.stringify(block)); }} onClick={() => addFromPalette(block)}><span>{block.label}</span>{block.type === "move" && <><span className="palette-value">{block.value}</span><span>steps</span></>}{block.type === "turn" && <><span className="palette-value">{block.value}</span><span>degrees</span></>}{block.type === "goto" && <>x <span className="palette-value">{block.value}</span> y <span className="palette-value">{block.secondValue}</span></>}{(block.type === "say" || block.type === "think") && <><span className="palette-value text-value">{block.value}</span><span>for</span><span className="palette-value">{block.secondValue}</span><span>seconds</span></>}{block.type === "repeat" && <span className="palette-value">{block.value}</span>}</div>)}</div><div className="palette-hint">Drag a block into your script, or click to add it.</div></div></aside>;
}
