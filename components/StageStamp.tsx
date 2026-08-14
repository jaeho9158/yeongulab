export function StageStamp({
  order,
  weeks,
  animate = false,
}: {
  order: number;
  weeks?: string;
  animate?: boolean;
}) {
  return (
    <div className={`stamp ${animate ? "stamp-animate" : ""}`}>
      <span className="text-[10px] leading-none tracking-widest">STEP</span>
      <span className="text-2xl leading-none font-bold">
        {String(order).padStart(2, "0")}
      </span>
      {weeks && (
        <span className="mt-0.5 text-[8px] leading-none tracking-tight">
          {weeks}
        </span>
      )}
    </div>
  );
}
