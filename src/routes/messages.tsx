import { createFileRoute } from "@tanstack/react-router";
import { StubPage } from "./explorer";

export const Route = createFileRoute("/messages")({
  head: () => ({ meta: [{ title: "Messages — Afrique-business" }] }),
  component: () => <StubPage title="Vos messages" subtitle="Discussions avec les acheteurs et vendeurs." />,
});
