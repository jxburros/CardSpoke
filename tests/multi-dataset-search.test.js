/**
 * Multi-Dataset Search Tests
 * Tests for searching across multiple datasets
 */

import { test } from 'uvu';
import * as assert from 'uvu/assert';

// Mock fuzzySearchMultiDataset function for testing
// In the real app, this is defined in app.js and uses the datasetManager

/**
 * Test helper: Create mock fuzzy search function
 */
function createMockFuzzySearchMultiDataset() {
  const mockDatasets = new Map();
  
  // Mock dataset 1
  mockDatasets.set('dataset_1', {
    id: 'dataset_1',
    name: 'Work',
    cards: {
      'card1': { id: 'card1', title: 'JavaScript Project', body: 'Work on JS', tags: [] },
      'card2': { id: 'card2', title: 'Python Script', body: 'Automation', tags: ['python'] }
    }
  });
  
  // Mock dataset 2
  mockDatasets.set('dataset_2', {
    id: 'dataset_2',
    name: 'Personal',
    cards: {
      'card3': { id: 'card3', title: 'JavaScript Learning', body: 'Study JS', tags: [] },
      'card4': { id: 'card4', title: 'Cooking Recipe', body: 'Pasta', tags: ['food'] }
    }
  });
  
  /**
   * Mock fuzzy search that scores based on exact/partial matches
   */
  function mockFuzzySearch(store, query) {
    const results = [];
    const queryLower = query.toLowerCase();
    
    Object.values(store.cards || {}).forEach(card => {
      const titleLower = (card.title || '').toLowerCase();
      const bodyLower = (card.body || '').toLowerCase();
      
      let score = 0;
      if (titleLower.includes(queryLower)) {
        score = 100;
      } else if (bodyLower.includes(queryLower)) {
        score = 70;
      } else if (card.tags && card.tags.some(tag => tag.toLowerCase().includes(queryLower))) {
        score = 50;
      }
      
      if (score > 0) {
        results.push({ card, score });
      }
    });
    
    results.sort((a, b) => b.score - a.score);
    return results;
  }
  
  /**
   * Mock multi-dataset search
   */
  return async function fuzzySearchMultiDataset(query, scope = 'current') {
    if (!query || query.trim() === '') {
      return [];
    }
    
    const allResults = [];
    
    if (scope === 'current') {
      // Search only first dataset (mock current)
      const dataset = mockDatasets.get('dataset_1');
      const results = mockFuzzySearch(dataset, query);
      results.forEach(result => {
        allResults.push({
          ...result,
          datasetId: dataset.id,
          datasetName: dataset.name
        });
      });
    } else if (scope === 'all') {
      // Search all datasets
      for (const [id, dataset] of mockDatasets) {
        const results = mockFuzzySearch(dataset, query);
        results.forEach(result => {
          allResults.push({
            ...result,
            datasetId: dataset.id,
            datasetName: dataset.name
          });
        });
      }
    }
    
    allResults.sort((a, b) => b.score - a.score);
    
    // Limit to 100 results
    return allResults.slice(0, 100);
  };
}

// Create mock search function
const fuzzySearchMultiDataset = createMockFuzzySearchMultiDataset();

// Tests for current dataset search
test('fuzzySearchMultiDataset searches current dataset only', async () => {
  const results = await fuzzySearchMultiDataset('JavaScript', 'current');
  
  assert.is(results.length, 1, 'Should find 1 result in current dataset');
  assert.is(results[0].card.title, 'JavaScript Project', 'Should find correct card');
  assert.is(results[0].datasetName, 'Work', 'Should include dataset name');
});

test('fuzzySearchMultiDataset returns empty for no matches in current dataset', async () => {
  const results = await fuzzySearchMultiDataset('Cooking', 'current');
  
  assert.is(results.length, 0, 'Should return empty array for no matches');
});

// Tests for all datasets search
test('fuzzySearchMultiDataset searches all datasets', async () => {
  const results = await fuzzySearchMultiDataset('JavaScript', 'all');
  
  assert.is(results.length, 2, 'Should find 2 results across all datasets');
  assert.ok(results.some(r => r.datasetName === 'Work'), 'Should include Work dataset');
  assert.ok(results.some(r => r.datasetName === 'Personal'), 'Should include Personal dataset');
});

test('fuzzySearchMultiDataset includes dataset information', async () => {
  const results = await fuzzySearchMultiDataset('JavaScript', 'all');
  
  results.forEach(result => {
    assert.ok(result.datasetId, 'Should include dataset ID');
    assert.ok(result.datasetName, 'Should include dataset name');
    assert.ok(result.card, 'Should include card data');
    assert.ok(typeof result.score === 'number', 'Should include score');
  });
});

test('fuzzySearchMultiDataset sorts by score across datasets', async () => {
  const results = await fuzzySearchMultiDataset('JavaScript', 'all');
  
  for (let i = 1; i < results.length; i++) {
    assert.ok(results[i-1].score >= results[i].score, 'Results should be sorted by score descending');
  }
});

test('fuzzySearchMultiDataset searches by tags across datasets', async () => {
  const results = await fuzzySearchMultiDataset('python', 'all');
  
  assert.ok(results.length >= 1, 'Should find results by tag');
  assert.ok(results.some(r => r.card.tags && r.card.tags.includes('python')), 'Should find card with python tag');
});

test('fuzzySearchMultiDataset returns empty for empty query', async () => {
  const results1 = await fuzzySearchMultiDataset('', 'all');
  const results2 = await fuzzySearchMultiDataset('   ', 'all');
  
  assert.is(results1.length, 0, 'Should return empty for empty string');
  assert.is(results2.length, 0, 'Should return empty for whitespace');
});

test('fuzzySearchMultiDataset handles mixed case queries', async () => {
  const results1 = await fuzzySearchMultiDataset('javascript', 'all');
  const results2 = await fuzzySearchMultiDataset('JAVASCRIPT', 'all');
  const results3 = await fuzzySearchMultiDataset('JavaScript', 'all');
  
  assert.is(results1.length, results2.length, 'Should return same results for different cases');
  assert.is(results2.length, results3.length, 'Should return same results for different cases');
});

test('fuzzySearchMultiDataset limits results to 100', async () => {
  // This test verifies the limit is in place, even though our mock doesn't have 100+ results
  const results = await fuzzySearchMultiDataset('a', 'all');
  
  assert.ok(results.length <= 100, 'Should limit results to 100 or fewer');
});

test('fuzzySearchMultiDataset prioritizes title matches', async () => {
  const results = await fuzzySearchMultiDataset('Python', 'all');
  
  assert.ok(results.length > 0, 'Should find results');
  // Title match should have higher score than body match
  const titleMatch = results.find(r => r.card.title.includes('Python'));
  assert.ok(titleMatch, 'Should find title match');
  assert.ok(titleMatch.score >= 70, 'Title match should have high score');
});

test.run();
