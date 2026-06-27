import type { CanvasNode, CanvasEdge } from "@/types/canvas";
import { NODE_COLORS } from "@/types/canvas";

export interface CanvasTemplate {
  id: string;
  name: string;
  description: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

const BLUE = NODE_COLORS[1].fill;
const PURPLE = NODE_COLORS[2].fill;
const ORANGE = NODE_COLORS[3].fill;
const RED = NODE_COLORS[4].fill;
const GREEN = NODE_COLORS[6].fill;
const TEAL = NODE_COLORS[7].fill;
const DARK = NODE_COLORS[0].fill;

function n(
  id: string,
  label: string,
  shape: string,
  color: string,
  x: number,
  y: number,
  width: number,
  height: number
): CanvasNode {
  return {
    id,
    type: "canvasNode",
    position: { x, y },
    data: { label, color, shape },
    width,
    height,
  };
}

function e(id: string, source: string, target: string): CanvasEdge {
  return {
    id,
    type: "canvasEdge",
    source,
    target,
    sourceHandle: null,
    targetHandle: null,
    data: {},
  };
}

// --- Microservices Architecture ---
const microservicesNodes: CanvasNode[] = [
  n("gw",         "API Gateway",       "pill",      ORANGE, 240,   0, 160,  60),
  n("auth",       "Auth Service",      "rectangle", BLUE,     0, 140, 160,  80),
  n("user",       "User Service",      "rectangle", BLUE,   200, 140, 160,  80),
  n("product",    "Product Service",   "rectangle", BLUE,   420, 140, 160,  80),
  n("user-db",    "User DB",           "cylinder",  GREEN,  200, 300, 100, 120),
  n("product-db", "Product DB",        "cylinder",  GREEN,  440, 300, 100, 120),
];

const microservicesEdges: CanvasEdge[] = [
  e("gw-auth",           "gw",      "auth"),
  e("gw-user",           "gw",      "user"),
  e("gw-product",        "gw",      "product"),
  e("user-userdb",       "user",    "user-db"),
  e("product-productdb", "product", "product-db"),
];

// --- CI/CD Pipeline ---
const cicdNodes: CanvasNode[] = [
  n("source",   "Source Code",         "rectangle", DARK,    0, 30, 140, 70),
  n("build",    "CI Build",            "rectangle", BLUE,  185, 30, 130, 70),
  n("test",     "Test Suite",          "rectangle", GREEN, 360, 30, 130, 70),
  n("docker",   "Docker Build",        "rectangle", TEAL,  535, 30, 140, 70),
  n("registry", "Container Registry",  "cylinder",  PURPLE,720,  0, 120, 110),
  n("deploy",   "Deploy",              "rectangle", ORANGE,890, 30, 120, 70),
  n("prod",     "Production",          "hexagon",   RED,  1060, 10, 130, 110),
];

const cicdEdges: CanvasEdge[] = [
  e("src-build",   "source",   "build"),
  e("build-test",  "build",    "test"),
  e("test-docker", "test",     "docker"),
  e("docker-reg",  "docker",   "registry"),
  e("reg-deploy",  "registry", "deploy"),
  e("deploy-prod", "deploy",   "prod"),
];

// --- Event-Driven System ---
const eventDrivenNodes: CanvasNode[] = [
  n("order",    "Order Service",       "rectangle", BLUE,    0,  50, 150, 75),
  n("payment",  "Payment Service",     "rectangle", BLUE,    0, 195, 150, 75),
  n("broker",   "Message Broker",      "hexagon",   PURPLE, 230, 90, 140, 120),
  n("notify",   "Notification Worker", "rectangle", TEAL,   465,  30, 170, 75),
  n("analytics","Analytics Worker",    "rectangle", TEAL,   465, 155, 170, 75),
  n("audit",    "Audit Worker",        "rectangle", TEAL,   465, 280, 170, 75),
  n("store",    "Event Store",         "cylinder",  GREEN,  700, 150, 110, 110),
];

const eventDrivenEdges: CanvasEdge[] = [
  e("order-broker",     "order",     "broker"),
  e("payment-broker",   "payment",   "broker"),
  e("broker-notify",    "broker",    "notify"),
  e("broker-analytics", "broker",    "analytics"),
  e("broker-audit",     "broker",    "audit"),
  e("analytics-store",  "analytics", "store"),
];

export const CANVAS_TEMPLATES: CanvasTemplate[] = [
  {
    id: "microservices",
    name: "Microservices Architecture",
    description:
      "API gateway routing to independent services with dedicated databases.",
    nodes: microservicesNodes,
    edges: microservicesEdges,
  },
  {
    id: "cicd-pipeline",
    name: "CI/CD Pipeline",
    description:
      "Source-to-production delivery pipeline with build, test, and deploy stages.",
    nodes: cicdNodes,
    edges: cicdEdges,
  },
  {
    id: "event-driven",
    name: "Event-Driven System",
    description:
      "Producers publish to a message broker consumed by multiple async workers.",
    nodes: eventDrivenNodes,
    edges: eventDrivenEdges,
  },
];
