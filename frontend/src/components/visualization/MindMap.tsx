import { useEffect, useRef, useCallback } from "react";
import { Transformer } from "markmap-lib";
import { Markmap } from "markmap-view";
import type { IPureNode } from "markmap-common";
import { Maximize2, ChevronsDownUp, ChevronsUpDown } from "lucide-react";



interface Props {
  content: string;
}

const transformer = new Transformer();

function walkNodes(node: IPureNode, fn: (n: IPureNode, depth: number) => void, depth = 0) {
  fn(node, depth);
  node.children?.forEach((child) => walkNodes(child, fn, depth + 1));
}

export default function MindMapView({ content }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const markmapRef = useRef<Markmap | null>(null);
  const contentRef = useRef(content);
  contentRef.current = content;

  useEffect(() => {
    if (!svgRef.current || !content) return;

    const { root } = transformer.transform(content);

    if (markmapRef.current) {
      markmapRef.current.setData(root);
      markmapRef.current.fit();
    } else {
      markmapRef.current = Markmap.create(
        svgRef.current,
        {
          duration: 400,
          initialExpandLevel: 2,
          toggleRecursively: false,
          spacingHorizontal: 80,
          spacingVertical: 6,
          maxWidth: 360,
          fitRatio: 0.95,
        },
        root,
      );
    }
  }, [content]);

  useEffect(() => {
    return () => {
      markmapRef.current?.destroy();
      markmapRef.current = null;
    };
  }, []);

  const handleFit = useCallback(() => {
    markmapRef.current?.fit();
  }, []);

  const handleExpandAll = useCallback(() => {
    if (!markmapRef.current || !contentRef.current) return;
    const { root } = transformer.transform(contentRef.current);
    walkNodes(root, (node) => {
      if (!node.payload) node.payload = {};
      node.payload.fold = 0;
    });
    markmapRef.current.setData(root);
    markmapRef.current.fit();
  }, []);

  const handleCollapseAll = useCallback(() => {
    if (!markmapRef.current || !contentRef.current) return;
    const { root } = transformer.transform(contentRef.current);
    walkNodes(root, (node, depth) => {
      if (!node.payload) node.payload = {};
      node.payload.fold = depth > 0 ? 1 : 0;
    });
    markmapRef.current.setData(root);
    markmapRef.current.fit();
  }, []);

  return (
    <div className="flex flex-col h-full min-h-[500px]">
      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={handleFit}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs
                     bg-surface border border-border text-text-secondary
                     hover:border-primary hover:text-primary transition-colors shadow-sm"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          Fit
        </button>
        <button
          onClick={handleExpandAll}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs
                     bg-surface border border-border text-text-secondary
                     hover:border-primary hover:text-primary transition-colors shadow-sm"
        >
          <ChevronsUpDown className="w-3.5 h-3.5" />
          Expand All
        </button>
        <button
          onClick={handleCollapseAll}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs
                     bg-surface border border-border text-text-secondary
                     hover:border-primary hover:text-primary transition-colors shadow-sm"
        >
          <ChevronsDownUp className="w-3.5 h-3.5" />
          Collapse All
        </button>
        <span className="ml-auto text-[11px] text-text-secondary opacity-60">
          Click node để mở/đóng · Scroll để zoom · Drag để pan
        </span>
      </div>

      {/* Map canvas */}
      <div className="flex-1 bg-surface rounded-xl border border-border overflow-hidden">
        <svg ref={svgRef} className="w-full h-full" />
      </div>
    </div>
  );
}
