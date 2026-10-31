"use client";

import type { PracticeOptions } from "@/lib/practice-options";

export function PracticeOptionsPanel({ value, onChange }: { value: PracticeOptions; onChange: (value: PracticeOptions) => void }) {
  return <details className="sm-fold sm-practice-options">
    <summary>练习偏好与分享 <span>可选</span></summary>
    <div className="sm-preference-list">
      <label><input type="checkbox" checked={value.eyesOpenPreferred} onChange={(event) => onChange({ ...value, eyesOpenPreferred: event.target.checked })} /><span>只用睁眼练习</span></label>
      <label><input type="checkbox" checked={!value.bodyFocusAllowed} onChange={(event) => onChange({ ...value, bodyFocusAllowed: !event.target.checked })} /><span>避开身体感受练习</span></label>
      <label><input type="checkbox" checked={!value.breathChangeAllowed} onChange={(event) => onChange({ ...value, breathChangeAllowed: !event.target.checked })} /><span>避开呼吸节奏引导</span></label>
      <label><input type="checkbox" checked={value.shareAnonymous} onChange={(event) => onChange({ ...value, shareAnonymous: event.target.checked })} /><span>自愿匿名分享本次开始、结束和已填写的评分变化。不含原话或反馈文字，不影响使用。</span></label>
    </div>
  </details>;
}
