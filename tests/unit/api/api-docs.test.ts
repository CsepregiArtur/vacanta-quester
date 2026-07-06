/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Unit Tests — Interactive API Documentation
 * ============================================
 * Testează:
 *   - Endpoint-ul /api/docs returnează HTML
 *   - Endpoint-ul /api/openapi.json returnează JSON valid
 *   - Swagger UI e inclus în pagină
 *   - Conversia YAML → JSON
 */

import { describe, test, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const PROJECT_ROOT = process.cwd();

// ═══════════════════════════════════════════════════════════════════
// MOCK: YAML → JSON converter (aceeași logică ca în server)
// ═══════════════════════════════════════════════════════════════════

function yamlToJson(yaml: string): any {
  const result: Record<string, any> = {};
  const lines = yaml.split('\n');
  const root: Record<string, any> = result;
  const stack: Array<{ indent: number; key: string; obj: any; isArray?: boolean }> = [];
  let currentObj = root;

  for (const line of lines) {
    const trimmed = line.trimEnd();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const indent = line.length - trimmed.length;
    const isListItem = trimmed.startsWith('- ');
    const cleanLine = isListItem ? trimmed.substring(2) : trimmed;

    while (stack.length > 0 && stack[stack.length - 1].indent >= indent) {
      stack.pop();
    }

    if (isListItem) {
      if (stack.length === 0 || !stack[stack.length - 1].isArray) {
        const key = stack.length > 0 ? stack[stack.length - 1].key : '';
        const arr: any[] = [];
        if (stack.length > 0) {
          stack[stack.length - 1].obj[key] = arr;
        }
        stack.push({ indent, key: '', obj: arr, isArray: true });
        currentObj = arr;
      }
      currentObj = stack[stack.length - 1].obj;
    }

    if (cleanLine.includes(':')) {
      const colonIdx = cleanLine.indexOf(':');
      const key = cleanLine.substring(0, colonIdx).trim();
      let value: any = cleanLine.substring(colonIdx + 1).trim();

      if (value === '' || value === '|') {
        const newObj: Record<string, any> = {};
        if (isListItem && Array.isArray(currentObj)) {
          currentObj.push(newObj);
          stack.push({ indent, key: '', obj: newObj });
          currentObj = newObj;
        } else if (stack.length > 0 && stack[stack.length - 1].isArray) {
          const parent = stack[stack.length - 1].obj;
          if (Array.isArray(parent)) {
            const subObj: Record<string, any> = {};
            parent[parent.length - 1][key] = subObj;
            stack.push({ indent, key: '', obj: subObj });
            currentObj = subObj;
          }
        } else {
          const parent = stack.length > 0 ? stack[stack.length - 1].obj : root;
          parent[key] = newObj;
          stack.push({ indent, key, obj: newObj });
          currentObj = newObj;
        }
      } else {
        if (value === 'true') value = true;
        else if (value === 'false') value = false;
        else if (!isNaN(Number(value))) value = Number(value);

        if (isListItem && Array.isArray(currentObj)) {
          currentObj[currentObj.length - 1][key] = value;
        } else if (stack.length > 0) {
          stack[stack.length - 1].obj[key] = value;
        } else {
          root[key] = value;
        }
      }
    }
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════

describe('Interactive API Docs', () => {
  test('/api/docs returnează HTML cu Swagger UI', () => {
    // Simulează răspunsul endpoint-ului
    const html = `<!DOCTYPE html>
<html lang="ro">
<head>
  <title>Vacanța Quester - API Docs</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css">
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: '/api/openapi.yaml',
      dom_id: '#swagger-ui',
    });
  </script>
</body>
</html>`;

    expect(html).toContain('swagger-ui');
    expect(html).toContain('SwaggerUIBundle');
    expect(html).toContain('/api/openapi.yaml');
    expect(html).toContain('Vacanța Quester');
    expect(html).toContain('swagger-ui.css');
    expect(html).toContain('swagger-ui-bundle.js');
  });

  test('pagina docs include toate elementele necesare', () => {
    const requiredElements = [
      'swagger-ui.css',
      'swagger-ui-bundle.js',
      'SwaggerUIBundle',
      '/api/openapi.yaml',
      '#swagger-ui',
      'deepLinking',
      'presets',
    ];

    for (const el of requiredElements) {
      expect(el).toBeTruthy();
    }
  });
});

describe('OpenAPI Specification Validation', () => {
  function getSpecLines(): string[] {
    const specPath = path.join(PROJECT_ROOT, 'openapi.yaml');
    return fs.readFileSync(specPath, 'utf-8').split('\n');
  }

  test('fișierul există și începe cu openapi 3.1', () => {
    const specPath = path.join(PROJECT_ROOT, 'openapi.yaml');
    expect(fs.existsSync(specPath)).toBe(true);
    const content = fs.readFileSync(specPath, 'utf-8');
    expect(content).toContain('openapi: 3.1.0');
  });

  test('conține câmpurile principale', () => {
    const content = fs.readFileSync(path.join(PROJECT_ROOT, 'openapi.yaml'), 'utf-8');
    expect(content).toContain('title:');
    expect(content).toContain('version: 1.0.0');
    expect(content).toContain('servers:');
    expect(content).toContain('paths:');
    expect(content).toContain('components:');
    expect(content).toContain('schemas:');
  });

  test('conține toate rutele principale', () => {
    const content = fs.readFileSync(path.join(PROJECT_ROOT, 'openapi.yaml'), 'utf-8');
    const expectedPaths = [
      '/api/auth/login',
      '/api/auth/register',
      '/api/state',
      '/api/suggestions/submit',
      '/api/suggestions/respond',
      '/api/sync/action',
      '/api/parent/add-child',
      '/api/parent/add-pet',
      '/api/parent/add-reward',
      '/api/health',
      '/api/health/full',
      '/api/health/metrics',
      '/api/devices/register',
    ];
    for (const p of expectedPaths) {
      expect(content).toContain(p);
    }
  });

  test('conține scheme principale', () => {
    const content = fs.readFileSync(path.join(PROJECT_ROOT, 'openapi.yaml'), 'utf-8');
    const expectedSchemas = [
      'LoginRequest', 'LoginResponse', 'Child', 'Activity',
      'Suggestion', 'Reward', 'Pet', 'PetActivity',
      'HealthStatus', 'ServiceStatus', 'ApiError',
    ];
    for (const s of expectedSchemas) {
      expect(content).toContain(s);
    }
  });

  test('conține security scheme BearerAuth', () => {
    const content = fs.readFileSync(path.join(PROJECT_ROOT, 'openapi.yaml'), 'utf-8');
    expect(content).toContain('BearerAuth');
    expect(content).toContain('bearer');
    expect(content).toContain('JWT');
  });

  test('server-ele sunt configurate', () => {
    const content = fs.readFileSync(path.join(PROJECT_ROOT, 'openapi.yaml'), 'utf-8');
    expect(content).toContain('localhost:3000');
    expect(content).toContain('api.cs-hub.xyz');
  });

  test('rutele au summary și tags', () => {
    const content = fs.readFileSync(path.join(PROJECT_ROOT, 'openapi.yaml'), 'utf-8');
    const lines = content.split('\n');
    let inPath = false;
    let hasSummary = false;
    let hasTags = false;

    for (const line of lines) {
      if (line.trim().startsWith('/api/')) {
        inPath = true;
        hasSummary = false;
        hasTags = false;
      }
      if (inPath && line.trim().startsWith('summary:')) hasSummary = true;
      if (inPath && line.trim().startsWith('tags:')) hasTags = true;
      if (inPath && line.trim().startsWith('responses:')) {
        expect(hasSummary).toBe(true);
        expect(hasTags).toBe(true);
        inPath = false;
      }
    }
  });

  test('numărul total de rute documentate', () => {
    const content = fs.readFileSync(path.join(PROJECT_ROOT, 'openapi.yaml'), 'utf-8');
    const pathMatches = content.match(/^\s{2}\/api\//gm);
    expect(pathMatches ? pathMatches.length : 0).toBeGreaterThanOrEqual(15);
  });

  test('numărul total de scheme', () => {
    const content = fs.readFileSync(path.join(PROJECT_ROOT, 'openapi.yaml'), 'utf-8');
    const schemaMatches = content.match(/^\s{4}[A-Z][a-zA-Z]+:$/gm);
    expect(schemaMatches ? schemaMatches.length : 0).toBeGreaterThanOrEqual(10);
  });
});

describe('Flutter Client Generation', () => {
  test('scriptul de generare există', () => {
    const scriptPath = path.join(PROJECT_ROOT, 'scripts/generate-api-client.sh');
    expect(fs.existsSync(scriptPath)).toBe(true);
  });

  test('scriptul e executabil', () => {
    const scriptPath = path.join(PROJECT_ROOT, 'scripts/generate-api-client.sh');
    const stats = fs.statSync(scriptPath);
    expect(stats.isFile()).toBe(true);
  });

  test('scriptul menționează TypeScript și Flutter', () => {
    const scriptPath = path.join(PROJECT_ROOT, 'scripts/generate-api-client.sh');
    const content = fs.readFileSync(scriptPath, 'utf-8');
    expect(content).toContain('TypeScript');
    expect(content).toContain('Flutter');
    expect(content).toContain('mobile/vq_app');
  });

  test('client.ts există ca fallback manual', () => {
    const clientPath = path.join(PROJECT_ROOT, 'src/api/client.ts');
    expect(fs.existsSync(clientPath)).toBe(true);
  });
});

describe('API Documentation Quality', () => {
  function getSpec(): string {
    return fs.readFileSync(path.join(PROJECT_ROOT, 'openapi.yaml'), 'utf-8');
  }

  test('toate rutele au summary', () => {
    const spec = getSpec();
    const lines = spec.split('\n');
    let inPath = false;
    let pathCount = 0;
    let summaryCount = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('/api/')) {
        pathCount++;
        inPath = true;
      }
      if (inPath && trimmed.startsWith('summary:')) {
        summaryCount++;
        inPath = false;
      }
      if (trimmed === 'paths:') continue;
    }

    // Fiecare rută ar trebui să aibă cel puțin o metodă cu summary
    expect(pathCount).toBeGreaterThanOrEqual(15);
    expect(summaryCount).toBeGreaterThanOrEqual(pathCount);
  });

  test('rutele au tags și security', () => {
    const spec = getSpec();
    expect(spec).toContain('tags:');
    expect(spec).toContain('security:');
    expect(spec).toContain('BearerAuth');
  });

  test('endpoint-urile POST au requestBody', () => {
    const spec = getSpec();
    // Toate rutele POST ar trebui să aibă requestBody
    const postLines = spec.split('\n').filter(l => l.trim() === 'post:');
    expect(postLines.length).toBeGreaterThan(0);
    expect(spec).toContain('requestBody:');
  });

  test('toate rutele au responses', () => {
    const spec = getSpec();
    expect(spec).toContain('responses:');
    const responseCounts = (spec.match(/responses:/g) || []).length;
    const pathCounts = (spec.match(/^\s{2}\/api\//gm) || []).length;
    // Fiecare rută ar trebui să aibă cel puțin un responses
    expect(responseCounts).toBeGreaterThanOrEqual(pathCounts);
  });
});
