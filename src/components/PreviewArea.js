import React from "react";
import CatSprite from "./CatSprite";

export default function PreviewArea({ sprites, selectedId, onSelect, playing }) {
  return <div className="stage-wrap"><div className="stage-canvas"><div className="stage-sky" /><div className="stage-floor" /><div className="stage-label">SPRITE PLAYGROUND</div>{sprites.map((sprite) => <button key={sprite.id} className={`stage-sprite ${selectedId === sprite.id ? "focused" : ""} ${playing ? "bouncing" : ""}`} style={{ left: `calc(50% + ${sprite.x}px)`, top: `calc(50% - ${sprite.y}px)`, transform: `translate(-50%, -50%) rotate(${sprite.direction - 90}deg)`, display: sprite.visible ? "block" : "none" }} onClick={() => onSelect(sprite.id)} aria-label={sprite.name}><span className={`speech-bubble ${sprite.thought ? "thought-bubble" : ""}`} style={{ display: sprite.bubble ? "block" : "none" }}>{sprite.bubble}</span>{sprite.kind === "cat" ? <CatSprite /> : <span className="sprite-emoji">{sprite.icon}</span>}</button>)}<div className="stage-coordinates"><span>↔ 480</span><span>↕ 360</span></div></div></div>;
}
