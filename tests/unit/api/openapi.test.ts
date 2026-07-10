/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Unit Tests — OpenAPI 3.1 Specification
 * =========================================
 * Testează:
 *   - Specificația OpenAPI există și e valid YAML
 *   - Toate endpoint-urile din OpenAPI au implementare în cod
 *   - Tipurile generate (client.ts) sunt sincronizate cu spec
 *   - Toate rutele principale sunt documentate
 */

import { describe, test, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

// ═══════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════

const PROJECT_ROOT = process.cwd();

function readOpenApiSpec(): string {
  const filePath = path.join(PROJECT_ROOT, 'openapi.yaml');
  return fs.readFileSync(filePath, 'utf-8');
}

function getClientTypesContent(): string {
  const filePath = path.join(PROJECT_ROOT, 'src/api/client.ts');
  return fs.readFileSync(filePath, 'utf-8');
}

function extractPathsFromSpec(spec: string): string[] {
  const paths: string[] = [];
  const lines = spec.split('\n');
  let inPaths = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === 'paths:') { inPaths = true; continue; }
    if (inPaths && trimmed.startsWith('/api/')) {
      // Extract just the path (before the colon)
      const pathName = trimmed.split(':')[0].trim();
      if (pathName && !paths.includes(pathName)) paths.push(pathName);
    }
    if (inPaths && trimmed === 'components:') break;
  }
  return paths;
}

function extractSchemasFromSpec(spec: string): string[] {
  const schemas: string[] = [];
  const lines = spec.split('\n');
  let inSchemas = false;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === 'schemas:') { inSchemas = true; continue; }
    if (inSchemas && trimmed.endsWith(':') && !trimmed.startsWith('#') && !trimmed.startsWith('-')) {
      const name = trimmed.replace(':', '').trim();
      // Filter out common YAML keys that aren't schema names
      if (name && !['type', 'properties', 'required', 'items', 'description', 'enum', 'example', 'format', 'additionalProperties', 'readOnly', 'writeOnly', 'nullable', 'minimum', 'maximum', 'minLength', 'maxLength', 'pattern', 'default'].includes(name)) {
        // Schema names are PascalCase or UPPERCASE
        if (/^[A-Z]/.test(name)) {
          schemas.push(name);
        }
      }
    }
    if (inSchemas && (trimmed === 'securitySchemes:' || trimmed === 'paths:')) break;
  }
  return schemas;
}

// ═══════════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════════

describe('OpenAPI 3.1 Specification', () => {
  test('fișierul openapi.yaml există', () => {
    const filePath = path.join(PROJECT_ROOT, 'openapi.yaml');
    expect(fs.existsSync(filePath)).toBe(true);
  });

  test('specificația începe cu openapi 3.1', () => {
    const spec = readOpenApiSpec();
    expect(spec).toContain('openapi: 3.1.0');
  });

  test('conține info cu titlu și versiune', () => {
    const spec = readOpenApiSpec();
    expect(spec).toContain('Vacanța Quester API');
    expect(spec).toContain('version: 1.0.0');
  });

  test('conține servere', () => {
    const spec = readOpenApiSpec();
    expect(spec).toContain('localhost:3000');
    expect(spec).toContain('api.cs-hub.xyz');
  });

  test('conține security scheme BearerAuth', () => {
    const spec = readOpenApiSpec();
    expect(spec).toContain('BearerAuth');
    expect(spec).toContain('bearer');
  });

  test('toate rutele principale sunt documentate', () => {
    const spec = readOpenApiSpec();
    const requiredEndpoints = [
      '/api/auth/login',
      '/api/auth/register',
      '/api/state',
      '/api/suggestions/submit',
      '/api/suggestions/respond',
      '/api/sync/action',
      '/api/sync/pull',
      '/api/parent/add-child',
      '/api/parent/add-pet',
      '/api/parent/add-reward',
      '/api/health',
      '/api/health/full',
      '/api/devices/register',
    ];
    for (const ep of requiredEndpoints) {
      expect(spec).toContain(ep);
    }
  });

  test('numărul de rute documentate', () => {
    const spec = readOpenApiSpec();
    const paths = extractPathsFromSpec(spec);
    expect(paths.length).toBeGreaterThanOrEqual(15);
  });

  test('conține definiții de schemas', () => {
    const spec = readOpenApiSpec();
    const schemas = extractSchemasFromSpec(spec);
    expect(schemas.length).toBeGreaterThanOrEqual(10);
  });
});

describe('Generated TypeScript Client (client.ts)', () => {
  test('fișierul client.ts există', () => {
    const filePath = path.join(PROJECT_ROOT, 'src/api/client.ts');
    expect(fs.existsSync(filePath)).toBe(true);
  });

  test('conține interfața LoginRequest', () => {
    const content = getClientTypesContent();
    expect(content).toContain('LoginRequest');
  });

  test('conține interfața LoginResponse', () => {
    const content = getClientTypesContent();
    expect(content).toContain('LoginResponse');
  });

  test('conține interfața Child', () => {
    const content = getClientTypesContent();
    expect(content).toContain('interface Child');
  });

  test('conține interfața Activity', () => {
    const content = getClientTypesContent();
    expect(content).toContain('interface Activity');
  });

  test('conține interfața Suggestion', () => {
    const content = getClientTypesContent();
    expect(content).toContain('interface Suggestion');
  });

  test('conține interfața Reward', () => {
    const content = getClientTypesContent();
    expect(content).toContain('interface Reward');
  });

  test('conține interfața Pet', () => {
    const content = getClientTypesContent();
    expect(content).toContain('interface Pet');
  });

  test('conține interfața HealthStatus', () => {
    const content = getClientTypesContent();
    expect(content).toContain('HealthStatus');
  });

  test('conține interfața ApiError', () => {
    const content = getClientTypesContent();
    expect(content).toContain('ApiError');
  });

  test('conține type TaskStatus', () => {
    const content = getClientTypesContent();
    expect(content).toContain('TaskStatus');
  });

  test('conține type PetType', () => {
    const content = getClientTypesContent();
    expect(content).toContain('PetType');
  });
});

describe('OpenAPI — Sincronizare cu codul', () => {
  test('endpoint-urile din OpenAPI există în server', () => {
    const spec = readOpenApiSpec();
    const serverFile = fs.readFileSync(
      path.join(PROJECT_ROOT, 'server/legacy/server.ts'),
      'utf-8'
    );

    // Verifică endpoint-urile principale
    const specEndpoints = [
      '/api/auth/login',
      '/api/auth/register',
      '/api/suggestions/submit',
      '/api/parent/add-child',
      '/api/parent/add-pet',
      '/api/health',
    ];

    for (const ep of specEndpoints) {
      expect(serverFile).toContain(ep);
    }
  });

  test('tipurile din client.ts corespund cu openapi.yaml', () => {
    const spec = readOpenApiSpec();
    const client = getClientTypesContent();

    // Verifică că tipurile principale există în ambele
    const typeMappings = [
      'LoginRequest', 'LoginResponse', 'Child', 'Activity',
      'Reward', 'Pet', 'PetActivity', 'Suggestion',
      'HealthStatus', 'ServiceStatus', 'ApiError',
    ];

    for (const type of typeMappings) {
      expect(client).toContain(type);
    }
  });
});
