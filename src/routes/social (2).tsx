import { createFileRoute } from "@tanstack/react-router";
import SocialPage from "@/components/social";

export const Route = createFileRoute("/social")({
  component: SocialPage,
});