#!/usr/bin/env bash
# ═════════════════════════════════════════════════════════════════════
# Generate API Client from OpenAPI 3.1 spec
# ═════════════════════════════════════════════════════════════════════
# Folosește openapi-generator pentru a genera:
#   - TypeScript client → src/api/generated/
#   - Flutter/Dart client → mobile/vq_app/lib/api/generated/
#   - Documentație HTML → docs/api/
# ═════════════════════════════════════════════════════════════════════

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
OPENAPI_SPEC="$PROJECT_DIR/openapi.yaml"

echo "🔧 Vacanța Quester — API Client Generator"
echo "==========================================="
echo "Spec: $OPENAPI_SPEC"
echo ""

# Verifică dacă openapi-generator e instalat
if ! command -v openapi-generator &>/dev/null && ! command -v npx &>/dev/null; then
  echo "⚠️  openapi-generator nu e instalat."
  echo ""
  echo "Instalare:"
  echo "  npm install @openapitools/openapi-generator-cli -g"
  echo ""
  echo "Sau generează manual tipurile TypeScript din:"
  echo "  src/api/client.ts (deja existent, sincronizat manual cu openapi.yaml)"
  echo ""
  echo "📄 Documentația interactivă e disponibilă la:"
  echo "  http://localhost:3000/api/docs"
  exit 0
fi

# Generează TypeScript client
echo "📦 Generating TypeScript client..."
npx @openapitools/openapi-generator-cli generate \
  -i "$OPENAPI_SPEC" \
  -g typescript-fetch \
  -o "$PROJECT_DIR/src/api/generated" \
  --additional-properties=supportsES6=true,npmVersion=6.9.0,typescriptThreePlus=true

echo "✅ TypeScript client generated → src/api/generated/"

# Generează Flutter/Dart client
echo "📱 Generating Flutter/Dart client..."
npx @openapitools/openapi-generator-cli generate \
  -i "$OPENAPI_SPEC" \
  -g dart-dio \
  -o "$PROJECT_DIR/mobile/vq_app/lib/api/generated" \
  --additional-properties=pubName=vq_api

echo "✅ Flutter client generated → mobile/vq_app/lib/api/generated/"

# Generează documentație HTML
echo "📄 Generating HTML documentation..."
npx @openapitools/openapi-generator-cli generate \
  -i "$OPENAPI_SPEC" \
  -g html \
  -o "$PROJECT_DIR/docs/api"

echo "✅ API docs generated → docs/api/"
echo ""
echo "🚀 Toate generările s-au completat!"
echo ""
echo "📖 Documentația interactivă:"
echo "   http://localhost:3000/api/docs"
echo ""
echo "📁 TypeScript client: src/api/generated/"
echo "📁 Flutter client:     mobile/vq_app/lib/api/generated/"
echo "📁 HTML docs:          docs/api/index.html"
