export function getDefaultBlockLabel(data: {
  fileName?: string;
  similarityType: 'alignment-score' | 'sequence-identity';
  identity: number;
  coverageThreshold: number;
}) {
  const parts: string[] = [];

  // Add file name if available
  if (data.fileName) {
    parts.push(data.fileName);
  }

  // Add similarity type label
  const similarityLabel = data.similarityType === 'alignment-score' ? 'BLOSUM' : 'Exact Match';
  if (similarityLabel) {
    parts.push(similarityLabel);
  }

  // Add identity threshold
  parts.push(`ident:${data.identity}`);

  // Add coverage threshold
  parts.push(`cov:${data.coverageThreshold}`);

  return parts.filter(Boolean).join(', ');
}
