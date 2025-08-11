import { Suspense } from "react";
import PayloadBuilderClientWrapper from "./PayloadBuilderClientWrapper";

export default function PayloadBuilderPage() {
  return (
    <Suspense
      fallback={
        <div style={{ width: "100%", height: "500px", backgroundColor: "#1a202c" }}>Loading...</div>
      }
    >
      <PayloadBuilderClientWrapper />
    </Suspense>
  );
}
