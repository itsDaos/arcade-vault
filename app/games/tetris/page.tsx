import TetrisGame from "./TetrisGame";

export default function TetrisPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#000",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      <TetrisGame />
    </main>
  );
}
