import { Concept, Subject, Topic, ConceptLink } from "@/lib/types/models";

export interface StarNode {
  id: string;
  concept: Concept;
  subject: Subject;
  topic: Topic;
  x: number;
  y: number;
  radius: number;
  retrievability: number; // 0.0 to 1.0
  isFading: boolean;
  flickerSeed: number;
  color: string;
}

export interface TopicCentroid {
  id: string;
  topic: Topic;
  subject: Subject;
  x: number;
  y: number;
  starCount: number;
  radius: number;
  color: string;
}

export interface RenderLink {
  id: string;
  source: StarNode;
  target: StarNode;
  isCrossSubject: boolean;
  relationText?: string;
  strength: number;
}

export interface CameraState {
  x: number;
  y: number;
  zoom: number;
}
