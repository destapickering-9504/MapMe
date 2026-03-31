interface Props {
  id?: string;
  title: string;
  count: number;
  className?: string;
}

export function SectionHeader({ id, title, count, className = "" }: Props) {
  return (
    <div className={className} style={{ marginBottom: "1.15rem" }}>
      <h2 id={id} className="hm-ref-h2">
        {title}
        <span className="hm-ref-h2-count">({count})</span>
      </h2>
    </div>
  );
}
