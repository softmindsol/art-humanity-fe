
interface InfoBoxProps {
    zoom: number;
    worldPos: { x: number; y: number };
    strokeCount: number;
    isSaving: boolean;
    saveError: string | null;
}

const InfoBox = ({ zoom, worldPos, strokeCount, isSaving, saveError }: InfoBoxProps) => {
    return (
        <div className="absolute bottom-5 right-5 bg-white/90 p-3 rounded-lg text-base text-[#5d4e37] border border-[#3e2723] shadow-lg w-[200px]">
            <div>Zoom: {Math.round(zoom * 100)}%</div>
            <div>World Pos: ({Math.round(worldPos.x)}, {Math.round(worldPos.y)})</div>
            <div>Strokes: {strokeCount}</div>
            {isSaving && <div className="text-orange-500 font-semibold mt-1">Saving...</div>}
            {saveError && <div className="text-red-600 font-semibold mt-1">{saveError}</div>}
        </div>
    );
};

export default InfoBox;