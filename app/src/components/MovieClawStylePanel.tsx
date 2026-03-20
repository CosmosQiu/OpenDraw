import { useEffect, useState } from "react";
import {
  DefaultStylePanel,
  TLUiStylePanelProps,
  useEditor,
} from "tldraw";

export function MovieClawStylePanel(props: TLUiStylePanelProps) {
  const editor = useEditor();
  const [currentToolId, setCurrentToolId] = useState(() =>
    editor.getCurrentToolId(),
  );

  useEffect(() => {
    const update = () => {
      setCurrentToolId(editor.getCurrentToolId());
    };

    update();
    const dispose = editor.store.listen(() => {
      update();
    });

    return () => {
      dispose();
    };
  }, [editor]);

  if (currentToolId === "select") {
    return null;
  }

  return (
    <div className="MovieClawStylePanel">
      <DefaultStylePanel {...props} />
    </div>
  );
}
