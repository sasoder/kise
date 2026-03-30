import { AbsoluteFill } from "remotion";

const Blank: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0b1020",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <h1
        style={{
          color: "white",
          fontSize: 64,
          fontFamily: "Inter, sans-serif",
          fontWeight: 700,
        }}
      >
        hisa
      </h1>
    </AbsoluteFill>
  );
};

export default Blank;
