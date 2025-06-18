/**
 * @fileoverview Utility functions for vector mathematics.
 */

/**
 * Calculates the cosine similarity between two embedding vectors.
 * Cosine similarity measures the cosine of the angle between two non-zero vectors,
 * indicating the directional similarity. A value of 1 means the vectors are identical
 * in direction, 0 means they are orthogonal, and -1 means they are diametrically opposed.
 *
 * @param {number[]} vectorA - The first embedding vector.
 * @param {number[]} vectorB - The second embedding vector.
 * @returns {number} The cosine similarity score (between -1 and 1, inclusive).
 * @throws {Error} If the embeddings do not have the same dimension, or if either vector is empty.
 */
export function calculateCosineSimilarity(vectorA: number[], vectorB: number[]): number {
  if (!vectorA || !vectorB) {
    throw new Error('Input vectors must not be null or undefined.');
  }
  if (vectorA.length === 0 || vectorB.length === 0) {
    throw new Error('Input vectors must not be empty.');
  }
  if (vectorA.length !== vectorB.length) {
    throw new Error('Embeddings must have the same dimension for cosine similarity calculation.');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
    normA += vectorA[i] * vectorA[i];
    normB += vectorB[i] * vectorB[i];
  }

  const magnitudeA = Math.sqrt(normA);
  const magnitudeB = Math.sqrt(normB);

  if (magnitudeA === 0 || magnitudeB === 0) {
    // If either vector has zero magnitude, similarity is undefined or can be considered 0.
    // Returning 0 to avoid division by zero and to indicate no similarity if one vector is zero.
    // This case also covers if both are zero vectors.
    return 0;
  }

  return dotProduct / (magnitudeA * magnitudeB);
}
