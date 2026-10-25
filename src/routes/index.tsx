import { createFileRoute } from "@tanstack/react-router";
import { Tracker } from "@/components/tracker/tracker";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return <Tracker />;
}
