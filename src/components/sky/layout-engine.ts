import { Concept, Subject, Topic, ConceptLink } from "@/lib/types/models";
import { StarNode, TopicCentroid, RenderLink } from "./sky-types";
import { calculateConceptRetrievability, isConceptFading } from "@/lib/fsrs/retrievability";

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function computeSkyConstellations({
  concepts,
  topics,
  subjects,
  links,
  now = new Date(),
}: {
  concepts: Concept[];
  topics: Topic[];
  subjects: Subject[];
  links: ConceptLink[];
  now?: Date;
}): {
  stars: StarNode[];
  topicCentroids: TopicCentroid[];
  renderLinks: RenderLink[];
} {
  const subjectMap = new Map<string, Subject>();
  subjects.forEach((s) => subjectMap.set(s.id, s));

  const fallbackSubject: Subject = {
    id: "general",
    name: "General Studies",
    color: "#E6AF2E",
    icon: "BookOpen",
    order: 0,
    createdAt: new Date().toISOString(),
  };

  const topicMap = new Map<string, Topic>();
  topics.forEach((t) => topicMap.set(t.id, t));

  const fallbackTopic: Topic = {
    id: "general-topic",
    subjectId: "general",
    name: "Core Concepts",
    createdAt: new Date().toISOString(),
  };

  // Group topics by subject
  const topicsBySubject = new Map<string, Topic[]>();
  topics.forEach((t) => {
    const subId = t.subjectId || "general";
    const list = topicsBySubject.get(subId) || [];
    list.push(t);
    topicsBySubject.set(subId, list);
  });

  // Calculate Topic Centroids
  const topicCentroids: TopicCentroid[] = [];
  const topicPositions = new Map<string, { x: number; y: number }>();

  const subjectList = subjects.length > 0 ? subjects : [fallbackSubject];
  const numSubjects = Math.max(1, subjectList.length);

  subjectList.forEach((subject, subIndex) => {
    const subTopics = topicsBySubject.get(subject.id) || [];
    const subAngle = (subIndex / numSubjects) * (2 * Math.PI) - Math.PI / 2;
    const subBaseRadius = numSubjects === 1 ? 0 : 550;

    const subCenterX = Math.cos(subAngle) * subBaseRadius;
    const subCenterY = Math.sin(subAngle) * subBaseRadius;

    if (subTopics.length === 0) return;

    subTopics.forEach((topic, tIndex) => {
      let tX = subCenterX;
      let tY = subCenterY;

      if (subTopics.length > 1) {
        const topicOffsetAngle = (tIndex / subTopics.length) * (2 * Math.PI);
        const topicSpreadRadius = 240 + Math.min(subTopics.length * 20, 200);
        tX += Math.cos(topicOffsetAngle) * topicSpreadRadius;
        tY += Math.sin(topicOffsetAngle) * topicSpreadRadius;
      }

      topicPositions.set(topic.id, { x: tX, y: tY });
      topicCentroids.push({
        id: topic.id,
        topic,
        subject,
        x: tX,
        y: tY,
        starCount: 0,
        radius: 120,
        color: subject.color || "#E6AF2E",
      });
    });
  });

  // Position Stars around Topic Centroids
  const stars: StarNode[] = [];
  const starMap = new Map<string, StarNode>();
  const starByName = new Map<string, StarNode>();

  // Group concepts by topic
  const conceptsByTopic = new Map<string, Concept[]>();
  concepts.forEach((c) => {
    const tId = c.topicId || "general-topic";
    const list = conceptsByTopic.get(tId) || [];
    list.push(c);
    conceptsByTopic.set(tId, list);
  });

  conceptsByTopic.forEach((conceptList, topicId) => {
    const centroidPos = topicPositions.get(topicId) || { x: 0, y: 0 };
    const topic = topicMap.get(topicId) || fallbackTopic;
    const subject = subjectMap.get(topic.subjectId) || fallbackSubject;

    const centroid = topicCentroids.find((tc) => tc.id === topicId);
    if (centroid) {
      centroid.starCount = conceptList.length;
      centroid.radius = Math.max(120, Math.sqrt(conceptList.length) * 45);
    }

    conceptList.forEach((concept, index) => {
      const hash = hashString(concept.id + concept.name);

      // Golden ratio spiral distribution
      const goldenAngle = 2.399963229728653; // radians
      const angle = index * goldenAngle + (hash % 100) * 0.01;
      const dist = 35 + Math.sqrt(index + 1) * 36 + ((hash >> 3) % 25);

      const x = centroidPos.x + Math.cos(angle) * dist;
      const y = centroidPos.y + Math.sin(angle) * dist;

      const r = calculateConceptRetrievability(concept.fsrs, now);
      const isFadingStar = isConceptFading(concept, now);

      // Star size based on importance (1 to 5)
      const baseRadius = 2.8 + (concept.importance || 3) * 1.1;

      const starNode: StarNode = {
        id: concept.id,
        concept,
        subject,
        topic,
        x,
        y,
        radius: baseRadius,
        retrievability: r,
        isFading: isFadingStar,
        flickerSeed: (hash % 1000) * 0.01,
        color: subject.color || "#E6AF2E",
      };

      stars.push(starNode);
      starMap.set(concept.id, starNode);
      starByName.set(concept.name.toLowerCase().trim(), starNode);
    });
  });

  // Build Render Links
  const renderLinks: RenderLink[] = [];
  links.forEach((l) => {
    const source =
      starMap.get(l.fromConcept) || starByName.get(l.fromConcept.toLowerCase().trim());
    const target =
      starMap.get(l.toConcept) || starByName.get(l.toConcept.toLowerCase().trim());

    if (source && target && source.id !== target.id) {
      const isCrossSubject = source.subject.id !== target.subject.id;
      renderLinks.push({
        id: l.id,
        source,
        target,
        isCrossSubject,
        relationText: l.relationText,
        strength: l.strength || 1,
      });
    }
  });

  return { stars, topicCentroids, renderLinks };
}
