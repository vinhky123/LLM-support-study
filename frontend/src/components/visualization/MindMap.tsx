import { useEffect, useRef } from "react";
import { Transformer } from "markmap-lib";
import { Markmap } from "markmap-view";

interface Props {
  content: string;
}

const transformer = new Transformer();

export default function MindMapView({ content }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const markmapRef = useRef<Markmap | null>(null);

  useEffect(() => {
    if (!svgRef.current || !content) return;

    const { root } = transformer.transform(content);

    if (markmapRef.current) {
      markmapRef.current.setData(root);
      markmapRef.current.fit();
    } else {
      markmapRef.current = Markmap.create(svgRef.current, { duration: 300 }, root);
    }

    return () => {
      // Cleanup on unmount only
    };
  }, [content]);

  useEffect(() => {
    return () => {
      markmapRef.current?.destroy();
      markmapRef.current = null;
    };
  }, []);

  return (
    <div className="w-full h-full bg-white rounded-xl border border-border overflow-hidden">
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
}
